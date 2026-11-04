"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCopy,
  Edit3,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  CONTENT_TYPES,
  ContentTypeKey,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
} from "@/lib/content-types";
import type { FinteraContentItem } from "@/lib/blog";
import { FINTERA_EDITORIAL_COMPLIANCE_RULES } from "@/lib/linkedin-strategy";

interface ContentHubClientProps {
  initialItems: FinteraContentItem[];
}

export function ContentHubClient({ initialItems }: ContentHubClientProps) {
  const [items, setItems] = useState<FinteraContentItem[]>(initialItems);
  const [selectedPillar, setSelectedPillar] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeItem, setActiveItem] = useState<FinteraContentItem | null>(
    initialItems[0] || null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [copiedLinkedin, setCopiedLinkedin] = useState(false);

  // Live edit mode state for active item
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCutoffDate, setEditCutoffDate] = useState("");
  const [editContent, setEditContent] = useState("");

  // Create / Quick-generate modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPillar, setNewPillar] =
    useState<FinteraContentPillarKey>("VIVIENDA_B2C");
  const [newType, setNewType] = useState<ContentTypeKey>("BLOG_POST");
  const [newContent, setNewContent] = useState("");

  const filteredItems = items.filter((item) => {
    if (selectedPillar !== "ALL" && item.pillar !== selectedPillar) return false;
    if (selectedType !== "ALL" && item.contentType !== selectedType)
      return false;
    if (selectedStatus !== "ALL" && item.status !== selectedStatus)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const startEditingActive = (item: FinteraContentItem) => {
    setEditTitle(item.title);
    setEditCutoffDate(item.cutoffDate);
    setEditContent(item.content);
    setIsEditingActive(true);
  };

  const handleSaveActiveEdit = async () => {
    if (!activeItem || !editTitle.trim() || !editContent.trim()) return;
    setIsSaving(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...activeItem,
          title: editTitle,
          cutoffDate: editCutoffDate || "Octubre 2026",
          content: editContent,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === data.item.id ? data.item : i))
        );
        setActiveItem(data.item);
        setIsEditingActive(false);
        setFeedbackBanner(
          `Cambios guardados y re-evaluados por QA Gate (${data.item.qaScore}/100).`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const buildLinkedinCopyForItem = (item: FinteraContentItem): string => {
    const pillarCfg = FINTERA_CONTENT_PILLARS[item.pillar];
    const typeCfg = CONTENT_TYPES[item.contentType];
    const utmUrl = `https://www.finterasoluciones.co/insights/${item.slug}?utm_source=linkedin&utm_medium=organic&utm_campaign=${item.pillar.toLowerCase()}`;
    return `${item.title}

${item.excerpt}

Puntos clave de nuestro ${typeCfg.label.toLowerCase()} (Fecha de corte de datos oficiales: ${item.cutoffDate}):
• Criterio financiero: Separamos el dato estadístico oficial de la recomendación práctica para tu flujo de caja.
• Acompañamiento: Evaluamos cada caso según capacidad de pago, condiciones reales o validación en RADIAN.
• Transparencia: Explicamos costos efectivos, seguros, plazos y requisitos sin promesas engañosas.

Lee el análisis completo en FINTERA Insights:
${utmUrl}

¿Deseas evaluar tu necesidad de financiación? ${pillarCfg.defaultCtaLabel}:
https://www.finterasoluciones.co${pillarCfg.defaultCtaUrl}

*Nota: Por tu seguridad financiera (Ley 1581 Habeas Data), nunca compartas datos confidenciales en comentarios públicos.*

#FINTERA #SolucionesFinancieras #Colombia #CreditoDeVivienda #Factoring #CriterioFinanciero`;
  };

  const handleCopyLinkedinPost = async (item: FinteraContentItem) => {
    try {
      await navigator.clipboard.writeText(buildLinkedinCopyForItem(item));
      setCopiedLinkedin(true);
      setTimeout(() => setCopiedLinkedin(false), 2500);
    } catch {
      // Safe fallback
    }
  };

  const handleGenerateAiDraft = async (
    pillarOverride?: FinteraContentPillarKey,
    typeOverride?: ContentTypeKey,
    topicOverride?: string
  ) => {
    setIsGenerating(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillar: pillarOverride || newPillar,
          contentType: typeOverride || newType,
          topic: topicOverride || newTitle || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => [
          data.item,
          ...prev.filter((i) => i.id !== data.item.id),
        ]);
        setActiveItem(data.item);
        setShowCreateModal(false);
        setNewTitle("");
        setFeedbackBanner(
          `Pieza generada con éxito ("${data.item.title}") · Puntaje QA FINTERA: ${data.item.qaScore}/100`
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSaving(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          pillar: newPillar,
          contentType: newType,
          status: "DRAFT",
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => [
          data.item,
          ...prev.filter((i) => i.id !== data.item.id),
        ]);
        setActiveItem(data.item);
        setShowCreateModal(false);
        setNewTitle("");
        setNewContent("");
        setFeedbackBanner(
          `Pieza guardada y evaluada por QA Gate (${data.item.qaScore}/100).`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemediateItem = async (id: string) => {
    setIsRemediating(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "remediate" }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === data.item.id ? data.item : i))
        );
        setActiveItem(data.item);
        setFeedbackBanner(
          `Auto-remediación FINTERA aplicada: puntaje subió de ${data.previousScore} a ${data.newScore}/100.`
        );
      }
    } finally {
      setIsRemediating(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    status: FinteraContentItem["status"]
  ) => {
    setIsSaving(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === data.item.id ? data.item : i))
        );
        setActiveItem(data.item);
        setFeedbackBanner(
          `Estado actualizado a ${data.item.status} para "${data.item.title}".`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalCount = items.length || 1;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            FINTERA INSIGHTS · CENTRO EDITORIAL Y GOBERNANZA QA
          </span>
          <h1 className="admin-title">
            Centro Editorial Multiformato y Posicionamiento
          </h1>
          <p className="admin-subtitle">
            Gestiona artículos, whitepapers, webinars, casos prácticos numéricos
            y carruseles para LinkedIn bajo la Regla Editorial de FINTERA
            (fuentes oficiales con fecha de corte, transparencia y cero promesas
            de aprobación sin evaluación).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/insights" target="_blank" className="admin-button">
            <ExternalLink size={15} />
            <span>Ver Portal FINTERA Insights</span>
          </Link>
          <button
            type="button"
            onClick={() => handleGenerateAiDraft()}
            disabled={isGenerating}
            className="admin-button"
          >
            <Sparkles size={15} />
            <span>
              {isGenerating
                ? "Redactando con Criterio FINTERA..."
                : "Redactar Pieza con IA"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="admin-button admin-button-primary"
          >
            <Plus size={15} />
            <span>Nueva Pieza / Formato</span>
          </button>
        </div>
      </div>

      {feedbackBanner && (
        <div className="admin-card flex items-center justify-between border-sky-500/40 bg-sky-950/30 px-4 py-3 text-sm text-sky-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-sky-400" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 4 Content Pillars Balance Tracker */}
      <div className="admin-kpi-grid">
        {Object.values(FINTERA_CONTENT_PILLARS).map((pillar) => {
          const count = items.filter((i) => i.pillar === pillar.key).length;
          const actualPct = Math.round((count / totalCount) * 100);
          return (
            <button
              key={pillar.key}
              type="button"
              onClick={() =>
                setSelectedPillar(
                  selectedPillar === pillar.key ? "ALL" : pillar.key
                )
              }
              className={`admin-card text-left transition ${
                selectedPillar === pillar.key
                  ? "ring-2 ring-sky-400"
                  : "hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  Pilar {pillar.number} · Meta {pillar.targetPercentage}%
                </span>
                <span className="admin-status admin-status-info">
                  {count} piezas ({actualPct}%)
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {pillar.label.replace(/^Pilar \d+ · /, "")}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                {pillar.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters bar */}
      <div className="admin-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filtrar por formato"
            className="admin-input w-auto"
          >
            <option value="ALL">Todos los formatos ({items.length})</option>
            {Object.values(CONTENT_TYPES).map((t) => (
              <option key={t.key} value={t.key}>
                {t.pluralLabel}
              </option>
            ))}
          </select>

          <select
            value={selectedPillar}
            onChange={(e) => setSelectedPillar(e.target.value)}
            aria-label="Filtrar por pilar editorial"
            className="admin-input w-auto"
          >
            <option value="ALL">Todos los pilares estratégicos</option>
            {Object.values(FINTERA_CONTENT_PILLARS).map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por estado"
            className="admin-input w-auto"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PUBLISHED">Publicados (PUBLISHED)</option>
            <option value="DRAFT">Borradores (DRAFT)</option>
            <option value="SCHEDULED">Programados (SCHEDULED)</option>
          </select>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por título, RADIAN, UVR, Superfinanciera..."
          className="admin-input max-w-xs"
        />
      </div>

      {/* Master-Detail Split: Content Table + QA Gate & Content Inspector */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="admin-card lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              Repositorio FINTERA Insights ({filteredItems.length})
            </h2>
            <span className="text-xs text-slate-400">
              Haz clic en una pieza para inspeccionar su QA Gate de 8
              dimensiones
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pieza Editorial</th>
                  <th>Formato</th>
                  <th>Pilar</th>
                  <th>QA Gate</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const typeCfg = CONTENT_TYPES[item.contentType];
                  const pillarCfg = FINTERA_CONTENT_PILLARS[item.pillar];
                  const isSelected = activeItem?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setActiveItem(item);
                        setIsEditingActive(false);
                      }}
                      className={`cursor-pointer transition ${
                        isSelected ? "bg-sky-950/40" : "hover:bg-slate-900/60"
                      }`}
                    >
                      <td>
                        <div className="font-semibold text-slate-100">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          Corte: {item.cutoffDate} · {item.readingTime} min ·{" "}
                          {item.wordCount} palabras
                        </div>
                      </td>
                      <td>
                        <span className="admin-status admin-status-info">
                          {typeCfg?.label || item.contentType}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-300">
                          {pillarCfg?.shortLabel || item.pillar}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status ${
                            item.qaScore >= 85
                              ? "admin-status-success"
                              : "admin-status-warning"
                          }`}
                        >
                          {item.qaScore}/100
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status ${
                            item.status === "PUBLISHED"
                              ? "admin-status-success"
                              : "admin-status-neutral"
                          }`}
                        >
                          {item.status === "PUBLISHED"
                            ? "Publicado"
                            : item.status === "DRAFT"
                            ? "Borrador"
                            : item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: QA Gate 8-Dimension Inspector & Full Preview */}
        <div className="admin-card lg:col-span-5">
          {activeItem ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                    {CONTENT_TYPES[activeItem.contentType]?.label} ·{" "}
                    {FINTERA_CONTENT_PILLARS[activeItem.pillar]?.shortLabel}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-100">
                    {activeItem.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Fecha de corte oficial: {activeItem.cutoffDate} · Autor:{" "}
                    {activeItem.authorName}
                  </p>
                </div>
                <Link
                  href={`/insights/${activeItem.slug}`}
                  target="_blank"
                  className="admin-button shrink-0 text-xs"
                >
                  <ExternalLink size={13} />
                  <span>Abrir</span>
                </Link>
              </div>

              {/* Governance Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {activeItem.status !== "PUBLISHED" ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleStatusChange(activeItem.id, "PUBLISHED")
                    }
                    className="admin-button admin-button-primary text-xs"
                  >
                    <CheckCircle2 size={14} />
                    <span>Aprobar y Publicar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleStatusChange(activeItem.id, "DRAFT")}
                    className="admin-button text-xs"
                  >
                    <span>Pasar a Borrador</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isRemediating}
                  onClick={() => handleRemediateItem(activeItem.id)}
                  className="admin-button text-xs"
                >
                  <Wrench size={14} />
                  <span>
                    {isRemediating
                      ? "Aplicando Regla Editorial..."
                      : "Auto-Remediar QA"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    isEditingActive
                      ? setIsEditingActive(false)
                      : startEditingActive(activeItem)
                  }
                  className="admin-button text-xs"
                >
                  <Edit3 size={13} />
                  <span>
                    {isEditingActive ? "Cancelar Edición" : "Editar Contenido"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLinkedinPost(activeItem)}
                  className="admin-button text-xs"
                >
                  <Share2 size={13} />
                  <span>
                    {copiedLinkedin
                      ? "¡Copy LinkedIn Copiado!"
                      : "Copiar Post LinkedIn + UTM"}
                  </span>
                </button>
              </div>

              {/* 8-Dimension QA Gate Scorecard */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                      Auditoría QA Gate FINTERA (8 Dimensiones)
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {activeItem.qaScore}/100
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {activeItem.qaReport?.summary}
                </p>

                {activeItem.qaReport?.dimensions && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {Object.values(activeItem.qaReport.dimensions).map((dim) => (
                      <div
                        key={dim.name}
                        className="rounded border border-slate-800/80 bg-slate-900/50 px-2.5 py-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">
                            {dim.label}
                          </span>
                          <span
                            className={
                              dim.passed
                                ? "font-semibold text-emerald-400"
                                : "font-semibold text-amber-400"
                            }
                          >
                            {dim.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isEditingActive ? (
                <div className="space-y-3 rounded-lg border border-sky-500/40 bg-slate-950 p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Título
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="admin-input mt-1 w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300">
                        Fecha de Corte
                      </label>
                      <input
                        type="text"
                        value={editCutoffDate}
                        onChange={(e) => setEditCutoffDate(e.target.value)}
                        className="admin-input mt-1 w-full text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300">
                      Contenido Markdown
                    </label>
                    <textarea
                      rows={10}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="admin-input mt-1 w-full font-mono text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingActive(false)}
                      className="admin-button text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveActiveEdit}
                      className="admin-button admin-button-primary text-xs"
                    >
                      Guardar y Re-evaluar QA Gate
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Excerpt & Markdown Content Preview */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Resumen Ejecutivo
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      {activeItem.excerpt}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Contenido Estructurado (Markdown)
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopyLinkedinPost(activeItem)}
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                      >
                        <ClipboardCopy size={12} />
                        <span>Copiar resumen para LinkedIn</span>
                      </button>
                    </div>
                    <pre className="mt-1.5 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3 font-sans text-xs leading-relaxed text-slate-300">
                      {activeItem.content}
                    </pre>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              Selecciona una pieza editorial para inspeccionar su auditoría QA y
              contenido.
            </div>
          )}
        </div>
      </div>

      {/* Regla Editorial de FINTERA Banner */}
      <div className="admin-card">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            La Regla Editorial de FINTERA (Verificación Automática en cada
            Publicación)
          </h2>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {FINTERA_EDITORIAL_COMPLIANCE_RULES.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
            >
              <p className="text-xs font-semibold text-sky-300">{rule.title}</p>
              <p className="mt-1 text-xs text-slate-400">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Creating / Generating a New Piece */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="admin-card w-full max-w-2xl space-y-4 border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Crear o Generar Nueva Pieza en FINTERA Insights
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Pilar Estratégico FINTERA
                </label>
                <select
                  value={newPillar}
                  onChange={(e) =>
                    setNewPillar(e.target.value as FinteraContentPillarKey)
                  }
                  className="admin-input mt-1 w-full"
                >
                  {Object.values(FINTERA_CONTENT_PILLARS).map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Formato Editorial
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ContentTypeKey)}
                  className="admin-input mt-1 w-full"
                >
                  {Object.values(CONTENT_TYPES).map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Título o Tema Financiero a Desarrollar
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Cómo comparar dos ofertas de crédito hipotecario en pesos y UVR"
                className="admin-input mt-1 w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Contenido en Markdown (Opcional si usas el Generador IA con
                Fuentes Oficiales)
              </label>
              <textarea
                rows={6}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Escribe el contenido o pulsa 'Generar con Motor IA FINTERA' para redactar automáticamente con citas de SFC, BanRep, DANE, DIAN/RADIAN y OCDE..."
                className="admin-input mt-1 w-full"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleGenerateAiDraft(newPillar, newType, newTitle)
                }
                disabled={isGenerating}
                className="admin-button"
              >
                <RefreshCw
                  size={14}
                  className={isGenerating ? "animate-spin" : ""}
                />
                <span>
                  {isGenerating
                    ? "Generando con Fuentes Oficiales..."
                    : "Generar con Motor IA FINTERA"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleManualCreate}
                disabled={isSaving || !newTitle.trim() || !newContent.trim()}
                className="admin-button admin-button-primary"
              >
                <span>Guardar Pieza Manual</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
