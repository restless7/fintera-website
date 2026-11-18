"use client";

import { useState } from "react";
import { Download, FileCheck2, FilePlus2, History, LoaderCircle, Replace } from "lucide-react";
import type { BankAdditionalRequirementDTO, CustomerDocumentEvidenceDTO, CustomerDocumentStatus, ViviendaRequirementDTO } from "@/lib/portal/portal-contracts";
import { PortalStatus, portalDate } from "./PortalPrimitives";
import { portalErrorMessage, portalRequest } from "./portal-api";

export const documentRequirementElementId = (requirementId: string) => "portal-requirement-" + encodeURIComponent(requirementId);
export const documentStatusLabels: Record<CustomerDocumentStatus, string> = { NEEDS_INFORMATION: "Por confirmar", NOT_APPLICABLE: "No aplica", PENDING_UPLOAD: "Pendiente de envío", QUEUED: "Validación pendiente", PROCESSING: "Validando archivo", UNDER_REVIEW: "En revisión", APPROVED: "Aprobado", REJECTED_NEEDS_ACTION: "Requiere corrección", PROCESSING_ERROR: "Revisar el envío" };
export function DocumentStatus({ status }: { status: CustomerDocumentStatus }) {
  const tone = status === "APPROVED" ? "success" : ["REJECTED_NEEDS_ACTION", "PROCESSING_ERROR"].includes(status) ? "danger" : ["NEEDS_INFORMATION", "PENDING_UPLOAD"].includes(status) ? "warning" : ["PROCESSING", "QUEUED", "UNDER_REVIEW"].includes(status) ? "info" : "neutral";
  return <PortalStatus tone={tone}>{documentStatusLabels[status]}</PortalStatus>;
}

function EvidenceRow({ evidence, busy, onReplace }: { evidence: CustomerDocumentEvidenceDTO; busy: boolean; onReplace?: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const download = async () => {
    if (pending) return;
    setPending(true); setError(null); setDownloadUrl(null);
    try {
      const result = await portalRequest<{ downloadUrl: string; expiresAt: string; fileName: string }>("/api/portal/documents/" + encodeURIComponent(evidence.versionId) + "/download");
      if (!result.downloadUrl.startsWith("https://")) throw new Error("Invalid download location");
      setDownloadUrl(result.downloadUrl);
    } catch (error: unknown) { setError(portalErrorMessage(error)); }
    finally { setPending(false); }
  };
  return <li className="portal-evidence-row"><div className="portal-evidence-main"><FileCheck2 size={19} aria-hidden="true" /><div className="min-w-0"><strong>{evidence.fileName}</strong><span className="portal-evidence-meta">Versión {evidence.versionNumber} · {portalDate(evidence.uploadedAt)}</span><p>{evidence.scanStatus === "CLEAN" ? evidence.reviewStatus === "APPROVED" ? "Aprobado en revisión documental" : evidence.reviewStatus === "REJECTED" ? "Requiere corrección" : "Pendiente de revisión documental" : evidence.scanStatus === "PENDING" ? "Validación del archivo en curso" : "Archivo no disponible para consulta"}</p></div></div><div className="portal-evidence-actions">{evidence.canDownload && <button type="button" className="portal-small-button" disabled={pending || busy} onClick={() => { void download(); }}>{pending ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}{pending ? "Preparando…" : "Consultar archivo"}</button>}{evidence.canReplace && onReplace && <button type="button" className="portal-small-button" disabled={busy} onClick={onReplace}><Replace size={14} aria-hidden="true" />Reemplazar</button>}</div>{evidence.publicReason && <p className="portal-notice portal-notice-warning portal-evidence-feedback">{evidence.publicReason}</p>}{downloadUrl && <p className="portal-evidence-feedback text-xs"><a className="portal-text-link" href={downloadUrl} target="_blank" rel="noopener noreferrer">Abrir o descargar {evidence.fileName}</a><span className="block mt-1 text-slate-600">El enlace es temporal. Si caduca, vuelve a consultar el archivo.</span></p>}{error && <p role="alert" className="portal-inline-error portal-evidence-feedback">{error}</p>}</li>;
}

export function DocumentRequirementCard({ requirement, busy, onAdd, onReplace }: { requirement: ViviendaRequirementDTO | BankAdditionalRequirementDTO; busy: boolean; onAdd: () => void; onReplace: (evidence: CustomerDocumentEvidenceDTO) => void }) {
  const general = requirement.scope === "GENERAL_VIVIENDA";
  const history = general ? requirement.history : [];
  return <article id={documentRequirementElementId(requirement.id)} tabIndex={-1} aria-labelledby={documentRequirementElementId(requirement.id) + "-title"} className={"portal-card portal-requirement-card" + (requirement.status === "NOT_APPLICABLE" ? " portal-not-applicable" : "")}><div className="portal-card-header"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="portal-requirement-kind">{general ? "Lista general" : requirement.bankId.replaceAll("-", " ")}</span>{general && requirement.periodLabel && <span className="portal-period">{requirement.periodLabel}</span>}{requirement.isMandatory && requirement.status !== "NOT_APPLICABLE" && <span className="text-[10px] text-slate-500">Requerido</span>}</div><h3 id={documentRequirementElementId(requirement.id) + "-title"}>{requirement.title}</h3><p className="portal-card-description">{requirement.description}</p></div><DocumentStatus status={requirement.status} /></div>{general && requirement.applicability !== "APPLIES" && <p className="portal-applicability-note">{requirement.applicabilityReason}</p>}{!general && requirement.publicReason && <p className="portal-notice portal-notice-warning mb-4">{requirement.publicReason}</p>}{requirement.evidence.length > 0 && <ul className="portal-evidence-list">{requirement.evidence.map(evidence => <EvidenceRow key={evidence.versionId} evidence={evidence} busy={busy} onReplace={requirement.canUpload && evidence.canReplace ? () => onReplace(evidence) : undefined} />)}</ul>}{history.length > 0 && <details className="portal-evidence-history"><summary><History size={14} aria-hidden="true" />Versiones anteriores ({history.length})</summary><ul className="portal-evidence-list mt-3">{history.map(evidence => <EvidenceRow key={evidence.versionId} evidence={evidence} busy={busy} />)}</ul></details>}{requirement.canUpload && (requirement.canAddEvidence || !requirement.evidence.length) && <div className="portal-requirement-footer"><span>{general && requirement.evidence.length ? "Puedes añadir otro soporte para este mismo requisito." : "Envía un archivo legible y completo."}</span><button type="button" className="portal-button portal-button-secondary" disabled={busy} onClick={onAdd}><FilePlus2 size={16} aria-hidden="true" />{requirement.evidence.length ? "Añadir otro archivo" : "Añadir documento"}</button></div>}</article>;
}
