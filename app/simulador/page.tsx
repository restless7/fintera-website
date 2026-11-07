"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import MultiBankSimulator from "@/components/fintera/bank-simulator/MultiBankSimulator";
import B2BFactoringCalculator from "@/components/fintera/factoring-simulator/B2BFactoringCalculator";
import InteractiveDocChecklistAndTracker from "@/components/fintera/growth/InteractiveDocChecklistAndTracker";
import { ALLIED_BANKS } from "@/lib/simulators/bank-configs";
import {
  ShieldCheckIcon,
  ScaleIcon,
  ClockIcon,
  BuildingLibraryIcon,
  HomeModernIcon,
  BriefcaseIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

export default function SimuladorPage() {
  const [activeLine, setActiveLine] = useState<"B2C" | "B2B" | "ALL">("ALL");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 bg-[#F7F7F7]">
        {/* FINTERA Brand Blueprint V1.0 — Dual-Line Selector Banner */}
        <section className="bg-[#0A2342] text-white py-10 border-b border-white/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#00C4B3]/20 border border-[#00C4B3]/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#00C4B3]">
                    Centro de Simulación y Diagnóstico Financiero FINTERA
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#FFD447]">
                    “Hagamos posible tu próximo proyecto.”
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Simula tu Crédito de Vivienda (B2C) o el Costo de Liquidez
                  sobre Facturas RADIAN (B2B)
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Selecciona la línea de financiación que deseas evaluar con
                  fórmulas reales de nuestras 8+ entidades vigiladas y supuestos
                  transparentes.
                </p>
              </div>

              {/* Dual-Line Switcher */}
              <div className="flex flex-wrap items-center gap-2 bg-[#061529] p-2 rounded-2xl border border-white/15 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveLine("B2C")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                    activeLine === "B2C"
                      ? "bg-[#00C4B3] text-[#0A2342] shadow"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <HomeModernIcon className="w-4 h-4" />
                  <span>Línea 1 · Vivienda B2C</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLine("B2B")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                    activeLine === "B2B"
                      ? "bg-[#00C4B3] text-[#0A2342] shadow"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <BriefcaseIcon className="w-4 h-4" />
                  <span>Línea 2 · Factoring RADIAN B2B</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLine("ALL")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                    activeLine === "ALL"
                      ? "bg-[#FFD447] text-[#0A2342] shadow"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  <span>Ver Ambas Líneas</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Línea 1: B2C MultiBank Mortgage & Housing Simulator */}
        {(activeLine === "B2C" || activeLine === "ALL") && (
          <MultiBankSimulator />
        )}

        {/* Línea 2: B2B Factoring & RADIAN Opportunity Cost Calculator */}
        {(activeLine === "B2B" || activeLine === "ALL") && (
          <B2BFactoringCalculator />
        )}

        {/* Growth Plan 2: Frictionless Document Vault Checklist & Live Multi-Bank Status Tracker */}
        <InteractiveDocChecklistAndTracker />

        {/* Bank Credentials & Institutional Trust Grid */}
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A2342] bg-[#00C4B3]/20 px-3 py-1 rounded-full">
                Red de Entidades Aliadas y Gobernanza Financiera
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0A2342] mt-3">
                ¿Por qué estructurar tu financiación a través de FINTERA?
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Conectamos tu perfil con las mesas de radicación directa de los
                principales bancos de Colombia y aliados de liquidez
                empresarial, con acompañamiento y transparencia total.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0A2342] flex items-center justify-center text-[#00C4B3]">
                  <ScaleIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-[#0A2342] text-base">
                  Comparación Objetiva
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calculamos cuotas con las fórmulas y tablas de seguros exactas
                  de cada entidad vigilada, y el costo de oportunidad real en
                  facturas electrónicas RADIAN.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#00C4B3]/20 flex items-center justify-center text-[#008f82]">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-[#0A2342] text-base">
                  Carpeta Digital Única
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Alista tus soportes una sola vez en nuestra Bóveda Documental
                  Cifrada y evita reprocesos o rechazos por documentos vencidos.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFD447]/30 flex items-center justify-center text-[#0A2342]">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-[#0A2342] text-base">
                  Cumplimiento Ley 546 y RADIAN
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Validación automática del límite de endeudamiento DTI (30% en
                  VIS y 40% en NO VIS) y de los 3 eventos obligatorios de la
                  DIAN en RADIAN.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0A2342] flex items-center justify-center text-[#FFD447]">
                  <BuildingLibraryIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-[#0A2342] text-base">
                  Red de Aliados B2B2C
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trabajamos junto a inmobiliarias, constructoras y contadores
                  públicos en toda Colombia.{" "}
                  <Link
                    href="/aliados"
                    className="font-bold text-[#008f82] underline"
                  >
                    Conoce el Portal de Aliados →
                  </Link>
                </p>
              </div>
            </div>

            {/* Bank Logos & Badges Summary */}
            <div className="mt-12 p-6 rounded-2xl bg-[#0A2342] text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="font-bold text-lg text-white">
                  Nuestra Red Bancaria e Institucional Oficial
                </h4>
                <p className="text-xs text-slate-300">
                  Convenios comerciales y de referenciación activos en toda
                  Colombia y para colombianos en el exterior.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {Object.values(ALLIED_BANKS).map((b) => (
                  <span
                    key={b.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
                  >
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
