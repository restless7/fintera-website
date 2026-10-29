"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Phone,
  Mail,
  RefreshCw,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PUBLIC_MILESTONES } from "@/lib/portal/bank-stage-mapping";

interface BankCaseSummary {
  id: string;
  bankId: string;
  productType: string;
  publicStageTitle: string;
  publicExplanation: string;
  badgeVariant: string;
  actionRequiredNote: string | null;
  filingNumber: string | null;
  lastUpdated: string;
}

interface ApplicationSummary {
  id: string;
  fileNumber: string;
  productCategory: string;
  requestedAmount: number;
  termMonths: number;
  createdAt: string;
  status: string;
  overallPublicStage: string;
  overallProgressPercentage: number;
  assignedAdvisor: {
    name: string;
    email: string;
    phone: string;
  } | null;
  bankCases: BankCaseSummary[];
  actionRequiredAlerts: string[];
}

interface DashboardData {
  isLinked: boolean;
  client: {
    fullName: string;
    documentType: string;
    documentNumberMasked: string;
    email: string;
    phoneMasked: string;
  } | null;
  applications: ApplicationSummary[];
}

async function readDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const response = await fetch("/api/portal/dashboard", { signal });
  if (!response.ok) throw new Error(`Error en servidor: ${response.statusText}`);
  return response.json();
}

