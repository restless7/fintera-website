import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { getAllFinteraContent, resolveArticleCoverImage } from "@/lib/blog";
import {
  CONTENT_TYPES,
  FINTERA_BRAND_BLUEPRINT,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
} from "@/lib/content-types";
import { FINTERA_AUTHORITATIVE_SOURCES } from "@/lib/research";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "FINTERA Insights | Inteligencia Financiera con Trato Humano en Colombia",
  description:
    "Artículos de análisis, whitepapers, webinars educativos, casos prácticos y guías sobre crédito de vivienda, leasing habitacional, RADIAN y factoring empresarial en Colombia con fuentes oficiales.",
};

export default async function FinteraInsightsPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string; type?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedPillar = resolvedParams.pillar || "ALL";
  const selectedType = resolvedParams.type || "ALL";

  const publishedItems = getAllFinteraContent({ status: "PUBLISHED" }).filter(
    (item) => {
      if (selectedPillar !== "ALL" && item.pillar !== selectedPillar)
        return false;
      if (selectedType !== "ALL" && item.contentType !== selectedType)
        return false;
      return true;
    }
  );

  const featuredItems = publishedItems.filter((i) => i.featured).slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F7F7] pt-24 pb-20">
        {/* Institutional Hero Header — FINTERA Brand Blueprint V1.0 (#0A2342 + #00C4B3 + #FFD447) */}
        <section className="relative overflow-hidden bg-[#0A2342] py-16 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,196,179,0.18),transparent_55%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00C4B3]/40 bg-[#00C4B3]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#00C4B3]">
                <span className="h-2 w-2 rounded-full bg-[#FFD447]" />
                <span>
                  FINTERA INSIGHTS · {FINTERA_BRAND_BLUEPRINT.positioning}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Claridad que conecta oportunidades de financiación en Colombia
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-200 sm:text-lg">
                Hacemos más claro el camino entre una necesidad de financiación y
                una oportunidad real de crédito. Explora nuestros whitepapers,
                webinars, simulaciones numéricas y guías sobre{" "}
                <strong className="text-white">
                  crédito de vivienda, leasing habitacional, flujo de caja,
                  RADIAN y factoring
                </strong>{" "}
                respaldados en fuentes primarias oficiales.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/simulador?utm_source=insights_hub&utm_medium=web&utm_campaign=vivienda_b2c"
                  className="rounded-xl bg-[#00C4B3] px-5 py-3 text-sm font-bold text-[#0A2342] shadow-lg transition hover:bg-[#00b0a0]"
                >
                  Tu crédito, con más claridad · Simular Vivienda (B2C)
                </Link>
                <Link
                  href="/contacto?linea=factoring&utm_source=insights_hub&utm_medium=web&utm_campaign=factoring_b2b"
                  className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Diagnóstico de Liquidez Empresarial (B2B)
                </Link>
              </div>
              <div className="mt-6 h-1 w-20 rounded-full bg-[#FFD447]" />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
          {/* 4 Content Pillars Filter Cards with Brand-Aligned Cover Images */}
          <section aria-label="Pilares estratégicos de contenido">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#008f82]">
                  ARQUITECTURA EDITORIAL · SEÑALES DE CLARIDAD
                </span>
                <h2 className="text-2xl font-bold text-[#0A2342]">
                  4 Pilares Estratégicos de FINTERA
                </h2>
              </div>
              {selectedPillar !== "ALL" && (
                <Link
                  href="/insights"
                  className="rounded-xl bg-[#0A2342] px-4 py-2 text-xs font-bold text-white hover:bg-[#0A2342]/90"
                >
                  Ver todas las publicaciones ({getAllFinteraContent({ status: "PUBLISHED" }).length})
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(FINTERA_CONTENT_PILLARS).map((pillar) => {
                const isActive = selectedPillar === pillar.key;
                return (
                  <Link
                    key={pillar.key}
                    href={
                      isActive ? "/insights" : `/insights?pillar=${pillar.key}`
                    }
                    className={`group overflow-hidden rounded-2xl border transition duration-200 flex flex-col justify-between ${
                      isActive
                        ? "border-[#00C4B3] bg-white ring-2 ring-[#00C4B3] shadow-lg"
                        : "border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:border-[#00C4B3]/60 hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="relative h-44 w-full overflow-hidden bg-[#0A2342]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={pillar.coverImage}
                          alt={pillar.label}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A2342] via-[#0A2342]/35 to-transparent" />
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-[#0A2342]/90 border border-[#00C4B3]/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00C4B3]">
                            Pilar {pillar.number}
                          </span>
                          <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0A2342]">
                            {pillar.audience === "B2C_VIVIENDA"
                              ? "Personas · B2C"
                              : pillar.audience === "B2B_EMPRESAS"
                              ? "Empresas · B2B"
                              : "Personas y Aliados"}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-[11px] font-semibold text-[#FFD447]">
                            “{pillar.brandClaim}”
                          </p>
                          <h3 className="text-base font-bold text-white leading-snug">
                            {pillar.label.replace(/^Pilar \d+ · /, "")}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-xs leading-relaxed text-slate-600">
                          {pillar.description}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0A2342]">
                        {isActive ? "Filtro activo" : "Explorar pilar"}
                      </span>
                      <span className="font-bold text-[#008f82] group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Featured Flagship Research Pieces (Whitepapers, Webinars, Case Studies) */}
          {featuredItems.length > 0 && selectedPillar === "ALL" && (
            <section aria-label="Investigaciones destacadas">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#008f82]">
                  PUBLICACIONES INSIGNIA · FINTERA INSIGHTS
                </span>
                <h2 className="text-2xl font-bold text-[#0A2342]">
                  Informes Descargables, Webinars y Simulaciones Documentadas
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {featuredItems.map((item) => {
                  const typeCfg = CONTENT_TYPES[item.contentType];
                  const pillarCfg =
                    FINTERA_CONTENT_PILLARS[
                      item.pillar as FinteraContentPillarKey
                    ] || FINTERA_CONTENT_PILLARS.VIVIENDA_B2C;
                  const coverSrc = resolveArticleCoverImage(
                    item.id,
                    item.slug,
                    item.coverImage
                  );
                  return (
                    <Link
                      key={item.id}
                      href={`/insights/${item.slug}`}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#00C4B3] hover:shadow-md"
                    >
                      <div>
                        <div className="relative h-44 w-full overflow-hidden bg-[#0A2342]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverSrc}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2342]/80 via-transparent to-transparent" />
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                            <span className="rounded-full bg-[#0A2342]/90 border border-[#00C4B3]/40 px-3 py-1 text-xs font-bold text-[#00C4B3]">
                              {typeCfg?.label}
                            </span>
                            <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0A2342]">
                              Corte: {item.cutoffDate}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="text-lg font-bold text-[#0A2342] group-hover:text-[#008f82]">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="mt-1.5 text-xs font-medium text-slate-600">
                              {item.subtitle}
                            </p>
                          )}
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                            {item.excerpt.replace(/[#*_`]/g, "")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs">
                        <span className="font-semibold text-slate-700">
                          {pillarCfg?.shortLabel} ·{" "}
                          {(item.analytics?.views ?? item.views ?? 180).toLocaleString(
                            "es-CO"
                          )}{" "}
                          lecturas
                        </span>
                        <span className="font-bold text-[#0A2342] group-hover:text-[#008f82]">
                          Leer publicación ({item.readingTime} min) →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Published Content Feed */}
          <section aria-label="Biblioteca completa de FINTERA Insights">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#0A2342]">
                  Biblioteca Editorial ({publishedItems.length} piezas)
                </h2>
                <p className="text-sm text-slate-600">
                  Cada pieza separa el dato publicado por las autoridades del
                  criterio financiero de FINTERA.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/insights"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    selectedType === "ALL"
                      ? "bg-[#0A2342] text-white"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-[#00C4B3]"
                  }`}
                >
                  Todos
                </Link>
                {Object.values(CONTENT_TYPES).map((t) => (
                  <Link
                    key={t.key}
                    href={`/insights?type=${t.key}`}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      selectedType === t.key
                        ? "bg-[#0A2342] text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-[#00C4B3]"
                    }`}
                  >
                    {t.pluralLabel}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {publishedItems.map((item) => {
                const typeCfg = CONTENT_TYPES[item.contentType];
                const pillarCfg =
                  FINTERA_CONTENT_PILLARS[
                    item.pillar as FinteraContentPillarKey
                  ] || FINTERA_CONTENT_PILLARS.VIVIENDA_B2C;
                const coverSrc = resolveArticleCoverImage(
                  item.id,
                  item.slug,
                  item.coverImage
                );
                return (
                  <Link
                    key={item.id}
                    href={`/insights/${item.slug}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#00C4B3] hover:shadow-md"
                  >
                    <div>
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative h-40 w-full sm:h-auto sm:w-44 shrink-0 overflow-hidden bg-[#0A2342]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverSrc}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-5 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-md bg-[#0A2342] px-2.5 py-0.5 font-bold text-[#00C4B3]">
                              {typeCfg?.label}
                            </span>
                            <span className="font-semibold text-[#0A2342]">
                              {pillarCfg?.shortLabel}
                            </span>
                            <span className="text-slate-400">
                              · Corte: {item.cutoffDate}
                            </span>
                          </div>

                          <h3 className="mt-2.5 text-base font-bold text-[#0A2342] group-hover:text-[#008f82] leading-snug">
                            {item.title}
                          </h3>

                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                            {item.excerpt.replace(/[#*_`]/g, "")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 bg-slate-50/50">
                      <span>
                        ✔ Revisión Humana E-E-A-T ·{" "}
                        {(item.analytics?.views ?? item.views ?? 180).toLocaleString(
                          "es-CO"
                        )}{" "}
                        lecturas · {item.readingTime} min
                      </span>
                      <span className="font-bold text-[#0A2342] group-hover:text-[#008f82]">
                        Consultar análisis →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 14 Authoritative Sources Transparency Footer */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008f82]">
              REGLA EDITORIAL FINTERA · FUENTES DE AUTORIDAD
            </span>
            <h2 className="mt-1 text-lg font-bold text-[#0A2342]">
              Respaldo en 14 Fuentes Primarias Oficiales y Multilaterales
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Una persona debe comprender un mensaje de FINTERA en la primera
              lectura, y un aliado financiero debe poder comprobar la afirmación
              que ese mensaje contiene.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {FINTERA_AUTHORITATIVE_SOURCES.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#00C4B3] hover:text-[#0A2342]"
                >
                  <span className="font-bold">{source.shortName}</span>
                  <span className="text-slate-400">·</span>
                  <span>{source.name}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
