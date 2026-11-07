"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Download,
  X,
  FileCheck,
  Eye,
  FileSpreadsheet,
  ArrowLeft,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface DocumentRequirement {
  requirementId: string;
  bankId: string;
  requirementCode: string;
  title: string;
  description: string;
  category: string;
  isMandatory: boolean;
  validityDays: number | null;
  status: "PENDING_UPLOAD" | "UNDER_REVIEW" | "APPROVED" | "REJECTED_NEEDS_ACTION";
  rejectionReasonPublic?: string | null;
  customerVisibleNotes?: string | null;
  hasUploadedEvidence: boolean;
  uploadedAt?: string | null;
  validUntil?: string | null;
  canUploadNewVersion: boolean;
  latestVersionId?: string | null;
  versionNumber?: number | null;
  originalFileName?: string | null;
  detectedMimeType?: string | null;
}

interface ApplicationOption {
  id: string;
  fileNumber: string;
  productCategory: string;
}

type StatusFilter = "ALL" | "PENDING_UPLOAD" | "REJECTED_NEEDS_ACTION" | "UNDER_REVIEW" | "APPROVED";

function uploadWithProgress(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.min(100, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Fallo en transferencia binaria al bucket Supabase (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Error de red durante la carga directa hacia Supabase Storage."));
    };

    xhr.send(file);
  });
}

