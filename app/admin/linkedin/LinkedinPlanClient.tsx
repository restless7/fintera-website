"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  FileDown,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import {
  FINTERA_90_DAY_PHASES,
  FINTERA_CONVERSION_FUNNEL,
  FINTERA_EDITORIAL_COMPLIANCE_RULES,
  FINTERA_LINKEDIN_PROFILE_SPEC,
  FINTERA_MONTH_1_CALENDAR,
  FINTERA_TARGET_NETWORK,
  FINTERA_WEEKLY_ROUTINE,
  LinkedinCalendarPostSpec,
} from "@/lib/linkedin-strategy";
import type { FinteraContentItem } from "@/lib/blog";
import { LinkedinCarouselPdfModal } from "@/components/fintera/growth/LinkedinCarouselPdfModal";
import { MarkdownRenderer } from "@/components/fintera/markdown-renderer";

interface LinkedinPlanClientProps {
  existingItems: FinteraContentItem[];
}

export function LinkedinPlanClient({ existingItems }: LinkedinPlanClientProps) {
  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | 4>(1);
  const [developingSlotId, setDevelopingSlotId] = useState<string | null>(null);
  const [generatedSlotItems, setGeneratedSlotItems] = useState<
    Record<string, FinteraContentItem>
  >({});
  const [copiedProfileField, setCopiedProfileField] = useState<string | null>(
    null
  );
  const [utmCampaign, setUtmCampaign] = useState("vivienda_oct2026");
  const [utmTarget, setUtmTarget] = useState("/simulador");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [carouselModalItem, setCarouselModalItem] =
    useState<FinteraContentItem | null>(null);

  const weekPosts = FINTERA_MONTH_1_CALENDAR.filter(
    (p) => p.week === selectedWeek
  );

  const handleCopyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedProfileField(label);
      setTimeout(() => setCopiedProfileField(null), 2500);
    } catch {
      // Clipboard API fallback ignored
    }
  };

  const handleDevelopCalendarPost = async (slot: LinkedinCalendarPostSpec) => {
    setDevelopingSlotId(slot.id);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarPostId: slot.id,
          pillar: slot.pillar,
          contentType: slot.contentType,
          topic: slot.title,
          publishImmediately: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setGeneratedSlotItems((prev) => ({
          ...prev,
          [slot.id]: data.item,
        }));
        setStatusMessage(
          `Publicación desarrollada y aprobada por QA Gate (${data.item.qaScore}/100): "${data.item.title}"`
        );
      }
    } finally {
      setDevelopingSlotId(null);
    }
  };

  const computedUtmUrl = `https://www.finterasoluciones.co${utmTarget}?utm_source=linkedin&utm_medium=organic&utm_campaign=${encodeURIComponent(
    utmCampaign || "posicionamiento_90d"
  )}`;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            PLAN ESTRATÉGICO DE POSICIONAMIENTO EN LINKEDIN · 90 DÍAS (OCTUBRE
            2026 – ENERO 2027)
          </span>
          <h1 className="admin-title">
            Posicionamiento de Marca FINTERA en LinkedIn · Mercado Colombiano
          </h1>
          <p className="admin-subtitle">
            Construye una marca que genere confianza, demuestre criterio
            financiero y convierta el conocimiento en oportunidades comerciales
            para crédito de vivienda (B2C) y liquidez empresarial / factoring
            (B2B).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/content" className="admin-button">
            <span>Ir al Centro Editorial ({existingItems.length})</span>
          </Link>
          <Link
            href="/insights"
            target="_blank"
            className="admin-button admin-button-primary"
          >
            <ExternalLink size={15} />
            <span>Ver FINTERA Insights</span>
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="admin-card flex items-center justify-between border-sky-500/40 bg-sky-950/30 px-4 py-3 text-sm text-sky-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-sky-400" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* SECCIÓN 1 & 3: Posicionamiento Central y Optimización del Perfil de Empresa */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="admin-card space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Sección 1 y 3 · Identidad y Página de Empresa en LinkedIn
              </span>
              <h2 className="mt-1 text-base font-bold text-slate-100">
                {FINTERA_LINKEDIN_PROFILE_SPEC.brandName} ·{" "}
                {FINTERA_LINKEDIN_PROFILE_SPEC.centralClaim}
              </h2>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  "perfil_completo",
                  `${FINTERA_LINKEDIN_PROFILE_SPEC.companyHeadline}\n\n${FINTERA_LINKEDIN_PROFILE_SPEC.companyDescription}`
                )
              }
              className="admin-button text-xs"
            >
              <ClipboardCopy size={13} />
              <span>
                {copiedProfileField === "perfil_completo"
                  ? "¡Propuesta copiada!"
                  : "Copiar propuesta de perfil"}
              </span>
            </button>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Titular sugerido de la empresa en LinkedIn
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    "titular",
                    FINTERA_LINKEDIN_PROFILE_SPEC.companyHeadline
                  )
                }
                className="text-xs text-sky-400 hover:underline"
              >
                {copiedProfileField === "titular" ? "Copiado" : "Copiar titular"}
              </button>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {FINTERA_LINKEDIN_PROFILE_SPEC.companyHeadline}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Descripción sugerida de la página corporativa
            </span>
            <div className="mt-2">
              <MarkdownRenderer
                content={FINTERA_LINKEDIN_PROFILE_SPEC.companyDescription}
                variant="dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {FINTERA_LINKEDIN_PROFILE_SPEC.attributes.map((attr) => (
              <div
                key={attr.name}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <p className="text-xs font-bold text-sky-300">{attr.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {attr.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Audiencias B2C y B2B + Alerta de Consistencia Web */}
        <div className="space-y-4 lg:col-span-5">
          <div className="admin-card space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Doble Audiencia y Red de Contactos Objetivo
            </span>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-xs font-bold text-sky-300">
                Línea 1 · Crédito de vivienda para personas (Audiencia B2C)
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-300">
                {FINTERA_TARGET_NETWORK.b2cVivienda.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-xs font-bold text-teal-300">
                Línea 2 · Liquidez empresarial y factoring (Audiencia B2B)
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-300">
                {FINTERA_TARGET_NETWORK.b2bFactoring.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="admin-card border-amber-500/40 bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldAlert size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Verificación de Consistencia Web y Portafolio
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              La comunicación distingue claramente las soluciones activas
              (Crédito de vivienda, libre inversión, vehículo y libranza) de las
              soluciones en estructuración con aliados (Factoring). El QA Gate
              bloquea cualquier afirmación de &ldquo;aprobación
              garantizada&rdquo; o &ldquo;liquidez garantizada&rdquo;.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2 & 10: Objetivos 90 Días (30/60/90) y Cronograma de FINTERA Insights */}
      <div className="admin-card space-y-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            Sección 2 y 10 · Objetivos para los Primeros 90 Días y Lanzamiento de
            Piezas Insignia
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FINTERA_90_DAY_PHASES.map((phase) => (
            <div
              key={phase.period}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2"
            >
              <span className="admin-status admin-status-info">
                {phase.period}
              </span>
              <h3 className="text-sm font-bold text-slate-100">
                {phase.title}
              </h3>
              <p className="text-xs text-slate-400">{phase.expectedResult}</p>
              <div className="border-t border-slate-800 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                  Hitos de FINTERA Insights:
                </span>
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {phase.insightMilestones.map((m) => (
                    <li key={m}>• {m}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 5: Calendario Editorial Interactivo del Primer Mes (Semanas 1 a 4 · Lunes a Jueves) */}
      <div className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={17} className="text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Sección 5 · Calendario Editorial Interactivo: Primer Mes (4
                Publicaciones / Semana)
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona una semana y haz clic en &ldquo;Desarrollar esta
                publicación&rdquo; para redactar el borrador completo con
                fuentes oficiales y validación QA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {([1, 2, 3, 4] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWeek(w)}
                className={`admin-button text-xs ${
                  selectedWeek === w ? "admin-button-primary" : ""
                }`}
              >
                Semana {w}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {weekPosts.map((slot) => {
            const generatedItem = generatedSlotItems[slot.id];
            const isDeveloping = developingSlotId === slot.id;
            return (
              <div
                key={slot.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {slot.day}
                    </span>
                    <span className="admin-status admin-status-info">
                      {slot.categoryBadge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold leading-snug text-slate-100">
                    {slot.title}
                  </h3>

                  <p className="text-xs font-medium text-sky-400">
                    Formato: {slot.format}
                  </p>
                  <p className="text-xs text-slate-400">{slot.objective}</p>

                  <div className="pt-1">
                    <span className="block text-[11px] font-semibold text-slate-400">
                      Fuentes primarias:
                    </span>
                    <p className="text-[11px] text-slate-300">
                      {slot.primarySources.join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  {generatedItem ? (
                    <div className="space-y-2">
                      <div className="rounded bg-emerald-950/40 px-2.5 py-1.5 text-xs text-emerald-300">
                        ✔ Desarrollada · QA: {generatedItem.qaScore}/100
                      </div>
                      <Link
                        href={`/insights/${generatedItem.slug}`}
                        target="_blank"
                        className="admin-button w-full justify-center text-xs"
                      >
                        <ExternalLink size={12} />
                        <span>Ver publicación generada</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setCarouselModalItem(generatedItem)}
                        className="admin-button w-full justify-center text-xs border-[#FFD447]/60 text-[#FFD447]"
                      >
                        <FileDown size={12} />
                        <span>Exportar Carrusel PDF (1080×1350)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={isDeveloping}
                        onClick={() => handleDevelopCalendarPost(slot)}
                        className="admin-button admin-button-primary w-full justify-center text-xs"
                      >
                        <Sparkles size={13} />
                        <span>
                          {isDeveloping
                            ? "Desarrollando..."
                            : "Desarrollar esta publicación"}
                        </span>
                      </button>
                      {existingItems[0] && (
                        <button
                          type="button"
                          onClick={() =>
                            setCarouselModalItem({
                              ...existingItems[0],
                              title: slot.title,
                              subtitle: slot.objective,
                              excerpt: slot.objective,
                              pillar: slot.pillar,
                              contentType: slot.contentType,
                              content: slot.draftOutlineMarkdown,
                            })
                          }
                          className="admin-button w-full justify-center text-xs"
                        >
                          <FileDown size={12} />
                          <span>Vista Previa Carrusel PDF</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 6 & 7: Rutina Semanal (Lunes a Viernes) y Embudo de Conversión con Constructor UTM */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="admin-card space-y-3 lg:col-span-7">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Sección 6 · Rutina Semanal de Crecimiento y Posicionamiento (Lunes
              a Viernes)
            </h2>
          </div>

          <div className="space-y-2">
            {FINTERA_WEEKLY_ROUTINE.map((r) => (
              <div
                key={r.day}
                className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="sm:w-48">
                  <span className="text-xs font-bold text-sky-300">
                    {r.day}
                  </span>
                  <span className="block text-xs font-medium text-slate-200">
                    {r.focus}
                  </span>
                </div>
                <p className="flex-1 text-xs text-slate-400">{r.action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card space-y-4 lg:col-span-5">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Sección 7 · Embudo de Conversión y Constructor de Enlaces UTM
            </h2>
          </div>

          <ol className="space-y-2 text-xs">
            {FINTERA_CONVERSION_FUNNEL.map((step) => (
              <li
                key={step.step}
                className="rounded border border-slate-800 bg-slate-950/50 p-2.5"
              >
                <strong className="text-sky-300">
                  Paso {step.step} · {step.stage}:
                </strong>{" "}
                <span className="text-slate-300">{step.description}</span>
              </li>
            ))}
          </ol>

          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Generador de Enlaces con Parámetros UTM para LinkedIn
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={utmTarget}
                onChange={(e) => setUtmTarget(e.target.value)}
                aria-label="Página de destino"
                className="admin-select text-xs bg-[#0a192f] text-white"
              >
                <option value="/simulador" className="bg-[#0A2342] text-white">
                  /simulador (Vivienda B2C + Factoring B2B)
                </option>
                <option value="/aliados" className="bg-[#0A2342] text-white">
                  /aliados (Portal de Aliados B2B2C)
                </option>
                <option
                  value="/credit-request"
                  className="bg-[#0A2342] text-white"
                >
                  /credit-request (Solicitud Crédito)
                </option>
                <option value="/contacto" className="bg-[#0A2342] text-white">
                  /contacto (Empresas / B2B)
                </option>
                <option value="/insights" className="bg-[#0A2342] text-white">
                  /insights (FINTERA Insights)
                </option>
              </select>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="utm_campaign"
                className="admin-input text-xs bg-[#0a192f] text-white"
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900 p-2 text-[11px] text-sky-300">
              <span className="truncate">{computedUtmUrl}</span>
              <button
                type="button"
                onClick={() => handleCopyText("utm", computedUtmUrl)}
                className="shrink-0 font-semibold text-white hover:underline"
              >
                {copiedProfileField === "utm" ? "¡Copiado!" : "Copiar URL"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 8 & 9: Indicadores Clave de Desempeño (KPIs) y Reglas de Cumplimiento */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="admin-card space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            Sección 8 · Métricas de Alcance
          </span>
          <h3 className="text-sm font-bold text-slate-100">
            Visibilidad en Audiencia Objetivo
          </h3>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>• Impresiones por publicación (Meta: 3–4 posts/semana)</li>
            <li>• Crecimiento de seguidores relevantes en Colombia</li>
            <li>• Visitas a la página corporativa de FINTERA en LinkedIn</li>
          </ul>
        </div>

        <div className="admin-card space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
            Sección 8 · Métricas de Confianza
          </span>
          <h3 className="text-sm font-bold text-slate-100">
            Interacción y Autoridad Financiera
          </h3>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>• Tasa de interacción por formato (Carrusel, Caso numérico)</li>
            <li>• Comentarios calificados y publicaciones guardadas</li>
            <li>• Descargas de Whitepapers y registros a Webinars</li>
          </ul>
        </div>

        <div className="admin-card space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Sección 8 · Métricas de Negocio
          </span>
          <h3 className="text-sm font-bold text-slate-100">
            Conversión Comercial hacia el CRM
          </h3>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>• Clics al sitio web con parámetros UTM (`utm_source=linkedin`)</li>
            <li>• Consultas recibidas por mensaje directo y formularios</li>
            <li>• Solicitudes de crédito de vivienda y diagnósticos B2B</li>
          </ul>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="text-sm font-semibold text-slate-100">
          Sección 9 · Reglas de Oro y Errores que FINTERA Evita Sistemáticamente
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {FINTERA_EDITORIAL_COMPLIANCE_RULES.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
            >
              <p className="text-xs font-semibold text-sky-300">{rule.title}</p>
              <p className="mt-1 text-xs text-slate-400">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

      {carouselModalItem && (
        <LinkedinCarouselPdfModal
          item={carouselModalItem}
          onClose={() => setCarouselModalItem(null)}
        />
      )}
    </div>
  );
}

