"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { CheckCircle2, FileUp, LoaderCircle, RefreshCw } from "lucide-react";
import type { CustomerUploadAuthorizationDTO, CustomerUploadInput, CustomerUploadProcessingDTO } from "@/lib/portal/portal-contracts";
import { documentRequirementElementId } from "./DocumentRequirementCard";
import { PortalDialog } from "./PortalDialog";
import { usePortalDraft, usePortalUnsavedChanges } from "./PortalDraftStore";
import { PortalApiFailure, portalErrorMessage, portalRequest } from "./portal-api";

export type DocumentUploadTarget = { applicationId: string; requirementId: string; scope: CustomerUploadInput["scope"]; mode: "ADD" | "REPLACE"; replaceVersionId?: string; expectedRevision: number; title: string; applicantName: string; periodLabel: string | null; allowedMimeTypes: string[]; maxFileSizeBytes: number; };
export type DocumentUploadDraft = { target: DocumentUploadTarget; file: File | null; intentId: string | null; percent: number; phase: "SELECT" | "AUTHORIZING" | "TRANSFERRING" | "CONFIRMING" | "WAITING" | "FINISHED" | "UNCERTAIN" | "FAILED"; binaryUploaded: boolean; result: CustomerUploadProcessingDTO | null; error: string | null; pollRound: number; mustRefresh: boolean; };
export function createUploadDraft(target: DocumentUploadTarget): DocumentUploadDraft { return { target, file: null, intentId: null, percent: 0, phase: "SELECT", binaryUploaded: false, result: null, error: null, pollRound: 0, mustRefresh: false }; }
export const isUploadBusy = (draft: DocumentUploadDraft | null) => !!draft && ["AUTHORIZING", "TRANSFERRING", "CONFIRMING"].includes(draft.phase);
const fileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
const formatMime = (mime: string) => ({ "application/pdf": "PDF", "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WebP" }[mime] || mime);

function transferFile(authorization: CustomerUploadAuthorizationDTO, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(authorization.uploadMethod, authorization.uploadUrl, true);
    Object.entries(authorization.uploadHeaders).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.timeout = 10 * 60 * 1000;
    request.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("La transferencia no se completó. Consulta el estado de este envío."));
    request.onerror = () => reject(new Error("La conexión se interrumpió durante la transferencia."));
    request.ontimeout = () => reject(new Error("La transferencia tardó más de lo esperado. Consulta el estado antes de repetirla."));
    request.onabort = () => reject(new Error("La transferencia se interrumpió."));
    request.send(file);
  });
}

