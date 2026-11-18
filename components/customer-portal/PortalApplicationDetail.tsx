"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, LoaderCircle, Mail, MessageSquare, RefreshCw, Send, UserRound } from "lucide-react";
import { usePortalDraft, usePortalUnsavedChanges } from "./PortalDraftStore";
import { PortalEmpty, PortalError, PortalLoading, PortalPageHeader, PortalStatus, portalCurrency, portalDate } from "./PortalPrimitives";
import { PortalApiFailure, portalProductLabel, portalDocumentHref, portalErrorMessage, portalRequest, usePortalRead } from "./portal-api";

interface Detail { id: string; fileNumber: string; productCategory: string; requestedAmount: number; termMonths: number; createdAt: string; status: string; customerVisibleNotes: string | null; assignedAdvisor: { name: string; email: string; phone: string } | null; applicants: { id: string; role: string; firstName: string; lastName: string; occupation: string }[]; bankApplications: { id: string; bankId: string; productType: string; currentStageTitle: string; currentStageDescription: string; badgeVariant: string; bankFilingNumber: string | null; filingDate: string | null; approvedAmount: number | null; approvedRateEA: number | null; approvedTermMonths: number | null; timeline: { id: string; stageTitle: string; explanation: string; actionRequired: string | null; publishedAt: string }[] }[]; }
interface Message { id: string; senderType: "CUSTOMER" | "ADVISOR"; senderName: string; content: string; createdAt: string; }
interface Conversation { messages: Message[]; canSend?: boolean; }
const noText: string | null = null;

export function PortalApplicationDetail({ applicationId }: { applicationId: string }) {
  const resource = usePortalRead<Detail>("/api/portal/applications/" + encodeURIComponent(applicationId));
  const app = resource.data;
  return <><PortalPageHeader eyebrow="MI SOLICITUD" title={app?.fileNumber || "Detalle de tu solicitud"} description={app ? portalProductLabel(app.productCategory) + " · Creada el " + portalDate(app.createdAt) : "Consulta las novedades publicadas de tu expediente."} back={{ href: "/portal/solicitudes", label: "Volver a mis solicitudes" }} actions={<Link href={portalDocumentHref(applicationId)} className="portal-button portal-button-teal"><FileText size={16} aria-hidden="true" />Mis documentos</Link>} />{resource.loading ? <PortalLoading label="Cargando tu expediente…" /> : resource.error ? <PortalError message={portalErrorMessage(resource.error)} onRetry={resource.reload} /> : app && <div className="portal-detail-grid"><div className="portal-stack"><section className="portal-card"><h2>Datos de la solicitud</h2><dl className="portal-profile-facts mt-6"><div><dt>Valor solicitado</dt><dd>{portalCurrency(app.requestedAmount)}</dd></div><div><dt>Plazo solicitado</dt><dd>{app.termMonths} meses</dd></div></dl>{app.customerVisibleNotes && <p className="portal-notice portal-notice-info mt-5">{app.customerVisibleNotes}</p>}</section><section className="portal-section-stack" aria-labelledby="portal-bank-progress"><div className="portal-section-title"><div><h2 id="portal-bank-progress">Seguimiento por entidad</h2><p>Etapas y novedades publicadas para tu solicitud.</p></div></div>{app.bankApplications.length ? app.bankApplications.map(bank => <article className="portal-card" key={bank.id}><div className="portal-card-header"><div><p className="portal-reference">{bank.bankId.replaceAll("-", " ")}</p><h3>{bank.productType}</h3></div><PortalStatus tone="info">{bank.currentStageTitle}</PortalStatus></div><p className="portal-card-description">{bank.currentStageDescription}</p>{bank.bankFilingNumber && <p className="portal-field-hint mt-3">Radicado de la entidad: {bank.bankFilingNumber}</p>}{bank.timeline.length ? <ol className="portal-timeline">{bank.timeline.map(event => <li key={event.id}><span className="portal-timeline-dot" aria-hidden="true" /><div><time dateTime={event.publishedAt}>{portalDate(event.publishedAt)}</time><h4>{event.stageTitle}</h4><p>{event.explanation}</p>{event.actionRequired && <p className="portal-notice portal-notice-warning mt-3">{event.actionRequired}</p>}</div></li>)}</ol> : <p className="portal-field-hint mt-5">Aún no hay novedades publicadas en esta entidad.</p>}</article>) : <PortalEmpty title="El trámite aún no tiene entidades vinculadas" description="Puedes preparar la documentación general mientras tu asesor completa la información del expediente." action={<Link href={portalDocumentHref(applicationId)} className="portal-button portal-button-secondary">Preparar documentos</Link>} />}</section><ConversationPanel applicationId={applicationId} /></div><aside className="portal-section-stack"><section className="portal-card portal-guide-card"><span className="portal-product-icon"><UserRound size={22} aria-hidden="true" /></span><h2>Tu acompañamiento</h2>{app.assignedAdvisor ? <><p><strong>{app.assignedAdvisor.name}</strong></p>{app.assignedAdvisor.email && <a className="portal-text-link break-all" href={"mailto:" + app.assignedAdvisor.email}><Mail size={15} aria-hidden="true" />{app.assignedAdvisor.email}</a>}{app.assignedAdvisor.phone && <a className="portal-text-link" href={"tel:" + app.assignedAdvisor.phone.replace(/[^+\d]/g, "")}>{app.assignedAdvisor.phone}</a>}</> : <><p>Cuando tengas un asesor asignado, encontrarás sus datos de contacto aquí.</p><Link href="/contacto" className="portal-text-link">Contactar a Fintera</Link></>}</section><section className="portal-card portal-guide-card"><h2>Documentos y observaciones</h2><p>Consulta qué soportes necesitas y revisa las observaciones públicas de cada archivo.</p><Link href={portalDocumentHref(applicationId)} className="portal-button portal-button-secondary">Abrir mis documentos</Link></section></aside></div>}</>;
}

