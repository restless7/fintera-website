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
  KeyRound,
  Briefcase,
  Home,
  FileSpreadsheet,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const ENTERPRISE_B2C_MILESTONES = [
  {
    index: 1,
    label: "1. Documentación",
    sla: "1–2 días hábiles",
    responsible: "Cliente / Mesa FINTERA",
    description: "Recopilación en Bóveda Cifrada y validación técnica preliminar",
  },
  {
    index: 2,
    label: "2. Radicación",
    sla: "24 horas hábiles",
    responsible: "Mesa de Originación FINTERA",
    description: "Ingreso formal y asignación de número de radicado bancario",
  },
  {
    index: 3,
    label: "3. Estudio de Riesgos",
    sla: "3–5 días hábiles",
    responsible: "Comité de Crédito del Banco",
    description: "Evaluación de capacidad de pago, centrales y políticas de crédito",
  },
  {
    index: 4,
    label: "4. Aprobación",
    sla: "1–2 días hábiles",
    responsible: "Entidad Financiera Aliada",
    description: "Emisión de carta de aprobación formal y condiciones de tasa",
  },
  {
    index: 5,
    label: "5. Peritaje y Títulos",
    sla: "5–8 días hábiles",
    responsible: "Perito Avaluador y Abogado",
    description: "Visita técnica al inmueble y estudio jurídico de tradición",
  },
  {
    index: 6,
    label: "6. Desembolso",
    sla: "2–3 días hábiles",
    responsible: "Operaciones Bancarias",
    description: "Firma de escrituras/garantías y giro final de recursos",
  },
];

const RADIAN_B2B_EVENTS = [
  {
    code: "Evento 030",
    title: "Acuse de recibo de Factura Electrónica",
    detail: "Confirmación de recepción del XML AttachedDocument y validación CUFE ante la DIAN.",
    status: "VERIFIED",
    actor: "Validador DIAN / FINTERA",
  },
  {
    code: "Evento 032",
    title: "Recibo del bien o prestación del servicio",
    detail: "Constancia electrónica del pagador corporativo sobre la entrega conforme.",
    status: "VERIFIED",
    actor: "Pagador Corporativo",
  },
  {
    code: "Evento 033 / 034",
    title: "Aceptación Expresa o Tácita (Ley 1231)",
    detail: "Consolidación irrevocable de la factura como Título Valor en el registro RADIAN.",
    status: "IN_PROGRESS",
    actor: "Cámara RADIAN DIAN (72h hábiles)",
  },
  {
    code: "Evento 037",
    title: "Inscripción de Endoso Electrónico y Giro",
    detail: "Endoso en propiedad con responsabilidad y desembolso neto en cuenta empresarial.",
    status: "PENDING",
    actor: "Tesorería FINTERA Factoring",
  },
];

async function readDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const response = await fetch("/api/portal/dashboard", { signal });
  if (response.status === 401) {
    return { isLinked: false, client: null, applications: [] };
  }
  if (!response.ok) throw new Error(`Error en servidor: ${response.statusText}`);
  return response.json();
}