export function DocumentUploadDialog({ draft, setDraft, onClose, onChanged }: { draft: DocumentUploadDraft; setDraft: Dispatch<SetStateAction<DocumentUploadDraft | null>>; onClose: () => void; onChanged: () => void }) {
  const [transferPending, setTransferPending] = usePortalDraft("portal:transfer-pending", false);
  const busy = isUploadBusy(draft) || transferPending;
  const dirty = !!draft.file && draft.phase !== "FINISHED";
  usePortalUnsavedChanges(dirty || busy);
  const update = (value: Partial<DocumentUploadDraft>) => setDraft(current => current ? { ...current, ...value } : current);
  const intentUrl = draft.intentId ? `/api/portal/documents/intents/${encodeURIComponent(draft.intentId)}?applicationId=${encodeURIComponent(draft.target.applicationId)}` : null;

  useEffect(() => {
    if (!intentUrl || !["WAITING", "UNCERTAIN"].includes(draft.phase)) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const poll = async () => {
      try {
        const result = await portalRequest<CustomerUploadProcessingDTO>(intentUrl, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const terminal = ["CONFIRMED", "PROCESSING_ERROR", "EXPIRED", "CANCELLED"].includes(result.status);
        setDraft(current => !current || current.intentId !== result.intentId ? current : { ...current, result, phase: result.status === "CONFIRMED" ? "FINISHED" : terminal ? "FAILED" : current.phase, error: terminal && result.status !== "CONFIRMED" ? result.message : null });
        if (terminal) { onChanged(); return; }
        attempts += 1;
        if (attempts < 12) timer = setTimeout(() => { void poll(); }, 3000);
      } catch (error: unknown) {
        if (!controller.signal.aborted) setDraft(current => current ? { ...current, error: portalErrorMessage(error) } : current);
      }
    };
    void poll();
    return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [intentUrl, draft.phase, draft.pollRound, setDraft, onChanged]);

  const confirm = async (intentId: string) => {
    setTransferPending(true);
    update({ phase: "CONFIRMING", error: null });
    try {
      const result = await portalRequest<CustomerUploadProcessingDTO>("/api/portal/documents/confirm-upload", { method: "POST", body: JSON.stringify({ intentId }) });
      update({ result, phase: result.status === "CONFIRMED" ? "FINISHED" : ["QUEUED", "PROCESSING"].includes(result.status) ? "WAITING" : "FAILED", error: ["PROCESSING_ERROR", "EXPIRED", "CANCELLED"].includes(result.status) ? result.message : null });
      onChanged();
    } catch (error: unknown) { update({ phase: "UNCERTAIN", error: "No pudimos confirmar la recepción. Estamos consultando este mismo envío para evitar duplicarlo. " + portalErrorMessage(error) }); }
    finally { setTransferPending(false); }
  };
  const upload = async () => {
    if (!draft.file || busy || draft.intentId || draft.mustRefresh) return;
    const file = draft.file;
    if (!draft.target.allowedMimeTypes.includes(file.type) || file.size > draft.target.maxFileSizeBytes || file.size <= 0) { update({ error: "El archivo no cumple el formato o el tamaño permitido para este requisito." }); return; }
    update({ phase: "AUTHORIZING", error: null, percent: 0 });
    setTransferPending(true);
    let intentId: string | null = null;
    try {
      const input: CustomerUploadInput = { applicationId: draft.target.applicationId, requirementId: draft.target.requirementId, scope: draft.target.scope, mode: draft.target.mode, ...(draft.target.replaceVersionId ? { replaceVersionId: draft.target.replaceVersionId } : {}), expectedRevision: draft.target.expectedRevision, fileName: file.name, mimeType: file.type, fileSize: file.size };
      const authorization = await portalRequest<CustomerUploadAuthorizationDTO>("/api/portal/documents/upload-intent", { method: "POST", body: JSON.stringify(input) });
      intentId = authorization.intentId;
      update({ intentId, phase: "TRANSFERRING" });
      await transferFile(authorization, file, percent => update({ percent }));
      update({ binaryUploaded: true, percent: 100 });
      await confirm(intentId);
    } catch (error: unknown) {
      update({ phase: intentId ? "UNCERTAIN" : "FAILED", mustRefresh: !intentId && (!(error instanceof PortalApiFailure) || error.status === 409 || error.status >= 500), error: intentId ? "La transferencia se interrumpió. Consulta el estado antes de iniciar otro envío." : portalErrorMessage(error) });
    }
    finally { setTransferPending(false); }
  };
  const phaseLabel = draft.phase === "AUTHORIZING" ? "Preparando el envío…" : draft.phase === "TRANSFERRING" ? `Enviando archivo · ${draft.percent}%` : draft.phase === "CONFIRMING" ? "Confirmando recepción…" : draft.phase === "WAITING" ? "Archivo recibido: validación en curso" : draft.phase === "FINISHED" ? "Archivo registrado para revisión" : draft.phase === "UNCERTAIN" ? "Consultando el resultado del envío" : null;
  return <PortalDialog returnFocusId={documentRequirementElementId(draft.target.requirementId)} title={draft.target.mode === "REPLACE" ? "Reemplazar documento" : "Añadir documento"} description="Revisa el archivo y su destino antes de confirmar el envío." busy={busy} onClose={onClose}>
    <div className="portal-upload-destination"><p>{draft.target.applicantName}</p><h3>{draft.target.title}</h3>{draft.target.periodLabel && <span>{draft.target.periodLabel}</span>}<p className="mt-2 text-xs">{draft.target.mode === "REPLACE" ? "Se creará una nueva versión; el historial anterior se conserva." : "El archivo se añadirá a este requisito, sin sustituir los que ya enviaste."}</p></div>
    {!draft.intentId && <div className="mt-5"><label htmlFor="portal-upload-file" className="portal-upload-picker"><FileUp size={29} aria-hidden="true" /><strong>{draft.file ? "Cambiar archivo" : "Selecciona tu archivo"}</strong><span>{draft.target.allowedMimeTypes.map(formatMime).join(", ")} · Máximo {fileSize(draft.target.maxFileSizeBytes)}</span><input id="portal-upload-file" type="file" accept={draft.target.allowedMimeTypes.join(",")} disabled={busy || draft.mustRefresh} onChange={event => update({ file: event.target.files?.[0] || null, error: null, phase: "SELECT" })} /></label><p className="portal-field-hint">Si necesitas varios soportes para este periodo, añádelos uno por envío.</p></div>}
    {draft.file && <div className="portal-selected-file"><FileUp size={20} aria-hidden="true" /><div><strong>{draft.file.name}</strong><span>{fileSize(draft.file.size)}</span></div></div>}
    {draft.phase === "UNCERTAIN" && !draft.binaryUploaded && draft.result?.status === "AWAITING_UPLOAD" && <p className="portal-notice portal-notice-warning mt-5">La transferencia anterior no quedó confirmada. Cierra este formulario y consulta los envíos pendientes de la lista. Cancela esa recepción o espera a que venza antes de preparar otro envío. Cancelar no confirma el borrado del objeto transferido.</p>}
    {phaseLabel && <div className={"portal-notice mt-5 " + (draft.phase === "FINISHED" ? "portal-notice-success" : "portal-notice-info")} role="status">{draft.phase === "FINISHED" ? <CheckCircle2 size={20} aria-hidden="true" /> : busy || draft.phase === "WAITING" ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}<div><strong>{phaseLabel}</strong><p className="mt-1 text-xs">{draft.result?.message || "Espera la confirmación antes de repetir el envío."}</p></div></div>}
    {draft.phase === "TRANSFERRING" && <progress aria-label="Progreso de transferencia del archivo" className="portal-upload-progress" value={draft.percent} max={100}>{draft.percent}%</progress>}
    {draft.phase === "FINISHED" && <p className="portal-field-hint mt-3">Registrar el archivo no significa que el documento o el crédito estén aprobados. Consulta el dictamen publicado en tu lista.</p>}
    {draft.error && <p role="alert" className="portal-notice portal-notice-danger mt-4">{draft.error}</p>}
    {!draft.binaryUploaded && draft.result?.status === "AWAITING_UPLOAD" && <p className="portal-field-hint mt-4">La transferencia anterior no quedó confirmada. Puedes cerrar este envío, actualizar la lista y preparar de nuevo el archivo. No se añadirá ninguna evidencia de este intento sin confirmación.</p>}
    <div className="portal-dialog-actions"><button type="button" className="portal-button portal-button-secondary" disabled={busy} onClick={onClose}>{draft.phase === "FINISHED" ? "Volver a mis documentos" : draft.mustRefresh ? "Cerrar y actualizar requisitos" : !draft.binaryUploaded && draft.result?.status === "AWAITING_UPLOAD" ? "Cerrar y preparar otro envío" : "Cerrar"}</button>{!draft.intentId && <button type="button" className="portal-button portal-button-teal" disabled={busy || !draft.file || draft.mustRefresh} onClick={() => { void upload(); }}>{busy ? "Enviando…" : "Confirmar y enviar"}</button>}{draft.intentId && ["WAITING", "UNCERTAIN", "FAILED"].includes(draft.phase) && <button type="button" className="portal-button portal-button-secondary" disabled={busy} onClick={() => update({ phase: "UNCERTAIN", pollRound: draft.pollRound + 1 })}><RefreshCw size={15} aria-hidden="true" />Consultar este envío</button>}{draft.binaryUploaded && draft.result?.status === "AWAITING_UPLOAD" && draft.result.canRetry && <button type="button" className="portal-button" disabled={busy} onClick={() => { if (draft.intentId) void confirm(draft.intentId); }}>Confirmar archivo recibido</button>}</div>
  </PortalDialog>;
}
