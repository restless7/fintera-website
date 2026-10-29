import type { AccessApiError, AccessMembership, AccessMutation } from "@/lib/auth/access-contracts";
import type { Permission, UserRole } from "@/lib/auth/types";

export type CommitAccessChange = (mutation: AccessMutation, success: string) => Promise<boolean>;
export const fieldClass = "w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60";
export const labelClass = "mb-2 block text-xs font-semibold text-slate-200";
export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Superadministración", COMMERCIAL_DIRECTOR: "Dirección comercial", SUPERVISOR: "Supervisión",
  COMMERCIAL_ADVISOR: "Asesoría comercial", DOCUMENT_ANALYST: "Análisis documental", OPERATIONS_OFFICER: "Operaciones",
  AUDITOR: "Auditoría", CLIENT: "Cliente",
};
export function membershipSignature(memberships: AccessMembership[]) {
  return JSON.stringify([...memberships].sort((a, b) => a.teamId.localeCompare(b.teamId)));
}
export function permissionGroup(permission: Permission) {
  if (permission.startsWith("crm:lead:")) return "Captación";
  if (permission.startsWith("crm:application:")) return "Expedientes";
  if (permission.startsWith("crm:bank-case:")) return "Procesos bancarios";
  if (permission.startsWith("crm:document:")) return "Documentos";
  if (permission.startsWith("crm:policy:")) return "Políticas bancarias";
  return "Analítica y auditoría";
}
export function accessErrorMessage(error: AccessApiError) {
  const messages: Partial<Record<AccessApiError["code"], string>> = {
    STALE_REVISION: "Este registro cambió mientras lo editabas. Actualiza los datos y revisa de nuevo el cambio.",
    SELF_LOCKOUT: "No puedes quitarte el acceso desde la cuenta que estás utilizando.",
    LAST_SUPER_ADMIN: "Debe permanecer al menos una cuenta activa con superadministración.",
    IDENTITY_NOT_FOUND: "No hay una cuenta de Clerk con este correo. La persona debe registrarse y verificar su correo.",
    IDENTITY_NOT_VERIFIED: "La cuenta debe tener este correo principal verificado y estar habilitada en Clerk, sin bloqueo ni suspensión.",
    IDENTITY_COLLISION: "La identidad no es única o ya está vinculada. Revisa la cuenta antes de continuar.",
    FORBIDDEN: "Tu cuenta no tiene autorización para administrar estos accesos.",
    UNAUTHENTICATED: "Tu sesión terminó. Inicia sesión de nuevo para continuar.",
    UNAVAILABLE: "El servicio de acceso no está disponible. Actualiza antes de volver a intentarlo.",
  };
  return messages[error.code] || error.error || "No se pudo completar el cambio.";
}