export default function CustomerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<"B2C_HIPOTECARIO" | "B2B_FACTORING">(
    "B2C_HIPOTECARIO"
  );

  // Modo de autenticación en la tarjeta de entrada ("RADICADO" | "OTP")
  const [authTab, setAuthTab] = useState<"RADICADO" | "OTP">("RADICADO");
  const [docType, setDocType] = useState("CC");
  const [docNumber, setDocNumber] = useState("");
  const [fileNumberOrEmail, setFileNumberOrEmail] = useState("");
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
    let active = true;
    const controller = new AbortController();

    async function initPortalSession() {
      try {
        // Si el cliente llega desde el Magic Tracking Link (?trackToken=...), activar cookie HttpOnly automáticamente
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const urlToken = params.get("trackToken");
          if (urlToken) {
            await fetch("/api/portal/auth/magic-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackToken: urlToken }),
            });
          }
        }

        const json = await readDashboard(controller.signal);
        if (active && !controller.signal.aborted) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (active && !controller.signal.aborted) {
          setError(err.message || "Error cargando la información del portal.");
        }
      } finally {
        if (active && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    initPortalSession();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const handleQuickRadicadoLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() || !fileNumberOrEmail.trim()) return;

    try {
      setLinkLoading(true);
      setOtpError(null);
      const res = await fetch("/api/portal/auth/magic-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          documentNumber: docNumber.trim(),
          fileNumberOrEmail: fileNumberOrEmail.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "No fue posible verificar el expediente.");
      }

      await fetchDashboard();
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setLinkLoading(false);
    }
  };

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
        setOtpCode(json.testOtpPreview);
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
        <p className="text-slate-600 font-medium text-sm">
          Sincronizando expediente protegido y bóveda documental...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CASO 1: PANTALLA DE ACCESO RÁPIDO POR RADICADO O VINCULACIÓN OTP
  // ---------------------------------------------------------------------------
  if (!data?.isLinked) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="border-slate-300 shadow-xl bg-white overflow-hidden">
          <div className="bg-[#0F172A] p-6 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Portal de Seguimiento y Bóveda Documental FINTERA
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm mt-1">
              Consulte el estado en tiempo real de su solicitud de crédito o cargue sus soportes en nuestra bóveda cifrada.
            </CardDescription>

            {/* Selector de Método de Acceso */}
            <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-slate-800/80 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("RADICADO");
                  setOtpError(null);
                }}
                className={`py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  authTab === "RADICADO"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Acceso por Radicado / Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("OTP");
                  setOtpError(null);
                }}
                className={`py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  authTab === "OTP"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vinculación Código OTP</span>
              </button>
            </div>
          </div>

          <CardContent className="p-6">
            {authTab === "RADICADO" ? (
              <form onSubmit={handleQuickRadicadoLookup} className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700">
                  Ingrese su documento de identidad junto con su{" "}
                  <strong>Número de Radicado (ej. FNT-2026-00001)</strong> o el{" "}
                  <strong>correo electrónico</strong> con el que registró su solicitud.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="docType" className="text-xs font-semibold text-slate-700 uppercase">
                      Tipo Doc.
                    </Label>
                    <select
                      id="docType"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="NIT">NIT</option>
                      <option value="PAS">Pasaporte</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="docNumber" className="text-xs font-semibold text-slate-700 uppercase">
                      Número de Documento
                    </Label>
                    <Input
                      id="docNumber"
                      type="text"
                      placeholder="Ej. 1020304050"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fileNumberOrEmail" className="text-xs font-semibold text-slate-700 uppercase">
                    Número de Radicado (FNT-2026-...) o Correo Registrado
                  </Label>
                  <Input
                    id="fileNumberOrEmail"
                    type="text"
                    placeholder="Ej. FNT-2026-00001 o cliente@empresa.com"
                    value={fileNumberOrEmail}
                    onChange={(e) => setFileNumberOrEmail(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10"
                >
                  {linkLoading ? "Verificando expediente..." : "Ingresar a mi Expediente y Bóveda Documental"}
                </Button>
              </form>
            ) : !challengeId ? (
              <form onSubmit={handleInitiateLink} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="docTypeOtp" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Tipo de Documento
                  </Label>
                  <select
                    id="docTypeOtp"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="PAS">Pasaporte (PAS)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="docNumberOtp" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Número de Documento
                  </Label>
                  <Input
                    id="docNumberOtp"
                    type="text"
                    placeholder="Ej. 1020304050"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                    className="h-10 text-base"
                  />
                  <p className="text-[11px] text-slate-500">
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
  // CASO 2: CLIENTE VERIFICADO Y VINCULADO CON DASHBOARD ENTERPRISE ACTIVO
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Cabecera Institucional del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bienvenido, {data.client?.fullName}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <UserCheck className="w-3.5 h-3.5" />
              Titular Verificado · Ley 1581 Habeas Data
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Documento {data.client?.documentType} {data.client?.documentNumberMasked} · Teléfono{" "}
            {data.client?.phoneMasked} · Bóveda Supabase AES-256 Activa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/portal/documentos">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm">
              <UploadCloud className="w-4 h-4" />
              <span>Bóveda de Documentos (Subir / Ver)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Selector de Línea de Negocio en el Portal (Vivienda B2C vs. Factoring RADIAN B2B) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
        <div className="space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Centro de Seguimiento Multiproducto FINTERA
          </p>
          <p className="text-xs text-slate-300">
            Monitorea en tiempo real tanto tus radicaciones hipotecarias como tus operaciones de liquidez empresarial RADIAN.
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveViewTab("B2C_HIPOTECARIO")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeViewTab === "B2C_HIPOTECARIO"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Crédito Vivienda y Leasing ({data.applications.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab("B2B_FACTORING")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeViewTab === "B2B_FACTORING"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Factoring B2B & Validación RADIAN</span>
          </button>
        </div>
      </div>

      {/* Alertas de Acción Inmediata (si las hay) */}
      {data.applications.some((app) => app.actionRequiredAlerts.length > 0) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Acciones Requeridas del Cliente para Avanzar en su Solicitud</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-1 pl-2">
            {data.applications
              .flatMap((app) => app.actionRequiredAlerts)
              .map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
          </ul>
        </div>
      )}

      {activeViewTab === "B2B_FACTORING" ? (
        /* MÓDULO ESPECIALIZADO DE TRACKING DE FACTORING B2B Y VALIDACIÓN RADIAN */
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="bg-[#0F172A] text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RADIAN · LEY 1231 / RES. DIAN 000085
                </span>
                <span className="text-xs text-slate-300">Operación de Descuento de Facturas</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Seguimiento de Títulos Valores Electrónicos y Liquidez Empresarial
              </h2>
              <p className="text-xs text-slate-300">
                Trazabilidad de eventos criptográficos DIAN (030, 032, 033/034 y Endoso Electrónico 037) y estado de giro.
              </p>
            </div>
            <Link href="/portal/documentos">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Cargar XML AttachedDocument + PDF DIAN</span>
              </Button>
            </Link>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Resumen Financiero del Lote de Facturas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Valor Nominal Lote
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  $
                  {(
                    data.applications[0]?.requestedAmount || 85000000
                  ).toLocaleString("es-CO")}{" "}
                  COP
                </p>
                <span className="text-[11px] text-slate-500">Cupo rotativo empresarial</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Porcentaje de Anticipo
                </span>
                <p className="text-xl font-bold text-emerald-700 mt-1">85.0% sobre Nominal</p>
                <span className="text-[11px] text-slate-500">Reserva de garantía: 15%</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Liquidez Neta Proyectada
                </span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  $
                  {Math.round(
                    (data.applications[0]?.requestedAmount || 85000000) * 0.832
                  ).toLocaleString("es-CO")}{" "}
                  COP
                </p>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Giro en 24h tras Endoso 037
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                  Responsable Actual
                </span>
                <p className="text-sm font-bold text-emerald-950 mt-1">
                  Validación de Eventos RADIAN y Soportes XML
                </p>
                <span className="text-[11px] text-emerald-700">
                  Mesa de Estructuración Corporativa FINTERA
                </span>
              </div>
            </div>

            {/* 4 Hitos Oficiales RADIAN */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Línea de Tiempo Regulatoria RADIAN (Eventos Electrónicos DIAN)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {RADIAN_B2B_EVENTS.map((ev) => {
                  const isVerified = ev.status === "VERIFIED";
                  const isCurrent = ev.status === "IN_PROGRESS";
                  return (
                    <div
                      key={ev.code}
                      className={`p-4 rounded-xl border space-y-2 ${
                        isVerified
                          ? "border-emerald-200 bg-emerald-50/30"
                          : isCurrent
                          ? "border-blue-300 bg-blue-50/40 ring-1 ring-blue-200"
                          : "border-slate-200 bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {ev.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isVerified
                              ? "bg-emerald-100 text-emerald-800"
                              : isCurrent
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isVerified ? "Certificado" : isCurrent ? "En Curso" : "Pendiente"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{ev.title}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{ev.detail}</p>
                      <p className="text-[10px] font-semibold text-slate-500 pt-1 border-t border-slate-200/80">
                        Responsable: {ev.actor}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* LISTADO DE SOLICITUDES HIPOTECARIAS Y LEASING (6 HITOS PÚBLICOS CLAROS) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Tus Expedientes de Crédito y Estado en Tiempo Real
            </h2>
            <span className="text-xs text-slate-500">
              {data.applications.length} caso(s) en seguimiento activo
            </span>
          </div>

          {data.applications.length === 0 ? (
            <Card className="text-center p-8 border-dashed border-2 border-slate-300">
              <CardContent className="space-y-3">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  No hay solicitudes activas registradas.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Si acaba de realizar una solicitud o simulación, su asesor asignado la vinculará en breve a su expediente digital.
                </p>
              </CardContent>
            </Card>
          ) : (
            data.applications.map((app) => {
              const currentMilestoneIndex = Math.max(
                1,
                Math.min(6, Math.round((app.overallProgressPercentage / 100) * 6))
              );
              const activeMilestoneMeta =
                ENTERPRISE_B2C_MILESTONES.find((m) => m.index === currentMilestoneIndex) ||
                ENTERPRISE_B2C_MILESTONES[0];

              return (
                <Card key={app.id} className="border-slate-200 shadow-sm bg-white overflow-hidden">
                  {/* Barra superior de la tarjeta */}
                  <div className="bg-slate-900 text-white p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                          {app.fileNumber}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">
                          Línea {app.productCategory.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                          Responsable actual: {activeMilestoneMeta.responsible}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        ${app.requestedAmount.toLocaleString("es-CO")} COP · {app.termMonths} Meses (
                        {Math.round(app.termMonths / 12)} años)
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/portal/documentos?applicationId=${app.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600 bg-slate-800 hover:bg-slate-700 text-white text-xs gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Subir Documentos</span>
                        </Button>
                      </Link>
                      <Link href={`/portal/solicitudes/${app.id}`}>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-medium text-xs"
                        >
                          <span>Ver Expediente y Línea de Tiempo</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Cuerpo de la solicitud */}
                  <CardContent className="p-6 space-y-6">
                    {/* Stepper Ejecutivo de 6 Hitos Públicos con SLA y Responsable */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-slate-600">
                        <div>
                          <span>
                            Etapa Oficial Actual:{" "}
                            <strong className="text-slate-900">{app.overallPublicStage}</strong>
                          </span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span>
                            SLA Estimado de Etapa:{" "}
                            <strong className="text-emerald-700">{activeMilestoneMeta.sla}</strong>
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700">
                          {app.overallProgressPercentage}% Completado
                        </span>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(12, app.overallProgressPercentage)}%` }}
                        />
                      </div>

                      {/* Tarjetas de los 6 Hitos Públicos */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
                        {ENTERPRISE_B2C_MILESTONES.map((m) => {
                          const isCompleted = m.index < currentMilestoneIndex;
                          const isCurrent = m.index === currentMilestoneIndex;
                          return (
                            <div
                              key={m.index}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isCurrent
                                  ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/30"
                                  : isCompleted
                                  ? "border-emerald-200 bg-emerald-50/20"
                                  : "border-slate-200 bg-slate-50/50 opacity-75"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCompleted || isCurrent
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-200 text-slate-500"
                                  }`}
                                >
                                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : m.index}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500">
                                  {m.sla}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">
                                {m.label}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                                {m.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Subcasos Bancarios Paralelos */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Gestión en Bancos Aliados ({app.bankCases.length} entidad(es) en curso)
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
                                Radicado Bancario: {b.filingNumber}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tarjeta de Asesor Financiero Asignado (Siempre Visible) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">
                            Asesor Financiero Asignado:{" "}
                            {app.assignedAdvisor?.name || "Mesa Especializada de Originación FINTERA"}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            SLA Respuesta &lt; 2h
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Acompañamiento directo en estructuración, comité bancario y avalúo.
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <a
                          href={`mailto:${
                            app.assignedAdvisor?.email || "operaciones@finterasoluciones.co"
                          }`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>Correo Directo</span>
                        </a>
                        <a
                          href={`https://wa.me/573244444430?text=${encodeURIComponent(
                            `Hola FINTERA, consulto por el estado de mi expediente ${app.fileNumber}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp Asesor</span>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
