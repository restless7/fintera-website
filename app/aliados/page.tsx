"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calculator,
  CheckCircle2,
  Handshake,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { PartnerCategory } from "@/lib/growth/growth-store";

export default function AliadosPortalPage() {
  // Partner Commission Simulator State
  const [simTrack, setSimTrack] = useState<"B2C_INMOBILIARIO" | "B2B_CONTADOR">(
    "B2C_INMOBILIARIO"
  );
  const [monthlyDeals, setMonthlyDeals] = useState<number>(3);
  const [avgDealAmount, setAvgDealAmount] = useState<number>(240000000);

  // Referral Registration Form State
  const [referralChannel, setReferralChannel] = useState<
    "PARTNER_REFERRAL_B2C" | "PARTNER_REFERRAL_B2B"
  >("PARTNER_REFERRAL_B2C");
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerCategory, setPartnerCategory] =
    useState<PartnerCategory>("INMOBILIARIA");
  const [partnerEmail, setPartnerEmail] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [city, setCity] = useState<string>("Bogotá D.C.");
  const [amountCOP, setAmountCOP] = useState<number>(250000000);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdTrackingCode, setCreatedTrackingCode] = useState<string | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Partner Status Tracker State
  const [searchCode, setSearchCode] = useState<string>("FIN-ALI-2610-319");
  const [searching, setSearching] = useState<boolean>(false);
  const [trackedLead, setTrackedLead] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  const partnerSimulation = useMemo(() => {
    const monthlyVolumeCOP = monthlyDeals * avgDealAmount;
    // Illustrative referral fee: 0.60% on disbursed B2C mortgage volume or 0.50% on structured B2B factoring volume
    const commissionRatePct = simTrack === "B2C_INMOBILIARIO" ? 0.6 : 0.5;
    const monthlyCommissionCOP = Math.round(
      monthlyVolumeCOP * (commissionRatePct / 100)
    );
    const annualCommissionCOP = monthlyCommissionCOP * 12;

    return {
      monthlyVolumeCOP,
      commissionRatePct,
      monthlyCommissionCOP,
      annualCommissionCOP,
    };
  }, [simTrack, monthlyDeals, avgDealAmount]);

  const handleRegisterReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim() || !clientName.trim() || !contactEmail.trim())
      return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const estComm = Math.round(
        amountCOP *
          ((referralChannel === "PARTNER_REFERRAL_B2C" ? 0.6 : 0.5) / 100)
      );
      const res = await fetch("/api/growth/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: referralChannel,
          pillar:
            referralChannel === "PARTNER_REFERRAL_B2C"
              ? "VIVIENDA_B2C"
              : "FACTORING_B2B",
          clientName: clientName.trim(),
          companyName: companyName.trim() || undefined,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          city: city.trim(),
          amountCOP: Number(amountCOP) || 200000000,
          termDaysOrMonths:
            referralChannel === "PARTNER_REFERRAL_B2C" ? 240 : 90,
          productLabel:
            referralChannel === "PARTNER_REFERRAL_B2C"
              ? "Referido Inmobiliario · Crédito / Leasing Habitacional"
              : "Referido Contable / B2B · Factoring Electrónico RADIAN",
          partnerName: partnerName.trim(),
          partnerCategory,
          partnerEmail: partnerEmail.trim(),
          estimatedCommissionCOP: estComm,
          utmSource: "portal_aliados",
          utmMedium: partnerCategory.toLowerCase(),
          utmCampaign: "red_aliados_fintera_2026",
          notes:
            notes.trim() ||
            `Referido por aliado ${partnerName.trim()} (${partnerCategory}).`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar referido.");
      }
      setCreatedTrackingCode(data.trackingCode);
      setTrackedLead(data.lead);
      setSearchCode(data.trackingCode);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Error procesando el registro"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/growth/leads?trackingCode=${encodeURIComponent(
          searchCode.trim()
        )}`
      );
      const data = await res.json();
      if (!res.ok || !data.found) {
        setTrackedLead(null);
        setSearchError(
          data.error ||
            "Código no encontrado. Prueba con FIN-ALI-2610-319 o FIN-ALI-2611-504."
        );
      } else {
        setTrackedLead(data.lead);
      }
    } catch {
      setSearchError("Error al consultar el código de seguimiento.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F7F7] pt-24 pb-20">
        {/* Hero Section — FINTERA Brand Blueprint V1.0 */}
        <section className="relative overflow-hidden bg-[#0A2342] py-16 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,196,179,0.22),transparent_55%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-[#00C4B3]/40 bg-[#00C4B3]/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#00C4B3]">
                    Red de Aliados Estratégicos FINTERA (B2B2C)
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#FFD447]/40 bg-[#FFD447]/15 px-3 py-1 text-xs font-bold text-[#FFD447]">
                    “Claridad que conecta oportunidades.”
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
                  Tu Brazo de Estructuración Hipotecaria y Liquidez Empresarial
                  en Colombia
                </h1>
                <p className="text-base text-slate-200 sm:text-lg leading-relaxed">
                  Acompañamos a{" "}
                  <strong className="text-white">
                    inmobiliarias, constructoras, brokers hipotecarios,
                    contadores públicos y consultores financieros
                  </strong>{" "}
                  para que sus clientes cierren su crédito de vivienda o
                  estructuren operaciones de factoring sobre RADIAN con total
                  transparencia y trazabilidad en tiempo real.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#radicar-referido"
                    className="rounded-xl bg-[#00C4B3] px-6 py-3.5 text-sm font-extrabold text-[#0A2342] shadow-lg transition hover:bg-[#00a899]"
                  >
                    Radicar un Cliente Referido (60s)
                  </a>
                  <a
                    href="#rastreador-aliados"
                    className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Consultar Estado de Referido
                  </a>
                </div>
              </div>

              {/* Pillar 4 Cover Visual Card */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#061529] shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/pillars/pilar-4-confianza-oportunidades.png"
                    alt="Alianzas Estratégicas FINTERA"
                    className="h-56 w-full object-cover"
                  />
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-[#00C4B3]">
                        Programa Institucional de Aliados
                      </span>
                      <span className="rounded-full bg-[#FFD447]/20 px-2.5 py-0.5 font-bold text-[#FFD447]">
                        Ley 1581 Habeas Data
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Visualiza el avance de cada operación referida sin exponer
                      los extractos ni documentos privados de tu cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 space-y-14">
          {/* Two Specialized Partner Tracks */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#0A2342] px-3.5 py-1 text-xs font-bold text-[#00C4B3]">
                  Línea 1 · Aliados Inmobiliarios y Constructoras (B2C)
                </span>
                <Building2 className="w-6 h-6 text-[#0A2342]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0A2342]">
                Cierra más ventas inmobiliarias asegurando el cierre financiero
                del comprador
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evita que tus promesas de compraventa se caigan por demoras o
                rechazos en un solo banco. Evaluamos el perfil del comprador bajo
                la Ley 546 y radicamos en paralelo ante más de 8 entidades
                vigiladas.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008f82] shrink-0" />
                  <span>
                    Pre-viabilidad hipotecaria y Leasing Habitacional en menos
                    de 24 horas hábiles.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008f82] shrink-0" />
                  <span>
                    Línea especializada COLEX para compradores colombianos
                    residentes en el exterior.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008f82] shrink-0" />
                  <span>
                    Acompañamiento completo hasta avalúo, estudio de títulos y
                    desembolso.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#0A2342] px-3.5 py-1 text-xs font-bold text-[#FFD447]">
                  Línea 2 · Contadores Públicos y Consultores CFO (B2B)
                </span>
                <Briefcase className="w-6 h-6 text-[#0A2342]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0A2342]">
                Convierte la cartera a 60–90 días de tus empresas clientes en
                capital de trabajo inmediato
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Como contador público, revisor fiscal o asesor financiero, eres
                el primero en detectar tensiones de tesorería. Te apoyamos con
                la validación técnica de los eventos RADIAN (DIAN) y la
                estructuración de factoring con aliados autorizados.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008f82] shrink-0" />
                  <span>
                    Auditoría sin costo de los eventos 030, 032 y 033/034 en el
                    sistema RADIAN de la DIAN.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008f82] shrink-0" />
                  <span>
                    Liquidez empresarial sin copar las líneas de endeudamiento
                    bancario tradicional de la pyme.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008f82] shrink-0" />
                  <span>
                    Esquema transparente de reconocimiento comercial por
                    operaciones estructuradas y desembolsadas.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Interactive Partner Commission & Volume Simulator */}
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#008f82]">
                  Simulador de Valor para Aliados FINTERA
                </span>
                <h2 className="text-2xl font-extrabold text-[#0A2342] mt-1">
                  Proyecta el Impacto de tu Alianza Comercial
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSimTrack("B2C_INMOBILIARIO")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    simTrack === "B2C_INMOBILIARIO"
                      ? "bg-[#0A2342] text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Inmobiliaria / Broker Vivienda
                </button>
                <button
                  type="button"
                  onClick={() => setSimTrack("B2B_CONTADOR")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    simTrack === "B2B_CONTADOR"
                      ? "bg-[#0A2342] text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Contador / Consultor B2B
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-[#0A2342]">
                    <span>
                      Operaciones referidas y desembolsadas por mes:
                    </span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 font-extrabold">
                      {monthlyDeals} operaciones / mes
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={monthlyDeals}
                    onChange={(e) => setMonthlyDeals(Number(e.target.value))}
                    className="w-full accent-[#00C4B3]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-[#0A2342]">
                    <span>
                      Monto promedio por operación (Crédito o Paquete de
                      Facturas):
                    </span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 font-extrabold">
                      {formatCOP(avgDealAmount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={80000000}
                    max={800000000}
                    step={20000000}
                    value={avgDealAmount}
                    onChange={(e) => setAvgDealAmount(Number(e.target.value))}
                    className="w-full accent-[#0A2342]"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-[#0A2342] p-6 text-white space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#00C4B3]">
                    Proyección Ilustrativa del Aliado
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[#FFD447] font-bold">
                    Factor ref: {partnerSimulation.commissionRatePct.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-300 block">
                    Honorario Comercial Mensual Estimado:
                  </span>
                  <p className="text-3xl font-extrabold text-[#00C4B3] tabular-nums">
                    {formatCOP(partnerSimulation.monthlyCommissionCOP)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15 text-xs">
                  <div>
                    <span className="text-slate-400 block">
                      Volumen Mensual Colocado:
                    </span>
                    <strong className="text-white tabular-nums">
                      {formatCOP(partnerSimulation.monthlyVolumeCOP)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      Proyección Anual (12m):
                    </span>
                    <strong className="text-[#FFD447] tabular-nums">
                      {formatCOP(partnerSimulation.annualCommissionCOP)}
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  *Simulación ilustrativa sujeta a convenio comercial de
                  corretaje/referenciación y desembolso efectivo por la entidad
                  aliada.
                </p>
              </div>
            </div>
          </section>

          {/* 60-Second Referral Registration + Live Status Tracker */}
          <section
            id="radicar-referido"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left: 60-Second Referral Form (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#008f82]">
                  Mesa Digital de Aliados FINTERA
                </span>
                <h2 className="text-2xl font-extrabold text-[#0A2342] mt-1">
                  Radica un Cliente Referido en 60 Segundos
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Obtén al instante tu código único{" "}
                  <code className="font-bold text-[#0A2342]">FIN-ALI-...</code>{" "}
                  para hacer seguimiento transparente de la operación.
                </p>
              </div>

              {createdTrackingCode ? (
                <div className="rounded-2xl bg-[#0A2342] p-6 text-white space-y-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-[#00C4B3] mx-auto" />
                  <h3 className="text-xl font-extrabold">
                    ¡Referido Registrado en la Mesa de Estructuración!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Guarda este código de seguimiento de aliado para consultar
                    el avance de la solicitud en cualquier momento:
                  </p>
                  <div className="inline-block rounded-xl border border-[#00C4B3] bg-[#061529] px-6 py-3 font-mono text-lg font-extrabold text-[#FFD447]">
                    {createdTrackingCode}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedTrackingCode(null);
                        setClientName("");
                        setCompanyName("");
                        setContactEmail("");
                        setContactPhone("");
                        setNotes("");
                      }}
                      className="rounded-xl bg-[#00C4B3] px-5 py-2.5 text-xs font-extrabold text-[#0A2342]"
                    >
                      Radicar Otro Referido
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterReferral} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setReferralChannel("PARTNER_REFERRAL_B2C")
                      }
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        referralChannel === "PARTNER_REFERRAL_B2C"
                          ? "bg-[#0A2342] text-white border-[#0A2342]"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      🏠 Referido Vivienda / Hipotecario (B2C)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReferralChannel("PARTNER_REFERRAL_B2B")
                      }
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition ${
                        referralChannel === "PARTNER_REFERRAL_B2B"
                          ? "bg-[#0A2342] text-white border-[#0A2342]"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      🏢 Referido Empresa / Factoring RADIAN (B2B)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Tu Nombre o Inmobiliaria / Firma
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Ej. Inmobiliaria Andina"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Categoría de Aliado
                      </label>
                      <select
                        value={partnerCategory}
                        onChange={(e) =>
                          setPartnerCategory(e.target.value as PartnerCategory)
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      >
                        <option value="INMOBILIARIA">Inmobiliaria</option>
                        <option value="CONSTRUCTORA">Constructora</option>
                        <option value="CONTADOR_PUBLICO">
                          Contador Público / Revisor Fiscal
                        </option>
                        <option value="CONSULTOR_FINANCIERO">
                          Consultor Financiero / CFO
                        </option>
                        <option value="BROKER_INDEPENDIENTE">
                          Broker Independiente
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Tu Correo de Aliado
                      </label>
                      <input
                        type="email"
                        required
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        placeholder="aliado@firma.co"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Nombre del Cliente Referido
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Nombre completo del comprador o contacto"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Empresa (Si es Factoring B2B) / Proyecto Vivienda
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Razón social o nombre del proyecto inmobiliario"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Correo del Cliente
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="cliente@correo.co"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Celular / WhatsApp Cliente
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+57 310..."
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0A2342] mb-1">
                        Monto Estimado (COP)
                      </label>
                      <input
                        type="number"
                        required
                        min={15000000}
                        step={5000000}
                        value={amountCOP}
                        onChange={(e) => setAmountCOP(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A2342] mb-1">
                      Contexto de la Operación (Ciudad, plazo esperado, banco o
                      pagador)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej. Comprador cuenta con 30% de cuota inicial, entrega en 3 meses. Cuenta con autorización Habeas Data para ser contactado por FINTERA."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  {submitError && (
                    <p className="text-xs text-rose-600 font-semibold">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-[#0A2342] hover:bg-[#123766] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#00C4B3]" />
                    <span>
                      {submitting
                        ? "Generando Código de Seguimiento..."
                        : "Registrar Referido y Generar Código de Trazabilidad"}
                    </span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Live Partner Referral Status Tracker (5 cols) */}
            <div
              id="rastreador-aliados"
              className="lg:col-span-5 rounded-3xl bg-[#0A2342] text-white p-8 shadow-xl space-y-6"
            >
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00C4B3]/20 px-3 py-1 text-xs font-bold text-[#00C4B3]">
                  <ShieldCheck className="w-4 h-4" />
                  Trazabilidad B2B2C Protegida (Ley 1581)
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  Rastreador de Operaciones Referidas
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ingresa tu código{" "}
                  <code className="text-[#FFD447]">FIN-ALI-...</code> o{" "}
                  <code className="text-[#FFD447]">FIN-B2B-...</code> para
                  consultar en qué etapa se encuentra tu cliente referido.
                </p>
              </div>

              <form onSubmit={handleTrackReferral} className="flex gap-2">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="FIN-ALI-2610-319"
                  className="flex-1 rounded-xl border border-slate-700 bg-[#061529] px-3.5 py-2.5 text-xs font-mono text-white"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="rounded-xl bg-[#00C4B3] hover:bg-[#00a899] px-4 py-2.5 text-xs font-extrabold text-[#0A2342] transition flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>{searching ? "..." : "Consultar"}</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-400">Ejemplos activos:</span>
                {["FIN-ALI-2610-319", "FIN-ALI-2611-504", "FIN-B2B-2610-841"].map(
                  (code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSearchCode(code)}
                      className="rounded bg-white/10 hover:bg-white/20 px-2 py-0.5 font-mono text-[#00C4B3]"
                    >
                      {code}
                    </button>
                  )
                )}
              </div>

              {searchError && (
                <p className="text-xs text-amber-300">{searchError}</p>
              )}

              {trackedLead && (
                <div className="rounded-2xl border border-[#00C4B3]/40 bg-[#061529] p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-[#FFD447]">
                      {trackedLead.trackingCode}
                    </span>
                    <span className="rounded-full bg-[#00C4B3]/20 px-2.5 py-0.5 font-bold text-[#00C4B3]">
                      Avance: {trackedLead.stageProgress}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {trackedLead.companyName || trackedLead.clientName}
                    </p>
                    <p className="text-slate-300">{trackedLead.productLabel}</p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#00C4B3]"
                      style={{ width: `${trackedLead.stageProgress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <div>
                      <span className="text-slate-400 block">
                        Monto en Estructuración:
                      </span>
                      <strong className="text-white">
                        {formatCOP(trackedLead.amountCOP)}
                      </strong>
                    </div>
                    {trackedLead.estimatedCommissionCOP && (
                      <div>
                        <span className="text-slate-400 block">
                          Honorario Aliado Est.:
                        </span>
                        <strong className="text-[#FFD447]">
                          {formatCOP(trackedLead.estimatedCommissionCOP)}
                        </strong>
                      </div>
                    )}
                  </div>
                  {trackedLead.partnerName && (
                    <p className="text-[11px] text-slate-400">
                      Aliado originador:{" "}
                      <strong className="text-slate-200">
                        {trackedLead.partnerName}
                      </strong>
                    </p>
                  )}
                  {trackedLead.notes && (
                    <p className="text-[11px] text-slate-300 bg-white/5 p-2.5 rounded-lg">
                      {trackedLead.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

