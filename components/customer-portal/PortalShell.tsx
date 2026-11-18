"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import { ArrowUpRight, FileText, Home, LifeBuoy, ListChecks, UserRound } from "lucide-react";
import { PortalDraftProvider } from "./PortalDraftStore";
import { PortalError, PortalLoading } from "./PortalPrimitives";
import { portalErrorMessage, portalRequest } from "./portal-api";

const navigation = [
  { href: "/portal", label: "Inicio", icon: Home },
  { href: "/portal/solicitudes", label: "Mis solicitudes", shortLabel: "Solicitudes", icon: ListChecks },
  { href: "/portal/documentos", label: "Documentos", icon: FileText },
  { href: "/portal/perfil", label: "Mi perfil", shortLabel: "Perfil", icon: UserRound },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { sessionId } = useAuth();
  const trackToken = params.get("trackToken");
  const [trackingGeneration, setTrackingGeneration] = useState(0);
  const [retry, setRetry] = useState(0);
  const [tracking, setTracking] = useState<{ token: string; error: string | null } | null>(null);
  const exchange = useRef<{ token: string; attempt: number; promise: Promise<void> } | null>(null);
  useEffect(() => {
    if (!trackToken) return;
    let active = true;
    if (exchange.current?.token !== trackToken || exchange.current.attempt !== retry) {
      const previous = exchange.current?.promise || Promise.resolve();
      const promise = previous.catch(() => undefined).then(async () => {
        const result = await portalRequest<{ success: boolean }>("/api/portal/auth/magic-session", { method: "POST", body: JSON.stringify({ trackToken }) });
        if (!result.success) throw new Error("Tracking exchange not acknowledged");
      });
      exchange.current = { token: trackToken, attempt: retry, promise };
    }
    void exchange.current.promise.then(() => {
      if (!active) return;
      const url = new URL(window.location.href);
      if (url.searchParams.get("trackToken") !== trackToken) return;
      url.searchParams.delete("trackToken");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      setTracking({ token: trackToken, error: null });
      setTrackingGeneration(value => value + 1);
    }).catch((error: unknown) => { if (active) setTracking({ token: trackToken, error: portalErrorMessage(error) }); });
    return () => { active = false; };
  }, [trackToken, retry]);
  const active = (href: string) => href === "/portal" ? pathname === href : pathname.startsWith(href);
  const current = navigation.find(item => active(item.href));

  const trackingPending = !!trackToken && tracking?.token !== trackToken;
  const trackingError = trackToken && tracking?.token === trackToken ? tracking.error : null;
  return <PortalDraftProvider scopeKey={(sessionId || "signed-out") + ":" + trackingGeneration}><div className="customer-portal">
    <a href="#portal-main" className="portal-skip">Saltar al contenido principal</a>
    <aside className="portal-sidebar" aria-label="Espacio del cliente">
      <Link href="/portal" className="portal-brand" aria-label="Fintera, inicio del portal">
        <Image src="/images/shieldlogo.png" alt="" width={36} height={36} />
        <span><strong>FINTERA</strong><span>Tu espacio de vivienda</span></span>
      </Link>
      <p className="portal-nav-caption">MI ESPACIO</p>
      <nav aria-label="Navegación principal del portal" className="portal-nav">
        {navigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={active(href) ? "page" : undefined} className={active(href) ? "is-current" : ""}><Icon size={19} aria-hidden="true" /><span>{label}</span></Link>)}
      </nav>
      <div className="portal-sidebar-help"><LifeBuoy size={22} aria-hidden="true" /><h2>Te acompañamos</h2><p>Si tienes una duda sobre tu solicitud, encuentra nuestros canales de atención.</p><Link href="/contacto">Contactar a Fintera <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <Link className="portal-site-link" href="/">Volver al sitio de Fintera <ArrowUpRight size={14} aria-hidden="true" /></Link>
    </aside>
    <div className="portal-main-column">
      <header className="portal-topbar">
        <Link href="/portal" className="portal-mobile-brand" aria-label="Fintera, inicio del portal"><Image src="/images/shieldlogo.png" alt="" width={30} height={30} /><span>FINTERA</span></Link>
        <p className="portal-location"><span>Portal de clientes</span><span aria-hidden="true">/</span><strong>{current?.label || "Mi espacio"}</strong></p>
        <div className="portal-account"><Link href="/contacto" className="portal-help-link" aria-label="Ayuda y contacto"><LifeBuoy size={17} aria-hidden="true" /><span>Ayuda</span></Link><UserButton afterSignOutUrl="/sign-in" /></div>
      </header>
      <main id="portal-main" tabIndex={-1} className="portal-main">{trackingError ? <PortalError title="No pudimos activar este enlace de seguimiento" message={trackingError} onRetry={() => { setTracking(null); setRetry(value => value + 1); }} /> : trackingPending ? <PortalLoading label="Activando la consulta de tu solicitud…" /> : children}</main>
      <footer className="portal-footer"><span>Fintera · Claridad para tu próximo paso.</span><div><Link href="/legal/privacidad">Privacidad</Link><Link href="/contacto">Contacto</Link></div></footer>
    </div>
    <nav aria-label="Navegación móvil del portal" className="portal-mobile-nav">{navigation.map(({ href, label, shortLabel, icon: Icon }) => <Link key={href} href={href} aria-label={label} aria-current={active(href) ? "page" : undefined} className={active(href) ? "is-current" : ""}><Icon size={20} aria-hidden="true" /><span>{shortLabel || label}</span></Link>)}</nav>
  </div></PortalDraftProvider>;
}
