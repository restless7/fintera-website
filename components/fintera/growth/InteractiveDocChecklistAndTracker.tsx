"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  FileCheck2,
  Globe2,
  Lock,
  Search,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from "lucide-react";

type ProfileKey =
  | "EMPLEADO"
  | "INDEPENDIENTE"
  | "EXTERIOR_COLEX"
  | "EMPRESA_B2B";

interface DocItemSpec {
  id: string;
  title: string;
  validity: string;
  tip: string;
  mandatory: boolean;
}

const PROFILE_DOCS: Record<
  ProfileKey,
  {
    label: string;
    subtitle: string;
    badge: string;
    items: DocItemSpec[];
  }
> = {
  EMPLEADO: {
    label: "Empleado (Vivienda B2C)",
    subtitle:
      "Carpeta estándar multibanco para asalariados con contrato a término indefinido o fijo en Colombia.",
    badge: "30%–40% Límite DTI Ley 546",
    items: [
      {
        id: "emp-1",
        title: "Documento de identidad ampliado al 150%",
        validity: "Vigente",
        tip: "Legible por ambas caras sin recortes en bordes.",
        mandatory: true,
      },
      {
        id: "emp-2",
        title: "Certificación laboral original (Cargo, salario, antigüedad y tipo de contrato)",
        validity: "Máx. 30 días de expedición",
        tip: "Mínimo 6 meses en contrato indefinido o 12 meses en término fijo.",
        mandatory: true,
      },
      {
        id: "emp-3",
        title: "Desprendibles de nómina de los últimos 3 meses",
        validity: "Últimos 90 días",
        tip: "Si tienes comisiones o recargos variables, adjunta los últimos 6 meses.",
        mandatory: true,
      },
      {
        id: "emp-4",
        title: "Extractos bancarios de nómina de los últimos 3 meses (PDF original del banco)",
        validity: "Últimos 90 días",
        tip: "Sin contraseña de apertura para validación automática en mesa de crédito.",
        mandatory: true,
      },
      {
        id: "emp-5",
        title: "Certificado de Ingresos y Retenciones (Formato 220 DIAN) o Declaración de Renta",
        validity: "Último año gravable",
        tip: "Si no declaras renta, adjunta carta de no declarante firmada.",
        mandatory: false,
      },
    ],
  },
  INDEPENDIENTE: {
    label: "Independiente / Profesional",
    subtitle:
      "Carpeta financiera para prestadores de servicios, comerciantes y rentistas de capital.",
    badge: "Análisis de Flujo de Caja Bancario",
    items: [
      {
        id: "ind-1",
        title: "Documento de identidad al 150% y RUT actualizado (DIAN)",
        validity: "RUT generación < 90 días",
        tip: "Verifica que el código CIIU coincida con tu actividad económica principal.",
        mandatory: true,
      },
      {
        id: "ind-2",
        title: "Extractos bancarios personales y/o de negocio de los últimos 6 meses",
        validity: "Últimos 180 días",
        tip: "Los bancos aliados calculan tu ingreso base sobre los abonos bancarios recurrentes.",
        mandatory: true,
      },
      {
        id: "ind-3",
        title: "Declaración de Renta de los últimos 2 años gravables (con acuse de recibo DIAN)",
        validity: "Últimos 2 periodos fiscales",
        tip: "Fundamental para soportar patrimonio bruto y renta líquida ante Bancolombia, Itaú y Davivienda.",
        mandatory: true,
      },
      {
        id: "ind-4",
        title: "Contratos de prestación de servicios o certificaciones comerciales de clientes",
        validity: "Vigentes",
        tip: "Acredita continuidad de ingresos de al menos 12 a 24 meses en la actividad.",
        mandatory: true,
      },
      {
        id: "ind-5",
        title: "Cámara de Comercio (si aplica como comerciante formal)",
        validity: "Máx. 30 días de expedición",
        tip: "Con matrícula mercantil renovada para el año en curso.",
        mandatory: false,
      },
    ],
  },
  EXTERIOR_COLEX: {
    label: "Colombiano en el Exterior (COLEX)",
    subtitle:
      "Carpeta especializada para compra de vivienda en Colombia desde EE. UU., España, Canadá, Europa o Chile.",
    badge: "Homologación de Ingresos en Divisas",
    items: [
      {
        id: "col-1",
        title: "Cédula de ciudadanía colombiana + Pasaporte o documento de estatus migratorio vigente",
        validity: "Vigente",
        tip: "Aceptamos residencia permanente, ciudadanía o permiso de trabajo vigente según el banco aliado.",
        mandatory: true,
      },
      {
        id: "col-2",
        title: "Taxes / Declaración de impuestos del país de residencia (Form 1040, W-2, IRPF o Notice of Assessment)",
        validity: "Último año fiscal",
        tip: "Valida tus ingresos anuales en USD, EUR, CAD, GBP o CLP.",
        mandatory: true,
      },
      {
        id: "col-3",
        title: "Extractos bancarios internacionales de los últimos 3 a 6 meses (Bank Statements)",
        validity: "Últimos 90–180 días",
        tip: "Donde se evidencie el abono periódico de nómina o actividad independiente en el exterior.",
        mandatory: true,
      },
      {
        id: "col-4",
        title: "Paystubs / Nóminas de los últimos 3 meses y carta laboral del empleador extranjero",
        validity: "Últimos 90 días",
        tip: "No requiere apostilla para la fase de aprobación de crédito hipotecario.",
        mandatory: true,
      },
      {
        id: "col-5",
        title: "Reporte de crédito internacional (Credit Bureau: Experian, Equifax, TransUnion o CIRBE)",
        validity: "Máx. 30 días",
        tip: "Nuestro equipo asesora la consulta sin afectar tu puntaje crediticio local.",
        mandatory: false,
      },
    ],
  },
  EMPRESA_B2B: {
    label: "Empresa B2B (Factoring RADIAN)",
    subtitle:
      "Carpeta corporativa para estructuración de capital de trabajo y descuento de facturas electrónicas.",
    badge: "Trazabilidad DIAN / RADIAN",
    items: [
      {
        id: "b2b-1",
        title: "Certificado de Existencia y Representación Legal (Cámara de Comercio) y RUT actualizado",
        validity: "Máx. 30 días de expedición",
        tip: "Verifica facultades del representante legal y cuantías máximas autorizadas.",
        mandatory: true,
      },
      {
        id: "b2b-2",
        title: "Estados Financieros de los últimos 2 cierres anuales + corte parcial reciente",
        validity: "Firmados por Contador y/o Revisor Fiscal",
        tip: "Incluye notas a los estados financieros y tarjetas profesionales.",
        mandatory: true,
      },
      {
        id: "b2b-3",
        title: "Declaración de Renta Persona Jurídica de los últimos 2 años y composición accionaria",
        validity: "Con certificación de beneficiarios finales (SARLAFT)",
        tip: "Requisito obligatorio de debida diligencia SARLAFT / SAGRILAFT.",
        mandatory: true,
      },
      {
        id: "b2b-4",
        title: "XML y Representación Gráfica de las Facturas Electrónicas con Eventos RADIAN (030, 032, 033/034)",
        validity: "Facturas con vencimiento entre 30 y 120 días",
        tip: "Sin reclamos inscritos y emitidas a pagadores corporativos verificables.",
        mandatory: true,
      },
      {
        id: "b2b-5",
        title: "Extractos bancarios corporativos de los últimos 3 meses y certificación de cuenta destino",
        validity: "Últimos 90 días",
        tip: "Cuenta a nombre del emisor para giro tras el endoso electrónico en RADIAN.",
        mandatory: true,
      },
    ],
  },
};

