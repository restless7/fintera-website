"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, FileText, RefreshCw } from "lucide-react";
import type { BankAdditionalRequirementDTO, CustomerDocumentEvidenceDTO, CustomerDocumentWorkspaceDTO, ViviendaRequirementDTO } from "@/lib/portal/portal-contracts";
import { DocumentProfileForm } from "./DocumentProfileForm";
import { DocumentPendingUploads } from "./DocumentPendingUploads";
import { DocumentRequirementCard, documentRequirementElementId } from "./DocumentRequirementCard";
import { DocumentUploadDialog, createUploadDraft, isUploadBusy, type DocumentUploadDraft } from "./DocumentUploadDialog";
import { usePortalDraft } from "./PortalDraftStore";
import { PortalLinkAccount } from "./PortalLinkAccount";
import { PortalEmpty, PortalError, PortalLoading, PortalPageHeader, PortalStatus } from "./PortalPrimitives";
import { PortalApiFailure, portalProductLabel, portalErrorMessage, usePortalRead, type PortalDashboard } from "./portal-api";

type Filter = "ALL" | "ACTION" | "REVIEW" | "APPROVED";
const noUpload: DocumentUploadDraft | null = null;
const needsAction = (status: string) => ["NEEDS_INFORMATION", "PENDING_UPLOAD", "REJECTED_NEEDS_ACTION", "PROCESSING_ERROR"].includes(status);
const inReview = (status: string) => ["QUEUED", "PROCESSING", "UNDER_REVIEW"].includes(status);

export function DocumentsWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const dashboard = usePortalRead<PortalDashboard>("/api/portal/dashboard");
  const requested = params.get("applicationId");
  const applications = dashboard.data?.applications || [];
  const applicationId = requested !== null ? applications.find(application => application.id === requested)?.id || "" : applications[0]?.id || "";
  const resource = usePortalRead<CustomerDocumentWorkspaceDTO>(applicationId && !dashboard.data?.isStatusOnly ? "/api/portal/documents/requirements?applicationId=" + encodeURIComponent(applicationId) : null);
  const [override, setOverride] = useState<CustomerDocumentWorkspaceDTO | null>(null);
  const workspace = override?.applicationId === applicationId ? override : resource.data;
  const reloadRequirements = resource.reload;
  const reload = useCallback(() => { setOverride(null); reloadRequirements(); }, [reloadRequirements]);
  const [activeUpload] = usePortalDraft<DocumentUploadDraft | null>(workspace ? `portal:${workspace.sessionScopeKey}:${workspace.applicationId}:upload` : "portal:no-workspace:upload", noUpload);
  const [transferPending] = usePortalDraft("portal:transfer-pending", false);
  const busy = isUploadBusy(activeUpload) || transferPending;
  const changeApplication = (id: string) => router.push("/portal/documentos?applicationId=" + encodeURIComponent(id));
  return <><PortalPageHeader eyebrow="DOCUMENTOS DE VIVIENDA" title="Prepara tus documentos" description="Encuentra lo que necesitas, envía tus soportes y consulta las observaciones de revisión." actions={<button type="button" className="portal-button portal-button-secondary" disabled={busy || resource.loading || dashboard.loading} onClick={reload}><RefreshCw size={15} aria-hidden="true" />Actualizar</button>} />
    {dashboard.loading ? <PortalLoading label="Consultando tus solicitudes…" /> : dashboard.error ? dashboard.error instanceof PortalApiFailure && dashboard.error.status === 401 ? <PortalLinkAccount onLinked={dashboard.reload} /> : <PortalError message={portalErrorMessage(dashboard.error)} onRetry={dashboard.reload} /> : !applications.length || dashboard.data?.isStatusOnly ? <PortalLinkAccount onLinked={dashboard.reload} /> : <div className="portal-stack"><div className="portal-document-context portal-card"><div><label className="portal-label" htmlFor="portal-document-application">Solicitud</label><select id="portal-document-application" className="portal-field" value={applicationId} disabled={busy} onChange={event => changeApplication(event.target.value)}>{!applicationId && <option value="" disabled>Elige una solicitud</option>}{applications.map(application => <option key={application.id} value={application.id}>{application.fileNumber} · {portalProductLabel(application.productCategory)}</option>)}</select></div>{applicationId && <Link className="portal-text-link" href={"/portal/solicitudes/" + encodeURIComponent(applicationId)}>Ver solicitud</Link>}</div>{!applicationId ? <PortalEmpty restricted title="La solicitud de este enlace no está disponible" description="Elige una solicitud de la lista para consultar sus documentos. No hemos seleccionado otro expediente en su lugar." /> : resource.loading && !workspace ? <PortalLoading label="Preparando tu lista de documentos…" /> : resource.error ? resource.error instanceof PortalApiFailure && resource.error.status === 401 ? <PortalLinkAccount onLinked={dashboard.reload} /> : <PortalError message={portalErrorMessage(resource.error)} onRetry={reload} /> : workspace && <WorkspaceContent workspace={workspace} requestedApplicant={params.get("applicantId")} onSelectApplicant={id => router.push("/portal/documentos?applicationId=" + encodeURIComponent(applicationId) + "&applicantId=" + encodeURIComponent(id))} onUpdated={setOverride} onReload={reload} />}</div>}
  </>;
}

