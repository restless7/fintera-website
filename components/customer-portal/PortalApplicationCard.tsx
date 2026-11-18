import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, Home, UserRound } from "lucide-react";
import type { PortalApplicationSummary } from "./portal-api";
import { portalDocumentHref, portalProductLabel } from "./portal-api";
import { PortalStatus, portalCurrency, portalDate } from "./PortalPrimitives";

export function PortalApplicationCard({ application, featured = false, statusOnly = false }: { application: PortalApplicationSummary; featured?: boolean; statusOnly?: boolean }) {
  const hasAction = application.actionRequiredAlerts.length > 0;
  return <article className={"portal-card portal-application-card" + (featured ? " portal-application-featured" : "")}>
    <div className="portal-card-header"><div className="flex min-w-0 items-start gap-3"><span className="portal-product-icon"><Home size={21} aria-hidden="true" /></span><div className="min-w-0"><p className="portal-reference">{application.fileNumber}</p><h2>{portalProductLabel(application.productCategory)}</h2></div></div><PortalStatus tone={hasAction ? "warning" : "info"}>{application.overallPublicStage || "Sin etapa publicada"}</PortalStatus></div>
    <div className="portal-application-facts"><div><span>Valor solicitado</span><strong>{application.requestedAmount === null ? "Información vinculada a tu cuenta" : portalCurrency(application.requestedAmount)}</strong></div><div><span>Plazo solicitado</span><strong>{application.termMonths === null ? "Disponible al vincular" : application.termMonths + " meses"}</strong></div></div>
    {hasAction && <div className="portal-notice portal-notice-warning"><strong>Tu solicitud requiere atención</strong><ul className="mt-2 list-disc space-y-1 pl-4">{application.actionRequiredAlerts.map((alert, index) => <li key={index}>{alert}</li>)}</ul></div>}
    {application.bankCases.length > 0 && <div className="portal-bank-summary">{application.bankCases.map(bank => <div key={bank.id}><span>{bank.bankId.replaceAll("-", " ")}</span><strong>{bank.publicStageTitle}</strong><p>{bank.publicExplanation}</p></div>)}</div>}
    <div className="portal-application-footer"><p><CalendarDays size={14} aria-hidden="true" />Creada el {portalDate(application.createdAt)}</p>{application.assignedAdvisor && <p><UserRound size={14} aria-hidden="true" />{application.assignedAdvisor.name}</p>}</div>
    <div className="portal-application-actions">{statusOnly ? <Link href="/portal/perfil" className="portal-button">Vincular mi cuenta <ArrowRight size={15} aria-hidden="true" /></Link> : <><Link href={"/portal/solicitudes/" + encodeURIComponent(application.id)} className="portal-button">Ver mi solicitud <ArrowRight size={15} aria-hidden="true" /></Link><Link href={portalDocumentHref(application.id)} className="portal-button portal-button-secondary"><FileText size={15} aria-hidden="true" />Revisar documentos</Link></>}</div>
  </article>;
}
