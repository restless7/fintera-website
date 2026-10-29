import { withAccessLock } from "./access-administration";

export interface VerifiedClerkUserEvent {
  id: string;
  primary_email_address_id?: string | null;
  email_addresses?: Array<{ id: string; email_address: string; verification?: { status?: string } | null }>;
  first_name?: string | null;
  last_name?: string | null;
}
/** Caller must verify Svix first. Metadata never grants any internal/customer authority. */
export async function synchronizeVerifiedClerkUser(type: string, identity: VerifiedClerkUserEvent) {
  return withAccessLock(async tx => {
    const existing = await tx.appUser.findUnique({ where: { clerkUserId: identity.id } });
    if (!existing) {
      await tx.accessAuditEvent.create({ data: { clerkUserId: identity.id, action: "RBAC_CLERK_IDENTITY_PENDING", resourceType: "ClerkIdentity", resourceId: identity.id, decision: "DENIED", reason: "Identidad verificada por webhook; el acceso requiere asignación explícita de SUPER_ADMIN.", metadata: { eventType: type, accessGranted: false } } });
      return { success: true, pendingInternalAccess: true };
    }
    if (type === "user.deleted") {
      const activeSuperAdminCount = await tx.appUser.count({ where: { role: "SUPER_ADMIN", isActive: true } });
      const recoveryNeeded = existing.isActive && existing.role === "SUPER_ADMIN" && activeSuperAdminCount <= 1;
      if (existing.isActive) await tx.appUser.update({ where: { id: existing.id }, data: { isActive: false, accessRevision: { increment: 1 } } });
      await tx.accessAuditEvent.create({ data: { userId: existing.id, clerkUserId: identity.id, action: recoveryNeeded ? "RBAC_EXTERNAL_LAST_SUPER_ADMIN_REVOKED" : "RBAC_CLERK_IDENTITY_REVOKED", resourceType: "AppUser", resourceId: existing.id, decision: "GRANTED", reason: "Clerk confirmó la eliminación de la identidad. No se conserva acceso interno para una identidad eliminada.", metadata: { source: "verified_clerk_webhook", recoveryNeeded, before: { role: existing.role, isActive: existing.isActive, accessRevision: existing.accessRevision }, after: { role: existing.role, isActive: false, accessRevision: existing.accessRevision + (existing.isActive ? 1 : 0) } } } });
      return { success: true, deactivated: true, recoveryNeeded };
    }
    const primary = identity.email_addresses?.find(email => email.id === identity.primary_email_address_id && email.verification?.status === "verified");
    const data: { email?: string; firstName?: string; lastName?: string } = {};
    let emailConflict = false;
    if (primary?.email_address && primary.email_address.length <= 254 && primary.email_address.includes("@")) {
      const collision = await tx.appUser.findFirst({ where: { email: { equals: primary.email_address, mode: "insensitive" }, id: { not: existing.id } }, select: { id: true } });
      if (collision) emailConflict = true;
      else if (primary.email_address !== existing.email) data.email = primary.email_address;
    }
    if (typeof identity.first_name === "string" && identity.first_name.length <= 256 && identity.first_name !== existing.firstName) data.firstName = identity.first_name;
    if (typeof identity.last_name === "string" && identity.last_name.length <= 256 && identity.last_name !== existing.lastName) data.lastName = identity.last_name;
    const changed = Object.keys(data).length > 0;
    if (changed) await tx.appUser.update({ where: { id: existing.id }, data: { ...data, accessRevision: { increment: 1 } } });
    await tx.accessAuditEvent.create({ data: { userId: existing.id, clerkUserId: identity.id, action: "RBAC_CLERK_PROFILE_SYNCHRONIZED", resourceType: "AppUser", resourceId: existing.id, decision: "GRANTED", reason: "Sincronización de perfil; rol, estado interno, equipos y vínculos de cliente permanecen bajo su autoridad canónica.", metadata: { eventType: type, profileChanged: changed, verifiedEmailSynced: !!data.email, emailConflict, authorityChanged: false } } });
    return { success: true, profileChanged: changed, emailConflict };
  });
}
