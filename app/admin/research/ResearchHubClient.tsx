"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Flame,
  Globe,
  Landmark,
  Mail,
  Radar,
  RefreshCw,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import type {
  AuthoritativeSourceDefinition,
  ResearchBrief,
  ResearchDeskState,
  ResearchSignal,
} from "@/lib/research";
import {
  CONTENT_TYPES,
  FINTERA_CONTENT_PILLARS,
  ContentTypeKey,
  FinteraContentPillarKey,
} from "@/lib/content-types";
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

  // Tab 1 Filters & State (14 Sources)
  const [sourceTierFilter, setSourceTierFilter] = useState<string>("ALL");
  const [sourcePillarFilter, setSourcePillarFilter] = useState<string>("ALL");
  const [sourceSearch, setSourceSearch] = useState<string>("");
  const [sweepingSourceId, setSweepingSourceId] = useState<string | null>(null);

  // Tab 2 Filters & State (Signals Feed)
  const [signalSourceFilter, setSignalSourceFilter] = useState<string>("ALL");
  const [signalPillarFilter, setSignalPillarFilter] = useState<string>("ALL");
  const [signalVelocityFilter, setSignalVelocityFilter] = useState<string>("ALL");
  const [signalStatusFilter, setSignalStatusFilter] = useState<string>("ALL");
  const [signalSearch, setSignalSearch] = useState<string>("");
  const [selectedFormatBySignal, setSelectedFormatBySignal] = useState<
    Record<string, ContentTypeKey>
  >({});
  const [updatingSignalStatusId, setUpdatingSignalStatusId] = useState<
    string | null
  >(null);

  // Tab 3 Filters & State (4 Research Desks & Monthly Dossiers)
  const [selectedBrief, setSelectedBrief] = useState<ResearchBrief | null>(
    initialBriefs[0] || null
  );
  const [deskFilter, setDeskFilter] = useState<string>("ALL");
  const [editionPeriod, setEditionPeriod] = useState<string>("Noviembre 2026");
  const [timeWindow, setTimeWindow] = useState<"24h" | "7d" | "30d">("30d");
  const [isGeneratingAllMonthly, setIsGeneratingAllMonthly] = useState(false);
  const [promotingBriefId, setPromotingBriefId] = useState<string | null>(null);
  const [dossierEmailRecipient, setDossierEmailRecipient] = useState<string>(
    "direccion@finterasoluciones.co"
  );
  const [sendingDossierEmail, setSendingDossierEmail] = useState(false);

  // Shared Actions State
  const [isSweeping, setIsSweeping] = useState(false);
  const [generatingSignalId, setGeneratingSignalId] = useState<string | null>(
    null
  );
  const [generatingBriefDesk, setGeneratingBriefDesk] = useState<string | null>(
    null
  );
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Signal count per authoritative source
  const signalCountBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const src of sources) {
      counts[src.id] = 0;
    }
    for (const sig of signals) {
      counts[sig.sourceId] = (counts[sig.sourceId] || 0) + 1;
    }
    return counts;
  }, [sources, signals]);

  // Filtered Sources (Tab 1)
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      if (sourceTierFilter !== "ALL" && s.tier !== sourceTierFilter) {
        return false;
      }
      if (
        sourcePillarFilter !== "ALL" &&
        !s.alignedPillars.includes(sourcePillarFilter as FinteraContentPillarKey)
      ) {
        return false;
      }
      if (sourceSearch.trim()) {
        const q = sourceSearch.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          s.shortName.toLowerCase().includes(q) ||
          s.whatItProvides.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [sources, sourceTierFilter, sourcePillarFilter, sourceSearch]);

  // Filtered Signals (Tab 2)
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      if (signalSourceFilter !== "ALL" && sig.sourceId !== signalSourceFilter) {
        return false;
      }
      if (signalPillarFilter !== "ALL" && sig.pillar !== signalPillarFilter) {
        return false;
      }
      if (
        signalVelocityFilter !== "ALL" &&
        sig.velocityStatus !== signalVelocityFilter
      ) {
        return false;
      }
      if (
        signalStatusFilter !== "ALL" &&
        sig.processingStatus !== signalStatusFilter
      ) {
        return false;
      }
      if (signalSearch.trim()) {
        const q = signalSearch.toLowerCase();
        const match =
          sig.title.toLowerCase().includes(q) ||
          sig.summary.toLowerCase().includes(q) ||
          sig.sourceName.toLowerCase().includes(q) ||
          sig.finteraAngle.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    signals,
    signalSourceFilter,
    signalPillarFilter,
    signalVelocityFilter,
    signalStatusFilter,
    signalSearch,
  ]);

  // Filtered Briefs (Tab 3)
  const filteredBriefs = useMemo(() => {
    if (deskFilter === "ALL") return briefs;
    return briefs.filter((b) => b.deskSlug === deskFilter);
  }, [briefs, deskFilter]);

  const handleRunSignalSweep = async (targetSourceId?: string) => {
    if (targetSourceId) {
      setSweepingSourceId(targetSourceId);
    } else {
      setIsSweeping(true);
    }
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/research/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          targetSourceId ? { sourceId: targetSourceId } : {}
        ),
      });
      const data = await res.json();
      if (data.success && data.signals) {
        setSignals(data.signals);
        const srcLabel = targetSourceId
          ? sources.find((s) => s.id === targetSourceId)?.shortName ||
            targetSourceId
          : `${data.sweepResult.sourcesChecked} fuentes oficiales`;
        setBannerMessage(
          `Barrido completado en ${srcLabel} · ${data.sweepResult.discoveredCount} señales nuevas procesadas (${data.sweepResult.totalActiveSignals} señales activas en Neon PostgreSQL).`
        );
      }
    } finally {
      setIsSweeping(false);
      setSweepingSourceId(null);
    }
  };

  const handleJumpToSourceSignals = (sourceId: string) => {
    setSignalSourceFilter(sourceId);
    setActiveTab("SIGNALS_FEED");
  };

  const handleToggleSignalStatus = async (signal: ResearchSignal) => {
    setUpdatingSignalStatusId(signal.id);
    const nextStatus: ResearchSignal["processingStatus"] =
      signal.processingStatus === "RAW" ? "DECOMPOSED" : "RAW";
    try {
      const res = await fetch("/api/admin/research/signals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: signal.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success && data.signals) {
        setSignals(data.signals);
        setBannerMessage(
          `Estado de la señal "${signal.title.slice(0, 48)}..." actualizado a ${
            nextStatus === "DECOMPOSED" ? "Procesada (DECOMPOSED)" : "Señal Cruda (RAW)"
          }.`
        );
      }
    } finally {
      setUpdatingSignalStatusId(null);
    }
  };

  const handleDraftFromSignal = async (signal: ResearchSignal) => {
    setGeneratingSignalId(signal.id);
    setBannerMessage(null);
    const chosenFormat = selectedFormatBySignal[signal.id] || "BLOG_POST";
    try {
      const res = await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: signal.id,
          pillar: signal.pillar,
          contentType: chosenFormat,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setBannerMessage(
          `Pieza (${CONTENT_TYPES[chosenFormat].label}) generada desde señal de ${signal.sourceName}: "${data.item.title}" (QA: ${data.item.qaScore}/100).`
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
          timeWindow,
          editionPeriod,
        }),
      });
      const data = await res.json();
      if (data.success && data.brief) {
        if (Array.isArray(data.briefs)) {
          setBriefs(data.briefs);
        } else {
          setBriefs((prev) => [
            data.brief,
            ...prev.filter((b) => b.id !== data.brief.id),
          ]);
        }
        setSelectedBrief(data.brief);
        setDeskFilter("ALL");
        setBannerMessage(
          `Dossier Mensual generado y seleccionado: ${data.brief.title} (Persistido en Neon PostgreSQL).`
        );
      }
    } finally {
      setGeneratingBriefDesk(null);
    }
  };

  const handleGenerateAllMonthlyBriefs = async () => {
    setIsGeneratingAllMonthly(true);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/research/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_ALL_MONTHLY",
          editionPeriod,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.briefs)) {
        setBriefs(data.briefs);
        if (data.generated?.[0]) {
          setSelectedBrief(data.generated[0]);
        } else if (data.briefs[0]) {
          setSelectedBrief(data.briefs[0]);
        }
        setBannerMessage(
          `Lote Mensual Completado: Se generaron y persistieron los ${data.generatedCount} Dossiers de las 4 Mesas para la edición ${editionPeriod}.`
        );
      }
    } finally {
      setIsGeneratingAllMonthly(false);
    }
  };

  const handlePromoteBriefToWhitepaper = async (brief: ResearchBrief) => {
    setPromotingBriefId(brief.id);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/research/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROMOTE_TO_WHITEPAPER",
          briefId: brief.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.whitepaper) {
        setBannerMessage(
          `Dossier publicado exitosamente como Whitepaper en /insights/${data.whitepaper.slug}: "${data.whitepaper.title}".`
        );
      }
    } finally {
      setPromotingBriefId(null);
    }
  };

  const handleSendDossierByEmail = async (brief: ResearchBrief) => {
    if (!dossierEmailRecipient.trim()) return;
    setSendingDossierEmail(true);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/insights/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPATCH_DIGEST",
          recipients: dossierEmailRecipient
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
          title: brief.title,
          excerpt: brief.executiveSummary,
          pillarLabel: FINTERA_CONTENT_PILLARS[brief.pillar]?.label || brief.deskName,
          cutoffDate: brief.cutoffDate,
          url: "https://www.finterasoluciones.co/insights",
          expertMesaNote:
            brief.sections[1]?.contentMarkdown?.slice(0, 260) ||
            brief.executiveSummary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerMessage(
          data.sentCount > 0
            ? `Dossier enviado vía Resend a ${data.sentCount} destinatario(s).`
            : `Dossier encolado en el Outbox Transaccional para envío vía Resend.`
        );
      }
    } finally {
      setSendingDossierEmail(false);
    }
  };

  const handleDownloadBriefMarkdown = (brief: ResearchBrief) => {
    const markdownContent = [
      `# ${brief.title}`,
      "",
      `> ${brief.executiveSummary}`,
      "",
      ...brief.sections.flatMap((sec) => [
        `## ${sec.title}`,
        "",
        sec.contentMarkdown,
        "",
      ]),
    ].join("\n");
    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brief.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            FINTERA RESEARCH OS · 14 FUENTES DE AUTORIDAD FINANCIERA & DOSSIERS MENSUALES
          </span>
          <h1 className="admin-title">
            Inteligencia Financiera, Señales y Dossiers Mensuales
          </h1>
          <p className="admin-subtitle">
            Monitorea las 14 fuentes oficiales colombianas, gremiales y
            multilaterales (SFC, BanRep, DANE, FNA, DIAN/RADIAN,
            Supersociedades, Asobancaria, Camacol, Confecámaras, Bancóldex, IFC,
            OCDE, Banco Mundial y FCI), filtra señales en tiempo real y sintetiza
            Dossiers Mensuales con persistencia en Neon PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleRunSignalSweep()}
            disabled={isSweeping}
            className="admin-button admin-button-primary"
          >
            <RefreshCw size={15} className={isSweeping ? "animate-spin" : ""} />
            <span>
              {isSweeping
                ? "Consultando 14 Fuentes Oficiales..."
                : "Ejecutar Barrido Global (Live Sweep)"}
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
          <div className="admin-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
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
                Mostrando {filteredSources.length} de {sources.length} fuentes ·{" "}
                {signals.length} señales totales
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-800 pt-3 md:grid-cols-12">
              <div className="relative md:col-span-7">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  placeholder="Buscar por entidad (SFC, BanRep, DIAN, RADIAN, OCDE, FCI) o indicador..."
                  className="admin-input pl-9 text-xs"
                />
              </div>
              <div className="md:col-span-5">
                <select
                  value={sourcePillarFilter}
                  onChange={(e) => setSourcePillarFilter(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="ALL">
                    Filtrar por Pilar Estratégico: Todos los 4 Pilares
                  </option>
                  {Object.values(FINTERA_CONTENT_PILLARS).map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredSources.map((src) => {
              const count = signalCountBySource[src.id] || 0;
              const isSweepingThis = sweepingSourceId === src.id;
              return (
                <div
                  key={src.id}
                  className="admin-card flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="admin-status admin-status-info">
                          {count} señal{count === 1 ? "" : "es"}
                        </span>
                        <span className="admin-status admin-status-success shrink-0">
                          Confianza {Math.round(src.credibilityScore * 100)}%
                        </span>
                      </div>
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

                  <div className="space-y-2.5 border-t border-slate-800 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                      <span className="text-[11px] text-emerald-400">
                        ● Monitor Activo · TLS 200 OK
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRunSignalSweep(src.id)}
                          disabled={isSweepingThis || isSweeping}
                          className="admin-button admin-button-primary text-xs"
                        >
                          <RefreshCw
                            size={12}
                            className={isSweepingThis ? "animate-spin" : ""}
                          />
                          <span>
                            {isSweepingThis
                              ? "Barriendo..."
                              : "Barrer Fuente Ahora"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpToSourceSignals(src.id)}
                          className="admin-button text-xs"
                        >
                          <Radar size={12} />
                          <span>Ver Señales ({count})</span>
                        </button>
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SIGNALS & TELEMETRY FEED */}
      {activeTab === "SIGNALS_FEED" && (
        <div className="space-y-4">
          {/* Enterprise Multi-Filter Bar */}
          <div className="admin-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Consola de Filtrado y Orquestación de Señales ({filteredSignals.length} de{" "}
                  {signals.length})
                </span>
              </div>
              {(signalSourceFilter !== "ALL" ||
                signalPillarFilter !== "ALL" ||
                signalVelocityFilter !== "ALL" ||
                signalStatusFilter !== "ALL" ||
                signalSearch.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setSignalSourceFilter("ALL");
                    setSignalPillarFilter("ALL");
                    setSignalVelocityFilter("ALL");
                    setSignalStatusFilter("ALL");
                    setSignalSearch("");
                  }}
                  className="admin-button text-xs"
                >
                  Restablecer Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
              <div className="relative md:col-span-4">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={signalSearch}
                  onChange={(e) => setSignalSearch(e.target.value)}
                  placeholder="Buscar por tema, UVR, RADIAN, tasas, ley..."
                  className="admin-input pl-9 text-xs"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={signalSourceFilter}
                  onChange={(e) => setSignalSourceFilter(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="ALL">Fuente: Todas las 14 Fuentes</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      #{src.number} {src.shortName} (
                      {signalCountBySource[src.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={signalPillarFilter}
                  onChange={(e) => setSignalPillarFilter(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="ALL">Pilar: Todos</option>
                  {Object.values(FINTERA_CONTENT_PILLARS).map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.shortLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <select
                  value={signalVelocityFilter}
                  onChange={(e) => setSignalVelocityFilter(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="ALL">Velocidad</option>
                  <option value="HIGH_VELOCITY">Alta (≥85)</option>
                  <option value="EMERGING">Emergente</option>
                  <option value="STABLE">Estable</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={signalStatusFilter}
                  onChange={(e) => setSignalStatusFilter(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="ALL">Estado: Todos</option>
                  <option value="RAW">Señal Cruda (RAW)</option>
                  <option value="DECOMPOSED">Procesada en Pieza</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSignals.map((sig) => {
              const selectedFormat =
                selectedFormatBySignal[sig.id] || "BLOG_POST";
              return (
                <div key={sig.id} className="admin-card space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="admin-status admin-status-info">
                          {sig.sourceName}
                        </span>
                        <span className="text-xs font-semibold text-sky-400">
                          {FINTERA_CONTENT_PILLARS[sig.pillar]?.label}
                        </span>
                        <span
                          className={`admin-status ${
                            sig.velocityScore >= 85
                              ? "admin-status-success"
                              : "admin-status-warning"
                          }`}
                        >
                          <Flame size={11} className="mr-1 inline" />
                          Velocidad {sig.velocityScore}/100 · Novedad{" "}
                          {Math.round(sig.noveltyScore * 100)}%
                        </span>
                        <span
                          className={`admin-status ${
                            sig.processingStatus === "DECOMPOSED"
                              ? "admin-status-success"
                              : "admin-status-neutral"
                          }`}
                        >
                          {sig.processingStatus === "DECOMPOSED"
                            ? "✔ Procesada Editorialmente"
                            : "● Señal Cruda (RAW)"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Corte: {sig.cutoffDate}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100">
                        {sig.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={updatingSignalStatusId === sig.id}
                        onClick={() => handleToggleSignalStatus(sig)}
                        className="admin-button text-xs"
                      >
                        {sig.processingStatus === "RAW"
                          ? "Marcar Procesada"
                          : "Reabrir como RAW"}
                      </button>

                      <a
                        href={sig.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-button text-xs"
                      >
                        <ExternalLink size={13} />
                        <span>Ver Fuente</span>
                      </a>

                      <select
                        value={selectedFormat}
                        onChange={(e) =>
                          setSelectedFormatBySignal((prev) => ({
                            ...prev,
                            [sig.id]: e.target.value as ContentTypeKey,
                          }))
                        }
                        className="admin-input w-auto py-1.5 text-xs"
                      >
                        {Object.values(CONTENT_TYPES).map((fmt) => (
                          <option key={fmt.key} value={fmt.key}>
                            Formato: {fmt.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={generatingSignalId === sig.id}
                        onClick={() => handleDraftFromSignal(sig)}
                        className="admin-button admin-button-primary text-xs"
                      >
                        <Sparkles size={13} />
                        <span>
                          {generatingSignalId === sig.id
                            ? "Redactando Pieza..."
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
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 4 RESEARCH DESKS & MONTHLY EVIDENCE-BACKED DOSSIERS */}
      {activeTab === "DESKS_AND_BRIEFS" && (
        <div className="space-y-4">
          {/* Enterprise Monthly Scheduler & Batch Controls Bar */}
          <div className="admin-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CalendarClock size={18} className="text-sky-400" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Motor de Dossiers Mensuales Automatizados · Homelab Systemd Timer + Neon PostgreSQL
                  </span>
                  <p className="text-xs text-slate-300">
                    Programación automática:{" "}
                    <strong>Día 1 de cada mes a las 06:00 COT</strong> (
                    <code>fintera-monthly-dossier.timer</code>) · Sintetiza las 4
                    Mesas de Investigación en informes ejecutivos auditables y
                    publicables como Whitepapers.
                  </p>
                </div>
              </div>

              <span className="admin-status admin-status-success">
                ● Scheduler Mensual Activo ({briefs.length} Dossiers en Historial)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-800 pt-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Edición / Corte Mensual
                </label>
                <select
                  value={editionPeriod}
                  onChange={(e) => setEditionPeriod(e.target.value)}
                  className="admin-input text-xs"
                >
                  <option value="Noviembre 2026">Edición Noviembre 2026</option>
                  <option value="Diciembre 2026">Edición Diciembre 2026</option>
                  <option value="Octubre 2026">Edición Octubre 2026</option>
                  <option value="Cierre Anual 2026">
                    Edición Especial · Cierre Anual 2026
                  </option>
                  <option value="Enero 2027">Edición Enero 2027</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Ventana de Síntesis
                </label>
                <select
                  value={timeWindow}
                  onChange={(e) =>
                    setTimeWindow(e.target.value as "24h" | "7d" | "30d")
                  }
                  className="admin-input text-xs"
                >
                  <option value="30d">30 Días · Informe Mensual Consolidado</option>
                  <option value="7d">7 Días · Corte Semanal Táctico</option>
                  <option value="24h">24 Horas · Boletín Flash Regulatorio</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Filtrar Dossiers por Mesa
                </label>
                <select
                  value={deskFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDeskFilter(val);
                    const nextList =
                      val === "ALL"
                        ? briefs
                        : briefs.filter((b) => b.deskSlug === val);
                    if (nextList[0]) setSelectedBrief(nextList[0]);
                  }}
                  className="admin-input text-xs"
                >
                  <option value="ALL">
                    Todas las 4 Mesas ({briefs.length} Dossiers)
                  </option>
                  {desks.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} (
                      {briefs.filter((b) => b.deskSlug === d.slug).length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end md:col-span-3">
                <button
                  type="button"
                  disabled={isGeneratingAllMonthly}
                  onClick={handleGenerateAllMonthlyBriefs}
                  className="admin-button admin-button-primary w-full justify-center text-xs"
                >
                  <Sparkles size={14} />
                  <span>
                    {isGeneratingAllMonthly
                      ? "Sintetizando 4 Mesas..."
                      : `Generar los 4 Dossiers (${editionPeriod})`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left Column: 4 Strategic Research Desks */}
            <div className="space-y-3 lg:col-span-5">
              {desks.map((desk) => {
                const deskBriefsCount = briefs.filter(
                  (b) => b.deskSlug === desk.slug
                ).length;
                return (
                  <div key={desk.id} className="admin-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                        Mesa Estratégica FINTERA
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="admin-status admin-status-info">
                          {deskBriefsCount} Dossier{deskBriefsCount === 1 ? "" : "s"}
                        </span>
                        <span className="admin-status admin-status-success">
                          {desk.activeSignalsCount} señales
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {desk.name}
                    </h3>
                    <p className="text-xs text-slate-400">{desk.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDeskFilter(desk.slug);
                          const firstForDesk = briefs.find(
                            (b) => b.deskSlug === desk.slug
                          );
                          if (firstForDesk) setSelectedBrief(firstForDesk);
                        }}
                        className="admin-button text-xs"
                      >
                        Ver Historial ({deskBriefsCount})
                      </button>
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
                            : `Generar Dossier (${editionPeriod})`}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Active Dossier Inspector & Publisher */}
            <div className="admin-card lg:col-span-7">
              {selectedBrief ? (
                <div className="space-y-4">
                  <div className="space-y-3 border-b border-slate-800 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="admin-status admin-status-info">
                          Edición: {selectedBrief.editionPeriod || selectedBrief.cutoffDate}
                        </span>
                        <span className="admin-status admin-status-success">
                          Versión v{selectedBrief.versionNumber || 1}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                          {selectedBrief.deskName}
                        </span>
                      </div>
                    </div>

                    {/* Full-width Unambiguous Dossier Selector */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Seleccionar Dossier del Repositorio ({filteredBriefs.length}{" "}
                        disponibles):
                      </label>
                      <select
                        value={selectedBrief.id}
                        onChange={(e) => {
                          const found = briefs.find(
                            (b) => b.id === e.target.value
                          );
                          if (found) setSelectedBrief(found);
                        }}
                        className="admin-input w-full text-xs font-semibold"
                      >
                        {filteredBriefs.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} · (Generado:{" "}
                            {new Date(b.generatedAt).toLocaleDateString("es-CO")}
                            )
                          </option>
                        ))}
                      </select>
                    </div>

                    <h2 className="text-lg font-bold text-slate-100">
                      {selectedBrief.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {selectedBrief.executiveSummary}
                    </p>

                    {/* Executive Action Bar: Promote to Whitepaper, Email via Resend, Download Markdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={promotingBriefId === selectedBrief.id}
                          onClick={() =>
                            handlePromoteBriefToWhitepaper(selectedBrief)
                          }
                          className="admin-button admin-button-primary text-xs"
                        >
                          <Sparkles size={13} />
                          <span>
                            {promotingBriefId === selectedBrief.id
                              ? "Publicando Whitepaper..."
                              : "Publicar como Whitepaper en /insights"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadBriefMarkdown(selectedBrief)
                          }
                          className="admin-button text-xs"
                        >
                          <Download size={13} />
                          <span>Descargar (.md)</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          type="text"
                          value={dossierEmailRecipient}
                          onChange={(e) =>
                            setDossierEmailRecipient(e.target.value)
                          }
                          placeholder="correo@empresa.co"
                          className="admin-input w-48 py-1 text-xs"
                        />
                        <button
                          type="button"
                          disabled={sendingDossierEmail}
                          onClick={() => handleSendDossierByEmail(selectedBrief)}
                          className="admin-button text-xs"
                        >
                          <Mail size={13} />
                          <span>
                            {sendingDossierEmail
                              ? "Enviando..."
                              : "Enviar por Resend"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verified Citations Matrix */}
                  {(selectedBrief.sections[0]?.citations?.length || 0) > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                        Matriz de Evidencia Primaria (
                        {selectedBrief.metrics.totalClaimsCited} Afirmaciones Verificadas ·{" "}
                        {selectedBrief.metrics.uniqueSourcesCited} Fuentes Oficiales)
                      </h3>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {selectedBrief.sections[0].citations
                          .slice(0, 4)
                          .map((cit) => (
                            <div
                              key={cit.claimId}
                              className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <strong className="text-slate-100">
                                  {cit.sourceName}
                                </strong>
                                <a
                                  href={cit.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                                >
                                  <span>Corte: {cit.cutoffDate}</span>
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                              <p className="mt-1.5 text-slate-400">
                                {cit.claimStatement}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Dossier Sections */}
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

                  {/* Verified Governance Footer */}
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-300">
                      <Send size={13} />
                      <span>
                        Certificación Editorial & E-E-A-T ({selectedBrief.author})
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-200">
                      Dossier verificado con separación estricta entre dato
                      publicado e interpretación de FINTERA · Índice de frescura:{" "}
                      {selectedBrief.metrics.freshnessScore}/100.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
