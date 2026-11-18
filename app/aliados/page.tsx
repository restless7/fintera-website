"use client";
import { useState } from "react";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Briefcase, Building2, CheckCircle2 } from "lucide-react";
import { GrowthCaptureForm } from "@/components/fintera/growth/GrowthCaptureForm";
import { GrowthReceiptTracker } from "@/components/fintera/growth/GrowthReceiptTracker";

export default function AliadosPortalPage() {
  const [channel, setChannel] = useState<
    "PARTNER_REFERRAL_B2C" | "PARTNER_REFERRAL_B2B"
  >("PARTNER_REFERRAL_B2C");
  const [locked, setLocked] = useState(false);
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F7F7] pt-24 pb-20">
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
                  acompañamiento y trazabilidad del expediente autorizado.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#radicar-referido"
                    className="rounded-xl bg-[#00C4B3] px-6 py-3.5 text-sm font-extrabold text-[#0A2342] shadow-lg transition hover:bg-[#00a899]"
                  >
                    Registrar un referido
                  </a>
                  <a
                    href="#rastreador-aliados"
                    className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Consultar recepción
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
                      El comprobante público confirma recepción. La información
                      del expediente requiere una cuenta y autorización.
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
                rechazos en un solo banco. Evaluamos el perfil del comprador
                bajo los criterios de cada entidad y preparamos la documentación
                para la revisión correspondiente.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#008f82] shrink-0" />
                  <span>
                    Orientación sobre crédito hipotecario y leasing
                    habitacional, según la información real del caso.
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
                alternativas de capital de trabajo
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
                    Revisión documental de los eventos y requisitos aplicables;
                    esta página no consulta ni certifica eventos de DIAN.
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
                    Los términos comerciales dependen del convenio real de cada
                    operación; no se calculan comisiones desde el formulario.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section
            id="radicar-referido"
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-extrabold text-[#0A2342]">
                Registrar un referido
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                La recepción no crea automáticamente un expediente ni acredita
                una comisión. El equipo revisará la información suministrada.
              </p>
            </div>
            <label className="block space-y-2 text-sm font-semibold text-[#0A2342]">
              Tipo de solicitud
              <select
                value={channel}
                disabled={locked}
                onChange={(event) =>
                  setChannel(event.target.value as typeof channel)
                }
                className="block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              >
                <option value="PARTNER_REFERRAL_B2C">
                  Vivienda / leasing habitacional
                </option>
                <option value="PARTNER_REFERRAL_B2B">
                  Empresa / factoring
                </option>
              </select>
            </label>
            <GrowthCaptureForm
              key={channel}
              channel={channel}
              pillar={
                channel === "PARTNER_REFERRAL_B2C"
                  ? "VIVIENDA_B2C"
                  : "FACTORING_B2B"
              }
              productLabel={
                channel === "PARTNER_REFERRAL_B2C"
                  ? "Referido de vivienda / leasing habitacional"
                  : "Referido empresarial / factoring"
              }
              partner
              source="portal_aliados"
              onLockChange={setLocked}
            />
          </section>
          <section id="rastreador-aliados">
            <GrowthReceiptTracker />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
