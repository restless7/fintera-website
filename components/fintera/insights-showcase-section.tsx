import Link from "next/link";
import { getAllFinteraContent } from "@/lib/blog";
import {
  CONTENT_TYPES,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
} from "@/lib/content-types";
import { FINTERA_AUTHORITATIVE_SOURCES } from "@/lib/research";

export default function InsightsShowcaseSection() {
  const featuredItems = getAllFinteraContent({ status: "PUBLISHED" })
    .slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.14),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-10 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">
              FINTERA Insights · Criterio Financiero y Educación Aplicada
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Investigación, simulaciones y guías para personas y empresas en
              Colombia
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Respaldamos cada publicación con datos oficiales verificables
              (Superfinanciera, Banco de la República, DANE, FNA, DIAN/RADIAN y
              OCDE), separando el hecho estadístico de la recomendación técnica
              de FINTERA.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/insights"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95"
            >
              Explorar Biblioteca FINTERA Insights →
            </Link>
          </div>
        </div>

        {/* 4 Content Pillars Summary Strip */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(FINTERA_CONTENT_PILLARS).map((pillar) => (
            <Link
              key={pillar.key}
              href={`/insights?pillar=${pillar.key}`}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-sky-400/50 hover:bg-white/10"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-sky-400">
                  Pilar {pillar.number}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-slate-300">
                  {pillar.audience === "B2C_VIVIENDA"
                    ? "Personas · B2C"
                    : pillar.audience === "B2B_EMPRESAS"
                    ? "Empresas · B2B"
                    : "Híbrido"}
                </span>
              </div>
              <h3 className="mt-2.5 text-base font-bold text-white group-hover:text-sky-300">
                {pillar.label.replace(/^Pilar \d+ · /, "")}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {pillar.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Featured Research Cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {featuredItems.map((item) => {
            const typeCfg = CONTENT_TYPES[item.contentType];
            const pillarCfg =
              FINTERA_CONTENT_PILLARS[item.pillar as FinteraContentPillarKey];
            return (
              <Link
                key={item.id}
                href={`/insights/${item.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-xl transition hover:-translate-y-0.5 hover:border-sky-400/60"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1 font-bold text-sky-300">
                      {typeCfg?.label}
                    </span>
                    <span className="text-slate-400">
                      Fecha de corte: {item.cutoffDate} · QA {item.qaScore}/100
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold leading-snug text-white group-hover:text-sky-300">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-300">
                    {item.excerpt}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                  <span className="font-semibold text-slate-400">
                    {pillarCfg?.shortLabel} · {item.readingTime} min de lectura
                  </span>
                  <span className="font-bold text-sky-400 group-hover:underline">
                    Leer documento completo →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 14 Sources Authority Bar */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                14 Fuentes Primarias de Autoridad
              </span>
              <p className="mt-0.5 text-xs text-slate-300">
                Nuestros whitepapers, webinars y análisis integran datos con
                fecha de corte de instituciones oficiales y multilaterales:
              </p>
            </div>
            <Link
              href="/insights"
              className="shrink-0 text-xs font-bold text-sky-300 hover:underline"
            >
              Ver metodología editorial →
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {FINTERA_AUTHORITATIVE_SOURCES.map((src) => (
              <span
                key={src.id}
                className="rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-300"
              >
                {src.shortName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