export default function DocumentosPortalPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Modal de Subida con Drag & Drop y Progreso Real
  const [activeReq, setActiveReq] = useState<DocumentRequirement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Modal de Previsualización / Descarga de Versión Certificada
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    fileName: string;
    url: string;
    mimeType: string;
    versionNumber: number;
  } | null>(null);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);

  const loadRequirements = useCallback(async (appId: string) => {
    if (!appId) return;
    try {
      setReqLoading(true);
      setError(null);
      const res = await fetch(`/api/portal/documents/requirements?applicationId=${appId}`);
      if (!res.ok) {
        throw new Error("No se pudieron cargar los requisitos documentales de este expediente.");
      }
      const json = await res.json();
      setRequirements(json.requirements || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReqLoading(false);
    }
  }, []);

  // Cargar sesión mágica (si viene en URL) y Solicitudes del usuario
  useEffect(() => {
    async function loadApps() {
      try {
        setLoading(true);
        let urlAppId: string | null = null;

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const urlToken = params.get("trackToken");
          urlAppId = params.get("applicationId");

          if (urlToken) {
            await fetch("/api/portal/auth/magic-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackToken: urlToken }),
            });
          }
        }

        const res = await fetch("/api/portal/dashboard");
        if (!res.ok) {
          throw new Error(
            "Para gestionar documentos, primero active su sesión desde el Resumen del Portal con su Radicado o Código OTP."
          );
        }
        const json = await res.json();
        const apps = (json.applications || []).map((a: any) => ({
          id: a.id,
          fileNumber: a.fileNumber,
          productCategory: a.productCategory,
        }));
        setApplications(apps);

        if (urlAppId && apps.some((a: ApplicationOption) => a.id === urlAppId)) {
          setSelectedAppId(urlAppId);
        } else if (apps.length > 0) {
          setSelectedAppId(apps[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      loadRequirements(selectedAppId);
    }
  }, [selectedAppId, loadRequirements]);

  // Generar vista previa local cuando se selecciona un archivo
  useEffect(() => {
    const primary = selectedFiles[0];
    if (!primary) {
      setLocalPreviewUrl(null);
      return;
    }
    if (primary.type.startsWith("image/") || primary.type === "application/pdf") {
      const objUrl = URL.createObjectURL(primary);
      setLocalPreviewUrl(objUrl);
      return () => URL.revokeObjectURL(objUrl);
    }
    setLocalPreviewUrl(null);
  }, [selectedFiles]);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    setSelectedFiles(filesArray);
    setUploadError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadProgressText) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploadProgressText) return;
    handleFilesSelected(e.dataTransfer.files);
  };

  // Manejador de Carga Documental Segura hacia Supabase Storage (Multi-file + XMLHttpRequest Progress + ClamAV)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReq || selectedFiles.length === 0 || !selectedAppId) return;

    try {
      setUploadError(null);
      setUploadPercent(5);

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const prefix = selectedFiles.length > 1 ? `[Archivo ${i + 1}/${selectedFiles.length}] ` : "";
        const resolvedMime =
          file.type ||
          (file.name.toLowerCase().endsWith(".xml") ? "application/xml" : "application/pdf");

        setUploadProgressText(
          `${prefix}Fase 1/3: Autorizando canal cifrado en Supabase Quarantine Vault...`
        );

        // 1. Solicitar intención de carga firmada
        const intentRes = await fetch("/api/portal/documents/upload-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: selectedAppId,
            requirementId: activeReq.requirementId,
            fileName: file.name,
            mimeType: resolvedMime,
            fileSize: file.size,
          }),
        });

        if (!intentRes.ok) {
          const errJson = await intentRes.json();
          throw new Error(errJson.error || "No se pudo autorizar la carga documental.");
        }

        const { intentId, uploadUrl } = await intentRes.json();

        // 2. Cargar directamente al bucket fintera-documents-quarantine con progreso en tiempo real
        setUploadProgressText(`${prefix}Fase 2/3: Subiendo ${file.name} a cuarentena cifrada...`);
        await uploadWithProgress(uploadUrl, file, resolvedMime, (pct) => {
          setUploadPercent(pct);
          setUploadProgressText(
            `${prefix}Fase 2/3: Subiendo ${file.name} (${pct}%)...`
          );
        });

        // 3. Confirmar carga, validar Magic Bytes, SHA-256, ClamAV y promover a fintera-documents-clean
        setUploadProgressText(
          `${prefix}Fase 3/3: Verificando Magic Bytes, SHA-256, Antivirus ClamAV y promoviendo a Bóveda Limpia...`
        );
        const confirmRes = await fetch("/api/portal/documents/confirm-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intentId }),
        });

        if (!confirmRes.ok) {
          const confErr = await confirmRes.json();
          throw new Error(confErr.error || "Error al certificar el documento en bóveda.");
        }

        const confirmData = await confirmRes.json();
        if (confirmData.scanStatus === "INFECTED") {
          throw new Error(
            "ALERTA DE SEGURIDAD: El archivo fue bloqueado por contener una firma maliciosa."
          );
        }
      }

      setUploadPercent(100);
      setUploadSuccess(true);
      setUploadProgressText(
        "Evidencia certificada y almacenada en Bóveda Limpia Supabase (AES-256)."
      );

      await loadRequirements(selectedAppId);

      setTimeout(() => {
        setActiveReq(null);
        setSelectedFiles([]);
        setUploadProgressText(null);
        setUploadPercent(0);
        setUploadSuccess(false);
      }, 1400);
    } catch (err: any) {
      setUploadError(err.message || "Error procesando el documento.");
      setUploadProgressText(null);
      setUploadPercent(0);
    }
  };

  // Previsualizar o Descargar Documento desde Bóveda Limpia Supabase
  const handlePreviewOrDownload = async (req: DocumentRequirement, mode: "PREVIEW" | "DOWNLOAD") => {
    if (!req.latestVersionId) return;
    try {
      setDownloadingVersionId(req.latestVersionId);
      const res = await fetch(`/api/portal/documents/${req.latestVersionId}/download`);
      const data = await res.json();
      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || "No fue posible generar el enlace firmado de visualización.");
      }

      if (mode === "DOWNLOAD") {
        window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        setPreviewModal({
          title: req.title,
          fileName: req.originalFileName || data.fileName || "documento.pdf",
          url: data.downloadUrl,
          mimeType: req.detectedMimeType || "application/pdf",
          versionNumber: req.versionNumber || 1,
        });
      }
    } catch (err: any) {
      alert(err.message || "Error abriendo documento certificado.");
    } finally {
      setDownloadingVersionId(null);
    }
  };

  const renderStatusBadge = (status: DocumentRequirement["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobado Conforme
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            En Revisión Mesa Fintera
          </span>
        );
      case "REJECTED_NEEDS_ACTION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Subsanación Requerida
          </span>
        );
      case "PENDING_UPLOAD":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <UploadCloud className="w-3.5 h-3.5" />
            Pendiente de Carga
          </span>
        );
    }
  };

  // Métricas del Checklist
  const totalCount = requirements.length;
  const approvedCount = requirements.filter((r) => r.status === "APPROVED").length;
  const reviewCount = requirements.filter((r) => r.status === "UNDER_REVIEW").length;
  const rejectedCount = requirements.filter((r) => r.status === "REJECTED_NEEDS_ACTION").length;
  const pendingCount = requirements.filter((r) => r.status === "PENDING_UPLOAD").length;
  const uploadedPct =
    totalCount > 0 ? Math.round(((approvedCount + reviewCount) / totalCount) * 100) : 0;

  const filteredRequirements = requirements.filter((r) =>
    statusFilter === "ALL" ? true : r.status === statusFilter
  );

  return (
    <div className="space-y-8">
      {/* Encabezado Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/portal">
              <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Resumen</span>
              </Button>
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Vault · Cuarentena + Bóveda Limpia AES-256</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 pt-1">
            Centro Documental y Bóveda de Evidencias
          </h1>
          <p className="text-sm text-slate-600">
            Arrastre sus soportes en PDF, PNG, JPG o XML DIAN. Cada archivo se valida con Magic Bytes, SHA-256 y escaneo antivirus antes de certificarse.
          </p>
        </div>

        {/* Selector de Solicitud */}
        {applications.length > 0 && (
          <div className="flex flex-col gap-1.5 min-w-[240px]">
            <Label htmlFor="app-select" className="text-xs font-bold uppercase text-slate-600">
              Expediente Activo:
            </Label>
            <select
              id="app-select"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.fileNumber} — {app.productCategory.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPIs de Progreso Documental y Filtros */}
      {totalCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 bg-white lg:col-span-2">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Avance de Carpeta Documental</span>
                <span className="text-emerald-700 font-bold">
                  {approvedCount + reviewCount} de {totalCount} soportes entregados ({uploadedPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, uploadedPct)}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {(
                  [
                    { id: "ALL", label: `Todos (${totalCount})` },
                    { id: "PENDING_UPLOAD", label: `Pendientes (${pendingCount})` },
                    { id: "REJECTED_NEEDS_ACTION", label: `Por Subsanar (${rejectedCount})` },
                    { id: "UNDER_REVIEW", label: `En Revisión (${reviewCount})` },
                    { id: "APPROVED", label: `Aprobados (${approvedCount})` },
                  ] as Array<{ id: StatusFilter; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      statusFilter === tab.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-[#0F172A] text-white lg:col-span-2">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Soporte Factoring B2B & RADIAN DIAN</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nuestra bóveda acepta archivos <strong>XML AttachedDocument DIAN</strong> junto con la representación gráfica PDF de sus facturas electrónicas (hasta 15 MB por archivo).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span>Hash SHA-256 + Antivirus en tiempo real</span>
                <span className="text-emerald-400 font-mono">fintera-documents-clean</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenido Principal */}
      {loading || reqLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Clock className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
          <p className="text-sm font-medium">
            Sincronizando obligaciones documentales y estado de bóveda...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <p>{error}</p>
          </div>
          <Link href="/portal">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white text-xs shrink-0">
              Ir a Activar Sesión en el Portal
            </Button>
          </Link>
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <FileCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            No hay documentos en este filtro
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Seleccione &quot;Todos&quot; para visualizar el listado completo de soportes del expediente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequirements.map((req) => (
            <Card
              key={req.requirementId}
              className={`border transition-all ${
                req.status === "REJECTED_NEEDS_ACTION"
                  ? "border-rose-300 bg-rose-50/20 shadow-sm"
                  : req.status === "APPROVED"
                  ? "border-emerald-200 bg-emerald-50/10"
                  : req.status === "UNDER_REVIEW"
                  ? "border-blue-200 bg-blue-50/10"
                  : "border-slate-200 bg-white"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
                        {req.bankId}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        [{req.requirementCode}]
                      </span>
                      {renderStatusBadge(req.status)}
                      {req.isMandatory && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Obligatorio
                        </span>
                      )}
                      {req.versionNumber && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Layers className="w-3 h-3" />
                          Versión v{req.versionNumber}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{req.description}</p>

                    {/* Explicación de Rechazo / Subsanación Pública */}
                    {req.status === "REJECTED_NEEDS_ACTION" && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1 mt-2">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>Observación de Mesa de Crédito (Requiere Subsanación):</span>
                        </div>
                        <p>
                          {req.rejectionReasonPublic ||
                            "El documento presenta ilegibilidad o requiere actualización de vigencia."}
                        </p>
                        {req.customerVisibleNotes && (
                          <p className="text-[11px] text-rose-700 font-medium pt-1">
                            Instrucción para corregir: {req.customerVisibleNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Metadatos del archivo cargado */}
                    {req.hasUploadedEvidence && (
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                        {req.originalFileName && (
                          <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            📄 {req.originalFileName}
                          </span>
                        )}
                        {req.uploadedAt && (
                          <span>
                            Cargado el:{" "}
                            {new Date(req.uploadedAt).toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones de Previsualización, Descarga y Carga de Nueva Versión */}
                  <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    {req.hasUploadedEvidence && req.latestVersionId && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingVersionId === req.latestVersionId}
                          onClick={() => handlePreviewOrDownload(req, "PREVIEW")}
                          className="text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Previsualizar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingVersionId === req.latestVersionId}
                          onClick={() => handlePreviewOrDownload(req, "DOWNLOAD")}
                          className="text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>Descargar</span>
                        </Button>
                      </div>
                    )}

                    {req.canUploadNewVersion && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveReq(req);
                          setSelectedFiles([]);
                          setUploadError(null);
                          setUploadSuccess(false);
                          setUploadPercent(0);
                        }}
                        className={`text-xs gap-1.5 font-semibold ${
                          req.status === "REJECTED_NEEDS_ACTION"
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : req.hasUploadedEvidence
                            ? "bg-slate-800 hover:bg-slate-900 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        {req.status === "REJECTED_NEEDS_ACTION"
                          ? "Subsanar y Cargar Nueva Versión"
                          : req.hasUploadedEvidence
                          ? `Cargar Nueva Versión (v${(req.versionNumber || 1) + 1})`
                          : "Subir Documento a Bóveda"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Carga Segura con Drag & Drop, Vista Previa y Progreso en Tiempo Real */}
      {activeReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-white border-slate-200 shadow-2xl overflow-hidden">
            <CardHeader className="bg-[#0F172A] text-white pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bóveda Documental Supabase · Cifrado AES-256</span>
                  </div>
                  <CardTitle className="text-base font-bold text-white">
                    {activeReq.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300">
                    Entidad: {activeReq.bankId.toUpperCase()} · Código: {activeReq.requirementCode}
                  </CardDescription>
                </div>
                <button
                  onClick={() => !uploadProgressText && setActiveReq(null)}
                  disabled={!!uploadProgressText}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-5">
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Zona Drag & Drop Interactiva */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/70 scale-[1.01]"
                      : "border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-slate-50"
                  }`}
                >
                  <input
                    id="file-drop-input"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.xml"
                    disabled={!!uploadProgressText}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Arrastra y suelta tu archivo aquí, o haz clic para explorar
                    </p>
                    <p className="text-xs text-slate-500">
                      Formatos admitidos: <strong>PDF, JPG, PNG, WEBP y XML (Factura DIAN)</strong> · Máximo 15 MB
                    </p>
                  </div>
                </div>

                {/* Lista de Archivos Seleccionados y Previsualización Antes de Subir */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-700">
                        Archivo(s) listo(s) para transferencia segura ({selectedFiles.length}):
                      </p>
                      <ul className="space-y-1.5">
                        {selectedFiles.map((f, idx) => (
                          <li
                            key={`${f.name}-${idx}`}
                            className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded border border-slate-200"
                          >
                            <span className="font-mono text-slate-800 truncate max-w-[320px]">
                              {f.name}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              {(f.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {localPreviewUrl && selectedFiles[0]?.type.startsWith("image/") && (
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-900/5 p-2 text-center">
                        <p className="text-[11px] font-semibold text-slate-500 mb-1">
                          Vista previa de legibilidad antes de subir:
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={localPreviewUrl}
                          alt="Vista previa del soporte"
                          className="max-h-44 mx-auto rounded object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Barra de Progreso en Tiempo Real (XMLHttpRequest 0% -> 100%) */}
                {uploadProgressText && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                        <span>{uploadProgressText}</span>
                      </div>
                      <span className="font-mono">{uploadPercent}%</span>
                    </div>
                    <div className="w-full bg-emerald-200/70 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${Math.max(8, uploadPercent)}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!uploadProgressText}
                    onClick={() => setActiveReq(null)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={selectedFiles.length === 0 || !!uploadProgressText || uploadSuccess}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Certificar y Subir a Bóveda Supabase</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Visor Inline de Documento Certificado (Supabase Signed URL) */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl bg-white border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="bg-[#0F172A] text-white py-3 px-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>
                    {previewModal.title} — Versión v{previewModal.versionNumber}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-300 font-mono">
                  {previewModal.fileName} · URL firmada efímera (5 min)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Abrir / Descargar</span>
                </a>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-slate-100 overflow-auto min-h-[65vh] flex items-center justify-center">
              {previewModal.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewModal.url}
                  alt={previewModal.fileName}
                  className="max-h-[75vh] max-w-full object-contain p-4"
                />
              ) : (
                <iframe
                  src={previewModal.url}
                  title={previewModal.fileName}
                  className="w-full h-[70vh] border-0"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