function WorkspaceContent({ workspace, requestedApplicant, onSelectApplicant, onUpdated, onReload }: { workspace: CustomerDocumentWorkspaceDTO; requestedApplicant: string | null; onSelectApplicant: (id: string) => void; onUpdated: (value: CustomerDocumentWorkspaceDTO) => void; onReload: () => void }) {
  const applicant = requestedApplicant !== null ? workspace.applicants.find(value => value.id === requestedApplicant) : workspace.applicants[0];
  const [filter, setFilter] = useState<Filter>("ALL");
  const [returnRequirementId, setReturnRequirementId] = usePortalDraft<string | null>(`portal:${workspace.sessionScopeKey}:${workspace.applicationId}:return-focus`, null);
  const [upload, setUpload] = usePortalDraft<DocumentUploadDraft | null>(`portal:${workspace.sessionScopeKey}:${workspace.applicationId}:upload`, noUpload);
  const [transferPending] = usePortalDraft("portal:transfer-pending", false);
  const busy = isUploadBusy(upload) || transferPending;
  useEffect(() => {
    if (!returnRequirementId || upload) return;
    const target = document.getElementById(documentRequirementElementId(returnRequirementId)) || document.getElementById("portal-main");
    target?.focus();
    setReturnRequirementId(null);
  }, [returnRequirementId, upload, setReturnRequirementId]);
  const general = workspace.requirements.filter(requirement => requirement.applicantId === applicant?.id);
  const bank = workspace.bankRequirements.filter(requirement => !requirement.applicantId || requirement.applicantId === applicant?.id);
  const applicable = [...general, ...bank].filter(requirement => requirement.status !== "NOT_APPLICABLE");
  const visible = (status: string) => filter === "ALL" || filter === "ACTION" && needsAction(status) || filter === "REVIEW" && inReview(status) || filter === "APPROVED" && status === "APPROVED";
  const generalVisible = general.filter(requirement => visible(requirement.status));
  const bankVisible = bank.filter(requirement => visible(requirement.status));
  const startUpload = (requirement: ViviendaRequirementDTO | BankAdditionalRequirementDTO, evidence?: CustomerDocumentEvidenceDTO) => {
    if (busy) return;
    if (upload?.file && upload.phase !== "FINISHED" && !window.confirm("Hay un envío abierto. ¿Quieres cerrar su formulario para preparar otro? Puedes consultar su estado en la lista.")) return;
    setUpload(createUploadDraft({ applicationId: workspace.applicationId, requirementId: requirement.id, scope: requirement.scope, mode: evidence ? "REPLACE" : "ADD", ...(evidence ? { replaceVersionId: evidence.versionId } : {}), expectedRevision: requirement.revision, title: requirement.title, applicantName: applicant?.name || "Solicitante", periodLabel: requirement.scope === "GENERAL_VIVIENDA" ? requirement.periodLabel : null, allowedMimeTypes: requirement.allowedMimeTypes, maxFileSizeBytes: requirement.maxFileSizeBytes }));
  };
  const closeUpload = () => {
    if (busy) return;
    if (upload?.file && ["SELECT", "FAILED"].includes(upload.phase) && !window.confirm("¿Cerrar el formulario de este envío?")) return;
    if (upload) setReturnRequirementId(upload.target.requirementId);
    setUpload(null); onReload();
  };
  if (workspace.accessState === "UNAVAILABLE") return <PortalError title="No pudimos preparar tus documentos" message={workspace.processing.message || "El servicio no está disponible en este momento. Vuelve a consultar tu lista."} onRetry={onReload} />;
  if (workspace.accessState !== "READY" || !workspace.permissions.canViewDocuments) return <PortalEmpty restricted title="La gestión documental necesita una cuenta vinculada" description="Inicia sesión con tu correo verificado y confirma la vinculación para consultar los soportes de tu solicitud." action={<Link href="/portal" className="portal-button">Revisar mi vinculación</Link>} />;
  if (!applicant && requestedApplicant !== null && workspace.applicants.length) return <div className="portal-stack"><div><label className="portal-label" htmlFor="portal-document-person">Documentos de</label><select id="portal-document-person" className="portal-field" value="" disabled={busy} onChange={event => onSelectApplicant(event.target.value)}><option value="" disabled>Elige una persona</option>{workspace.applicants.map(person => <option key={person.id} value={person.id}>{person.name}{person.role === "PRIMARY_HOLDER" ? " · Titular" : ""}</option>)}</select></div><PortalEmpty restricted title="La persona de este enlace no está disponible" description="Selecciona una persona autorizada para consultar sus documentos. No hemos cambiado el destinatario del envío." /></div>;
  if (!applicant) return <PortalEmpty title="Estamos preparando tu lista" description="Todavía no hay solicitantes disponibles para gestionar documentos. Consulta a tu asesor para completar la información del expediente." action={<Link href="/contacto" className="portal-button portal-button-secondary">Contactar a Fintera</Link>} />;
  return <><div className="portal-person-row"><div><label className="portal-label" htmlFor="portal-document-person">Documentos de</label><select id="portal-document-person" className="portal-field" value={applicant.id} disabled={busy} onChange={event => onSelectApplicant(event.target.value)}>{workspace.applicants.map(person => <option key={person.id} value={person.id}>{person.name}{person.role === "PRIMARY_HOLDER" ? " · Titular" : ""}</option>)}</select></div><PortalStatus tone={applicant.profile.occupation === "UNKNOWN" ? "warning" : "neutral"}>{applicant.profile.occupation === "ASALARIADO" ? "Empleado" : applicant.profile.occupation === "INDEPENDIENTE" ? "Independiente" : "Actividad por confirmar"}</PortalStatus></div>
    <DocumentProfileForm key={applicant.id} workspace={workspace} applicant={applicant} onUpdated={onUpdated} />
    {!workspace.processing.configured && <p role="status" className="portal-notice portal-notice-warning">{workspace.processing.message}</p>}
    <DocumentPendingUploads workspace={workspace} busy={busy} onUpdated={onUpdated} onReload={onReload} />
    <div className="portal-document-metrics"><div><span className="portal-metric-icon portal-metric-pending"><FileText size={19} aria-hidden="true" /></span><p><strong>{applicable.filter(requirement => needsAction(requirement.status)).length}</strong><span>Pendientes o por confirmar</span></p></div><div><span className="portal-metric-icon portal-metric-review"><Clock3 size={19} aria-hidden="true" /></span><p><strong>{applicable.filter(requirement => inReview(requirement.status)).length}</strong><span>En validación o revisión</span></p></div><div><span className="portal-metric-icon portal-metric-approved"><CheckCircle2 size={19} aria-hidden="true" /></span><p><strong>{applicable.filter(requirement => requirement.status === "APPROVED").length}</strong><span>Requisitos aprobados</span></p></div></div>
    <div className="portal-filter-tabs" role="group" aria-label="Filtrar estado documental">{([{ value: "ALL", label: "Todos" }, { value: "ACTION", label: "Necesitan atención" }, { value: "REVIEW", label: "En revisión" }, { value: "APPROVED", label: "Aprobados" }] as const).map(item => <button type="button" key={item.value} aria-pressed={filter === item.value} className={filter === item.value ? "is-current" : ""} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
    {!generalVisible.length && !bankVisible.length ? <PortalEmpty title="No hay documentos en este estado" description="Consulta otra categoría para revisar tu lista completa." action={<button type="button" className="portal-button portal-button-secondary" onClick={() => setFilter("ALL")}>Ver todos los documentos</button>} /> : <><section className="portal-section-stack" aria-labelledby="portal-general-checklist"><div className="portal-section-title"><div><h2 id="portal-general-checklist">Lista general de vivienda</h2><p>Documentos según la actividad y las condiciones registradas de {applicant.name}.</p></div></div>{generalVisible.length ? generalVisible.map(requirement => <DocumentRequirementCard key={requirement.id} requirement={requirement} busy={busy} onAdd={() => startUpload(requirement)} onReplace={evidence => startUpload(requirement, evidence)} />) : <p className="portal-card-description">No hay requisitos generales en este filtro.</p>}</section>{bankVisible.length > 0 && <section className="portal-section-stack" aria-labelledby="portal-bank-checklist"><div className="portal-section-title"><div><h2 id="portal-bank-checklist">Documentos adicionales del banco</h2><p>Son requisitos de cada entidad y pueden pedir periodos o soportes distintos a la lista general.</p></div></div>{bankVisible.map(requirement => <DocumentRequirementCard key={requirement.id} requirement={requirement} busy={busy} onAdd={() => startUpload(requirement)} onReplace={evidence => startUpload(requirement, evidence)} />)}</section>}</>}
    <p className="portal-document-footnote">La aprobación de documentos corresponde a su revisión. Las decisiones y condiciones del crédito se consultan en el expediente.</p>{upload && <DocumentUploadDialog draft={upload} setDraft={setUpload} onClose={closeUpload} onChanged={onReload} />}
  </>;
}
