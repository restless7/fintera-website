import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { ROLE_LABELS } from "@/components/admin/navigation";
import { ACCESS_PERMISSIONS, ACCESS_ROLES, EDITABLE_POLICY_ROLES, type AccessMutation, type AccessState, type AccessMembership } from "./access-contracts";
import { AccessAdministrationError } from "./access-errors";
import { lookupVerifiedAccessIdentity, verifyExistingAccessIdentity } from "./access-identity";
import { ROLE_PERMISSIONS_MAP, type Permission, type UserRole } from "./types";

export const ACCESS_WRITE_LOCK = 710292026001;
type Tx = Prisma.TransactionClient;
type Actor = { id: string; clerkUserId: string; role: UserRole; isActive: boolean };
function fail(code: ConstructorParameters<typeof AccessAdministrationError>[0], message: string, status = 400): never { throw new AccessAdministrationError(code, message, status); }

/** Shared by operator writes and verified identity lifecycle events. Never auto retry. */
export async function withAccessLock<T>(operation: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ACCESS_WRITE_LOCK}::bigint)`;
    return operation(tx);
  }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 15000 });
}
async function freshActor(tx: Tx, clerkUserId: string): Promise<Actor> {
  // FOR UPDATE causes a serialization failure if this row changed after our snapshot.
  // A waiter cannot continue using an administrator revoked by the preceding writer.
  const actors = await tx.$queryRaw<Actor[]>`SELECT id,"clerkUserId",role,"isActive" FROM public.app_users WHERE "clerkUserId"=${clerkUserId} FOR UPDATE`;
  const actor = actors[0];
  if (!actor?.isActive || actor.role !== "SUPER_ADMIN") fail("FORBIDDEN", "Esta operación requiere una cuenta SUPER_ADMIN activa.", 403);
  return actor;
}
export async function assertAccessAdministrator(clerkUserId: string) {
  const actor = await prisma.appUser.findUnique({ where: { clerkUserId }, select: { id: true, isActive: true, role: true } });
  if (!actor?.isActive || actor.role !== "SUPER_ADMIN") fail("FORBIDDEN", "Acceso exclusivo de SUPER_ADMIN.", 403);
  return actor;
}
async function record(tx: Tx, actor: { id: string; clerkUserId: string }, action: string, resourceType: string, resourceId: string, reason: string, before: unknown, after: unknown) {
  // Audit failure is intentionally uncaught: the entire mutation must roll back.
  await tx.accessAuditEvent.create({ data: { userId: actor.id, clerkUserId: actor.clerkUserId, action, resourceType, resourceId, decision: "GRANTED", reason, metadata: JSON.parse(JSON.stringify({ before, after })) } });
}
async function validateMemberships(tx: Tx, role: UserRole, memberships: AccessMembership[]) {
  if (role === "CLIENT" && memberships.length) fail("INVALID_INPUT", "Un cliente no puede pertenecer a equipos internos.");
  if (await tx.team.count({ where: { id: { in: memberships.map(x => x.teamId) } } }) !== memberships.length) fail("INVALID_INPUT", "Uno de los equipos ya no existe.");
}
const scopeDescriptions: Record<UserRole, string> = {
  SUPER_ADMIN: "Alcance empresarial global y administración de accesos.",
  COMMERCIAL_DIRECTOR: "Alcance empresarial global; cada acción requiere su permiso y las reglas del proceso.",
  SUPERVISOR: "Listados de sus equipos y expedientes asignados; cada expediente conserva sus verificaciones de relación. La marca líder no amplía el alcance.",
  COMMERCIAL_ADVISOR: "Expedientes asignados a su usuario; los equipos no transfieren la propiedad de una asignación.",
  DOCUMENT_ANALYST: "Listados y apertura de expedientes asignados a su usuario, además de las verificaciones documentales.",
  OPERATIONS_OFFICER: "Listados y apertura de expedientes asignados a su usuario, además de las reglas bancarias.",
  AUDITOR: "Lectura global para auditoría. No se permiten permisos de escritura.",
  CLIENT: "Sin navegación interna. Los flujos de cliente requieren su relación y concesiones específicas; el alta no vincula expedientes automáticamente.",
};
const permissionLabels: Record<Permission, string> = {
  "crm:lead:read": "Consultar prospectos", "crm:lead:create": "Crear prospectos", "crm:lead:assign": "Asignar prospectos",
  "crm:application:read": "Consultar expedientes", "crm:application:create": "Crear expedientes", "crm:application:update": "Actualizar expedientes", "crm:application:transition": "Cambiar estado comercial",
  "crm:bank-case:manage": "Gestionar proceso bancario", "crm:document:read": "Consultar documentos", "crm:document:review": "Revisar documentos", "crm:document:upload": "Cargar documentos",
  "crm:policy:read": "Consultar políticas", "crm:policy:propose": "Proponer políticas", "crm:policy:approve": "Aprobar políticas", "crm:policy:rollback": "Revertir políticas", "crm:report:read": "Consultar reportes", "crm:audit:read": "Consultar auditoría",
};
export async function getAccessAdministration(clerkUserId: string, query: { search: string; role: string; status: string; page: number }): Promise<AccessState> {
  const actor = await assertAccessAdministrator(clerkUserId);
  const where: Prisma.AppUserWhereInput = {
    ...(query.search ? { OR: ["email", "firstName", "lastName"].map(field => ({ [field]: { contains: query.search, mode: "insensitive" } })) } : {}),
    ...(ACCESS_ROLES.includes(query.role as UserRole) ? { role: query.role as UserRole } : {}),
    ...(query.status === "active" ? { isActive: true } : query.status === "inactive" ? { isActive: false } : {}),
  };
  const pageSize = 25;
  const [users, total, activeSuperAdminCount, teams, overrides, audits] = await Promise.all([
    prisma.appUser.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (query.page - 1) * pageSize, take: pageSize, select: { id: true, clerkUserId: true, email: true, firstName: true, lastName: true, role: true, isActive: true, accessRevision: true, teamMemberships: { select: { teamId: true, isLead: true } } } }),
    prisma.appUser.count({ where }), prisma.appUser.count({ where: { role: "SUPER_ADMIN", isActive: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, description: true, revision: true, _count: { select: { memberships: true } } } }),
    prisma.rolePermissionPolicy.findMany(),
    prisma.accessAuditEvent.findMany({ where: { action: { startsWith: "RBAC_" } }, orderBy: [{ timestamp: "desc" }, { id: "desc" }], take: 50, select: { id: true, action: true, resourceType: true, resourceId: true, reason: true, timestamp: true, metadata: true, user: { select: { email: true } } } }),
  ]);
  return {
    actorUserId: actor.id, activeSuperAdminCount, users: users.map(({ teamMemberships, ...user }) => ({ ...user, memberships: teamMemberships })), total, page: query.page, pageSize,
    teams: teams.map(({ _count, ...team }) => ({ ...team, memberCount: _count.memberships })),
    policies: ACCESS_ROLES.map(role => {
      const override = overrides.find(row => row.role === role);
      const editable = (EDITABLE_POLICY_ROLES as readonly string[]).includes(role);
      return { role, label: ROLE_LABELS[role], permissions: editable && override ? override.permissions as Permission[] : ROLE_PERMISSIONS_MAP[role], defaultPermissions: ROLE_PERMISSIONS_MAP[role], revision: override?.revision || 0, editable, scopeDescription: scopeDescriptions[role], restriction: "Los permisos no sustituyen el alcance del expediente ni las restricciones específicas de cada transición bancaria. El permiso de reportes mantiene el contrato global existente de analítica." };
    }),
    permissionCatalog: ACCESS_PERMISSIONS.map(permission => ({ permission, label: permissionLabels[permission] })),
    audit: audits.map(({ user, timestamp, ...event }) => ({ ...event, timestamp: timestamp.toISOString(), actorEmail: user?.email || null })),
  };
}

export async function mutateAccessAdministration(clerkUserId: string, input: AccessMutation) {
  await assertAccessAdministrator(clerkUserId);
  if (input.action === "lookupIdentity") {
    const identity = await lookupVerifiedAccessIdentity(input.email);
    await assertAccessAdministrator(clerkUserId);
    return { success: true as const, identity: { ...identity, alreadyProvisioned: !!await prisma.appUser.findUnique({ where: { clerkUserId: identity.clerkUserId }, select: { id: true } }) } };
  }
  let reactivation: { clerkUserId: string; accessRevision: number } | null = null;
  if (input.action === "updateUser" && input.isActive) {
    const target = await prisma.appUser.findUnique({ where: { id: input.userId }, select: { clerkUserId: true, isActive: true, accessRevision: true } });
    if (target && !target.isActive) {
      if (target.accessRevision !== input.expectedRevision) fail("STALE_REVISION", "El usuario cambió. Actualiza y revisa antes de guardar.", 409);
      await verifyExistingAccessIdentity(target.clerkUserId);
      reactivation = { clerkUserId: target.clerkUserId, accessRevision: target.accessRevision };
    }
  }
  // Provider reads precede the transaction; the actor and identity collision are checked again inside.
  const identity = input.action === "provisionUser" ? await lookupVerifiedAccessIdentity(input.email) : null;
  if (input.action === "provisionUser" && identity?.clerkUserId !== input.clerkUserId) fail("IDENTITY_COLLISION", "La identidad cambió. Verifica nuevamente el correo.", 409);
  return withAccessLock(async tx => {
    const actor = await freshActor(tx, clerkUserId);
    if (input.action === "provisionUser") {
      if (!identity) fail("IDENTITY_NOT_FOUND", "Identidad no encontrada.", 404);
      await validateMemberships(tx, input.role, input.memberships);
      const collision = await tx.appUser.findFirst({ where: { OR: [{ clerkUserId: identity.clerkUserId }, { email: { equals: identity.email, mode: "insensitive" } }] }, select: { id: true } });
      if (collision) fail("IDENTITY_COLLISION", "La identidad o el correo ya están vinculados a un usuario.", 409);
      const user = await tx.appUser.create({ data: { ...identity, role: input.role, isActive: true, accessRevision: 1, teamMemberships: { create: input.memberships } } });
      if (input.memberships.length) await tx.team.updateMany({ where: { id: { in: input.memberships.map(m => m.teamId) } }, data: { revision: { increment: 1 } } });
      await record(tx, actor, "RBAC_USER_PROVISIONED", "AppUser", user.id, input.reason, null, { role: user.role, isActive: true, memberships: input.memberships, accessRevision: 1 });
    } else if (input.action === "updateUser") {
      const previous = await tx.appUser.findUnique({ where: { id: input.userId }, include: { teamMemberships: { select: { teamId: true, isLead: true } } } });
      if (!previous) fail("NOT_FOUND", "Usuario no encontrado.", 404);
      if (previous.accessRevision !== input.expectedRevision) fail("STALE_REVISION", "El usuario cambió. Actualiza y revisa antes de guardar.", 409);
      if (!previous.isActive && input.isActive && (!reactivation || reactivation.clerkUserId !== previous.clerkUserId || reactivation.accessRevision !== previous.accessRevision)) fail("STALE_REVISION", "La identidad cambió. Verifica nuevamente antes de reactivar.", 409);
      if (actor.id === previous.id && (input.role !== "SUPER_ADMIN" || !input.isActive)) fail("SELF_LOCKOUT", "No puedes quitar tu propio acceso de SUPER_ADMIN.", 409);
      if (previous.role === "SUPER_ADMIN" && previous.isActive && (input.role !== "SUPER_ADMIN" || !input.isActive) && await tx.appUser.count({ where: { role: "SUPER_ADMIN", isActive: true } }) <= 1) fail("LAST_SUPER_ADMIN", "Debe permanecer al menos un SUPER_ADMIN activo.", 409);
      await validateMemberships(tx, input.role, input.memberships);
      const changed = await tx.appUser.updateMany({ where: { id: previous.id, accessRevision: input.expectedRevision }, data: { role: input.role, isActive: input.isActive, accessRevision: { increment: 1 } } });
      if (changed.count !== 1) fail("STALE_REVISION", "El usuario cambió. Actualiza y revisa antes de guardar.", 409);
      await tx.teamMembership.deleteMany({ where: { userId: previous.id, teamId: { notIn: input.memberships.map(m => m.teamId) } } });
      for (const m of input.memberships) await tx.teamMembership.upsert({ where: { userId_teamId: { userId: previous.id, teamId: m.teamId } }, create: { ...m, userId: previous.id }, update: { isLead: m.isLead } });
      const previousTeams = new Set(previous.teamMemberships.map(m => m.teamId));
      const changedTeams = Array.from(new Set(Array.from(previousTeams).concat(input.memberships.map(m => m.teamId))));
      if (changedTeams.length) await tx.team.updateMany({ where: { id: { in: changedTeams } }, data: { revision: { increment: 1 } } });
      await record(tx, actor, "RBAC_USER_ACCESS_CHANGED", "AppUser", previous.id, input.reason,
        { role: previous.role, isActive: previous.isActive, memberships: previous.teamMemberships, accessRevision: previous.accessRevision },
        { role: input.role, isActive: input.isActive, memberships: input.memberships, accessRevision: input.expectedRevision + 1 });
    } else if (input.action === "createTeam") {
      const team = await tx.team.create({ data: { name: input.name, description: input.description || null, revision: 1 } });
      await record(tx, actor, "RBAC_TEAM_CREATED", "Team", team.id, input.reason, null, { name: team.name, description: team.description, revision: 1 });
    } else if (input.action === "updateTeam") {
      const previous = await tx.team.findUnique({ where: { id: input.teamId } });
      if (!previous) fail("NOT_FOUND", "Equipo no encontrado.", 404);
      if (previous.revision !== input.expectedRevision) fail("STALE_REVISION", "El equipo cambió. Actualiza y revisa antes de guardar.", 409);
      const change = await tx.team.updateMany({ where: { id: previous.id, revision: input.expectedRevision }, data: { name: input.name, description: input.description || null, revision: { increment: 1 } } });
      if (change.count !== 1) fail("STALE_REVISION", "El equipo cambió. Actualiza y revisa antes de guardar.", 409);
      await record(tx, actor, "RBAC_TEAM_CHANGED", "Team", previous.id, input.reason, { name: previous.name, description: previous.description, revision: previous.revision }, { name: input.name, description: input.description, revision: input.expectedRevision + 1 });
    } else if (input.action === "updateRolePermissions") {
      if (!(EDITABLE_POLICY_ROLES as readonly string[]).includes(input.role)) fail("INVALID_INPUT", "La política de este rol está protegida.");
      const previous = await tx.rolePermissionPolicy.findUnique({ where: { role: input.role } });
      if ((previous?.revision || 0) !== input.expectedRevision) fail("STALE_REVISION", "La política cambió. Actualiza y revisa antes de guardar.", 409);
      const permissions = [...input.permissions].sort();
      await tx.rolePermissionPolicy.upsert({ where: { role: input.role }, create: { role: input.role, permissions, revision: 1 }, update: { permissions, revision: { increment: 1 } } });
      await record(tx, actor, "RBAC_ROLE_POLICY_CHANGED", "RolePermissionPolicy", input.role, input.reason,
        { permissions: previous?.permissions || ROLE_PERMISSIONS_MAP[input.role], revision: input.expectedRevision }, { permissions, revision: input.expectedRevision + 1 });
    }
    return { success: true as const };
  });
}
