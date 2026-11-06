"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  CONTENT_TYPES,
  ContentTypeKey,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
} from "@/lib/content-types";
import type { FinteraContentItem } from "@/lib/blog";
import type { ResearchSignal } from "@/lib/research";

interface PipelineClientProps {
  initialItems: FinteraContentItem[];
  initialSignals: ResearchSignal[];
  sourcesCount: number;
}

export function PipelineClient({
  initialItems,
  initialSignals,
  sourcesCount,
}: PipelineClientProps) {
  const [items, setItems] = useState<FinteraContentItem[]>(initialItems);
  const [signals, setSignals] = useState<ResearchSignal[]>(initialSignals);
  const [selectedPillar, setSelectedPillar] =
    useState<FinteraContentPillarKey>("VIVIENDA_B2C");
  const [selectedFormat, setSelectedFormat] =
    useState<ContentTypeKey>("BLOG_POST");
  const [customTopic, setCustomTopic] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([
    "[FINTERA-OS] Motor de Inteligencia y Redacción Financiera inicializado.",
    `[FUENTES] ${sourcesCount} fuentes oficiales colombianas, gremiales y multilaterales conectadas.`,
    "[QA-GATE] Validador de 8 dimensiones activo (Regla Editorial de FINTERA).",
  ]);

  const appendLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString("es-CO");
    setLogMessages((prev) => [`[${ts}] ${msg}`, ...prev]);
  };

  const handleRunScraper = async () => {
    setIsScraping(true);
    appendLog(
      "Iniciando barrido de señales financieras (SFC, BanRep, DANE, DIAN/RADIAN, OCDE)..."
    );
    try {
      const res = await fetch("/api/admin/research/signals", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.signals) {
        setSignals(data.signals);
        appendLog(
          `✔ Barrido finalizado: ${data.sweepResult.sourcesChecked} fuentes auditadas, ${data.sweepResult.totalActiveSignals} señales en cola.`
        );
      }
    } finally {
      setIsScraping(false);
    }
  };

  const handleRunGenerator = async () => {
    setIsGenerating(true);
    appendLog(
      `Iniciando redacción autónoma (${CONTENT_TYPES[selectedFormat].label} · ${FINTERA_CONTENT_PILLARS[selectedPillar].shortLabel})...`
    );
    try {
      const res = await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillar: selectedPillar,
          contentType: selectedFormat,
          topic: customTopic.trim() || undefined,
          publishImmediately: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => [
          data.item,
          ...prev.filter((i) => i.id !== data.item.id),
        ]);
        setCustomTopic("");
        appendLog(
          `✔ Pieza generada y validada por QA Gate (${data.item.qaScore}/100): "${data.item.title}" [${data.providerUsed}]`
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const avgQaScore = items.length
    ? (
        items.reduce((acc, item) => acc + item.qaScore, 0) / items.length
      ).toFixed(1)
    : "96.0";

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            FINTERA AUTONOMOUS CONTENT & SCRAPING ENGINE
          </span>
          <h1 className="admin-title">
            Motor IA de Scraping Financiero y Redacción Multiformato
          </h1>
          <p className="admin-subtitle">
            Orquesta el agente recolector de señales oficiales (`fintera-trend-scraper`)
            y el generador autónomo de artículos, whitepapers, webinars y
            carruseles de LinkedIn (`fintera-content-agent`) con gobernanza QA
            de 8 dimensiones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/content" className="admin-button">
            <span>Abrir Centro Editorial</span>
          </Link>
          <Link href="/admin/research" className="admin-button">
            <span>Ver 14 Fuentes Oficiales</span>
          </Link>
        </div>
      </div>

      {/* Pipeline KPIs */}
      <div className="admin-kpi-grid">
        <div className="admin-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            Fuentes Autorizadas
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {sourcesCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            6 Oficiales Colombia · 4 Gremiales · 4 Multilaterales
          </p>
        </div>

        <div className="admin-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
            Señales Financieras en Cola
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {signals.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Con fecha de corte y separación Hecho vs. Criterio FINTERA
          </p>
        </div>

        <div className="admin-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Piezas en FINTERA Insights
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {items.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Whitepapers, Webinars, Casos Prácticos, Guías y Artículos
          </p>
        </div>

        <div className="admin-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Promedio QA Gate (8 Dim)
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {avgQaScore}/100
          </p>
          <p className="mt-1 text-xs text-slate-400">
            100% cumplimiento de la Regla Editorial de FINTERA
          </p>
        </div>
      </div>

      {/* Two-Column Action Console */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Agent 1: Trend Scraper + Agent 2: Content Generator */}
        <div className="space-y-4 lg:col-span-7">
          <div className="admin-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radar size={18} className="text-sky-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-100">
                    Agente 1 · FINTERA Financial Trend Scraper
                  </h2>
                  <p className="text-xs text-slate-400">
                    Monitorea actualizaciones de tasas hipotecarias (SFC),
                    inflación/UVR (BanRep), vivienda (DANE/FNA) y facturación
                    RADIAN (DIAN).
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isScraping}
                onClick={handleRunScraper}
                className="admin-button"
              >
                <RefreshCw
                  size={14}
                  className={isScraping ? "animate-spin" : ""}
                />
                <span>
                  {isScraping ? "Ejecutando Scraper..." : "Ejecutar Scraper"}
                </span>
              </button>
            </div>
          </div>

          <div className="admin-card space-y-4">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  Agente 2 · FINTERA Autonomous Content & LinkedIn Drafter
                </h2>
                <p className="text-xs text-slate-400">
                  Sintetiza señales oficiales en piezas multiformato y ejecuta
                  la auditoría automática de 8 dimensiones antes de publicar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  Pilar Estratégico
                </label>
                <select
                  value={selectedPillar}
                  onChange={(e) =>
                    setSelectedPillar(e.target.value as FinteraContentPillarKey)
                  }
                  className="admin-select mt-1 w-full bg-[#0a192f] text-white"
                >
                  {Object.values(FINTERA_CONTENT_PILLARS).map((p) => (
                    <option
                      key={p.key}
                      value={p.key}
                      className="bg-[#0A2342] text-white"
                    >
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200">
                  Formato de Salida
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) =>
                    setSelectedFormat(e.target.value as ContentTypeKey)
                  }
                  className="admin-select mt-1 w-full bg-[#0a192f] text-white"
                >
                  {Object.values(CONTENT_TYPES).map((t) => (
                    <option
                      key={t.key}
                      value={t.key}
                      className="bg-[#0A2342] text-white"
                    >
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Pillar Brand Identity Preview */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0A2342]/60 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FINTERA_CONTENT_PILLARS[selectedPillar].coverImage}
                alt={FINTERA_CONTENT_PILLARS[selectedPillar].shortLabel}
                className="h-12 w-20 shrink-0 rounded border border-slate-700 object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#00C4B3]">
                  {FINTERA_CONTENT_PILLARS[selectedPillar].brandClaim}
                </p>
                <p className="truncate text-[11px] text-slate-300">
                  {FINTERA_CONTENT_PILLARS[selectedPillar].description}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200">
                Tema o Pregunta Financiera Específica (Opcional)
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Ej. Cómo funciona RADIAN en la DIAN y qué papel cumple en la circulación de facturas"
                className="admin-input mt-1 w-full bg-[#0a192f] text-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleRunGenerator}
                className="admin-button admin-button-primary"
              >
                <Sparkles size={15} />
                <span>
                  {isGenerating
                    ? "Generando y Auditando Pieza..."
                    : "Ejecutar Generador Autónomo"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Telemetry Console & Latest Generated Outputs */}
        <div className="space-y-4 lg:col-span-5">
          <div className="admin-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Consola de Ejecución en Vivo
              </span>
              <ShieldCheck size={15} className="text-emerald-400" />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300 space-y-1.5">
              {logMessages.map((msg, idx) => (
                <div key={idx}>{msg}</div>
              ))}
            </div>
          </div>

          <div className="admin-card space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Últimas Piezas Procesadas por el Motor
            </span>
            <div className="space-y-2">
              {items.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-950/50 p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {CONTENT_TYPES[item.contentType]?.label} · QA:{" "}
                      {item.qaScore}/100
                    </p>
                  </div>
                  <Link
                    href={`/insights/${item.slug}`}
                    target="_blank"
                    className="admin-button shrink-0 text-xs"
                  >
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

