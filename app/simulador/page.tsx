"use client";

import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import MultiBankSimulator from "@/components/fintera/bank-simulator/MultiBankSimulator";
import { ALLIED_BANKS } from "@/lib/simulators/bank-configs";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  ScaleIcon,
  ClockIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/outline";

export default function SimuladorPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 bg-slate-50">
        
        {/* Dedicated MultiBank Simulator */}
        <MultiBankSimulator />

        {/* Bank Credentials & Institutional Trust Grid */}
        <section className="py-16 bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Red de Entidades Aliadas
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                ¿Por qué Simular a través de Fintera?
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Conectamos tu perfil con las mesas de radicación directa de los principales bancos de Colombia, optimizando tiempos de respuesta y garantizando la mejor tasa posible.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <ScaleIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Comparación Objetiva</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calculamos cuotas con las fórmulas y tablas de seguros exactas de cada entidad (no promedios ni estimaciones genéricas).
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Pre-Aprobación Ágil</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Radicación centralizada con cédula y formulario digital en Bizagi para bancos con aprobación en menos de 24 horas.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Cumplimiento Ley 546</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Validación automática del límite de endeudamiento DTI (30% en VIS y 40% en NO VIS) para asegurar viabilidad jurídica y financiera.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <BuildingLibraryIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Portafolio Integral</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Desde vivienda VIS y Leasing Habitacional hasta créditos de Acabados Credifamilia y la línea internacional COLEX.
                </p>
              </div>
            </div>

            {/* Bank Logos & Badges Summary */}
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="font-bold text-lg text-white">Nuestra Red Bancaria Oficial</h4>
                <p className="text-xs text-slate-300">
                  Convenios comerciales y de referenciación activos en toda Colombia y para colombianos en el exterior.
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
