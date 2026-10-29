import type { Permission, UserRole } from "@/lib/auth/types";

export interface AdminNavItem { label: string; href: string; icon: "overview" | "applications" | "assigned" | "follow-up" | "analytics" | "users"; }
export interface AdminNavGroup { label: string; items: AdminNavItem[]; }

export function getAdminNavigation(role: UserRole, permissions: Permission[]): AdminNavGroup[] {
  if (role === "CLIENT") return [];
  const groups: AdminNavGroup[] = [];
  if (permissions.includes("crm:application:read")) {
    groups.push({ label: "General", items: [{ label: "Panel general", href: "/admin/crm", icon: "overview" }] });
    groups.push({ label: "Operación comercial", items: [
      { label: "Solicitudes", href: "/admin/crm/applications", icon: "applications" },
      { label: "Mis asignados", href: "/admin/crm/applications?scope=my_cases", icon: "assigned" },
      { label: "Seguimientos", href: "/admin/crm/applications?scope=follow_up", icon: "follow-up" },
    ] });
  }
  if (permissions.includes("crm:report:read")) groups.push({ label: "Inteligencia", items: [{ label: "Analítica comercial", href: "/admin/crm/bi", icon: "analytics" }] });
  if (role === "SUPER_ADMIN") groups.push({ label: "Administración", items: [{ label: "Usuarios y accesos", href: "/admin/crm/users", icon: "users" }] });
  return groups;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Administración", COMMERCIAL_DIRECTOR: "Dirección comercial", SUPERVISOR: "Supervisión",
  COMMERCIAL_ADVISOR: "Asesoría comercial", DOCUMENT_ANALYST: "Análisis documental", OPERATIONS_OFFICER: "Operaciones", AUDITOR: "Auditoría", CLIENT: "Cliente",
};

export function isNavigationActive(href: string, pathname: string, scope: string | null) {
  const [path, query] = href.split("?");
  if (path === "/admin/crm") return pathname === path;
  if (path === "/admin/crm/bi") return pathname === path;
  if (!pathname.startsWith(path)) return false;
  const itemScope = new URLSearchParams(query || "").get("scope");
  if (pathname !== path) return !itemScope;
  return itemScope ? itemScope === scope : !scope || scope === "all";
}
