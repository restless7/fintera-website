import type { AuthContext } from "./types";
/** Landing is a real permitted module, never an implicit permission grant. */
export function getAdminLanding(context: AuthContext): string | null {
  if (context.role === "CLIENT") return null;
  if (context.permissions.includes("crm:application:read")) return "/admin/crm";
  if (context.permissions.includes("crm:report:read")) return "/admin/crm/bi";
  return null;
}
