import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, FileSearch, LoaderCircle, LockKeyhole, RefreshCw } from "lucide-react";

export function PortalPageHeader({ eyebrow, title, description, actions, back }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return <header className="portal-page-header">{back && <Link href={back.href} className="portal-back"><ArrowLeft size={16} aria-hidden="true" />{back.label}</Link>}<div className="portal-heading-row"><div>{eyebrow && <p className="portal-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="portal-page-description">{description}</p>}</div>{actions && <div className="portal-heading-actions">{actions}</div>}</div></header>;
}

export function PortalLoading({ label = "Cargando tu información…" }: { label?: string }) {
  return <div className="portal-card portal-loading" role="status"><LoaderCircle size={24} className="animate-spin" aria-hidden="true" /><p>{label}</p></div>;
}

export function PortalError({ title = "No pudimos cargar esta información", message, onRetry, pending = false }: { title?: string; message: string; onRetry?: () => void; pending?: boolean }) {
  return <div className="portal-card portal-error" role="alert"><AlertCircle size={24} aria-hidden="true" /><div><h2>{title}</h2><p>{message}</p>{onRetry && <button type="button" className="portal-button portal-button-secondary" disabled={pending} onClick={onRetry}><RefreshCw size={16} aria-hidden="true" />{pending ? "Actualizando…" : "Volver a intentar"}</button>}</div></div>;
}

export function PortalEmpty({ title, description, action, restricted = false }: { title: string; description: string; action?: ReactNode; restricted?: boolean }) {
  const Icon = restricted ? LockKeyhole : FileSearch;
  return <div className="portal-card portal-empty"><span className="portal-empty-icon"><Icon size={27} aria-hidden="true" /></span><h2>{title}</h2><p>{description}</p>{action && <div className="portal-empty-actions">{action}</div>}</div>;
}

export function PortalStatus({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "success" | "danger" | "info" }) {
  return <span className={"portal-status portal-status-" + tone}><span aria-hidden="true" />{children}</span>;
}

export const portalCurrency = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
export const portalDate = (value: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(new Date(value));
