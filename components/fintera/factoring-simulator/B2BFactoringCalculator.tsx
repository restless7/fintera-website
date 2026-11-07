"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  Download,
  FileCheck2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function B2BFactoringCalculator() {
  // Financial Inputs
  const [invoiceAmount, setInvoiceAmount] = useState<number>(120000000);
  const [paymentTermDays, setPaymentTermDays] = useState<number>(90);
  const [supplierEarlyDiscountPct, setSupplierEarlyDiscountPct] =
    useState<number>(4.2);
  const [monthlyDiscountFactorPct, setMonthlyDiscountFactorPct] =
    useState<number>(1.55);

  // RADIAN (DIAN) Events Checklist
  const [event030Acuse, setEvent030Acuse] = useState<boolean>(true);
  const [event032ReciboBien, setEvent032ReciboBien] = useState<boolean>(true);
  const [event033Aceptacion, setEvent033Aceptacion] = useState<boolean>(true);
  const [noClaimsInRadian, setNoClaimsInRadian] = useState<boolean>(true);

  // Lead Capture Modal / Drawer State
  const [showLeadForm, setShowLeadForm] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [nitMasked, setNitMasked] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [payerCompanyName, setPayerCompanyName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedTrackingCode, setSubmittedTrackingCode] = useState<
    string | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

  const calculation = useMemo(() => {
    const monthsEquivalent = paymentTermDays / 30;
    const totalDiscountRatePct = monthlyDiscountFactorPct * monthsEquivalent;
    const estimatedDiscountCostCOP = Math.round(
      invoiceAmount * (totalDiscountRatePct / 100)
    );
    const operationalCustodyFeeCOP = 185000; // Costo operativo ilustrativo custodia/endoso RADIAN
    const totalFactoringCostCOP =
      estimatedDiscountCostCOP + operationalCustodyFeeCOP;
    const netDisbursementCOP = Math.max(
      0,
      invoiceAmount - totalFactoringCostCOP
    );

    // Commercial benefit from having cash on day 3 instead of waiting paymentTermDays
    const commercialGainFromLiquidityCOP = Math.round(
      invoiceAmount * (supplierEarlyDiscountPct / 100)
    );

    const netFinancialBenefitCOP =
      commercialGainFromLiquidityCOP - totalFactoringCostCOP;

    const effectiveAnnualRateApprox =
      (Math.pow(1 + monthlyDiscountFactorPct / 100, 12) - 1) * 100;

    const completedRadianEvents = [
      event030Acuse,
      event032ReciboBien,
      event033Aceptacion,
    ].filter(Boolean).length;

    const isRadianNegotiable =
      event030Acuse &&
      event032ReciboBien &&
      event033Aceptacion &&
      noClaimsInRadian;

    const daysLiberated = Math.max(0, paymentTermDays - 3);

    return {
      monthsEquivalent,
      totalDiscountRatePct,
      estimatedDiscountCostCOP,
      operationalCustodyFeeCOP,
      totalFactoringCostCOP,
      netDisbursementCOP,
      commercialGainFromLiquidityCOP,
      netFinancialBenefitCOP,
      effectiveAnnualRateApprox,
      completedRadianEvents,
      isRadianNegotiable,
      daysLiberated,
    };
  }, [
    invoiceAmount,
    paymentTermDays,
    supplierEarlyDiscountPct,
    monthlyDiscountFactorPct,
    event030Acuse,
    event032ReciboBien,
    event033Aceptacion,
    noClaimsInRadian,
  ]);

  const handleExportCsv = () => {
    const rows = [
      ["Concepto", "Valor"],
      ["Valor Nominal Factura (COP)", invoiceAmount],
      ["Plazo de Pago Pactado (Dias)", paymentTermDays],
      ["Dias de Caja Liberados", calculation.daysLiberated],
      [
        "Eventos RADIAN Completados (de 3)",
        calculation.completedRadianEvents,
      ],
      [
        "Estado Titulo Valor RADIAN",
        calculation.isRadianNegotiable
          ? "APTO PARA ENDOSO ELECTRONICO"
          : "PENDIENTE DE EVENTOS RADIAN",
      ],
      [
        "Liquidez Neta Estimada a Recibir (COP)",
        calculation.netDisbursementCOP,
      ],
      [
        "Costo Financiero y Operativo Estimado (COP)",
        calculation.totalFactoringCostCOP,
      ],
      [
        "Beneficio Comercial Pronto Pago / Rotacion (COP)",
        calculation.commercialGainFromLiquidityCOP,
      ],
      [
        "Beneficio Neto de Liquidez (COP)",
        calculation.netFinancialBenefitCOP,
      ],
    ];
    const csv =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `fintera-diagnostico-factoring-radian-${paymentTermDays}d.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitB2BDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const searchParams =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const res = await fetch("/api/growth/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "B2B_FACTORING_CALCULATOR",
          pillar: "FACTORING_B2B",
          clientName: contactName.trim(),
          companyName: companyName.trim() || "Empresa en Evaluación B2B",
          nitOrCedulaMasked: nitMasked.trim() || "Reservado (Ley 1581)",
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          amountCOP: invoiceAmount,
          termDaysOrMonths: paymentTermDays,
          productLabel: `Factoring RADIAN ${paymentTermDays}d · Pagador: ${
            payerCompanyName.trim() || "Corporativo en estudio"
          }`,
          radianReady: calculation.isRadianNegotiable,
          radianEventsCompleted: calculation.completedRadianEvents,
          estimatedNetBenefitCOP: calculation.netFinancialBenefitCOP,
          utmSource: searchParams?.get("utm_source") || "simulador_b2b",
          utmMedium: searchParams?.get("utm_medium") || "calculadora_radian",
          utmCampaign:
            searchParams?.get("utm_campaign") || "liquidez_empresarial_2026",
          notes: `Liquidez neta estimada: ${formatCOP(
            calculation.netDisbursementCOP
          )}. Pagador reportado: ${
            payerCompanyName.trim() || "Por definir"
          }. Eventos RADIAN: ${calculation.completedRadianEvents}/3.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "No se pudo registrar el diagnóstico B2B."
        );
      }
      setSubmittedTrackingCode(data.trackingCode);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Error al enviar solicitud"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-10 bg-[#F7F7F7]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Institutional Header Banner */}
        <div className="rounded-3xl bg-[#0A2342] text-white p-8 sm:p-10 shadow-xl mb-8 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,196,179,0.22),transparent_55%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#00C4B3]/20 border border-[#00C4B3]/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#00C4B3]">
                  Línea 2 · Soluciones Empresariales y Capital de Trabajo (B2B)
                </span>
                <span className="rounded-full bg-[#FFD447]/20 border border-[#FFD447]/40 px-3 py-1 text-xs font-bold text-[#FFD447]">
                  “Mejores oportunidades. Procesos más inteligentes.”
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Calculadora del Costo de Esperar Facturas y Validador RADIAN
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Evalúa con criterio financiero cuánto le cuesta a tu empresa
                esperar 60, 90 o 120 días el pago de una factura electrónica vs.
                anticiparla mediante aliados autorizados sobre el registro{" "}
                <strong className="text-white">RADIAN (DIAN)</strong>.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm space-y-2 max-w-xs">
              <div className="flex items-center gap-2 text-[#00C4B3] text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Regla de Transparencia FINTERA</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Simulación ilustrativa con supuestos explícitos (Fecha de corte:
                Octubre 2026). Toda operación real está sujeta a verificación
                RADIAN y estudio de cupo del pagador.
              </p>
            </div>
          </div>
        </div>

        {/* Main 12-Column Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Financial & RADIAN Parameters (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Financial Variables */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A2342] text-[#00C4B3] flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#008f82]">
                      Paso 1 · Parámetros de Cartera Comercial
                    </span>
                    <h3 className="text-lg font-extrabold text-[#0A2342]">
                      Variables de la Factura y Costo de Oportunidad
                    </h3>
                  </div>
                </div>
              </div>

              {/* Invoice Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#0A2342]">
                    Valor Nominal de la Factura Electrónica (COP)
                  </label>
                  <span className="text-lg font-extrabold text-[#0A2342] bg-slate-100 px-3 py-1 rounded-lg">
                    {formatCOP(invoiceAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={15000000}
                  max={1000000000}
                  step={5000000}
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                  className="w-full accent-[#00C4B3] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>$15.000.000 COP</span>
                  <span>$250.000.000 COP</span>
                  <span>$500.000.000 COP</span>
                  <span>$1.000.000.000 COP</span>
                </div>
              </div>

              {/* Payment Term Days */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2342] block">
                  Plazo de Pago Pactado con tu Cliente (Pagador de la Factura)
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[30, 60, 90, 120].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setPaymentTermDays(days)}
                      className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                        paymentTermDays === days
                          ? "bg-[#0A2342] text-white border-[#0A2342] shadow-md"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#00C4B3]"
                      }`}
                    >
                      {days} días
                    </button>
                  ))}
                </div>
              </div>

              {/* Opportunity Benefit vs Discount Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0A2342]">
                      Descuento por Pronto Pago de Proveedores / Margen de
                      Rotación
                    </label>
                    <span className="text-sm font-extrabold text-[#008f82]">
                      {supplierEarlyDiscountPct.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={10.0}
                    step={0.2}
                    value={supplierEarlyDiscountPct}
                    onChange={(e) =>
                      setSupplierEarlyDiscountPct(Number(e.target.value))
                    }
                    className="w-full accent-[#00C4B3]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Ahorro comercial que obtiene tu empresa al pagar materia
                    prima de contado o rotar inventario antes de {paymentTermDays}{" "}
                    días.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0A2342]">
                      Factor Mensual Estimado de Descuento (Ilustrativo)
                    </label>
                    <span className="text-sm font-extrabold text-[#0A2342]">
                      {monthlyDiscountFactorPct.toFixed(2)}% M.V.
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.15}
                    max={2.25}
                    step={0.05}
                    value={monthlyDiscountFactorPct}
                    onChange={(e) =>
                      setMonthlyDiscountFactorPct(Number(e.target.value))
                    }
                    className="w-full accent-[#0A2342]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Equivalente aprox. a{" "}
                    <strong>
                      {calculation.effectiveAnnualRateApprox.toFixed(1)}% E.A.
                    </strong>{" "}
                    según riesgo crediticio del pagador.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Interactive RADIAN Readiness Check */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00C4B3]/15 text-[#008f82] flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#008f82]">
                      Paso 2 · Verificación de Título Valor (DIAN / RADIAN)
                    </span>
                    <h3 className="text-lg font-extrabold text-[#0A2342]">
                      Checklist de Eventos Obligatorios en RADIAN
                    </h3>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    calculation.isRadianNegotiable
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {calculation.isRadianNegotiable
                    ? "✔ Título Valor Negociable (3/3 Eventos)"
                    : `⚠ Pendiente Eventos (${calculation.completedRadianEvents}/3)`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:border-[#00C4B3] transition">
                  <input
                    type="checkbox"
                    checked={event030Acuse}
                    onChange={(e) => setEvent030Acuse(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0A2342]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0A2342] block">
                      Evento 030 · Acuse de recibo de la factura
                    </span>
                    <span className="text-[11px] text-slate-600">
                      El adquirente (pagador) confirmó electrónicamente la
                      recepción del XML de la factura.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:border-[#00C4B3] transition">
                  <input
                    type="checkbox"
                    checked={event032ReciboBien}
                    onChange={(e) => setEvent032ReciboBien(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0A2342]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0A2342] block">
                      Evento 032 · Recibo del bien o servicio
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Constancia electrónica de entrega satisfactoria de la
                      mercancía o prestación del servicio.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:border-[#00C4B3] transition">
                  <input
                    type="checkbox"
                    checked={event033Aceptacion}
                    onChange={(e) => setEvent033Aceptacion(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0A2342]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0A2342] block">
                      Evento 033 / 034 · Aceptación expresa o tácita
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Aceptación irrevocable del título valor (expresa o tras 3
                      días hábiles desde el evento 032).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer hover:border-[#00C4B3] transition">
                  <input
                    type="checkbox"
                    checked={noClaimsInRadian}
                    onChange={(e) => setNoClaimsInRadian(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#0A2342]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0A2342] block">
                      Sin reclamo (031) ni endoso previo activo
                    </span>
                    <span className="text-[11px] text-slate-600">
                      La factura se encuentra libre de gravámenes y lista para
                      endoso electrónico en RADIAN.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Executive Output & Conversion (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-[#0A2342] text-white p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00C4B3]">
                    Resultado del Diagnóstico Financiero
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    Liquidez Inmediata vs. Esperar {paymentTermDays} Días
                  </h3>
                </div>
                <span className="rounded-xl bg-[#FFD447] px-3 py-1 text-xs font-extrabold text-[#0A2342]">
                  +{calculation.daysLiberated} días de caja
                </span>
              </div>

              {/* Primary Metric: Net Disbursement */}
              <div className="rounded-2xl bg-white/10 border border-[#00C4B3]/40 p-5 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#00C4B3]">
                  Liquidez Neta Estimada a Recibir (48–72h)
                </span>
                <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                  {formatCOP(calculation.netDisbursementCOP)}
                </p>
                <p className="text-xs text-slate-300">
                  Equivalente al{" "}
                  <strong>
                    {(
                      (calculation.netDisbursementCOP / invoiceAmount) *
                      100
                    ).toFixed(2)}
                    %
                  </strong>{" "}
                  del valor nominal abonado directamente a tesorería.
                </p>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-3 text-xs border-b border-white/15 pb-5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Valor nominal de la factura ({paymentTermDays} días):</span>
                  <strong className="text-white tabular-nums">
                    {formatCOP(invoiceAmount)}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>
                    Descuento financiero estimado (
                    {calculation.totalDiscountRatePct.toFixed(2)}% por{" "}
                    {paymentTermDays}d):
                  </span>
                  <span className="text-amber-300 font-semibold tabular-nums">
                    - {formatCOP(calculation.estimatedDiscountCostCOP)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Costos operativos de registro y custodia RADIAN:</span>
                  <span className="text-amber-300 font-semibold tabular-nums">
                    - {formatCOP(calculation.operationalCustodyFeeCOP)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-300 pt-1 border-t border-white/10">
                  <span>
                    Ahorro / beneficio comercial por pronto pago (
                    {supplierEarlyDiscountPct.toFixed(1)}%):
                  </span>
                  <strong className="tabular-nums">
                    + {formatCOP(calculation.commercialGainFromLiquidityCOP)}
                  </strong>
                </div>
              </div>

              {/* Net Economic Benefit Box */}
              <div
                className={`rounded-2xl p-4 border ${
                  calculation.netFinancialBenefitCOP >= 0
                    ? "bg-emerald-950/50 border-emerald-400/40"
                    : "bg-slate-900/80 border-white/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Beneficio Económico Neto de Anticipar:
                  </span>
                  <span
                    className={`text-lg font-extrabold tabular-nums ${
                      calculation.netFinancialBenefitCOP >= 0
                        ? "text-[#00C4B3]"
                        : "text-[#FFD447]"
                    }`}
                  >
                    {calculation.netFinancialBenefitCOP >= 0 ? "+" : ""}
                    {formatCOP(calculation.netFinancialBenefitCOP)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  {calculation.netFinancialBenefitCOP >= 0
                    ? "El ahorro comercial por pagar de contado a tus proveedores supera el costo financiero del factoring, generando utilidad adicional y liberando capital de trabajo."
                    : "Incluso con un descuento menor de proveedores, liberas flujo de caja inmediato sin consumir cupos de endeudamiento bancario tradicional."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLeadForm((prev) => !prev)}
                  className="w-full rounded-xl bg-[#00C4B3] hover:bg-[#00a899] px-5 py-3.5 text-sm font-extrabold text-[#0A2342] shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Solicitar Estudio de Pagador y Estructuración B2B
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-[#00C4B3]" />
                    <span>Descargar CSV</span>
                  </button>
                  <Link
                    href="/aliados"
                    className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4 text-[#FFD447]" />
                    <span>Soy Contador / Aliado</span>
                  </Link>
                </div>
              </div>

              {/* Expandable B2B Lead Capture Form */}
              {showLeadForm && (
                <div className="rounded-2xl border border-[#00C4B3]/50 bg-[#061529] p-5 space-y-4">
                  {submittedTrackingCode ? (
                    <div className="space-y-3 text-center py-2">
                      <CheckCircle2 className="w-10 h-10 text-[#00C4B3] mx-auto" />
                      <h4 className="text-base font-extrabold text-white">
                        ¡Diagnóstico B2B Registrado con Éxito!
                      </h4>
                      <p className="text-xs text-slate-300">
                        Tu código único de seguimiento en la mesa de
                        estructuración B2B de FINTERA es:
                      </p>
                      <div className="rounded-xl bg-[#0A2342] border border-[#00C4B3] py-2.5 px-4 font-mono text-base font-extrabold text-[#FFD447]">
                        {submittedTrackingCode}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Puedes consultar el avance de tu evaluación en el{" "}
                        <Link
                          href={`/aliados?code=${submittedTrackingCode}`}
                          className="text-[#00C4B3] underline font-bold"
                        >
                           Rastreador de Operaciones B2B
                        </Link>{" "}
                        o en nuestro{" "}
                        <Link
                          href="/portal"
                          className="text-[#00C4B3] underline font-bold"
                        >
                          Portal de Clientes
                        </Link>
                        .
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmitB2BDiagnostic}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#00C4B3]">
                          Pre-Radicación Confidencial B2B (Ley 1581)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLeadForm(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cerrar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Tu nombre y cargo (Ej. CFO)"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-[#0A2342] px-3 py-2 text-xs text-white placeholder:text-slate-400"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Razón social de tu empresa"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-[#0A2342] px-3 py-2 text-xs text-white placeholder:text-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="email"
                          required
                          placeholder="Correo corporativo"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-[#0A2342] px-3 py-2 text-xs text-white placeholder:text-slate-400"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Celular / WhatsApp corporativo"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-[#0A2342] px-3 py-2 text-xs text-white placeholder:text-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          placeholder="NIT empresa (opcional)"
                          value={nitMasked}
                          onChange={(e) => setNitMasked(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-[#0A2342] px-3 py-2 text-xs text-white placeholder:text-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Empresa pagadora de la factura"
                          value={payerCompanyName}
                          onChange={(e) => setPayerCompanyName(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-[#0A2342] px-3 py-2 text-xs text-white placeholder:text-slate-400"
                        />
                      </div>

                      {submitError && (
                        <p className="text-xs text-rose-400">{submitError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-[#FFD447] hover:bg-amber-300 px-4 py-2.5 text-xs font-extrabold text-[#0A2342] transition"
                      >
                        {submitting
                          ? "Generando Expediente B2B..."
                          : "Confirmar y Obtener Código de Seguimiento B2B"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
