"use client";
import { CustomerDocumentReviewPanel } from "@/components/admin/CustomerDocumentReviewPanel";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useAdminDraft } from "@/components/admin/useAdminDraft";
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges";
import { CANONICAL_PUBLIC_STAGE_MAP } from "@/lib/portal/bank-stage-mapping";
import { PageHeader } from "@/components/admin/PageHeader";
import { CaseNavigation } from "@/components/admin/CaseNavigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminPermissions } from "@/components/admin/AdminShell";
import { DocumentDialog } from "@/components/admin/DocumentDialog";

interface PendingUploadReceipt { id: string; fileName: string; status: string; message: string; }
interface AdminUploadAttempt { intentId: string; binaryUploaded: boolean; status: string; message: string; }

interface DocumentWorkspaceProps {
  params: Promise<{ id: string }>;
}

async function readDocumentWorkspace(applicationId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/admin/crm/applications/${applicationId}/documents`, { signal });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Error ${response.status}: Fallo al cargar documentos`);
  }
  return response.json();
}

export default function DocumentWorkspacePage({ params }: DocumentWorkspaceProps) {
  const resolvedParams = use(params);
  const applicationId = resolvedParams.id;
  const permissions = useAdminPermissions();
  const canUpload = permissions.includes("crm:document:upload");
  const canReview = permissions.includes("crm:document:review");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedBankAppId, setSelectedBankAppId] = useAdminDraft<string>(`documents:${applicationId}:selectedBankAppId`, "ALL");
  const [selectedApplicantId, setSelectedApplicantId] = useAdminDraft<string>(`documents:${applicationId}:selectedApplicantId`, "ALL");

  // Estados de modales
  const [isUploadModalOpen, setIsUploadModalOpen] = useAdminDraft(`documents:${applicationId}:isUploadModalOpen`, false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useAdminDraft(`documents:${applicationId}:isReviewModalOpen`, false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useAdminDraft(`documents:${applicationId}:isAttachModalOpen`, false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Datos para carga
  const [uploadTargetReqId, setUploadTargetReqId] = useAdminDraft<string | null>(`documents:${applicationId}:uploadTargetReqId`, null);
  const [uploadCategory, setUploadCategory] = useAdminDraft<string>(`documents:${applicationId}:uploadCategory`, "IDENTIFICATION");
  const [uploadApplicantId, setUploadApplicantId] = useAdminDraft<string>(`documents:${applicationId}:uploadApplicantId`, "");
  const [uploadFile, setUploadFile] = useAdminDraft<File | null>(`documents:${applicationId}:uploadFile`, null);
  const [uploading, setUploading] = useAdminDraft(`documents:${applicationId}:uploading`, false);
  const [uploadStatusMsg, setUploadStatusMsg] = useAdminDraft<string | null>(`documents:${applicationId}:uploadStatusMsg`, null);

  const [uploadAttempt, setUploadAttempt] = useAdminDraft<AdminUploadAttempt | null>(`documents:${applicationId}:uploadAttempt`, null);

  // Datos para revisión
  const [reviewTarget, setReviewTarget] = useAdminDraft<{
    bankAppId: string;
    requirementId: string;
    versionId: string;
    reqName: string;
    bankName: string;
  } | null>(`documents:${applicationId}:reviewTarget`, null);
  const [reviewStatus, setReviewStatus] = useAdminDraft<string>(`documents:${applicationId}:reviewStatus`, "");
  const [rejectionReason, setRejectionReason] = useAdminDraft<string>(`documents:${applicationId}:rejectionReason`, "");
  const [internalNotes, setInternalNotes] = useAdminDraft<string>(`documents:${applicationId}:internalNotes`, "");
  const [customerVisibleNotes, setCustomerVisibleNotes] = useAdminDraft<string>(`documents:${applicationId}:customerVisibleNotes`, "");
  const [reviewInitial, setReviewInitial] = useAdminDraft<string>(`documents:${applicationId}:reviewInitial`, "");
  const reviewFingerprint = JSON.stringify([reviewStatus, rejectionReason, internalNotes, customerVisibleNotes]);
  const isReviewDirty = isReviewModalOpen && reviewFingerprint !== reviewInitial;
  const [reviewSubmitting, setReviewSubmitting] = useAdminDraft(`documents:${applicationId}:reviewSubmitting`, false);

  // Datos para vincular existente (Reutilización multibanco)
  const [attachTargetReqId, setAttachTargetReqId] = useAdminDraft<string | null>(`documents:${applicationId}:attachTargetReqId`, null);
  const [selectedVersionToAttach, setSelectedVersionToAttach] = useAdminDraft<string>(`documents:${applicationId}:selectedVersionToAttach`, "");
  const [attaching, setAttaching] = useAdminDraft(`documents:${applicationId}:attaching`, false);

  // Datos para historial de versiones
  const [historyAsset, setHistoryAsset] = useState<any>(null);
  useUnsavedChanges(uploading || reviewSubmitting || attaching || (isUploadModalOpen && !!uploadFile) || isReviewDirty);
  const applicantRoleLabel = (role: string) => (({ PRIMARY_HOLDER: "Titular", CO_APPLICANT: "Cosolicitante", GUARANTOR: "Garante" } as Record<string, string>)[role] || role.replace(/_/g, " "));
  const bankStageLabel = (stage: string) => CANONICAL_PUBLIC_STAGE_MAP[stage as keyof typeof CANONICAL_PUBLIC_STAGE_MAP]?.publicTitle || stage.replace(/_/g, " ");

  const applyWorkspaceData = useCallback((json: any) => {
    setData(json);
    setError(null);
    if (json.bankApplications?.length > 0) {
      setSelectedBankAppId((current) => current === "ALL" ? json.bankApplications[0].id : current);
    }
    if (json.applicants?.length > 0) {
      setUploadApplicantId((current) => current || json.applicants[0].id);
    }
  }, [setSelectedBankAppId, setUploadApplicantId]);

  const fetchWorkspace = useCallback(async () => {
    try {
      applyWorkspaceData(await readDocumentWorkspace(applicationId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [applicationId, applyWorkspaceData]);

  useEffect(() => {
    const controller = new AbortController();
    readDocumentWorkspace(applicationId, controller.signal)
      .then((json) => { if (!controller.signal.aborted) applyWorkspaceData(json); })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applicationId, applyWorkspaceData, uploading, reviewSubmitting, attaching]);

  const closeUpload = () => {
    if (uploading || (uploadFile && !window.confirm("¿Descartar el archivo seleccionado?"))) return;
    setIsUploadModalOpen(false);
    setUploadFile(null);
    setUploadTargetReqId(null);
    setUploadStatusMsg(null);
    if (uploadAttempt && !uploadAttempt.binaryUploaded) setUploadAttempt(null);
  };
  const closeReview = () => {
    if (reviewSubmitting || (isReviewDirty && !window.confirm("¿Descartar los cambios de esta revisión?"))) return;
    setIsReviewModalOpen(false);
    setReviewTarget(null);
    setRejectionReason("");
    setInternalNotes("");
    setCustomerVisibleNotes("");
    setReviewInitial("");
    setReviewStatus("");
  };
  const closeAttach = () => {
    if (attaching) return;
    setIsAttachModalOpen(false);
    setAttachTargetReqId(null);
    setSelectedVersionToAttach("");
  };

  // Manejar Materialización
  const handleMaterialize = async (bankAppId: string) => {
    if (loading || !canUpload) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MATERIALIZE_REQUIREMENTS",
          bankApplicationId: bankAppId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al materializar requisitos");
      await fetchWorkspace();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  // La recepción en cola y la validación del archivo son estados diferentes.
  const confirmAdminUpload = async (intentId: string) => {
    const response = await fetch(`/api/admin/crm/applications/${applicationId}/documents`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CONFIRM_UPLOAD", intentId }),
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) throw new Error(result.message || result.error || "No se pudo confirmar la recepción del archivo.");
    const queued = response.status === 202 || result.queued === true;
    setUploadAttempt({ intentId, binaryUploaded: true, status: queued ? "QUEUED" : "CONFIRMED", message: result.message || (queued ? "Archivo recibido en cola. La validación y la revisión siguen pendientes." : "Archivo validado. Consulte su revisión documental.") });
    return result;
  };
  const refreshPendingUploads = async () => {
    if (uploading) return;
    try {
      const current = await readDocumentWorkspace(applicationId);
      applyWorkspaceData(current);
      if (uploadAttempt) {
        const pending = (current.pendingUploads || []).find((item: PendingUploadReceipt) => item.id === uploadAttempt.intentId);
        if (pending) setUploadAttempt(value => value ? { ...value, status: pending.status, message: pending.message } : value);
        else setUploadAttempt(value => value ? { ...value, message: "El envío ya no figura entre los pendientes. Revise las versiones del expediente; si la confirmación quedó incierta, consulte el mismo envío antes de repetir la carga." } : value);
      }
    } catch (failure: unknown) { setError(failure instanceof Error ? failure.message : "No pudimos actualizar los envíos pendientes."); }
  };
  const recoverUploadConfirmation = async () => {
    if (!uploadAttempt?.binaryUploaded || uploading || !canUpload) return;
    setUploading(true);
    try { await confirmAdminUpload(uploadAttempt.intentId); setUploadFile(null); setIsUploadModalOpen(false); await fetchWorkspace(); }
    catch (failure: unknown) { setUploadStatusMsg(failure instanceof Error ? failure.message : "Consulte el resultado antes de repetir el envío."); }
    finally { setUploading(false); }
  };
  const handleUploadSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (uploading || !canUpload) return;
    if (uploadAttempt?.binaryUploaded && ["UNCERTAIN", "AWAITING_UPLOAD"].includes(uploadAttempt.status)) {
      setUploadStatusMsg("Consulte la confirmación del envío anterior antes de crear otra carga."); return;
    }
    if (!uploadFile || uploadFile.size <= 0 || uploadFile.size > 15 * 1024 * 1024) { setUploadStatusMsg("Seleccione un archivo de hasta 15 MB."); return; }
    let attempt: AdminUploadAttempt | null = null;
    try {
      setUploading(true); setUploadStatusMsg("1/3 Preparando autorización de carga…");
      const intentResponse = await fetch(`/api/admin/crm/applications/${applicationId}/documents`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_UPLOAD_INTENT", category: uploadCategory, title: uploadFile.name, declaredFileName: uploadFile.name, declaredMimeType: uploadFile.type || "application/pdf", maxAllowedBytes: 15 * 1024 * 1024, applicantId: uploadApplicantId || undefined, requirementId: uploadTargetReqId || undefined }),
      });
      const intent = await intentResponse.json();
      if (!intentResponse.ok || !intent.intentId || !intent.uploadUrl || intent.uploadMethod !== "PUT") throw new Error(intent.error || "No se pudo autorizar el envío.");
      attempt = { intentId: intent.intentId, binaryUploaded: false, status: "AWAITING_UPLOAD", message: "Transferencia pendiente de confirmación." };
      setUploadAttempt(attempt); setUploadStatusMsg("2/3 Transfiriendo el archivo…");
      const put = await fetch(intent.uploadUrl, { method: intent.uploadMethod, headers: intent.uploadHeaders, body: uploadFile });
      if (!put.ok) throw new Error("La transferencia no se completó. Consulte el estado de este intento.");
      attempt = { ...attempt, binaryUploaded: true }; setUploadAttempt(attempt);
      setUploadStatusMsg("3/3 Confirmando recepción para validación…");
      await confirmAdminUpload(intent.intentId);
      setIsUploadModalOpen(false); setUploadFile(null); setUploadStatusMsg(null);
      await fetchWorkspace();
    } catch (failure: unknown) {
      const message = failure instanceof Error ? failure.message : "No se pudo confirmar el resultado del envío.";
      setUploadStatusMsg(message);
      if (attempt) setUploadAttempt({ ...attempt, status: "UNCERTAIN", message: attempt.binaryUploaded ? "El archivo se transfirió, pero no se pudo confirmar el resultado. Consulte este mismo envío antes de repetirlo." : "La transferencia no quedó confirmada. Actualice el estado antes de preparar otra carga." });
    } finally { setUploading(false); }
  };

  // Manejar Revisión Humana
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget || reviewSubmitting || !canReview) return;
    if (reviewStatus !== "APPROVED" && reviewStatus !== "REJECTED") {
      alert("Seleccione un dictamen antes de registrar la revisión.");
      return;
    }

    if (reviewStatus === "REJECTED" && !rejectionReason.trim()) {
      alert("Debe indicar el motivo de rechazo obligatorio");
      return;
    }

    try {
      setReviewSubmitting(true);
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVIEW",
          bankApplicationId: reviewTarget.bankAppId,
          requirementId: reviewTarget.requirementId,
          documentVersionId: reviewTarget.versionId,
          status: reviewStatus,
          rejectionReason: rejectionReason || undefined,
          internalNotes: internalNotes || undefined,
          customerVisibleNotes: customerVisibleNotes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fallo al registrar revisión");

      setIsReviewModalOpen(false);
      setReviewTarget(null);
      setRejectionReason("");
      setInternalNotes("");
      setCustomerVisibleNotes("");
      setReviewInitial("");
    setReviewStatus("");
      await fetchWorkspace();
    } catch (err: any) {
      alert(`Error en revisión: ${err.message}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Manejar Reutilización Multibanco
  const handleAttachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attaching || !canUpload) return;
    if (!attachTargetReqId || !selectedVersionToAttach) {
      alert("Seleccione una versión documental");
      return;
    }

    try {
      setAttaching(true);
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ATTACH_TO_REQUIREMENT",
          requirementId: attachTargetReqId,
          documentVersionId: selectedVersionToAttach,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fallo al vincular versión");

      setIsAttachModalOpen(false);
      setAttachTargetReqId(null);
      setSelectedVersionToAttach("");
      await fetchWorkspace();
    } catch (err: any) {
      alert(`Error al vincular: ${err.message}`);
      setLoading(false);
    } finally {
      setAttaching(false);
    }
  };

  // Descargar Documento Seguro
  const handleDownload = async (versionId: string) => {
    try {
      const res = await fetch(
        `/api/admin/crm/applications/${applicationId}/documents/${versionId}/download`
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Fallo al autorizar descarga");
      }
      window.open(json.downloadUrl, "_blank");
    } catch (err: any) {
      alert(`Error de descarga: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="admin-page flex min-h-[40vh] items-center justify-center">
        <div role="status" className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-slate-400 font-semibold">Cargando Workspace Documental...</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="admin-page flex min-h-[40vh] items-center justify-center">
        <div role="alert" className="max-w-md bg-slate-900 border border-rose-800 rounded-xl p-6 text-center">
          <div className="text-rose-500 font-bold text-lg mb-2">Error de Carga</div>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <Link
            href={`/admin/crm/applications/${applicationId}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-lg text-white"
          >
            Volver al Expediente
          </Link>
        </div>
      </div>
    );
  }

  const { fileNumber, client, applicants, bankApplications, assets, requirements, bankReadiness } = data;

  // Filtrar requisitos
  const filteredRequirements = requirements.filter((req: any) => {
    if (selectedBankAppId !== "ALL" && req.bankApplicationId !== selectedBankAppId) return false;
    if (selectedApplicantId !== "ALL" && req.applicantId !== selectedApplicantId) return false;
    return true;
  });

  const selectedBankApp = bankApplications.find((b: any) => b.id === selectedBankAppId);
  const readiness = selectedBankAppId !== "ALL" ? bankReadiness[selectedBankAppId] : null;

  return (
    <div className="admin-page">
      <div className="space-y-6">
        <PageHeader title="Documentos" eyebrow={fileNumber}
          description={`Requisitos y evidencias de ${[client?.firstName, client?.firstLastName].filter(Boolean).join(" ") || "la solicitud"}. Revise el estado documental de cada banco antes de continuar.`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/admin/crm/applications/${applicationId}/documents/dossier${
                  selectedBankAppId !== "ALL" ? `?bankApplicationId=${selectedBankAppId}` : ""
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-button text-xs font-bold"
              >
                📦 Descargar Dossier Bancario (PDF)
              </a>
              {canUpload && (
                <button
                  onClick={() => {
                    setUploadTargetReqId(null);
                    setIsUploadModalOpen(true);
                  }}
                  className="admin-button admin-button-primary"
                >
                  + Cargar documento
                </button>
              )}
            </div>
          }
        />
        <CaseNavigation applicationId={applicationId} fileNumber={fileNumber} documents />
        {error && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-sm text-rose-300">{error}</p>}

        <CustomerDocumentReviewPanel applicationId={applicationId} requirements={data.customerRequirements || []} canLink={!!data.canLinkCustomerIdentity} onRefresh={fetchWorkspace} />

        {(uploadAttempt || (data.pendingUploads || []).length > 0) && <section className="admin-card space-y-4" aria-labelledby="admin-pending-uploads-title"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="admin-pending-uploads-title" className="font-semibold text-white">Recepción y validación de archivos</h2><button type="button" className="admin-button" disabled={uploading} onClick={() => { void refreshPendingUploads(); }}>Actualizar envíos</button></div>{uploadAttempt && <div role="status" className="rounded-lg border border-sky-800 bg-sky-950/30 p-3 text-sm text-sky-100"><p>{uploadAttempt.message}</p><p className="mt-2 break-all text-xs text-sky-200">Envío: {uploadAttempt.intentId}</p>{uploadAttempt.binaryUploaded && ["UNCERTAIN", "AWAITING_UPLOAD"].includes(uploadAttempt.status) && <button type="button" className="admin-button mt-3" disabled={uploading || !canUpload} onClick={() => { void recoverUploadConfirmation(); }}>Consultar confirmación del mismo envío</button>}</div>}<ul className="space-y-3">{(data.pendingUploads || []).map((pending: PendingUploadReceipt) => <li key={pending.id} className="rounded-lg border border-slate-700 p-3"><div className="flex flex-wrap justify-between gap-2"><strong className="break-all text-sm text-white">{pending.fileName}</strong><span className="text-xs text-slate-300">{({ AWAITING_UPLOAD: "Pendiente de confirmación", QUEUED: "En cola", PROCESSING: "Validando", PROCESSING_ERROR: "Revisar envío", EXPIRED: "Autorización vencida" } as Record<string,string>)[pending.status] || pending.status}</span></div><p className="mt-2 text-xs text-slate-300">{pending.message}</p><p className="mt-2 break-all text-[11px] text-slate-400">{pending.id}</p></li>)}</ul><p className="text-xs text-slate-400">La recepción o la validación del archivo no sustituye la revisión documental.</p></section>}

        {/* Readiness Bar por Banco */}
        {selectedBankApp && readiness && (
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              readiness.isReady
                ? "bg-emerald-950/30 border-emerald-800/80 text-emerald-300"
                : "bg-amber-950/30 border-amber-800/80 text-amber-300"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">
                  {selectedBankApp.bankId.toUpperCase()} — {selectedBankApp.productType}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    readiness.isReady ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {readiness.isReady ? "LISTO PARA RADICACIÓN" : "BLOQUEADO PARA RADICACIÓN"}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-90">
                {readiness.message} · Obligatorios aprobados: {readiness.approvedCount}/
                {readiness.totalMandatory}
              </p>
              {readiness.pendingRequirements.length > 0 && (
                <ul className="text-[11px] list-disc list-inside mt-2 space-y-0.5 text-amber-200">
                  {readiness.pendingRequirements.map((issue: { requirementId: string; title: string; reason?: string }) => (
                    <li key={issue.requirementId}>{issue.title}: {issue.reason || "Pendiente de revisión"}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs opacity-75 font-mono">
                Etapa actual: {bankStageLabel(selectedBankApp.stage)}
              </span>
            </div>
          </div>
        )}

        {/* Selector de Banco y Solicitante */}
        <div className="flex flex-wrap items-center justify-between gap-4 admin-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2">Entidad Bancaria:</span>
            <button
              onClick={() => setSelectedBankAppId("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedBankAppId === "ALL"
                  ? "bg-sky-600 text-white keep-white-text"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Todos los Bancos
            </button>
            {bankApplications.map((bankApp: any) => (
              <button
                key={bankApp.id}
                onClick={() => setSelectedBankAppId(bankApp.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedBankAppId === bankApp.id
                    ? "bg-sky-600 text-white keep-white-text"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span>{bankApp.bankId.toUpperCase()}</span>
                {bankReadiness[bankApp.id]?.isReady && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="document-applicant-filter" className="text-xs font-bold text-slate-400">Sujeto:</label>
            <select id="document-applicant-filter"
              value={selectedApplicantId}
              onChange={(e) => setSelectedApplicantId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="ALL">Todos los solicitantes</option>
              {applicants.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {applicantRoleLabel(a.role)}: {a.firstName} {a.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tablero Principal: Checklist de Obligaciones Documentales */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span> Obligaciones Documentales Materializadas ({filteredRequirements.length})
            </h2>

            {canUpload && selectedBankApp && filteredRequirements.length === 0 && (
              <button
                onClick={() => handleMaterialize(selectedBankApp.id)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Generar Requisitos para {selectedBankApp.bankId.toUpperCase()}
              </button>
            )}
          </div>

          {filteredRequirements.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <p className="text-sm italic">
                No se han generado requisitos documentales para los filtros seleccionados.
              </p>
              {canUpload && selectedBankApp && (
                <button
                  onClick={() => handleMaterialize(selectedBankApp.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg"
                >
                  Materializar Catálogo de Requisitos para {selectedBankApp.bankId.toUpperCase()}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredRequirements.map((req: any) => {
                const latestReview = req.reviews?.[0];
                const activeEvidence = req.evidenceLinks?.[0];
                const version = activeEvidence?.documentVersion;
                const isApproved = latestReview?.status === "APPROVED";
                const isRejected = latestReview?.status === "REJECTED";
                const isMissing = !version;

                return (
                  <div
                    key={req.id}
                    className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {req.requirementDefinition.title}
                        </span>
                        {req.isMandatory ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            OPCIONAL
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {req.bankApplication.bankId.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {req.applicant?.role ? applicantRoleLabel(req.applicant.role) : "General"}: {req.applicant?.firstName} {req.applicant?.lastName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{req.requirementDefinition.description}</p>

                      {/* Estado del Archivo Físico Asociado */}
                      {version ? (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 text-slate-300">
                          <span className="font-semibold text-slate-200">
                            📄 {version.originalFileName} (v{version.versionNumber})
                          </span>
                          <span>·</span>
                          <span className="text-slate-400">
                            {(version.fileSizeBytes / 1024).toFixed(1)} KB
                          </span>
                          <span>·</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                              version.scanStatus === "CLEAN"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-rose-950 text-rose-400 border border-rose-800"
                            }`}
                          >
                            Antivirus: {version.scanStatus}
                          </span>
                          <span>·</span>
                          <button
                            onClick={() => handleDownload(version.id)}
                            className="text-emerald-400 hover:underline font-semibold"
                          >
                            Descargar
                          </button>
                          {version.scanDetails && version.scanDetails.includes("IA ") && (
                            <>
                              <span>·</span>
                              <span className="px-2 py-0.5 rounded bg-blue-950/90 text-blue-300 border border-blue-700/50 font-semibold text-[10px]">
                                🤖 {version.scanDetails.split("|").pop()?.trim()}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-400/90 italic pt-1">
                          ⚠️ Sin archivo cargado para este requisito.
                        </div>
                      )}

                      {latestReview?.internalNotes &&
                        latestReview.internalNotes.includes("[PRE-AUDITORÍA IA") && (
                          <div className="mt-2 p-2.5 rounded-lg bg-slate-950/90 border border-blue-800/40 text-[11px] text-slate-300 whitespace-pre-line font-mono">
                            {latestReview.internalNotes}
                          </div>
                        )}
                    </div>

                    {/* Estado de Decisión y Acciones */}
                    <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
                      <div>
                        {isMissing ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            SIN DOCUMENTO
                          </span>
                        ) : isApproved ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            APROBADO BANCO
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            RECHAZADO
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            PENDIENTE REVISIÓN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botón de Carga o Reemplazo */}
                        {canUpload && <button
                          onClick={() => {
                            setUploadTargetReqId(req.id);
                            setUploadCategory(req.requirementDefinition.category || "IDENTIFICATION");
                            setUploadApplicantId(req.applicantId || "");
                            setIsUploadModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                        >
                          {version ? "Reemplazar" : "Cargar"}
                        </button>}

                        {/* Botón de Reutilización Multibanco */}
                        {canUpload && <button
                          onClick={() => {
                            setAttachTargetReqId(req.id);
                            setIsAttachModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-lg border border-purple-800/40 transition-all"
                          title="Vincular un archivo ya cargado en este expediente"
                        >
                          Reutilizar
                        </button>}

                        {/* Botón de Revisión Humana */}
                        {canReview && version && (
                          <button
                            onClick={() => {
                              setReviewTarget({
                                bankAppId: req.bankApplicationId,
                                requirementId: req.id,
                                versionId: version.id,
                                reqName: req.requirementDefinition.title,
                                bankName: req.bankApplication.bankId.toUpperCase(),
                              });
                              setReviewInitial(JSON.stringify(["", latestReview?.rejectionReasonDescription || "", latestReview?.internalNotes || "", latestReview?.customerVisibleNotes || ""]));
                              setReviewStatus("");
                              setRejectionReason(latestReview?.rejectionReasonDescription || "");
                              setInternalNotes(latestReview?.internalNotes || "");
                              setCustomerVisibleNotes(latestReview?.customerVisibleNotes || "");
                              setIsReviewModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-700/50 transition-all"
                          >
                            Revisar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sección: Repositorio de Activos Documentales del Expediente */}
        <div className="admin-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Archivos del expediente ({assets?.length || 0})
              </h2>
              <p className="text-xs text-slate-400">
                Archivos del expediente con estado de revisión, versiones y descarga autorizada.
              </p>
            </div>
          </div>

          {!assets?.length && <p className="py-4 text-sm text-slate-400">Aún no hay archivos en este expediente. Cargue la evidencia de un requisito para empezar.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assets?.map((asset: any) => {
              const currentVer = asset.versions?.[0];
              const versionCount = asset.versions?.length || 0;

              return (
                <div
                  key={asset.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        {asset.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {versionCount} {versionCount === 1 ? "versión" : "versiones"}
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm truncate" title={asset.title}>
                      {asset.title}
                    </div>
                    {asset.applicant && (
                      <div className="text-xs text-slate-400">
                        {applicantRoleLabel(asset.applicant.role)}: {asset.applicant.firstName} {asset.applicant.lastName}
                      </div>
                    )}
                  </div>

                  {currentVer && (
                    <div className="text-[11px] space-y-1 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>v{currentVer.versionNumber}</span>
                        <span>{(currentVer.fileSizeBytes / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate" title={currentVer.sha256}>
                        SHA: {currentVer.sha256.slice(0, 16)}...
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <StatusBadge status={currentVer.scanStatus} />
                        <button
                          onClick={() => handleDownload(currentVer.id)}
                          className="text-emerald-400 hover:underline font-sans font-semibold"
                        >
                          Descargar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <button
                      onClick={() => {
                        setHistoryAsset(asset);
                        setIsHistoryModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      Ver historial
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL 1: Carga y Validación Antivirus */}
      {isUploadModalOpen && (
        <DocumentDialog title="Cargar documento" onClose={closeUpload} busy={uploading} wide={false}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Cargar Evidencia Documental</h3>
              <button
                onClick={closeUpload}
                className="text-slate-400 hover:text-white" aria-label="Cerrar diálogo"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoría del Documento
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  disabled={uploading}
                >
                  <option value="IDENTIFICATION">Identificación (Cédula de Ciudadanía)</option>
                  <option value="INCOME_PROOF">Comprobante de Ingresos / Desprendibles</option>
                  <option value="TAX_RETURN">Declaración de Renta</option>
                  <option value="BANK_STATEMENT">Extractos Bancarios</option>
                  <option value="EMPLOYMENT_CERT">Certificado Laboral</option>
                  <option value="PROPERTY_DOCS">Documentos del Inmueble (Certificado de Tradición)</option>
                  <option value="OTHER">Otro Soporte Requerido</option>
                </select>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sujeto / Solicitante Asociado
                <select
                  value={uploadApplicantId}
                  onChange={(e) => setUploadApplicantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  disabled={uploading}
                >
                  {applicants.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {applicantRoleLabel(a.role)}: {a.firstName} {a.lastName}
                    </option>
                  ))}
                </select>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Archivo (PDF, JPEG o PNG · Máximo 15 MB)
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-300"
                  disabled={uploading}
                  required={!uploadFile}
                />
                {uploadFile && <span className="mt-2 block text-xs text-emerald-300">Archivo seleccionado: {uploadFile.name}</span>}
                </label>
              </div>

              {uploadStatusMsg && (
                <div role="status" className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300">
                  {uploadStatusMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeUpload}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg"
                  disabled={uploading}
                >
                  {uploading ? "Enviando…" : "Enviar archivo"}
                </button>
              </div>
            </form>
        </DocumentDialog>
      )}

      {/* MODAL 2: Revisión Humana Bancaria */}
      {isReviewModalOpen && reviewTarget && (
        <DocumentDialog title="Revisión documental" onClose={closeReview} busy={reviewSubmitting} wide={false}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Revisión Documental Interna</h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  {reviewTarget.bankName} · {reviewTarget.reqName}
                </p>
              </div>
              <button
                onClick={closeReview}
                className="text-slate-400 hover:text-white" aria-label="Cerrar diálogo"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dictamen de Revisión
                <select
                  value={reviewStatus}
                  required
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  disabled={reviewSubmitting}
                >
                  <option value="" disabled>Seleccione el dictamen</option>
                  <option value="APPROVED">APROBADO (Cumple política del banco)</option>
                  <option value="REJECTED">Solicitar corrección / Rechazar (indique el motivo)</option>
                </select>
                </label>
              </div>

              {reviewStatus === "REJECTED" && (
                <div>
                  <label className="block text-xs font-semibold text-rose-400 mb-1">
                    Motivo de Rechazo Obligatorio *
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ej. Cédula ilegible en el reverso / extractos sin sello"
                    className="w-full bg-slate-950 border border-rose-800 rounded-lg p-2.5 text-xs text-white"
                    required
                    disabled={reviewSubmitting}
                  />
                </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas Internas del Analista (Privado)
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  disabled={reviewSubmitting}
                />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observaciones visibles para el cliente
                <textarea
                  value={customerVisibleNotes}
                  onChange={(e) => setCustomerVisibleNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  disabled={reviewSubmitting}
                />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeReview}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                  disabled={reviewSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg"
                  disabled={reviewSubmitting || (reviewStatus !== "APPROVED" && reviewStatus !== "REJECTED")}
                >
                  {reviewSubmitting ? "Guardando..." : "Registrar Decisión"}
                </button>
              </div>
            </form>
        </DocumentDialog>
      )}

      {/* MODAL 3: Reutilización Multibanco */}
      {isAttachModalOpen && (
        <DocumentDialog title="Vincular evidencia" onClose={closeAttach} busy={attaching} wide={false}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Reutilizar Evidencia Documental</h3>
              <button
                onClick={closeAttach}
                className="text-slate-400 hover:text-white" aria-label="Cerrar diálogo"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Vincule una versión física ya existente a este requisito bancario. No se duplicarán bytes ni se alterarán revisiones previas.
            </p>

            <form onSubmit={handleAttachSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seleccione el Archivo Físico
                <select
                  value={selectedVersionToAttach}
                  onChange={(e) => setSelectedVersionToAttach(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                  required disabled={attaching}
                >
                  <option value="">-- Seleccionar versión --</option>
                  {assets?.flatMap((asset: any) =>
                    asset.versions.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {asset.title} (v{v.versionNumber}) · {v.originalFileName} · {v.scanStatus}
                      </option>
                    ))
                  )}
                </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button" disabled={attaching}
                  onClick={closeAttach}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={attaching}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg"
                >
                  {attaching ? "Vinculando…" : "Vincular evidencia"}
                </button>
              </div>
            </form>
        </DocumentDialog>
      )}

      {/* MODAL 4: historial de Versiones */}
      {isHistoryModalOpen && historyAsset && (
        <DocumentDialog title="Historial de versiones" onClose={() => setIsHistoryModalOpen(false)} busy={false} wide={true}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Historial de versiones</h3>
                <p className="text-xs text-slate-400">{historyAsset.title}</p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white" aria-label="Cerrar diálogo"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {historyAsset.versions.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Versión {v.versionNumber}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(v.uploadedAt).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    <div>Archivo: {v.originalFileName}</div>
                    <div>Tamaño: {(v.fileSizeBytes / 1024).toFixed(1)} KB · MIME: {v.detectedMimeType}</div>
                    <div className="truncate">SHA-256: {v.sha256}</div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={v.scanStatus} />
                    <button
                      onClick={() => handleDownload(v.id)}
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      Descargar Versión
                    </button>
                  </div>
                </div>
              ))}
            </div>
        </DocumentDialog>
      )}
    </div>
  );
}
