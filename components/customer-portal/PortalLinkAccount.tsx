"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Link2, LoaderCircle, MailCheck } from "lucide-react";
import type { CustomerLinkStateDTO } from "@/lib/portal/portal-contracts";
import { PortalEmpty, PortalError, PortalLoading } from "./PortalPrimitives";
import { PortalApiFailure, portalErrorMessage, portalRequest, usePortalRead } from "./portal-api";

export function PortalLinkAccount({ onLinked }: { onLinked: () => void }) {
  const { data, error, loading, reload } = usePortalRead<CustomerLinkStateDTO>("/api/portal/auth/link");
  const [selected, setSelected] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const link = async () => {
    const applicationId = selected || data?.applications[0]?.id;
    if (!applicationId || !confirmed || pending) return;
    setPending(true); setFailure(null);
    try { await portalRequest<CustomerLinkStateDTO>("/api/portal/auth/link", { method: "POST", body: JSON.stringify({ applicationId, confirm: true }) }); onLinked(); reload(); }
    catch (error: unknown) { setFailure(portalErrorMessage(error)); }
    finally { setPending(false); }
  };
  if (loading) return <PortalLoading label="Consultando la vinculación de tu cuenta…" />;
  const signInRequired = error instanceof PortalApiFailure && error.status === 401 || data?.state === "SIGN_IN_REQUIRED";
  if (error instanceof PortalApiFailure && error.status === 403 && error.code === "VERIFIED_EMAIL_REQUIRED") return <PortalEmpty restricted title="Verifica tu correo principal" description="Abre el control de tu cuenta en la parte superior del portal y verifica tu correo principal. Después vuelve a consultar la vinculación de tu solicitud." action={<button type="button" className="portal-button" onClick={reload}>Ya verifiqué mi correo</button>} />;
  if (error && !signInRequired) return <PortalError message={portalErrorMessage(error)} onRetry={reload} />;
  if (signInRequired || !data) return <PortalEmpty restricted title="Tu solicitud, en un solo lugar" description="Inicia sesión con el correo que registraste en tu solicitud. Si todavía no tienes una cuenta, créala con ese mismo correo para consultar la vinculación de tu expediente." action={<><Link href="/sign-in?redirect_url=%2Fportal" className="portal-button">Iniciar sesión <ArrowRight size={16} aria-hidden="true" /></Link><Link href="/sign-up?redirect_url=%2Fportal" className="portal-button portal-button-secondary">Crear mi cuenta</Link><Link href="/credit-request" className="portal-text-link">Solicitar crédito</Link></>} />;
  if (data.state === "LINKED") return <PortalEmpty title="Tu cuenta ya está vinculada" description={data.message} action={<button type="button" className="portal-button" onClick={onLinked}>Consultar mis solicitudes</button>} />;
  if (data.state !== "CONFIRM_EMAIL_LINK" || !data.applications.length) return <PortalEmpty title="Vamos a vincular tu solicitud" description={data.message} action={<><Link href="/contacto" className="portal-button">Solicitar ayuda para vincular</Link><Link href="/credit-request" className="portal-button portal-button-secondary">Iniciar una solicitud</Link></>} />;
  return <section className="portal-card portal-link-card"><span className="portal-empty-icon"><MailCheck size={27} aria-hidden="true" /></span><h2>Encontramos una solicitud con tu correo</h2><p className="portal-card-description">{data.message}</p><div className="mt-6"><label htmlFor="portal-link-application" className="portal-label">Solicitud que quieres vincular</label><select id="portal-link-application" className="portal-field" value={selected || data.applications[0].id} disabled={pending} onChange={event => { setSelected(event.target.value); setConfirmed(false); }}>{data.applications.map(application => <option key={application.id} value={application.id}>{application.fileNumber}</option>)}</select></div><label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-teal-700" checked={confirmed} disabled={pending} onChange={event => setConfirmed(event.target.checked)} /><span>Reconozco esta solicitud y quiero vincularla a mi cuenta.</span></label>{failure && <p role="alert" className="portal-inline-error mt-4">{failure} Revisa la vinculación antes de repetir el intento.</p>}<button type="button" className="portal-button portal-button-teal mt-6" disabled={pending || !confirmed} onClick={() => { void link(); }}>{pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}{pending ? "Vinculando…" : "Confirmar vinculación"}</button></section>;
}