const STRUCTURING_STAGES = [
  {
    step: 1,
    title: "1. Simulación y Diagnóstico de Viabilidad",
    desc: "Cálculo de capacidad DTI (Ley 546) para vivienda o costo de espera vs. descuento RADIAN para empresas.",
  },
  {
    step: 2,
    title: "2. Bóveda Documental Cifrada (Supabase Vault)",
    desc: "Carga protegida de soportes con validación antimalware y revisión técnica antes de presentar a bancos.",
  },
  {
    step: 3,
    title: "3. Radicación Multibanco / Mesa de Aliados",
    desc: "Presentación simultánea ante 8+ entidades vigiladas (B2C) o fondeadores institucionales de factoring (B2B).",
  },
  {
    step: 4,
    title: "4. Avalúo, Estudio de Títulos o Cupo de Pagador",
    desc: "Seguimiento técnico de peritaje inmobiliario o validación de eventos 030/032/033 en RADIAN (DIAN).",
  },
  {
    step: 5,
    title: "5. Carta de Aprobación y Desembolso",
    desc: "Cierre financiero acompañado hasta la firma de escrituras o el giro de liquidez a tesorería.",
  },
];

export default function InteractiveDocChecklistAndTracker() {
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileKey>("EMPLEADO");
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({
    "emp-1": true,
    "emp-2": true,
  });

  // Live Tracking Code Lookup
  const [trackingQuery, setTrackingQuery] = useState<string>("FIN-B2B-2610-841");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const currentSpec = PROFILE_DOCS[selectedProfile];
  const completedCount = currentSpec.items.filter(
    (item) => checkedIds[item.id]
  ).length;
  const readinessPct = Math.round(
    (completedCount / currentSpec.items.length) * 100
  );

  const toggleDoc = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(
        `/api/growth/leads?trackingCode=${encodeURIComponent(
          trackingQuery.trim()
        )}`
      );
      const data = await res.json();
      if (!res.ok || !data.found) {
        setLookupResult(null);
        setLookupError(
          data.error || "No se encontró el código. Prueba con FIN-B2B-2610-841 o FIN-ALI-2610-319."
        );
      } else {
        setLookupResult(data.lead);
      }
    } catch {
      setLookupError("Error al consultar el estado de la operación.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0A2342] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#00C4B3]">
            <ShieldCheck className="w-4 h-4" />
            Señales de Claridad · Bóveda Documental y Trazabilidad en Vivo
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-[#0A2342] tracking-tight">
            Prepara tu Carpeta sin Fricción y Rastrea Cada Etapa de tu Solicitud
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Más del 60% de las demoras bancarias en Colombia ocurren por
            carpetas documentales incompletas o extractos vencidos. Valida tu
            checklist según tu perfil y cárgala de forma cifrada en nuestro{" "}
            <strong className="text-[#0A2342]">Portal de Clientes</strong>.
          </p>
        </div>

        {/* Profile Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              {
                key: "EMPLEADO",
                icon: UserCheck,
                title: "Empleado (B2C)",
                sub: "Contrato Indefinido / Fijo",
              },
              {
                key: "INDEPENDIENTE",
                icon: Briefcase,
                title: "Independiente / Renta",
                sub: "Honorarios y Comerciantes",
              },
              {
                key: "EXTERIOR_COLEX",
                icon: Globe2,
                title: "Colombiano en el Exterior",
                sub: "Línea Internacional COLEX",
              },
              {
                key: "EMPRESA_B2B",
                icon: Building2,
                title: "Empresa B2B (Factoring)",
                sub: "Liquidez y Eventos RADIAN",
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = selectedProfile === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedProfile(tab.key)}
                className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                  active
                    ? "bg-[#0A2342] text-white border-[#0A2342] shadow-lg ring-2 ring-[#00C4B3]"
                    : "bg-slate-50 text-[#0A2342] border-slate-200 hover:border-[#00C4B3]"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    active
                      ? "bg-[#00C4B3] text-[#0A2342]"
                      : "bg-white text-[#0A2342] border border-slate-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">{tab.title}</p>
                  <p
                    className={`text-xs mt-0.5 ${
                      active ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {tab.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Two-Column Grid: Checklist on Left (7 cols) + 5-Stage Tracker & Live Lookup on Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive Document Checklist */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-[#F7F7F7] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="inline-block rounded-md bg-[#0A2342] px-2.5 py-1 text-[11px] font-bold text-[#00C4B3]">
                  {currentSpec.badge}
                </span>
                <h3 className="mt-2 text-xl font-extrabold text-[#0A2342]">
                  {currentSpec.label}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {currentSpec.subtitle}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Alistamiento Documental
                </span>
                <span className="text-2xl font-extrabold text-[#0A2342]">
                  {readinessPct}%{" "}
                  <span className="text-xs font-semibold text-slate-500">
                    ({completedCount}/{currentSpec.items.length})
                  </span>
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#00C4B3] transition-all duration-300"
                style={{ width: `${readinessPct}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {currentSpec.items.map((doc) => {
                const isChecked = Boolean(checkedIds[doc.id]);
                return (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition ${
                      isChecked
                        ? "bg-white border-[#00C4B3] shadow-sm"
                        : "bg-white/80 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDoc(doc.id)}
                      className="mt-1 h-4 w-4 accent-[#0A2342]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isChecked
                              ? "text-[#0A2342] line-through decoration-[#00C4B3]"
                              : "text-[#0A2342]"
                          }`}
                        >
                          {doc.title}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                          Vigencia: {doc.validity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        <strong className="text-[#008f82]">
                          Criterio FINTERA:
                        </strong>{" "}
                        {doc.tip}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Vault CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[#0A2342] p-5 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00C4B3]">
                  <Lock className="w-4 h-4" />
                  <span>Bóveda Documental Cifrada (Supabase Storage + AES-256)</span>
                </div>
                <p className="text-xs text-slate-300">
                  Sube tus soportes una sola vez y FINTERA estructura la
                  presentación ante las entidades aliadas.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/portal/documentos"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00C4B3] hover:bg-[#00a899] px-4 py-2.5 text-xs font-extrabold text-[#0A2342] transition"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Abrir Bóveda Documental</span>
                </Link>
                <Link
                  href="/credits/apply"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white transition"
                >
                  <span>Iniciar Solicitud</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Live Operation Tracker & 5 Milestones */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Tracking Code Search */}
            <div className="rounded-3xl bg-[#0A2342] text-white p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00C4B3]">
                  Rastreador Rápido de Expediente
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#FFD447]">
                  24/7 en línea
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Consulta el Estado de tu Solicitud o Diagnóstico B2B
              </h3>
              <form onSubmit={handleLookup} className="flex gap-2">
                <input
                  type="text"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="Ej. FIN-B2B-2610-841 o FIN-ALI-2610-319"
                  className="flex-1 rounded-xl border border-slate-700 bg-[#061529] px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="rounded-xl bg-[#00C4B3] hover:bg-[#00a899] px-4 py-2.5 text-xs font-extrabold text-[#0A2342] transition flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>{lookupLoading ? "..." : "Consultar"}</span>
                </button>
              </form>

              {lookupError && (
                <p className="text-xs text-amber-300">{lookupError}</p>
              )}

              {lookupResult && (
                <div className="rounded-2xl border border-[#00C4B3]/40 bg-[#061529] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#FFD447]">
                      {lookupResult.trackingCode}
                    </span>
                    <span className="rounded-full bg-[#00C4B3]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#00C4B3]">
                      Avance: {lookupResult.stageProgress}%
                    </span>
                  </div>
                  <p className="font-bold text-white text-sm">
                    {lookupResult.companyName || lookupResult.clientName}
                  </p>
                  <p className="text-slate-300">{lookupResult.productLabel}</p>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#00C4B3]"
                      style={{ width: `${lookupResult.stageProgress}%` }}
                    />
                  </div>
                  {lookupResult.notes && (
                    <p className="text-[11px] text-slate-400 pt-1">
                      {lookupResult.notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 5-Stage Structuring Path */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#008f82]">
                <FileCheck2 className="w-4 h-4" />
                <span>Las 5 Etapas de Estructuración FINTERA</span>
              </div>
              <ol className="space-y-3">
                {STRUCTURING_STAGES.map((st) => (
                  <li
                    key={st.step}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A2342] text-xs font-extrabold text-[#00C4B3]">
                      {st.step}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#0A2342]">
                        {st.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