export default function CustomerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados del Flujo de Vinculación de Identidad
  const [docType, setDocType] = useState("CC");
  const [docNumber, setDocNumber] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedDest, setMaskedDest] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const json = await readDashboard();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Error cargando la información del portal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    readDashboard(controller.signal)
      .then((json) => { if (!controller.signal.aborted) { setData(json); setError(null); } })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message || "Error cargando la información del portal."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const handleInitiateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) return;

    try {
      setLinkLoading(true);
      setOtpError(null);
      const res = await fetch("/api/portal/auth/link-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          documentNumber: docNumber.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "No fue posible iniciar la verificación.");
      }

      setChallengeId(json.challengeId);
      setMaskedDest(json.maskedDestination);
      if (json.testOtpPreview) {
        setOtpCode(json.testOtpPreview); // Autocompletar en desarrollo local
      }
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId || !otpCode.trim()) return;

    try {
      setLinkLoading(true);
      setOtpError(null);
      const res = await fetch("/api/portal/auth/verify-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          otpCode: otpCode.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Código incorrecto o expirado.");
      }

      // Vinculación exitosa: recargar dashboard
      setChallengeId(null);
      setOtpCode("");
      await fetchDashboard();
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setLinkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3" aria-live="polite">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-slate-600 font-medium text-sm">Cargando tu información protegida...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASO 1: USUARIO AUTENTICADO PERO SIN EXPEDIENTE VINCULADO
  // ---------------------------------------------------------------------------
  if (!data?.isLinked) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="border-slate-300 shadow-xl bg-white overflow-hidden">
          <div className="bg-[#0F172A] p-6 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Vinculación de Identidad Segura</CardTitle>
            <CardDescription className="text-slate-300 text-sm mt-1">
              Conecte su cuenta digital con su expediente hipotecario Fintera de forma protegida.
            </CardDescription>
          </div>

          <CardContent className="p-6">
            {!challengeId ? (
              <form onSubmit={handleInitiateLink} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="docType" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Tipo de Documento
                  </Label>
                  <select
                    id="docType"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="PAS">Pasaporte (PAS)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="docNumber" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Número de Documento
                  </Label>
                  <Input
                    id="docNumber"
                    type="text"
                    placeholder="Ej. 1020304050"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                    className="h-10 text-base"
                    aria-describedby="docNumberHelp"
                  />
                  <p id="docNumberHelp" className="text-[11px] text-slate-500">
                    Ingrese el documento con el cual radicó su solicitud con Fintera.
                  </p>
                </div>

                {otpError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={linkLoading}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-medium h-10"
                >
                  {linkLoading ? "Verificando..." : "Validar e Iniciar Desafío OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                  <p className="font-semibold mb-1">Código de verificación generado</p>
                  <p>
                    Hemos enviado un código seguro de 6 dígitos a su número registrado terminado en{" "}
                    <strong>{maskedDest}</strong>. Tiene 10 minutos para confirmarlo.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otpCode" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Código de 6 Dígitos
                  </Label>
                  <Input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    className="h-12 text-center text-2xl tracking-widest font-mono font-bold"
                  />
                </div>

                {otpError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setChallengeId(null)}
                    className="w-1/3"
                  >
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    disabled={linkLoading}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {linkLoading ? "Validando..." : "Confirmar Vinculación"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASO 2: CLIENTE VERIFICADO Y VINCULADO CON DASHBOARD ACTIVO
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Cabecera del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bienvenido, {data.client?.fullName}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <UserCheck className="w-3.5 h-3.5" />
              Titular Verificado
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Documento {data.client?.documentType} {data.client?.documentNumberMasked} · Teléfono {data.client?.phoneMasked}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/portal/documentos">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Centro de Documentos
            </Button>
          </Link>
        </div>
      </div>

      {/* Alertas de Acción Inmediata (si las hay) */}
      {data.applications.some((app) => app.actionRequiredAlerts.length > 0) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Acciones Requeridas para Avanzar en tu Crédito</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-1 pl-2">
            {data.applications.flatMap((app) => app.actionRequiredAlerts).map((alert, idx) => (
              <li key={idx}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Listado de Solicitudes Hipotecarias */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Tus Expedientes de Crédito</h2>
          <span className="text-xs text-slate-500">{data.applications.length} caso(s) en trámite</span>
        </div>

        {data.applications.length === 0 ? (
          <Card className="text-center p-8 border-dashed border-2 border-slate-300">
            <CardContent className="space-y-3">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No hay solicitudes activas registradas.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Si acaba de realizar una solicitud o simulación, su asesor asignado la vinculará en breve a su expediente digital.
              </p>
            </CardContent>
          </Card>
        ) : (
          data.applications.map((app) => (
            <Card key={app.id} className="border-slate-200 shadow-sm bg-white overflow-hidden">
              {/* Barra superior de la tarjeta */}
              <div className="bg-slate-900 text-white p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      {app.fileNumber}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      Línea {app.productCategory.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    ${app.requestedAmount.toLocaleString("es-CO")} COP · {app.termMonths} Meses ({Math.round(app.termMonths / 12)} años)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/portal/solicitudes/${app.id}`}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-medium">
                      <span>Ver Expediente y Línea de Tiempo</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Cuerpo de la solicitud */}
              <CardContent className="p-6 space-y-6">
                {/* Stepper de Hitos Principales */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                    <span>Estado Consolidado: <strong className="text-slate-900">{app.overallPublicStage}</strong></span>
                    <span>{app.overallProgressPercentage}% Completado</span>
                  </div>
                  
                  {/* Barra de Progreso */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(10, app.overallProgressPercentage)}%` }}
                    />
                  </div>

                  {/* Iconos de hitos */}
                  <div className="hidden sm:grid grid-cols-6 gap-2 pt-2 text-center">
                    {PUBLIC_MILESTONES.map((m) => {
                      const isReached = (app.overallProgressPercentage / 100) * 6 >= m.index;
                      return (
                        <div key={m.index} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isReached
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {m.index}
                          </div>
                          <span className={`text-[11px] font-medium leading-tight ${isReached ? "text-slate-800" : "text-slate-400"}`}>
                            {m.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subcasos Bancarios Paralelos */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Gestión en Bancos Aliados ({app.bankCases.length} alternativas paralelas)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {app.bankCases.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 uppercase">
                            {b.bankId.replace(/-/g, " ")}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {b.publicStageTitle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          {b.publicExplanation}
                        </p>
                        {b.filingNumber && (
                          <p className="text-[11px] text-slate-500 font-mono">
                            Radicado: {b.filingNumber}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tarjeta de Asesor Asignado */}
                {app.assignedAdvisor && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900">Tu Asesor Comercial Especializado</p>
                      <p className="text-slate-600">{app.assignedAdvisor.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={`mailto:${app.assignedAdvisor.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>Correo</span>
                      </a>
                      <a
                        href="https://wa.me/573009128800"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>WhatsApp Fintera</span>
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
