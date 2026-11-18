"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import type { CustomerDocumentWorkspaceDTO, CustomerUploadProcessingDTO } from "@/lib/portal/portal-contracts";
import { usePortalDraft } from "./PortalDraftStore";
import { portalErrorMessage, portalRequest } from "./portal-api";
import { PortalStatus } from "./PortalPrimitives";

type PendingAction = { pending: boolean; uncertainIntentId: string | null; error: string | null; message: string | null };
const initialAction: PendingAction = { pending: false, uncertainIntentId: null, error: null, message: null };
const statusLabels: Record<CustomerUploadProcessingDTO["status"], string> = { AWAITING_UPLOAD: "Recepción pendiente", QUEUED: "En cola", PROCESSING: "En validación", CONFIRMED: "Registrado para revisión", PROCESSING_ERROR: "Requiere atención", EXPIRED: "Vencido", CANCELLED: "Cancelado" };

export function DocumentPendingUploads({ workspace, busy, onUpdated, onReload }: { workspace: CustomerDocumentWorkspaceDTO; busy: boolean; onUpdated: (value: CustomerDocumentWorkspaceDTO) => void; onReload: () => void }) {
  const [action, setAction] = usePortalDraft<PendingAction>(`portal:${workspace.sessionScopeKey}:${workspace.applicationId}:pending-action`, initialAction);
  const [, setTransferPending] = usePortalDraft("portal:transfer-pending", false);
  const disabled = busy || action.pending;
  const reconcile = async () => {
    if (disabled || !action.uncertainIntentId) return;
    const intentId = action.uncertainIntentId;
    setAction(current => ({ ...current, pending: true, error: null })); setTransferPending(true);
    try {
      const result = await portalRequest<CustomerUploadProcessingDTO>(`/api/portal/documents/intents/${encodeURIComponent(intentId)}`);
      const fresh = await portalRequest<CustomerDocumentWorkspaceDTO>("/api/portal/documents/requirements?applicationId=" + encodeURIComponent(workspace.applicationId));
      setAction({ pending: false, uncertainIntentId: null, error: null, message: result.status === "CANCELLED" ? "La cancelación está confirmada. Puedes preparar otro envío." : result.message });
      onUpdated(fresh);
    } catch (error: unknown) { setAction(current => ({ ...current, pending: false, error: portalErrorMessage(error) })); }
    finally { setTransferPending(false); }
  };
  const cancel = async (intentId: string) => {
    if (disabled || action.uncertainIntentId || !window.confirm("¿Cancelar la recepción pendiente de este archivo? Podrás preparar otro envío. Esto no confirma la eliminación del objeto transferido.")) return;
    setAction({ pending: true, uncertainIntentId: null, error: null, message: null }); setTransferPending(true);
    try {
      const result = await portalRequest<CustomerUploadProcessingDTO>(`/api/portal/documents/intents/${encodeURIComponent(intentId)}/cancel`, { method: "POST", body: "{}" });
      if (result.status !== "CANCELLED") throw new Error("Cancellation not acknowledged");
      setAction({ pending: false, uncertainIntentId: null, error: null, message: "Recepción cancelada. Actualiza la lista antes de preparar otro envío; no se ha confirmado el borrado del objeto." });
      onReload();
    } catch (error: unknown) { setAction({ pending: false, uncertainIntentId: intentId, error: "No pudimos confirmar la cancelación. Consulta este mismo envío antes de repetir una acción. " + portalErrorMessage(error), message: null }); }
    finally { setTransferPending(false); }
  };
  if (!workspace.pendingUploads.length && !action.error && !action.message && !action.pending) return null;
  return <section className="portal-card portal-section-stack" aria-labelledby="portal-pending-uploads"><div><h2 id="portal-pending-uploads">Envíos en recepción o validación</h2><p className="portal-card-description">Termina o cancela la recepción pendiente antes de añadir otro archivo al mismo requisito. Un archivo en cola todavía no está aprobado.</p></div>
    {workspace.pendingUploads.map(intent => {
      const requirement = [...workspace.requirements, ...workspace.bankRequirements].find(item => item.id === intent.requirementId);
      const person = workspace.applicants.find(item => item.id === requirement?.applicantId);
      return <article key={intent.intentId} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3>{requirement?.title || "Archivo de tu solicitud"}</h3>{person && <p className="portal-field-hint">{person.name}</p>}</div><PortalStatus tone={intent.status === "PROCESSING_ERROR" ? "warning" : "info"}>{statusLabels[intent.status]}</PortalStatus></div><p className="portal-card-description">{intent.message}</p>{intent.status === "AWAITING_UPLOAD" && workspace.permissions.canUploadDocuments && <button type="button" className="portal-button portal-button-secondary mt-4" disabled={disabled || !!action.uncertainIntentId} onClick={() => { void cancel(intent.intentId); }}>Cancelar recepción pendiente</button>}</article>;
    })}
    {action.pending && <p role="status" className="flex items-center gap-2 text-sm"><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />Consultando la recepción…</p>}
    {action.error && <div role="alert" className="portal-notice portal-notice-danger">{action.error}<button type="button" className="portal-button portal-button-secondary mt-3" disabled={disabled} onClick={() => { void reconcile(); }}><RefreshCw size={15} aria-hidden="true" />Consultar este envío</button></div>}
    {action.message && <p role="status" className="portal-notice portal-notice-info">{action.message}</p>}
  </section>;
}
