import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { getAllFinteraContent } from "@/lib/blog";
import {
  CONTENT_TYPES,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
} from "@/lib/content-types";
import { FINTERA_AUTHORITATIVE_SOURCES } from "@/lib/research";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "FINTERA Insights | Educación Financiera, Crédito de Vivienda y Factoring en Colombia",
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
      <main className="min-h-screen bg-slate-50 pt-24 pb-20">
        {/* Hero Header */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-sky-300">
                FINTERA Insights · Criterio Financiero · Acompañamiento ·
                Transparencia
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
                Conocimiento financiero para tomar decisiones informadas en
                Colombia
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
                Conectamos personas y empresas con soluciones financieras.
                Explora nuestros whitepapers, webinars, simulaciones numéricas y
                guías sobre{" "}
                <strong className="text-white">
                  crédito de vivienda, leasing habitacional, flujo de caja,
                  RADIAN y factoring
                </strong>{" "}
                respaldados en fuentes primarias oficiales.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/simulador?utm_source=insights_hub&utm_medium=web&utm_campaign=vivienda_b2c"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                >
                  Simular Crédito de Vivienda (B2C)
                </Link>
                <Link
                  href="/contacto?utm_source=insights_hub&utm_medium=web&utm_campaign=factoring_b2b"
                  className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Diagnóstico de Liquidez Empresarial (B2B)
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
          {/* 4 Content Pillars Filter Cards */}
          <section aria-label="Pilares estratégicos de contenido">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                4 Líneas Editoriales de FINTERA
              </h2>
              {selectedPillar !== "ALL" && (
                <Link
                  href="/insights"
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Ver todas las publicaciones
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(FINTERA_CONTENT_PILLARS).map((pillar) => {
                const isActive = selectedPillar === pillar.key;
                return (
                  <Link
                    key={pillar.key}
                    href={
                      isActive ? "/insights" : `/insights?pillar=${pillar.key}`
                    }
                    className={`rounded-2xl border p-5 transition shadow-sm ${
                      isActive
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Pilar {pillar.number} ({pillar.targetPercentage}%)
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {pillar.audience === "B2C_VIVIENDA"
                          ? "Personas · B2C"
                          : pillar.audience === "B2B_EMPRESAS"
                          ? "Empresas · B2B"
                          : "Personas y Empresas"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-slate-900">
                      {pillar.label.replace(/^Pilar \d+ · /, "")}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {pillar.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Featured Flagship Research Pieces (Whitepapers, Webinars, Case Studies) */}
          {featuredItems.length > 0 && selectedPillar === "ALL" && (
            <section aria-label="Investigaciones destacadas">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  PUBLICACIONES INSIGNIA · FINTERA INSIGHTS
                </span>
                <h2 className="text-2xl font-bold text-slate-900">
                  Informes Descargables, Webinars y Simulaciones Documentadas
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {featuredItems.map((item) => {
                  const typeCfg = CONTENT_TYPES[item.contentType];
                  const pillarCfg =
                    FINTERA_CONTENT_PILLARS[
                      item.pillar as FinteraContentPillarKey
                    ];
                  return (
                    <Link
                      key={item.id}
                      href={`/insights/${item.slug}`}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                            {typeCfg?.label}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            Corte: {item.cutoffDate}
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-700">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="mt-1.5 text-xs font-medium text-slate-600">
                            {item.subtitle}
                          </p>
                        )}
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                          {item.excerpt}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                        <span className="font-semibold text-slate-700">
                          {pillarCfg?.shortLabel}
                        </span>
                        <span className="font-bold text-blue-600 group-hover:underline">
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
                <h2 className="text-2xl font-bold text-slate-900">
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
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 border border-slate-200"
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
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 border border-slate-200"
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
                  ];
                return (
                  <Link
                    key={item.id}
                    href={`/insights/${item.slug}`}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-bold text-slate-800">
                          {typeCfg?.label}
                        </span>
                        <span className="font-semibold text-blue-700">
                          {pillarCfg?.label}
                        </span>
                        <span className="text-slate-400">
                          · Corte: {item.cutoffDate}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900 hover:text-blue-700">
                        {item.title}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        {item.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>
                        Por {item.authorName} · {item.readingTime} min de
                        lectura
                      </span>
                      <span className="font-bold text-blue-600">
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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              REGLA EDITORIAL FINTERA · FUENTES DE AUTORIDAD
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              14 Fuentes Oficiales, Gremiales y Multilaterales que Respaldan
              Nuestro Criterio
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              En FINTERA utilizamos fuentes primarias verificables con fecha de
              corte explícita, separamos el dato publicado de nuestra
              interpretación y nunca presentamos simulaciones hipotéticas como
              resultados garantizados.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FINTERA_AUTHORITATIVE_SOURCES.slice(0, 8).map((src) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs transition hover:border-blue-300"
                >
                  <strong className="block text-slate-900">
                    {src.shortName}
                  </strong>
                  <span className="mt-1 line-clamp-2 block text-slate-600">
                    {src.whatItProvides}
                  </span>
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

