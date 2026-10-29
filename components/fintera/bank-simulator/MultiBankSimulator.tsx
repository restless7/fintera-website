"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BankId,
  CreditProductType,
  AmortizationSystem,
  SimulationParams,
  SimulationCalculation,
} from "@/lib/simulators/types";
import { ALLIED_BANKS, PRODUCT_LABELS } from "@/lib/simulators/bank-configs";
import { calculateBankLoan, runMultiBankComparison } from "@/lib/simulators/financial-engine";
import {
  BuildingOffice2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  TableCellsIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  ScaleIcon,
  ClockIcon,
  UserGroupIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export default function MultiBankSimulator() {
  // Simulator State
  const [selectedBankId, setSelectedBankId] = useState<BankId | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<CreditProductType>("hipotecario-vis");
  const [amortizationSystem, setAmortizationSystem] = useState<AmortizationSystem>("pesos-cuota-fija");
  
  // Numerical Inputs
  const [propertyValue, setPropertyValue] = useState<number>(220000000);
  const [loanAmount, setLoanAmount] = useState<number>(176000000);
  const [termYears, setTermYears] = useState<number>(20);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(6500000);
  const [clientAge, setClientAge] = useState<number>(34);
  const [leasingPurchaseOption, setLeasingPurchaseOption] = useState<number>(1);
  const [showAmortizationTable, setShowAmortizationTable] = useState<boolean>(false);
  const [filterYear, setFilterYear] = useState<number>(1);

  // FASE 3: Estado Multisolicitante / Cotitular / Codeudor
  const [hasCoApplicant, setHasCoApplicant] = useState<boolean>(false);
  const [coApplicantIncome, setCoApplicantIncome] = useState<number>(3500000);
  const [coApplicantRelationship, setCoApplicantRelationship] = useState<"conyuge" | "familiar-primer-grado" | "familiar-segundo-grado" | "tercero-codeudor">("conyuge");
  const [existingFinancialObligations, setExistingFinancialObligations] = useState<number>(0);

  // Currency Formatter
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Parameter object for calculation engine
  const simulationParams: SimulationParams = useMemo(() => ({
    bankId: selectedBankId,
    productType: selectedProduct,
    amortizationSystem,
    propertyValue,
    loanAmount,
    termYears,
    monthlyIncome,
    clientAge,
    employmentType: "empleado-indefinido",
    existingFinancialObligations,
    coApplicants: hasCoApplicant && coApplicantIncome > 0 ? [{
      relationship: coApplicantRelationship,
      monthlyIncome: coApplicantIncome,
      age: clientAge,
      employmentType: "empleado-indefinido",
    }] : undefined,
    leasingPurchaseOptionPercent: leasingPurchaseOption,
  }), [
    selectedBankId,
    selectedProduct,
    amortizationSystem,
    propertyValue,
    loanAmount,
    termYears,
    monthlyIncome,
    clientAge,
    existingFinancialObligations,
    hasCoApplicant,
    coApplicantIncome,
    coApplicantRelationship,
    leasingPurchaseOption,
  ]);

  // Execute engine calculations
  const comparisonResult = useMemo(() => {
    try {
      return runMultiBankComparison(simulationParams);
    } catch {
      return null;
    }
  }, [simulationParams]);

  const singleBankCalculation = useMemo<SimulationCalculation | null>(() => {
    if (selectedBankId === "all") {
      // Pick best rate bank from comparison as active preview
      if (comparisonResult && comparisonResult.calculations.length > 0) {
        return comparisonResult.calculations.find(c => c.bankId === comparisonResult.bestRateBankId) || comparisonResult.calculations[0];
      }
      return null;
    }
    return calculateBankLoan(selectedBankId, simulationParams);
  }, [selectedBankId, simulationParams, comparisonResult]);

  // Current LTV
  const currentLTV = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;

  // Handle Loan Slider adjustment
  const handlePropertyValueChange = (newVal: number) => {
    setPropertyValue(newVal);
    // Auto-adjust default loan amount to 80% or max allowed
    const defaultRatio = selectedProduct === "hipotecario-novis" ? 0.70 : 0.80;
    setLoanAmount(Math.round(newVal * defaultRatio));
  };

  // Export Amortization Table to CSV
  const handleExportCSV = (calculation: SimulationCalculation) => {
    const headers = ["Mes", "Cuota Total", "Abono Capital", "Interes", "Seguro Vida", "Seguro Incendio", "Saldo Restante"];
    const rows = calculation.amortizationPreview.map(r => [
      r.month,
      r.paymentTotal,
      r.principalPayment,
      r.interestPayment,
      r.lifeInsurance,
      r.fireInsurance,
      r.remainingBalance
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Plan_Amortizacion_${calculation.bankName}_${calculation.productType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funnel Handoff: Save sanitized simulation parameters to local storage with 2-hour TTL
  const handleApplyWithBank = (bankId?: string) => {
    const targetBank = bankId && bankId in ALLIED_BANKS ? ALLIED_BANKS[bankId as BankId] : (selectedBankId !== "all" ? ALLIED_BANKS[selectedBankId as BankId] : undefined);
    const calc = singleBankCalculation?.bankId === bankId ? singleBankCalculation : comparisonResult?.calculations.find(c => c.bankId === bankId);
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hours TTL
    const funnelPayload = {
      creditTypes: [`${targetBank?.name || "Banco Aliado"} - ${PRODUCT_LABELS[selectedProduct].label}`],
      requestedAmount: loanAmount,
      termMonths: String(termYears * 12),
      monthlyIncome: calc?.consolidatedMonthlyIncome || monthlyIncome,
      residenceCity: "Bogotá",
      birthCountry: "Colombia",
      residenceCountry: "Colombia",
      simulatedBank: targetBank?.name,
      simulatedRateEA: calc ? `${(calc.rateEA * 100).toFixed(2)}%` : "11.5%",
      simulatedMonthlyPayment: calc ? calc.initialMonthlyTotalPayment : 0,
      existingObligations: existingFinancialObligations,
      hasCoApplicant: hasCoApplicant,
      sourceDocument: calc?.traceability.sourceDocument || "",
      effectiveDate: calc?.traceability.effectiveDate || "",
    };

    localStorage.setItem("fintera_credit_request", JSON.stringify({
      data: funnelPayload,
      timestamp: Date.now(),
      expiresAt: expiresAt,
    }));

    window.location.href = "/credit-request";
  };

  return (
    <section id="simulador" className="py-16 md:py-24 bg-gradient-to-b from-slate-50 via-white to-blue-50/40 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold tracking-wide uppercase mb-4">
            <ScaleIcon className="w-4 h-4" />
            Simulador Multibanco Oficial
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Simula y Compara con Nuestros{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 via-blue-600 to-cyan-500">
              Bancos Aliados
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Políticas reales de crédito, tasas efectivas 2026, seguros de ley y capacidad de endeudamiento parametrizada directamente de los manuales bancarios.
          </p>
        </div>

        {/* Bank Selection Ribbon */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Selecciona el Banco o Compara Todos
            </span>
            <span className="text-xs text-slate-400">
              8 Entidades Aliadas con Convenio Vigente
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {/* All Banks Option */}
            <button
              type="button"
              onClick={() => setSelectedBankId("all")}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                selectedBankId === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500 ring-offset-2"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <SparklesIcon className={`w-5 h-5 ${selectedBankId === "all" ? "text-yellow-400" : "text-slate-400"}`} />
              <span className="text-xs font-bold leading-tight">Comparar Todos</span>
            </button>

            {/* Individual Banks */}
            {Object.values(ALLIED_BANKS).map((bank) => {
              const isSelected = selectedBankId === bank.id;
              const hasProduct = Boolean(bank.products[selectedProduct]);

              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBankId(bank.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 relative ${
                    isSelected
                      ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500 ring-offset-2"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  } ${!hasProduct && selectedBankId !== "all" ? "opacity-60" : ""}`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black tracking-wider text-white shadow-xs" style={{ backgroundColor: bank.primaryColor }}>
                    {bank.shortCode}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 truncate w-full">
                    {bank.name.replace("Banco ", "")}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column (Inputs) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-lg space-y-6">
            
            {/* Product Switcher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Tipo de Crédito / Destino
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRODUCT_LABELS) as CreditProductType[]).map((pType) => (
                  <button
                    key={pType}
                    type="button"
                    onClick={() => setSelectedProduct(pType)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                      selectedProduct === pType
                        ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {PRODUCT_LABELS[pType].label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {PRODUCT_LABELS[selectedProduct].description}
              </p>
            </div>

            {/* Amortization System Switcher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Sistema de Amortización
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAmortizationSystem("pesos-cuota-fija")}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-semibold transition-all ${
                    amortizationSystem === "pesos-cuota-fija"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pesos Cuota Fija
                </button>
                <button
                  type="button"
                  onClick={() => setAmortizationSystem("uvr-cuota-constante")}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-semibold transition-all ${
                    amortizationSystem === "uvr-cuota-constante"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  UVR Constante
                </button>
                <button
                  type="button"
                  onClick={() => setAmortizationSystem("pesos-abono-constante")}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-semibold transition-all ${
                    amortizationSystem === "pesos-abono-constante"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Abono Cte. (Decr.)
                </button>
              </div>
            </div>

            {/* Property Value Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Valor Comercial Inmueble
                </label>
                <span className="text-sm font-extrabold text-slate-900 font-mono">
                  {formatCOP(propertyValue)}
                </span>
              </div>
              <input
                type="range"
                min={80000000}
                max={1500000000}
                step={5000000}
                value={propertyValue}
                onChange={(e) => handlePropertyValueChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>$80M</span>
                <span>$500M</span>
                <span>$1.500M+</span>
              </div>
            </div>

            {/* Loan Amount Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Monto a Financiar
                  </label>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    currentLTV <= 70 ? "bg-emerald-100 text-emerald-800" :
                    currentLTV <= 80 ? "bg-blue-100 text-blue-800" :
                    currentLTV <= 90 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                  }`}>
                    LTV: {currentLTV.toFixed(1)}%
                  </span>
                </div>
                <span className="text-sm font-extrabold text-blue-600 font-mono">
                  {formatCOP(loanAmount)}
                </span>
              </div>
              <input
                type="range"
                min={20000000}
                max={propertyValue}
                step={2000000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Cuota Inicial: {formatCOP(Math.max(0, propertyValue - loanAmount))}</span>
                <span>{((loanAmount / propertyValue) * 100).toFixed(0)}% del valor</span>
              </div>
            </div>

            {/* Term & Client Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Plazo: {termYears} Años ({termYears * 12} Meses)
                </label>
                <select
                  value={termYears}
                  onChange={(e) => setTermYears(Number(e.target.value))}
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={5}>5 Años (60 meses)</option>
                  <option value={10}>10 Años (120 meses)</option>
                  <option value={15}>15 Años (180 meses)</option>
                  <option value={20}>20 Años (240 meses)</option>
                  {amortizationSystem === "uvr-cuota-constante" && (
                    <>
                      <option value={25}>25 Años (300 meses)</option>
                      <option value={30}>30 Años (360 meses)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Edad del Solicitante
                </label>
                <input
                  type="number"
                  min={18}
                  max={74}
                  value={clientAge}
                  onChange={(e) => setClientAge(Number(e.target.value))}
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Income Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Ingreso Mensual Titular Principal
                </label>
                <span className="text-xs font-semibold text-slate-700 font-mono">
                  {formatCOP(monthlyIncome)}
                </span>
              </div>
              <input
                type="range"
                min={2000000}
                max={40000000}
                step={500000}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Multisolicitante / Cotitular Switcher (Fase 3) */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    ¿Unificar Ingresos con Cotitular o Codeudor?
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="coApplicantToggle"
                  checked={hasCoApplicant}
                  onChange={(e) => setHasCoApplicant(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {hasCoApplicant && (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Parentesco / Vínculo
                    </label>
                    <select
                      value={coApplicantRelationship}
                      onChange={(e) => setCoApplicantRelationship(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="conyuge">Cónyuge o Compañero(a) Permanente</option>
                      <option value="familiar-primer-grado">Familiar 1er Grado (Padre / Madre / Hijo)</option>
                      <option value="familiar-segundo-grado">Familiar 2do Grado (Hermanos)</option>
                      <option value="tercero-codeudor">Tercero / Codeudor Solidario</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Ingreso Mensual del Cotitular
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600">
                        {formatCOP(coApplicantIncome)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1423500}
                      max={25000000}
                      step={500000}
                      value={coApplicantIncome}
                      onChange={(e) => setCoApplicantIncome(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div className="p-2 bg-blue-50/80 rounded-lg border border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
                    <span>Ingreso Familiar Consolidado:</span>
                    <strong className="font-mono text-xs">{formatCOP(monthlyIncome + coApplicantIncome)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Obligaciones Financieras Mensuales Previas (Fase 3) */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">
                  Obligaciones Financieras Mensuales Actuales
                </label>
                <span className="font-mono font-bold text-slate-800">
                  {formatCOP(existingFinancialObligations)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15000000}
                step={250000}
                value={existingFinancialObligations}
                onChange={(e) => setExistingFinancialObligations(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-500">
                Cuotas de tarjetas, créditos de libre destino o vehículo que inciden en el endeudamiento global.
              </p>
            </div>

            {/* Leasing Purchase Option if applicable */}
            {selectedProduct === "leasing-habitacional" && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-blue-900">
                  <span>Opción de Compra Final</span>
                  <span className="font-bold">{leasingPurchaseOption}% ({formatCOP(loanAmount * (leasingPurchaseOption / 100))})</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={leasingPurchaseOption}
                  onChange={(e) => setLeasingPurchaseOption(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                />
                <p className="text-[10px] text-blue-700">
                  Al final del plazo podrás adquirir el inmueble abonando este porcentaje residual.
                </p>
              </div>
            )}
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">

            {/* Active Calculation Highlight Card */}
            {singleBankCalculation ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                
                {/* Card Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                          {singleBankCalculation.bankName}
                        </span>
                        <span className="text-xs text-slate-300">
                          {singleBankCalculation.productName}
                        </span>
                        {/* Data Source Badge (Fase 2) */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          singleBankCalculation.dataSourceInfo.isFallback
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}>
                          {singleBankCalculation.dataSourceInfo.isFallback ? "Tarifario Base (Contingencia)" : "Tarifario en Vivo (BD)"}
                        </span>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-mono">
                        {formatCOP(singleBankCalculation.initialMonthlyTotalPayment)}
                        <span className="text-xs text-slate-300 font-normal ml-2">/ mes</span>
                      </h3>
                      <p className="text-xs text-blue-200 mt-1">
                        Cuota inicial total incluyendo seguros obligatorios de Vida y Terremoto
                      </p>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 space-y-1">
                      <div className="text-xs text-slate-400">Tasa Preferencial</div>
                      <div className="text-2xl font-black text-cyan-400">
                        {(singleBankCalculation.rateEA * 100).toFixed(2)}% <span className="text-xs font-normal">E.A.</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        ~{(singleBankCalculation.rateMV * 100).toFixed(2)}% M.V.
                      </div>
                    </div>
                  </div>

                  {/* Traceability Metadata Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>Fuente Oficial: {singleBankCalculation.traceability.sourceDocument}</span>
                    </span>
                    <span className="text-slate-400">Vigencia: {singleBankCalculation.traceability.effectiveDate}</span>
                  </div>
                </div>

                {/* Detailed Metrics Breakdown */}
                <div className="p-6 space-y-6">
                  
                  {/* Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Capital + Interés</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {formatCOP(singleBankCalculation.monthlyPrincipalInterestPayment)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Seguro de Vida</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {formatCOP(singleBankCalculation.monthlyLifeInsurance)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Seguro Terremoto</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {formatCOP(singleBankCalculation.monthlyFireInsurance)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Ingreso Mínimo Req.</span>
                      <span className="text-sm font-bold text-blue-600 font-mono">
                        {formatCOP(singleBankCalculation.minRequiredIncome)}
                      </span>
                    </div>
                  </div>

                  {/* DTI Capacity Gauge & Precalificación Orientativa (Fase 3) */}
                  <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-blue-50/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {singleBankCalculation.isConsolidatedDtiViable && singleBankCalculation.isGlobalDtiViable ? (
                          <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-800">
                          {singleBankCalculation.dtiOriginDescription}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {singleBankCalculation.hasCoApplicants ? (
                          <>
                            Cuota hipotecaria:{" "}
                            <strong className="text-slate-900">
                              {(singleBankCalculation.consolidatedDtiRatio * 100).toFixed(1)}%
                            </strong>{" "}
                            del ingreso familiar consolidado de {formatCOP(singleBankCalculation.consolidatedMonthlyIncome)}.
                          </>
                        ) : (
                          <>
                            Cuota hipotecaria:{" "}
                            <strong className="text-slate-900">
                              {(singleBankCalculation.actualDtiRatio * 100).toFixed(1)}%
                            </strong>{" "}
                            de los ingresos declarados de {formatCOP(monthlyIncome)}.
                          </>
                        )}
                      </p>
                      {existingFinancialObligations > 0 && (
                        <p className="text-[11px] text-slate-600">
                          Endeudamiento global (cuota + pasivos):{" "}
                          <strong className={singleBankCalculation.isGlobalDtiViable ? "text-slate-900" : "text-red-600"}>
                            {(singleBankCalculation.globalDtiRatio * 100).toFixed(1)}%
                          </strong>{" "}
                          (Límite banco: {(singleBankCalculation.maxGlobalDtiLimit * 100).toFixed(0)}%).
                        </p>
                      )}
                      <p className="text-[11px] text-blue-700 font-medium">
                        {singleBankCalculation.preliminaryEligibilityMessage}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {singleBankCalculation.bankAdmissionRuleApplied}
                      </p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                        singleBankCalculation.preliminaryEligibilityStatus === "apto"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : singleBankCalculation.preliminaryEligibilityStatus === "capacidad-ajustada"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : singleBankCalculation.preliminaryEligibilityStatus === "sobreendeudamiento-previo"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : singleBankCalculation.preliminaryEligibilityStatus === "requiere-codeudor-adicional"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-purple-100 text-purple-800 border border-purple-300"
                      }`}>
                        {singleBankCalculation.preliminaryEligibilityStatus === "apto"
                          ? "Apto para Estudio"
                          : singleBankCalculation.preliminaryEligibilityStatus === "capacidad-ajustada"
                          ? "Capacidad Ajustada"
                          : singleBankCalculation.preliminaryEligibilityStatus === "sobreendeudamiento-previo"
                          ? "Sobreendeudamiento"
                          : singleBankCalculation.preliminaryEligibilityStatus === "requiere-codeudor-adicional"
                          ? "Requiere Cotitular"
                          : "Ajustar Plazo/Edad"}
                      </span>
                    </div>
                  </div>

                  {/* Legalization Costs Estimate */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between pr-3 border-r border-slate-200">
                      <span className="text-slate-500">Avalúo Estimado 2026:</span>
                      <strong className="text-slate-800 font-mono">{formatCOP(singleBankCalculation.estimatedAppraisalCost)}</strong>
                    </div>
                    <div className="flex items-center justify-between pl-3">
                      <span className="text-slate-500">Estudio de Títulos:</span>
                      <strong className="text-slate-800 font-mono">{formatCOP(singleBankCalculation.estimatedTitleSearchCost)}</strong>
                    </div>
                  </div>

                  {/* Legal Transparency & Non-binding Disclaimer */}
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <InformationCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>Aviso Legal de Simulación Informativa (No Vinculante)</span>
                    </div>
                    <p className="leading-relaxed text-[10.5px]">
                      Este simulador reproduce de manera exacta las fórmulas y manuales de producto provistos por los bancos aliados vigentes a 2026. Los resultados son exclusivamente informativos y constituyen una precalificación estimada. La aprobación definitiva, tasa personalizada y condiciones contractuales son competencia privativa de la entidad financiera tras estudio de títulos, avalúo y verificación en centrales de riesgo.
                    </p>
                  </div>

                  {/* Actions & Handoff */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAmortizationTable(!showAmortizationTable)}
                      className="flex-1 flex items-center justify-center gap-2 h-12 text-xs font-bold border-slate-300 hover:bg-slate-100"
                    >
                      <TableCellsIcon className="w-4 h-4 text-slate-600" />
                      {showAmortizationTable ? "Ocultar Tabla de Pagos" : "Ver Tabla de Amortización"}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleApplyWithBank(singleBankCalculation.bankId)}
                      className="flex-1 flex items-center justify-center gap-2 h-12 text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <span>Solicitar con {singleBankCalculation.bankName}</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center text-amber-800">
                <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-amber-500 mb-3" />
                <h4 className="font-bold text-lg">Parámetros Fuera de Política</h4>
                <p className="text-xs text-amber-700 mt-1">
                  El banco seleccionado no ofrece esta línea de producto con el monto o plazo solicitado.
                  Prueba cambiando a &quot;Comparar Todos&quot; para ver qué bancos aplican.
                </p>
              </div>
            )}

            {/* Multi-Bank Comparison Cards (When "Comparar Todos" is selected) */}
            {selectedBankId === "all" && comparisonResult && comparisonResult.calculations.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ScaleIcon className="w-4 h-4 text-blue-600" />
                    Comparativa de Entidades para tu Monto de {formatCOP(loanAmount)}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {comparisonResult.calculations.length} Bancos Disponibles
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparisonResult.calculations.map((calc) => {
                    const bankMeta = ALLIED_BANKS[calc.bankId];
                    const isBestRate = calc.bankId === comparisonResult.bestRateBankId;
                    const isLowestPayment = calc.bankId === comparisonResult.lowestPaymentBankId;

                    return (
                      <div
                        key={calc.bankId}
                        className={`p-4 rounded-xl border bg-white transition-all hover:shadow-md ${
                          isLowestPayment ? "border-emerald-400 bg-emerald-50/10 ring-1 ring-emerald-400" :
                          isBestRate ? "border-blue-400 bg-blue-50/10 ring-1 ring-blue-400" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
                              style={{ backgroundColor: bankMeta.primaryColor }}
                            >
                              {bankMeta.shortCode}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">{calc.bankName}</h5>
                              <p className="text-[10px] text-slate-500">{bankMeta.approvalValidityPeriod}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            {isLowestPayment && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                                Cuota Más Baja
                              </span>
                            )}
                            {isBestRate && !isLowestPayment && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
                                Mejor Tasa E.A.
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Cuota Integral</span>
                            <span className="text-base font-extrabold text-slate-900 font-mono">
                              {formatCOP(calc.initialMonthlyTotalPayment)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Tasa E.A.</span>
                            <span className="text-xs font-black text-blue-600">
                              {(calc.rateEA * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                            {bankMeta.keyBenefits[0]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyWithBank(calc.bankId)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            Elegir <ArrowRightIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amortization Schedule Drawer / Accordion */}
        <AnimatePresence>
          {showAmortizationTable && singleBankCalculation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-12 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-lg font-bold flex items-center gap-2">
                    <TableCellsIcon className="w-5 h-5 text-cyan-400" />
                    Tabla de Amortización Proyectada ({singleBankCalculation.bankName})
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Plan de pagos mes a mes con discriminación de abono a capital, intereses corrientes y seguros obligatorios.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV(singleBankCalculation)}
                    className="text-xs text-slate-900 bg-white hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Descargar CSV
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowAmortizationTable(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <ChevronUpIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mes</th>
                      <th className="py-3 px-4">Cuota Total</th>
                      <th className="py-3 px-4">Abono Capital</th>
                      <th className="py-3 px-4">Intereses</th>
                      <th className="py-3 px-4">Seguro Vida</th>
                      <th className="py-3 px-4">Seguro Incendio</th>
                      <th className="py-3 px-4">Saldo Capital</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {singleBankCalculation.amortizationPreview.map((row) => (
                      <tr key={row.month} className="hover:bg-blue-50/50 font-mono">
                        <td className="py-2.5 px-4 font-bold text-slate-900">#{row.month}</td>
                        <td className="py-2.5 px-4 font-bold text-blue-600">{formatCOP(row.paymentTotal)}</td>
                        <td className="py-2.5 px-4 text-emerald-600">{formatCOP(row.principalPayment)}</td>
                        <td className="py-2.5 px-4 text-slate-600">{formatCOP(row.interestPayment)}</td>
                        <td className="py-2.5 px-4 text-slate-500">{formatCOP(row.lifeInsurance)}</td>
                        <td className="py-2.5 px-4 text-slate-500">{formatCOP(row.fireInsurance)}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold">{formatCOP(row.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
