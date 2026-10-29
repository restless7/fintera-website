import type { AccessAudit } from "@/lib/auth/access-contracts";

const actionLabels: Record<string, string> = {
  RBAC_USER_PROVISIONED: "Acceso habilitado", RBAC_USER_ACCESS_CHANGED: "Acceso de usuario actualizado",
  RBAC_TEAM_CREATED: "Equipo creado", RBAC_TEAM_CHANGED: "Equipo actualizado", RBAC_ROLE_POLICY_CHANGED: "Política de rol actualizada",
  RBAC_CLERK_IDENTITY_PENDING: "Identidad pendiente de asignación",
  RBAC_CLERK_IDENTITY_REVOKED: "Identidad eliminada en Clerk; acceso desactivado",
  RBAC_EXTERNAL_LAST_SUPER_ADMIN_REVOKED: "Última identidad de superadministración eliminada; requiere recuperación",
  RBAC_CLERK_PROFILE_SYNCHRONIZED: "Perfil sincronizado desde Clerk",
  PROVISION_OWNER_ACCESS: "Acceso del propietario habilitado",
};
function actorLabel(entry: AccessAudit) {
  if (entry.action.startsWith("RBAC_CLERK_") || entry.action === "RBAC_EXTERNAL_LAST_SUPER_ADMIN_REVOKED") return "Origen: webhook verificado de Clerk";
  return entry.actorEmail || "Actor no disponible en el registro";
}
function summary(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = metadata as Record<string, unknown>;
  const before = value.before;
  const after = value.after;
  if (!before || !after || typeof before !== "object" || typeof after !== "object") return null;
  const old = before as Record<string, unknown>;
  const next = after as Record<string, unknown>;
  const changes: string[] = [];
  if (typeof old.role === "string" && typeof next.role === "string" && old.role !== next.role) changes.push("Rol actualizado");
  if (typeof old.isActive === "boolean" && typeof next.isActive === "boolean" && old.isActive !== next.isActive) changes.push(next.isActive ? "Acceso activado" : "Acceso desactivado");
  if (Array.isArray(old.permissions) && Array.isArray(next.permissions)) changes.push("Permisos revisados");
  return changes.length ? changes.join(" · ") : null;
}
export function UserAuditLog({ entries }: { entries: AccessAudit[] }) {
  return <section aria-labelledby="access-audit-title" className="space-y-5"><div><h2 id="access-audit-title" className="text-lg font-semibold text-white">Movimientos recientes de acceso</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Historial de las operaciones administrativas devueltas por el registro de auditoría.</p></div>{entries.length ? <ol className="space-y-3">{entries.map(entry => <li key={entry.id} className="admin-card"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-semibold text-white">{actionLabels[entry.action] || entry.action.replaceAll("_", " ").toLocaleLowerCase("es")}</h3><time className="text-xs text-slate-400" dateTime={entry.timestamp}>{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(entry.timestamp))}</time></div><p className="mt-2 break-all text-sm text-slate-300">{actorLabel(entry)}</p>{summary(entry.metadata) && <p className="mt-3 text-sm text-emerald-200">{summary(entry.metadata)}</p>}{entry.reason && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{entry.reason}</p>}<p className="mt-4 break-all text-[11px] text-slate-400">Referencia: {entry.resourceType}{entry.resourceId ? " · " + entry.resourceId : ""}<span className="mt-1 block">Registro {entry.id}</span></p></li>)}</ol> : <div className="admin-card"><h3 className="font-semibold text-white">Sin movimientos registrados</h3><p className="mt-2 text-sm text-slate-300">Las operaciones de administración aparecerán aquí cuando se hayan guardado.</p></div>}</section>;
}
