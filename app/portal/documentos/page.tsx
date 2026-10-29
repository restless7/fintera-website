"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Download,
  RefreshCw,
  X,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
}

interface ApplicationOption {
  id: string;
  fileNumber: string;
  productCategory: string;
}

export default function DocumentosPortalPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal de Subida
  const [activeReq, setActiveReq] = useState<DocumentRequirement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Cargar Solicitudes del usuario
  useEffect(() => {
    async function loadApps() {
      try {
        setLoading(true);
        const res = await fetch("/api/portal/dashboard");
        if (!res.ok) throw new Error("No se pudo cargar la información del portal.");
        const json = await res.json();
        const apps = (json.applications || []).map((a: any) => ({
          id: a.id,
          fileNumber: a.fileNumber,
          productCategory: a.productCategory,
        }));
        setApplications(apps);
        if (apps.length > 0) {
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

  // Cargar Requisitos de la Solicitud Seleccionada
  useEffect(() => {
    if (!selectedAppId) return;

    async function loadRequirements() {
      try {
        setReqLoading(true);
        setError(null);
        const res = await fetch(`/api/portal/documents/requirements?applicationId=${selectedAppId}`);
        if (!res.ok) {
          throw new Error("No se pudieron cargar los requisitos documentales.");
        }
        const json = await res.json();
        setRequirements(json.requirements || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setReqLoading(false);
      }
    }
    loadRequirements();
  }, [selectedAppId]);

  // Manejador de Carga Documental Segura (Presigned PUT + ClamAV Scan)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReq || !selectedFile || !selectedAppId) return;

    try {
      setUploadError(null);
      setUploadProgress("Solicitando canal cifrado de carga...");

      // 1. Solicitar intención de carga
      const intentRes = await fetch("/api/portal/documents/upload-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedAppId,
          requirementId: activeReq.requirementId,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || "application/pdf",
          fileSize: selectedFile.size,
        }),
      });

      if (!intentRes.ok) {
        const errJson = await intentRes.json();
        throw new Error(errJson.error || "No se pudo autorizar la carga documental.");
      }

      const { intentId, uploadUrl } = await intentRes.json();

      // 2. Cargar directamente al almacén de cuarentena
      setUploadProgress("Cargando evidencia cifrada...");
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!putRes.ok) {
        throw new Error("Fallo en la transferencia binaria hacia el almacén.");
      }

      // 3. Confirmar carga y detonar escaneo ClamAV y cifrado AES-256-GCM
      setUploadProgress("Ejecutando escaneo antimalware ClamAV y certificación criptográfica...");
      const confirmRes = await fetch("/api/portal/documents/confirm-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });

      if (!confirmRes.ok) {
        const confErr = await confirmRes.json();
        throw new Error(confErr.error || "Error al procesar la certificación del archivo.");
      }

      const confirmData = await confirmRes.json();

      if (confirmData.scanStatus === "INFECTED") {
        throw new Error("ALERTA DE SEGURIDAD: El archivo fue rechazado por contener una firma maliciosa.");
      }

      setUploadSuccess(true);
      setUploadProgress("Evidencia recibida y certificada satisfactoriamente.");

      // Recargar requisitos
      setTimeout(() => {
        setActiveReq(null);
        setSelectedFile(null);
        setUploadProgress(null);
        setUploadSuccess(false);
        // refrescar
        fetch(`/api/portal/documents/requirements?applicationId=${selectedAppId}`)
          .then((r) => r.json())
          .then((data) => setRequirements(data.requirements || []));
      }, 1500);
    } catch (err: any) {
      setUploadError(err.message || "Error procesando el documento.");
      setUploadProgress(null);
    }
  };

  const renderStatusBadge = (status: DocumentRequirement["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobado
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            En Revisión Fintera
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

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Gestor Documental y Subsanaciones
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Cargue de forma segura los documentos solicitados por las entidades financieras y atienda requerimientos.
        </p>
      </div>

      {/* Selector de Solicitud */}
      {applications.length > 1 && (
        <Card className="border-slate-200">
          <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <Label htmlFor="app-select" className="text-sm font-semibold text-slate-700">
              Seleccionar Solicitud:
            </Label>
            <select
              id="app-select"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full sm:w-80 h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.fileNumber} — {app.productCategory}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Contenido Principal */}
      {loading || reqLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Clock className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
          <p className="text-sm">Consultando requisitos documentales autorizados...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      ) : requirements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <FileCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Expediente al día</h3>
          <p className="text-sm text-slate-500 mt-1">
            No tiene obligaciones documentales pendientes de carga para esta solicitud.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requirements.map((req) => (
            <Card
              key={req.requirementId}
              className={`border transition-all ${
                req.status === "REJECTED_NEEDS_ACTION"
                  ? "border-rose-200 bg-rose-50/20"
                  : req.status === "APPROVED"
                  ? "border-emerald-200 bg-emerald-50/10"
                  : "border-slate-200 bg-white"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {req.bankId}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">[{req.requirementCode}]</span>
                      {renderStatusBadge(req.status)}
                      {req.isMandatory && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Obligatorio
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                    <p className="text-xs text-slate-600">{req.description}</p>

                    {/* Explicación de Rechazo / Subsanación Pública */}
                    {req.status === "REJECTED_NEEDS_ACTION" && req.rejectionReasonPublic && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1 mt-2">
                        <div className="flex items-center gap-1.5 font-semibold text-rose-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>Motivo de devolución:</span>
                        </div>
                        <p>{req.rejectionReasonPublic}</p>
                        {req.customerVisibleNotes && (
                          <p className="text-[11px] text-rose-600 italic">
                            Instrucciones: {req.customerVisibleNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Información de Vigencia / Fecha */}
                    {req.uploadedAt && (
                      <p className="text-[11px] text-slate-400">
                        Última versión cargada el: {new Date(req.uploadedAt).toLocaleDateString("es-CO")}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2">
                    {req.canUploadNewVersion && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveReq(req);
                          setSelectedFile(null);
                          setUploadError(null);
                          setUploadSuccess(false);
                        }}
                        className={`text-xs gap-1.5 ${
                          req.status === "REJECTED_NEEDS_ACTION"
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        {req.hasUploadedEvidence ? "Reemplazar Evidencia" : "Cargar Archivo"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Carga Segura con ClamAV */}
      {activeReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white border-slate-200 shadow-xl animate-in fade-in-50">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Carga Segura de Evidencia
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {activeReq.title} ({activeReq.bankId})
                  </CardDescription>
                </div>
                <button
                  onClick={() => !uploadProgress && setActiveReq(null)}
                  disabled={!!uploadProgress}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Protocolo de Protección Documental</span>
                  </div>
                  <p>
                    Su archivo será analizado en tiempo real por el motor antivirus ClamAV y cifrado
                    criptográficamente con AES-256-GCM. Formatos permitidos: PDF, JPG, PNG (máx. 10 MB).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-input" className="text-xs font-semibold text-slate-700">
                    Seleccionar Archivo Local
                  </Label>
                  <Input
                    id="file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={!!uploadProgress}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-xs file:text-xs file:bg-slate-100 file:border-0 file:rounded-md file:mr-2 file:px-2"
                  />
                  {selectedFile && (
                    <p className="text-[11px] text-slate-500">
                      Archivo: <span className="font-mono">{selectedFile.name}</span> (
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {uploadProgress && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
                    <Clock className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{uploadProgress}</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!uploadProgress}
                    onClick={() => setActiveReq(null)}
                    className="text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!selectedFile || !!uploadProgress || uploadSuccess}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Iniciar Carga y Análisis
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
