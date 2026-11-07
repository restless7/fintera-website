"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Landmark,
  Radar,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type {
  AuthoritativeSourceDefinition,
  ResearchBrief,
  ResearchDeskState,
  ResearchSignal,
} from "@/lib/research";
import { FINTERA_CONTENT_PILLARS } from "@/lib/content-types";
import { MarkdownRenderer } from "@/components/fintera/markdown-renderer";

interface ResearchHubClientProps {
  sources: AuthoritativeSourceDefinition[];
  desks: ResearchDeskState[];
  initialSignals: ResearchSignal[];
  initialBriefs: ResearchBrief[];
}

export function ResearchHubClient({
  sources,
  desks,
  initialSignals,
  initialBriefs,
}: ResearchHubClientProps) {
  const router = useRouter();
  const [signals, setSignals] = useState<ResearchSignal[]>(initialSignals);
  const [briefs, setBriefs] = useState<ResearchBrief[]>(initialBriefs);
  const [activeTab, setActiveTab] = useState<
    "SOURCES_14" | "SIGNALS_FEED" | "DESKS_AND_BRIEFS"
  >("SOURCES_14");
  const [sourceTierFilter, setSourceTierFilter] = useState<string>("ALL");
  const [selectedBrief, setSelectedBrief] = useState<ResearchBrief | null>(
    initialBriefs[0] || null
  );
  const [isSweeping, setIsSweeping] = useState(false);
  const [generatingSignalId, setGeneratingSignalId] = useState<string | null>(
    null
  );
  const [generatingBriefDesk, setGeneratingBriefDesk] = useState<string | null>(
    null
  );
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const filteredSources = sources.filter(
    (s) => sourceTierFilter === "ALL" || s.tier === sourceTierFilter
  );

  const handleRunSignalSweep = async () => {
    setIsSweeping(true);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/research/signals", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.signals) {
        setSignals(data.signals);
        setBannerMessage(
          `Barrido completado en ${data.sweepResult.sourcesChecked} fuentes oficiales · ${data.sweepResult.discoveredCount} señales nuevas procesadas (${data.sweepResult.totalActiveSignals} activas).`
        );
      }
    } finally {
      setIsSweeping(false);
    }
  };

  const handleDraftFromSignal = async (signal: ResearchSignal) => {
    setGeneratingSignalId(signal.id);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: signal.id,
          pillar: signal.pillar,
          contentType: "BLOG_POST",
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setBannerMessage(
          `Artículo generado desde señal de ${signal.sourceName}: "${data.item.title}" (QA: ${data.item.qaScore}/100).`
        );
        router.push("/admin/content");
      }
    } finally {
      setGeneratingSignalId(null);
    }
  };

  const handleGenerateDeskBrief = async (deskSlug: string) => {
    setGeneratingBriefDesk(deskSlug);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/research/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deskSlug,
          timeWindow: "7d",
        }),
      });
      const data = await res.json();
      if (data.success && data.brief) {
        setBriefs((prev) => [data.brief, ...prev]);
        setSelectedBrief(data.brief);
        setBannerMessage(
          `Dossier de Inteligencia generado para ${data.brief.deskName} con fecha de corte ${data.brief.cutoffDate}.`
        );
      }
    } finally {
      setGeneratingBriefDesk(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            FINTERA RESEARCH OS · 14 FUENTES DE AUTORIDAD FINANCIERA
          </span>
          <h1 className="admin-title">
            Inteligencia Financiera y Fuentes Oficiales
          </h1>
          <p className="admin-subtitle">
            Monitorea las 14 fuentes oficiales colombianas, gremiales y
            multilaterales (SFC, BanRep, DANE, FNA, DIAN/RADIAN,
            Supersociedades, Asobancaria, Camacol, Confecámaras, Bancóldex, IFC,
            OCDE, Banco Mundial y FCI) para respaldar el contenido de FINTERA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunSignalSweep}
            disabled={isSweeping}
            className="admin-button admin-button-primary"
          >
            <RefreshCw size={15} className={isSweeping ? "animate-spin" : ""} />
            <span>
              {isSweeping
                ? "Consultando Fuentes Oficiales..."
                : "Ejecutar Barrido de Fuentes (Live Sweep)"}
            </span>
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div className="admin-card flex items-center justify-between border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("SOURCES_14")}
          className={`admin-button ${
            activeTab === "SOURCES_14" ? "admin-button-primary" : ""
          }`}
        >
          <Landmark size={15} />
          <span>14 Fuentes Autorizadas ({sources.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("SIGNALS_FEED")}
          className={`admin-button ${
            activeTab === "SIGNALS_FEED" ? "admin-button-primary" : ""
          }`}
        >
          <Radar size={15} />
          <span>Señales y Tendencias Capturadas ({signals.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("DESKS_AND_BRIEFS")}
          className={`admin-button ${
            activeTab === "DESKS_AND_BRIEFS" ? "admin-button-primary" : ""
          }`}
        >
          <Compass size={15} />
          <span>4 Mesas de Investigación y Dossiers ({briefs.length})</span>
        </button>
      </div>

      {/* TAB 1: 14 AUTHORITATIVE SOURCES CATALOG */}
      {activeTab === "SOURCES_14" && (
        <div className="space-y-4">
          <div className="admin-card flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSourceTierFilter("ALL")}
                className={`admin-button text-xs ${
                  sourceTierFilter === "ALL" ? "admin-button-primary" : ""
                }`}
              >
                Todas las Fuentes (14)
              </button>
              <button
                type="button"
                onClick={() => setSourceTierFilter("OFICIAL_COLOMBIA")}
                className={`admin-button text-xs ${
                  sourceTierFilter === "OFICIAL_COLOMBIA"
                    ? "admin-button-primary"
                    : ""
                }`}
              >
                <Landmark size={13} />
                <span>Oficiales Colombia (6)</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceTierFilter("GREMIAL_SECTORIAL")}
                className={`admin-button text-xs ${
                  sourceTierFilter === "GREMIAL_SECTORIAL"
                    ? "admin-button-primary"
                    : ""
                }`}
              >
                <Building2 size={13} />
                <span>Sectoriales y Gremiales (4)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setSourceTierFilter("MULTILATERAL_INTERNACIONAL")
                }
                className={`admin-button text-xs ${
                  sourceTierFilter === "MULTILATERAL_INTERNACIONAL"
                    ? "admin-button-primary"
                    : ""
                }`}
              >
                <Globe size={13} />
                <span>Internacionales Multilaterales (4)</span>
              </button>
            </div>
            <span className="text-xs text-slate-400">
              Regla Editorial: Separar siempre el dato publicado de la
              interpretación de FINTERA
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredSources.map((src) => (
              <div
                key={src.id}
                className="admin-card flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                        Fuente #{src.number} ·{" "}
                        {src.tier === "OFICIAL_COLOMBIA"
                          ? "Oficial Colombia"
                          : src.tier === "GREMIAL_SECTORIAL"
                          ? "Sectorial / Gremial"
                          : "Multilateral Internacional"}
                      </span>
                      <h3 className="mt-0.5 text-base font-bold text-slate-100">
                        {src.name}
                      </h3>
                    </div>
                    <span className="admin-status admin-status-success shrink-0">
                      Confianza {Math.round(src.credibilityScore * 100)}%
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="rounded border border-slate-800 bg-slate-950/50 p-2.5">
                      <strong className="block text-slate-200">
                        ¿Qué aporta esta fuente?
                      </strong>
                      <p className="mt-1 text-slate-400">
                        {src.whatItProvides}
                      </p>
                    </div>
                    <div className="rounded border border-sky-900/40 bg-sky-950/20 p-2.5">
                      <strong className="block text-sky-300">
                        ¿Cómo la usa FINTERA en su contenido?
                      </strong>
                      <p className="mt-1 text-slate-300">
                        {src.howFinteraUsesIt}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                  <div className="flex flex-wrap gap-1">
                    {src.alignedPillars.map((pKey) => (
                      <span
                        key={pKey}
                        className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                      >
                        {FINTERA_CONTENT_PILLARS[pKey]?.shortLabel}
                      </span>
                    ))}
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-button text-xs"
                  >
                    <ExternalLink size={12} />
                    <span>Portal Oficial</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SIGNALS & TELEMETRY FEED */}
      {activeTab === "SIGNALS_FEED" && (
        <div className="space-y-3">
          {signals.map((sig) => (
            <div key={sig.id} className="admin-card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="admin-status admin-status-info">
                      {sig.sourceName}
                    </span>
                    <span className="text-xs font-semibold text-sky-400">
                      {FINTERA_CONTENT_PILLARS[sig.pillar]?.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      Fecha de corte: {sig.cutoffDate}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-100">
                    {sig.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={sig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-button text-xs"
                  >
                    <ExternalLink size={13} />
                    <span>Ver Fuente</span>
                  </a>
                  <button
                    type="button"
                    disabled={generatingSignalId === sig.id}
                    onClick={() => handleDraftFromSignal(sig)}
                    className="admin-button admin-button-primary text-xs"
                  >
                    <Sparkles size={13} />
                    <span>
                      {generatingSignalId === sig.id
                        ? "Redactando Artículo..."
                        : "Desarrollar Pieza FINTERA"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs">
                  <strong className="text-slate-200">
                    1. Dato Publicado (Hecho Oficial):
                  </strong>
                  <p className="mt-1 text-slate-400">{sig.summary}</p>
                </div>
                <div className="rounded border border-sky-900/40 bg-sky-950/20 p-3 text-xs">
                  <strong className="text-sky-300">
                    2. Interpretación y Criterio Financiero FINTERA:
                  </strong>
                  <p className="mt-1 text-slate-300">{sig.finteraAngle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: 4 RESEARCH DESKS & EVIDENCE-BACKED BRIEFS */}
      {activeTab === "DESKS_AND_BRIEFS" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            {desks.map((desk) => (
              <div key={desk.id} className="admin-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                    Mesa Estratégica FINTERA
                  </span>
                  <span className="admin-status admin-status-success">
                    {desk.activeSignalsCount} señales activas
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {desk.name}
                </h3>
                <p className="text-xs text-slate-400">{desk.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-slate-400">
                    {desk.uniqueSourcesCount} fuentes primarias vinculadas
                  </span>
                  <button
                    type="button"
                    disabled={generatingBriefDesk === desk.slug}
                    onClick={() => handleGenerateDeskBrief(desk.slug)}
                    className="admin-button admin-button-primary text-xs"
                  >
                    <FileSpreadsheet size={13} />
                    <span>
                      {generatingBriefDesk === desk.slug
                        ? "Sintetizando Dossier..."
                        : "Generar Dossier Oficial"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-card lg:col-span-7">
            {selectedBrief ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                      {selectedBrief.deskName} · Fecha de corte:{" "}
                      {selectedBrief.cutoffDate}
                    </span>
                    <select
                      value={selectedBrief.id}
                      onChange={(e) => {
                        const found = briefs.find(
                          (b) => b.id === e.target.value
                        );
                        if (found) setSelectedBrief(found);
                      }}
                      className="admin-input w-auto text-xs"
                    >
                      {briefs.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title.slice(0, 58)}...
                        </option>
                      ))}
                    </select>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-slate-100">
                    {selectedBrief.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {selectedBrief.executiveSummary}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedBrief.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                        {sec.title}
                      </h3>
                      <div className="mt-2">
                        <MarkdownRenderer
                          content={sec.contentMarkdown}
                          variant="dark"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

