"use client";

import { useSyncExternalStore, useState, createContext, useContext, type ReactNode, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import * as Dialog from "@radix-ui/react-dialog";
import { BarChart3, BriefcaseBusiness, ChevronRight, Clock3, House, Menu, PanelLeftClose, PanelLeftOpen, UsersRound, X } from "lucide-react";
import type { Permission } from "@/lib/auth/types";
import { isNavigationActive, type AdminNavGroup } from "./navigation";

const CaseReferenceContext = createContext<Dispatch<SetStateAction<string | null>>>(() => {});
export const useSetCaseReference = () => useContext(CaseReferenceContext);
const AdminPermissionsContext = createContext<Permission[]>([]);
export const useAdminPermissions = () => useContext(AdminPermissionsContext);

function subscribeSidebar(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener("fintera-sidebar-change", listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener("fintera-sidebar-change", listener); }; }

const icons = { overview: House, applications: BriefcaseBusiness, assigned: UsersRound, "follow-up": Clock3, analytics: BarChart3, users: UsersRound };
export interface AdminShellProps { children: ReactNode; navigation: AdminNavGroup[]; employeeName: string; roleLabel: string; accountControl?: ReactNode; permissions?: Permission[]; }

export function AdminShell({ children, navigation, employeeName, roleLabel, accountControl, permissions = [] }: AdminShellProps) {
  const [caseReference, setCaseReference] = useState<string | null>(null);
  const pathname = usePathname();
  const query = useSearchParams();
  const [fallbackCollapsed, setFallbackCollapsed] = useState(false);
  const collapsed = useSyncExternalStore(subscribeSidebar, () => { try { return localStorage.getItem("fintera.admin.sidebar") === "collapsed"; } catch { return fallbackCollapsed; } }, () => false);
  const routeKey = pathname + "?" + query.toString();
  const [mobileRoute, setMobileRoute] = useState<string | null>(null);
  const [previousRoute, setPreviousRoute] = useState(routeKey);
  if (previousRoute !== routeKey) {
    setPreviousRoute(routeKey);
    setMobileRoute(null);
  }
  const mobileOpen = mobileRoute === routeKey;
  const setMobileOpen = (open: boolean) => setMobileRoute(open ? routeKey : null);
  const toggle = () => { const next = !collapsed; setFallbackCollapsed(next); try { localStorage.setItem("fintera.admin.sidebar", next ? "collapsed" : "expanded"); window.dispatchEvent(new Event("fintera-sidebar-change")); } catch {} };
  const isCase = /^\/admin\/crm\/applications\/[^/]+/.test(pathname);
  const home = navigation.flatMap(group => group.items)[0] || { label: "Acceso al equipo", href: "/admin-access" };
  const crumbs = [{ label: home.label, href: home.href }];
  if (pathname.includes("/applications")) crumbs.push({ label: "Solicitudes", href: "/admin/crm/applications" });
  if (isCase) crumbs.push({ label: caseReference || "Expediente", href: pathname.split("/").slice(0, 5).join("/") + (query.get("returnTo") ? `?returnTo=${encodeURIComponent(query.get("returnTo")!)}` : "") });
  if (pathname.endsWith("/documents")) crumbs.push({ label: "Documentos", href: pathname });
  if (pathname.endsWith("/bi") && home.href !== pathname) crumbs.push({ label: "Analítica comercial", href: pathname });
  if (pathname.endsWith("/users")) crumbs.push({ label: "Usuarios y accesos", href: pathname });

  const sidebar = (rail: boolean) => <>
    <Link href={home.href} className="admin-brand" aria-label={`Fintera, ${home.label}`} title={rail ? `Fintera · ${home.label}` : undefined}>
      {/* Existing Fintera shield is the same mark used on the public website. */}
      <Image src="/images/shieldlogo.png" width={34} height={34} alt="" unoptimized />
      {!rail && <span><strong>FINTERA</strong><small>Operación hipotecaria</small></span>}
    </Link>
    <nav aria-label="Navegación administrativa" className="admin-sidebar-nav">
      {navigation.map(group => <div className="admin-sidebar-group" key={group.label}>
        {!rail && <p>{group.label}</p>}
        {group.items.map(item => { const Icon = icons[item.icon]; const active = isNavigationActive(item.href, pathname, query.get("scope")); return <Link key={item.href} href={item.href} className={`admin-nav-item ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} aria-label={rail ? item.label : undefined} title={rail ? item.label : undefined}><Icon size={19} aria-hidden="true" />{!rail && <span>{item.label}</span>}{rail && <span className="admin-nav-tooltip">{item.label}</span>}</Link>; })}
      </div>)}
    </nav>
    <div className="admin-sidebar-footer">
      {!rail && <div className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-100">{employeeName}</span><span className="mt-1 block text-xs text-slate-400">{roleLabel}</span></div>}
      <span className="admin-account">{accountControl || <UserButton />}</span>
    </div>
  </>;

  return <AdminPermissionsContext.Provider value={permissions}><CaseReferenceContext.Provider value={setCaseReference}><div className={`admin-shell dark ${collapsed ? "admin-shell-collapsed" : ""}`}>
    <a href="#admin-main" className="admin-skip-link">Saltar al contenido principal</a>
    <aside className="admin-sidebar" aria-label="Panel lateral">{sidebar(collapsed)}<button className="admin-collapse" onClick={toggle} aria-label={collapsed ? "Expandir navegación" : "Contraer navegación"} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /><span>Contraer panel</span></>}</button></aside>
    <div className="admin-main-column">
      <header className="admin-topbar">
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger asChild><button className="admin-icon-button admin-mobile-trigger" aria-label="Abrir navegación"><Menu size={21} /></button></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="admin-drawer-overlay" /><Dialog.Content className="admin-drawer dark" aria-describedby={undefined}><Dialog.Title className="sr-only">Navegación de Fintera</Dialog.Title><Dialog.Close className="admin-drawer-close admin-icon-button" aria-label="Cerrar navegación"><X size={20} /></Dialog.Close>{sidebar(false)}</Dialog.Content></Dialog.Portal>
        </Dialog.Root>
        <nav aria-label="Ruta de navegación" className="admin-breadcrumbs"><ol>{crumbs.map((crumb, index) => <li key={crumb.href + index}>{index > 0 && <ChevronRight size={13} aria-hidden="true" />}{index === crumbs.length - 1 ? <span aria-current="page">{crumb.label}</span> : <Link href={crumb.href}>{crumb.label}</Link>}</li>)}</ol></nav>
        <span className="admin-topbar-label">Espacio de trabajo</span>
      </header>
      <main id="admin-main" tabIndex={-1} className="admin-main">{children}</main>
      <footer className="admin-main-footer"><span>FINTERA</span><span>Gestión comercial · Colombia</span></footer>
    </div>
  </div></CaseReferenceContext.Provider></AdminPermissionsContext.Provider>;
}