function ConversationPanel({ applicationId }: { applicationId: string }) {
  const url = "/api/portal/applications/" + encodeURIComponent(applicationId) + "/messages";
  const resource = usePortalRead<Conversation>(url);
  const [content, setContent] = usePortalDraft("portal:message:" + applicationId + ":content", "");
  const [pending, setPending] = usePortalDraft("portal:message:" + applicationId + ":pending", false);
  const [uncertain, setUncertain] = usePortalDraft("portal:message:" + applicationId + ":uncertain", false);
  const [error, setError] = usePortalDraft<string | null>("portal:message:" + applicationId + ":error", noText);
  const [fresh, setFresh] = useState<{ applicationId: string; data: Conversation } | null>(null);
  const conversation = fresh?.applicationId === applicationId ? fresh.data : resource.data;
  usePortalUnsavedChanges(!!content || pending);
  const refresh = async () => {
    try { setFresh({ applicationId, data: await portalRequest<Conversation>(url) }); setUncertain(false); setError(null); }
    catch (error: unknown) { setError(portalErrorMessage(error)); }
  };
  const send = async () => {
    if (!content.trim() || pending || uncertain || !conversation?.canSend) return;
    setPending(true); setError(null);
    let acknowledged = false;
    try {
      const result = await portalRequest<{ success: boolean; message: Message }>(url, { method: "POST", body: JSON.stringify({ content: content.trim() }) });
      if (!result.success) throw new Error("Unconfirmed message");
      acknowledged = true; setContent("");
      setFresh({ applicationId, data: await portalRequest<Conversation>(url) });
    } catch (error: unknown) {
      setError(acknowledged ? "El mensaje se envió. Actualiza la conversación para verlo." : portalErrorMessage(error));
      if (acknowledged || !(error instanceof PortalApiFailure) || error.status >= 500) setUncertain(true);
    } finally { setPending(false); }
  };
  return <section className="portal-card" aria-labelledby="portal-conversation-title"><div className="portal-card-header"><h2 id="portal-conversation-title" className="flex items-center gap-2"><MessageSquare size={19} aria-hidden="true" />Conversación de la solicitud</h2><button type="button" className="portal-small-button" disabled={pending} onClick={() => { void refresh(); }}><RefreshCw size={14} aria-hidden="true" />Actualizar</button></div>{resource.loading && !conversation ? <PortalLoading label="Cargando conversación…" /> : resource.error && !conversation ? <p role="alert" className="portal-inline-error">{portalErrorMessage(resource.error)}</p> : <>{conversation?.messages.length ? <ol className="portal-messages">{conversation.messages.map(message => <li key={message.id} className={message.senderType === "CUSTOMER" ? "is-customer" : ""}><div><strong>{message.senderName}</strong><time dateTime={message.createdAt}>{portalDate(message.createdAt)}</time></div><p>{message.content}</p></li>)}</ol> : <p className="portal-card-description">Todavía no hay mensajes en esta conversación.</p>}{conversation?.canSend && <form className="mt-6 space-y-3" onSubmit={event => { event.preventDefault(); void send(); }}><label htmlFor="portal-message" className="portal-label">Mensaje para tu asesor</label><textarea id="portal-message" className="portal-field" rows={3} value={content} disabled={pending || uncertain} maxLength={5000} onChange={event => setContent(event.target.value)} placeholder="Escribe tu consulta sobre esta solicitud." /><div className="flex justify-end"><button type="submit" className="portal-button" disabled={!content.trim() || pending || uncertain}>{pending ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}{pending ? "Enviando…" : "Enviar mensaje"}</button></div></form>}</>}{error && <p role="alert" className="portal-notice portal-notice-warning mt-4">{error}{uncertain && <button type="button" className="portal-text-link mt-2 block" onClick={() => { void refresh(); }}>Consultar la conversación antes de continuar</button>}</p>}</section>;
}
