"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCopy,
  Code2,
  Edit3,
  Eye,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
  Wrench,
} from "lucide-react";
import {
  buildFinteraBrandImagePrompt,
  CONTENT_TYPES,
  ContentTypeKey,
  FINTERA_AI_REWRITE_PRESETS,
  FINTERA_BRAND_BLUEPRINT,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
} from "@/lib/content-types";
import type { FinteraContentItem } from "@/lib/blog";
import { FINTERA_EDITORIAL_COMPLIANCE_RULES } from "@/lib/linkedin-strategy";
import { MarkdownRenderer } from "@/components/fintera/markdown-renderer";
import { LinkedinCarouselPdfModal } from "@/components/fintera/growth/LinkedinCarouselPdfModal";

interface ContentHubClientProps {
  initialItems: FinteraContentItem[];
}

type InspectorTab = "PREVIEW" | "AI_REWRITE" | "CREATIVE_IMAGE" | "MANUAL_EDIT";

export function ContentHubClient({ initialItems }: ContentHubClientProps) {
  const [items, setItems] = useState<FinteraContentItem[]>(initialItems);
  const [selectedPillar, setSelectedPillar] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeItem, setActiveItem] = useState<FinteraContentItem | null>(
    initialItems[0] || null
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("PREVIEW");
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [showCarouselPdfModal, setShowCarouselPdfModal] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRewritingAi, setIsRewritingAi] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [copiedLinkedin, setCopiedLinkedin] = useState(false);

  // Manual edit state for active item
  const [editTitle, setEditTitle] = useState("");
  const [editCutoffDate, setEditCutoffDate] = useState("");
  const [editContent, setEditContent] = useState("");

  // AI Editorial Rewrite state
  const [aiRewriteInstructions, setAiRewriteInstructions] = useState("");
  const [aiRewriteTitle, setAiRewriteTitle] = useState("");

  // Creative Picture Attachment & Qwen Image Generation state
  const [creativePrompt, setCreativePrompt] = useState("");
  const [creativeSize, setCreativeSize] = useState<
    "1024x1024" | "1280x720" | "720x1280"
  >("1024x1024");
  const [customImageUrl, setCustomImageUrl] = useState("");

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

  const selectItemForInspection = (
    item: FinteraContentItem,
    tab: InspectorTab = "PREVIEW"
  ) => {
    setActiveItem(item);
    setEditTitle(item.title);
    setEditCutoffDate(item.cutoffDate);
    setEditContent(item.content);
    setAiRewriteTitle(item.title);
    setCreativePrompt(
      item.imagePrompt ||
        buildFinteraBrandImagePrompt({
          title: item.title,
          pillar: item.pillar,
          contentType: item.contentType,
        })
    );
    setInspectorTab(tab);
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
        setInspectorTab("PREVIEW");
        setFeedbackBanner(
          `Cambios guardados y re-evaluados por QA Gate (${data.item.qaScore}/100).`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiRewriteSubmit = async () => {
    if (!activeItem || !aiRewriteInstructions.trim()) return;
    setIsRewritingAi(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch("/api/admin/content/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeItem.id,
          instructions: aiRewriteInstructions.trim(),
          newTitle: aiRewriteTitle.trim() || activeItem.title,
          cutoffDate: activeItem.cutoffDate,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === data.item.id ? data.item : i))
        );
        setActiveItem(data.item);
        setEditTitle(data.item.title);
        setEditContent(data.item.content);
        setInspectorTab("PREVIEW");
        setFeedbackBanner(
          `✔ Reescritura IA completada (${data.providerUsed}) · QA Gate: ${data.previousQaScore} → ${data.newQaScore}/100`
        );
      } else if (data.error) {
        setFeedbackBanner(`⚠ ${data.error}`);
      }
    } finally {
      setIsRewritingAi(false);
    }
  };

  const handleGenerateCreativeImage = async () => {
    if (!activeItem) return;
    setIsGeneratingImage(true);
    setFeedbackBanner(null);
    try {
      const promptToUse =
        creativePrompt.trim() ||
        buildFinteraBrandImagePrompt({
          title: activeItem.title,
          pillar: activeItem.pillar,
          contentType: activeItem.contentType,
        });
      const res = await fetch("/api/admin/content/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeItem.id,
          action: "generate",
          prompt: promptToUse,
          size: creativeSize,
          setAsCover: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === data.item.id ? data.item : i))
        );
        setActiveItem(data.item);
        setFeedbackBanner(
          `✔ Pieza gráfica generada con ${data.modelUsed} y asignada como portada.`
        );
      } else if (data.error) {
        setFeedbackBanner(`⚠ ${data.error}`);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAttachCustomImage = async (imageUrlToAttach: string, label?: string) => {
    if (!activeItem || !imageUrlToAttach.trim()) return;
    setIsGeneratingImage(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch("/api/admin/content/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeItem.id,
          action: "attach",
          imageUrl: imageUrlToAttach.trim(),
          prompt: label || creativePrompt.trim() || "Pieza creativa adjunta",
          setAsCover: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === data.item.id ? data.item : i))
        );
        setActiveItem(data.item);
        setCustomImageUrl("");
        setFeedbackBanner("✔ Imagen creativa adjuntada y establecida como portada.");
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItem) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleAttachCustomImage(reader.result, `Archivo subido: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const buildLinkedinCopyForItem = (item: FinteraContentItem): string => {
    const pillarCfg = FINTERA_CONTENT_PILLARS[item.pillar];
    const typeCfg = CONTENT_TYPES[item.contentType];
    const utmUrl = `https://www.finterasoluciones.co/insights/${item.slug}?utm_source=linkedin&utm_medium=organic&utm_campaign=${item.pillar.toLowerCase()}`;
    return `${item.title}

“${pillarCfg.brandClaim}”

${item.excerpt.replace(/[#*_`]/g, "")}

Puntos clave de nuestro ${typeCfg.label.toLowerCase()} (Fecha de corte de datos oficiales: ${item.cutoffDate}):
• Criterio financiero: Separamos el dato estadístico oficial de la recomendación práctica para tu flujo de caja.
• Acompañamiento: Evaluamos cada caso según capacidad de pago, condiciones reales o validación en RADIAN.
• Transparencia: Explicamos costos efectivos, seguros, plazos y requisitos sin promesas engañosas.

Lee el análisis completo en FINTERA Insights:
${utmUrl}

¿Deseas evaluar tu necesidad de financiación? ${pillarCfg.defaultCtaLabel}:
https://www.finterasoluciones.co${pillarCfg.defaultCtaUrl}

*Nota: Por tu seguridad financiera (Ley 1581 Habeas Data), nunca compartas datos confidenciales en comentarios públicos.*

#FINTERA #ClaridadQueConecta #SolucionesFinancieras #Colombia #CreditoDeVivienda #Factoring`;
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
        selectItemForInspection(data.item, "PREVIEW");
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
        selectItemForInspection(data.item, "PREVIEW");
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

  const activePillarCfg = activeItem
    ? FINTERA_CONTENT_PILLARS[activeItem.pillar] ||
      FINTERA_CONTENT_PILLARS.VIVIENDA_B2C
    : FINTERA_CONTENT_PILLARS.VIVIENDA_B2C;
  const activeCoverSrc = activeItem?.coverImage || activePillarCfg.coverImage;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            FINTERA INSIGHTS · BRAND BLUEPRINT V1.0 · CENTRO EDITORIAL Y CREATIVO
          </span>
          <h1 className="admin-title">
            Centro Editorial Multiformato, Edición IA y Estudio Visual Qwen
          </h1>
          <p className="admin-subtitle">
            Gestiona artículos, whitepapers, webinars y piezas gráficas bajo la
            Arquitectura de Marca de FINTERA (<em>“{FINTERA_BRAND_BLUEPRINT.positioning}”</em> ·
            Paleta institucional <code className="text-[#00C4B3]">#0A2342</code> y{" "}
            <code className="text-[#00C4B3]">#00C4B3</code>).
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
        <div className="admin-card mb-4 flex items-center justify-between border-[#00C4B3]/50 bg-[#0A2342]/80 px-4 py-3 text-sm text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#00C4B3]" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs text-slate-300 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 4 Content Pillars Balance Tracker with Brand-Aligned Cover Images */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
        {Object.values(FINTERA_CONTENT_PILLARS).map((pillar) => {
          const count = items.filter((i) => i.pillar === pillar.key).length;
          const isSelected = selectedPillar === pillar.key;
          return (
            <button
              key={pillar.key}
              type="button"
              onClick={() =>
                setSelectedPillar(isSelected ? "ALL" : pillar.key)
              }
              className={`group admin-card !p-0 overflow-hidden text-left transition flex flex-col justify-between ${
                isSelected
                  ? "ring-2 ring-sky-500 border-sky-500"
                  : ""
              }`}
            >
              <div>
                <div className="relative h-32 w-full overflow-hidden bg-[#0A2342] keep-white-text">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pillar.coverImage}
                    alt={pillar.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2342] via-[#0A2342]/40 to-transparent" />
                  <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                    <span className="rounded-full bg-[#0A2342]/90 border border-[#00C4B3]/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00C4B3]">
                      Pilar {pillar.number}
                    </span>
                    <span className="rounded-full bg-sky-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {count} piezas
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-[10px] font-semibold text-[#FFD447]">
                      “{pillar.brandClaim}”
                    </p>
                    <p className="text-xs font-bold text-white leading-snug">
                      {pillar.label.replace(/^Pilar \d+ · /, "")}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-300">
                    {pillar.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters bar */}
      <div className="admin-card mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filtrar por formato"
            className="admin-input w-auto bg-[#0a192f] text-white"
          >
            <option value="ALL" className="bg-[#0A2342] text-white">
              Todos los formatos ({items.length})
            </option>
            {Object.values(CONTENT_TYPES).map((t) => (
              <option
                key={t.key}
                value={t.key}
                className="bg-[#0A2342] text-white"
              >
                {t.pluralLabel}
              </option>
            ))}
          </select>

          <select
            value={selectedPillar}
            onChange={(e) => setSelectedPillar(e.target.value)}
            aria-label="Filtrar por pilar editorial"
            className="admin-input w-auto bg-[#0a192f] text-white"
          >
            <option value="ALL" className="bg-[#0A2342] text-white">
              Todos los pilares estratégicos
            </option>
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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por estado"
            className="admin-input w-auto bg-[#0a192f] text-white"
          >
            <option value="ALL" className="bg-[#0A2342] text-white">
              Todos los estados
            </option>
            <option value="PUBLISHED" className="bg-[#0A2342] text-white">
              Publicados (PUBLISHED)
            </option>
            <option value="DRAFT" className="bg-[#0A2342] text-white">
              Borradores (DRAFT)
            </option>
            <option value="SCHEDULED" className="bg-[#0A2342] text-white">
              Programados (SCHEDULED)
            </option>
          </select>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por título, RADIAN, UVR, Superfinanciera..."
          className="admin-input max-w-xs bg-[#0a192f] text-white"
        />
      </div>

      {/* Master-Detail Split: Content Table + QA Gate & Content/AI Studio Inspector */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 mb-6">
        <div className="admin-card lg:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Repositorio FINTERA Insights ({filteredItems.length})
            </h2>
            <span className="text-xs text-slate-400">
              Selecciona una pieza para editar con IA, adjuntar imagen o auditar QA
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
                  const pillarCfg =
                    FINTERA_CONTENT_PILLARS[item.pillar] ||
                    FINTERA_CONTENT_PILLARS.VIVIENDA_B2C;
                  const isSelected = activeItem?.id === item.id;
                  const thumbSrc = item.coverImage || pillarCfg.coverImage;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => selectItemForInspection(item, "PREVIEW")}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? "bg-sky-500/15 border-l-4 border-l-sky-600"
                          : "hover:bg-slate-900/60"
                      }`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbSrc}
                            alt={item.title}
                            className="h-11 w-14 shrink-0 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-semibold text-white leading-snug">
                              {item.title}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">
                              Corte: {item.cutoffDate} · {item.readingTime} min ·{" "}
                              {item.wordCount} palabras
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-status admin-status-info">
                          {typeCfg?.label || item.contentType}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-200">
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

        {/* Right Column: QA Gate 8-Dimension Inspector, AI Editorial Rewriter, Creative Studio & Formatted Preview */}
        <div className="admin-card lg:col-span-6">
          {activeItem ? (
            <div className="space-y-4">
              {/* Article Cover Banner & Header */}
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="relative h-36 w-full overflow-hidden keep-white-text">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeCoverSrc}
                    alt={activeItem.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2342] via-[#0A2342]/65 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#0A2342]/90 border border-[#00C4B3]/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#00C4B3]">
                      {CONTENT_TYPES[activeItem.contentType]?.label} ·{" "}
                      {activePillarCfg.shortLabel}
                    </span>
                    <Link
                      href={`/insights/${activeItem.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-sky-700"
                    >
                      <ExternalLink size={13} />
                      <span>Abrir en /insights</span>
                    </Link>
                  </div>
                  <div className="absolute bottom-2.5 left-3.5 right-3.5">
                    <p className="text-[11px] font-semibold text-[#FFD447]">
                      “{activePillarCfg.brandClaim}”
                    </p>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {activeItem.title}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-3.5 py-2 text-[11px] text-slate-300">
                  <span>
                    Fecha de corte oficial: <strong className="text-white">{activeItem.cutoffDate}</strong> · Autor:{" "}
                    {activeItem.authorName}
                  </span>
                  {activeItem.aiModel && (
                    <span className="text-sky-400 font-semibold">
                      Motor: {activeItem.aiModel}
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Governance & Studio Mode Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setInspectorTab("PREVIEW")}
                  className={`admin-button text-xs ${
                    inspectorTab === "PREVIEW" ? "admin-button-primary" : ""
                  }`}
                >
                  <Eye size={14} />
                  <span>Vista Formateada</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiRewriteTitle(activeItem.title);
                    setInspectorTab("AI_REWRITE");
                  }}
                  className={`admin-button text-xs ${
                    inspectorTab === "AI_REWRITE" ? "admin-button-primary" : ""
                  }`}
                >
                  <Wand2 size={14} />
                  <span>Reescribir con IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreativePrompt(
                      activeItem.imagePrompt ||
                        buildFinteraBrandImagePrompt({
                          title: activeItem.title,
                          pillar: activeItem.pillar,
                          contentType: activeItem.contentType,
                        })
                    );
                    setInspectorTab("CREATIVE_IMAGE");
                  }}
                  className={`admin-button text-xs ${
                    inspectorTab === "CREATIVE_IMAGE" ? "admin-button-primary" : ""
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>Pieza Gráfica / Portada IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(activeItem.title);
                    setEditCutoffDate(activeItem.cutoffDate);
                    setEditContent(activeItem.content);
                    setInspectorTab("MANUAL_EDIT");
                  }}
                  className={`admin-button text-xs ${
                    inspectorTab === "MANUAL_EDIT" ? "admin-button-primary" : ""
                  }`}
                >
                  <Edit3 size={13} />
                  <span>Editar Contenido</span>
                </button>

                <button
                  type="button"
                  disabled={isRemediating}
                  onClick={() => handleRemediateItem(activeItem.id)}
                  className="admin-button text-xs"
                >
                  <Wrench size={14} />
                  <span>
                    {isRemediating ? "Remediando..." : "Auto-Remediar QA"}
                  </span>
                </button>

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
                    <span>Publicar</span>
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
                  onClick={() => handleCopyLinkedinPost(activeItem)}
                  className="admin-button text-xs"
                >
                  <Share2 size={13} />
                  <span>
                    {copiedLinkedin ? "¡Copiado!" : "Copy LinkedIn"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCarouselPdfModal(true)}
                  className="admin-button text-xs border-[#FFD447]/60 text-[#FFD447]"
                >
                  <FileText size={13} />
                  <span>Carrusel PDF LinkedIn (1080×1350)</span>
                </button>
              </div>

              {/* 8-Dimension QA Gate Scorecard */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#00C4B3]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      Auditoría QA Gate FINTERA (8 Dimensiones)
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#00C4B3]">
                    {activeItem.qaScore}/100
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  {activeItem.qaReport?.summary}
                </p>

                {activeItem.qaReport?.dimensions && (
                  <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.values(activeItem.qaReport.dimensions).map((dim) => (
                      <div
                        key={dim.name}
                        className="rounded-lg border border-slate-800 bg-[#0a192f] px-2.5 py-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-200 truncate pr-1">
                            {dim.label}
                          </span>
                          <span
                            className={
                              dim.passed
                                ? "font-bold text-[#00C4B3]"
                                : "font-bold text-amber-400"
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

              {/* TAB 1: SENIOR AI EDITORIAL REWRITE SERVICE */}
              {inspectorTab === "AI_REWRITE" && (
                <div className="space-y-4 rounded-xl border border-[#00C4B3]/50 bg-[#0A2342]/90 p-4 text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Wand2 size={16} className="text-[#00C4B3]" />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Servicio de Reescritura Editorial con IA (Brand Blueprint V1.0)
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Indica qué cambios deseas aplicar o selecciona una directriz del Manual de Marca de FINTERA.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Directrices Rápidas del Manual de Marca FINTERA (Clic para cargar):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {FINTERA_AI_REWRITE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setAiRewriteInstructions(preset.instruction)
                          }
                          className="rounded-lg border border-[#00C4B3]/40 bg-[#0a192f] px-2.5 py-1.5 text-[11px] font-medium text-[#00C4B3] transition hover:bg-[#00C4B3] hover:text-[#0A2342]"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200">
                      Título de la Pieza (Opcional modificar)
                    </label>
                    <input
                      type="text"
                      value={aiRewriteTitle}
                      onChange={(e) => setAiRewriteTitle(e.target.value)}
                      className="admin-input mt-1 w-full bg-[#071120] text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200">
                      Instrucciones de Reescritura para el Motor IA (Hermes / NVIDIA NIM / Qwen)
                    </label>
                    <textarea
                      rows={5}
                      value={aiRewriteInstructions}
                      onChange={(e) =>
                        setAiRewriteInstructions(e.target.value)
                      }
                      placeholder="Ej. Reescribe la introducción aplicando el principio 'Primero la respuesta', agrega una tabla comparativa entre Crédito en Pesos y UVR con cifras ilustrativas transparentes, y refuerza el tono del Sabio Estratega..."
                      className="admin-input mt-1 w-full bg-[#071120] text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setInspectorTab("PREVIEW")}
                      className="admin-button text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isRewritingAi || !aiRewriteInstructions.trim()}
                      onClick={handleAiRewriteSubmit}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#00C4B3] px-4 py-2.5 text-xs font-bold text-[#0A2342] shadow-lg transition hover:bg-[#00b0a0] disabled:opacity-50"
                    >
                      <RefreshCw
                        size={14}
                        className={isRewritingAi ? "animate-spin" : ""}
                      />
                      <span>
                        {isRewritingAi
                          ? "Reescribiendo Artículo con IA..."
                          : "Ejecutar Reescritura con IA y Auditar QA"}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CREATIVE PICTURE ATTACHMENT & QWEN IMAGE 3.0 GENERATOR MODULE */}
              {inspectorTab === "CREATIVE_IMAGE" && (
                <div className="space-y-4 rounded-xl border border-[#FFD447]/40 bg-[#0A2342]/95 p-4 text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-[#FFD447]" />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Estudio de Pieza Gráfica y Portada (Qwen Image 3.0 + Adjuntos)
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          Concepto maestro: <em>“Señales de claridad”</em> · Paleta{" "}
                          <code className="text-[#00C4B3]">#0A2342</code>,{" "}
                          <code className="text-[#00C4B3]">#00C4B3</code> y acento{" "}
                          <code className="text-[#FFD447]">#FFD447</code>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prompt Sugerido Alineado con el Manual de Marca */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-200">
                        Prompt Visual Sugerido (Alineado con Artículo + Brand Blueprint V1.0)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCreativePrompt(
                            buildFinteraBrandImagePrompt({
                              title: activeItem.title,
                              pillar: activeItem.pillar,
                              contentType: activeItem.contentType,
                            })
                          )
                        }
                        className="text-[11px] font-semibold text-[#00C4B3] hover:underline"
                      >
                        Restaurar prompt sugerido del Manual de Marca
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={creativePrompt}
                      onChange={(e) => setCreativePrompt(e.target.value)}
                      className="admin-input mt-1 w-full bg-[#071120] text-white text-xs"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Restricción activa (Sección 08 Brand Blueprint): {FINTERA_BRAND_BLUEPRINT.prohibitedVisuals}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-200">
                        Formato / Relación:
                      </label>
                      <select
                        value={creativeSize}
                        onChange={(e) =>
                          setCreativeSize(
                            e.target.value as
                              | "1024x1024"
                              | "1280x720"
                              | "720x1280"
                          )
                        }
                        className="admin-input w-auto bg-[#071120] text-white text-xs"
                      >
                        <option value="1024x1024" className="bg-[#0A2342] text-white">
                          Cuadrado LinkedIn / Feed (1024×1024)
                        </option>
                        <option value="1280x720" className="bg-[#0A2342] text-white">
                          Horizontal Portada Editorial (1280×720)
                        </option>
                        <option value="720x1280" className="bg-[#0A2342] text-white">
                          Vertical Historia / Reel (720×1280)
                        </option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={isGeneratingImage}
                      onClick={handleGenerateCreativeImage}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#00C4B3] px-4 py-2.5 text-xs font-bold text-[#0A2342] shadow-lg transition hover:bg-[#00b0a0] disabled:opacity-50"
                    >
                      <Sparkles
                        size={14}
                        className={isGeneratingImage ? "animate-spin" : ""}
                      />
                      <span>
                        {isGeneratingImage
                          ? "Generando con Qwen Image 3.0..."
                          : "Generar Pieza Gráfica con Qwen IA"}
                      </span>
                    </button>
                  </div>

                  {/* Manual Attachment: Upload Local File or Paste External URL */}
                  <div className="border-t border-white/10 pt-3 space-y-2.5">
                    <span className="block text-xs font-semibold text-slate-200">
                      Adjuntar Pieza Creativa Propia (Subir Archivo o Pegar URL):
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        placeholder="https://... o /images/..."
                        className="admin-input flex-1 bg-[#071120] text-white text-xs"
                      />
                      <button
                        type="button"
                        disabled={isGeneratingImage || !customImageUrl.trim()}
                        onClick={() => handleAttachCustomImage(customImageUrl)}
                        className="admin-button text-xs"
                      >
                        Adjuntar URL como Portada
                      </button>
                      <label className="admin-button cursor-pointer text-xs">
                        <Upload size={13} />
                        <span>Subir Imagen Local</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLocalFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Gallery of Pillar Covers & Generated Creative Assets */}
                  <div className="border-t border-white/10 pt-3">
                    <span className="block text-xs font-semibold text-slate-200 mb-2">
                      Biblioteca de Portadas Institucionales y Activos Generados:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {Object.values(FINTERA_CONTENT_PILLARS).map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() =>
                            handleAttachCustomImage(
                              p.coverImage,
                              `Portada institucional ${p.shortLabel}`
                            )
                          }
                          className={`group relative overflow-hidden rounded-lg border text-left ${
                            activeCoverSrc === p.coverImage
                              ? "border-[#00C4B3] ring-2 ring-[#00C4B3]"
                              : "border-slate-700"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.coverImage}
                            alt={p.shortLabel}
                            className="h-20 w-full object-cover"
                          />
                          <div className="bg-[#071120] px-2 py-1 text-[10px] font-semibold text-slate-200 truncate">
                            Pilar {p.number}: {p.shortLabel}
                          </div>
                        </button>
                      ))}

                      {(activeItem.creativeAssets || []).map((asset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            handleAttachCustomImage(asset.url, asset.prompt)
                          }
                          className={`group relative overflow-hidden rounded-lg border text-left ${
                            activeCoverSrc === asset.url
                              ? "border-[#FFD447] ring-2 ring-[#FFD447]"
                              : "border-slate-700"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset.url}
                            alt={asset.model}
                            className="h-20 w-full object-cover"
                          />
                          <div className="bg-[#071120] px-2 py-1 text-[10px] font-semibold text-[#FFD447] truncate">
                            IA · {asset.model}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MANUAL MARKDOWN EDITOR (HIGH CONTRAST) */}
              {inspectorTab === "MANUAL_EDIT" && (
                <div className="space-y-3 rounded-xl border border-sky-400/50 bg-[#0a192f] p-4 text-white">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-white">
                        Título de la Pieza
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="admin-input mt-1 w-full bg-[#071120] text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white">
                        Fecha de Corte Oficial
                      </label>
                      <input
                        type="text"
                        value={editCutoffDate}
                        onChange={(e) => setEditCutoffDate(e.target.value)}
                        className="admin-input mt-1 w-full bg-[#071120] text-white text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white">
                      Contenido Estructurado en Markdown
                    </label>
                    <textarea
                      rows={14}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="admin-input mt-1 w-full bg-[#071120] font-mono text-xs text-white leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectorTab("PREVIEW")}
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
                      Guardar Cambios y Re-evaluar QA Gate
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: FORMATTED MARKDOWN PREVIEW */}
              {inspectorTab === "PREVIEW" && (
                <>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Resumen Ejecutivo
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-200">
                      {activeItem.excerpt.replace(/[#*_`]/g, "")}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                        Contenido Editorial ({showRawMarkdown ? "Código Fuente Markdown" : "Vista Formateada"})
                      </h4>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowRawMarkdown((v) => !v)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white"
                        >
                          <Code2 size={13} />
                          <span>
                            {showRawMarkdown
                              ? "Ver Vista Formateada"
                              : "Ver Código Markdown"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLinkedinPost(activeItem)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00C4B3] hover:underline"
                        >
                          <ClipboardCopy size={12} />
                          <span>Copiar Post para LinkedIn</span>
                        </button>
                      </div>
                    </div>

                    {showRawMarkdown ? (
                      <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-[#071120] p-4 font-mono text-xs leading-relaxed text-slate-200">
                        {activeItem.content}
                      </pre>
                    ) : (
                      <div className="max-h-[460px] overflow-y-auto rounded-xl border border-slate-800 bg-[#071120] p-5">
                        <MarkdownRenderer
                          content={activeItem.content}
                          variant="dark"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              Selecciona una pieza editorial para inspeccionar su auditoría QA,
              editar con IA o generar su portada.
            </div>
          )}
        </div>
      </div>

      {/* Regla Editorial de FINTERA Banner */}
      <div className="admin-card">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[#00C4B3]" />
          <h2 className="text-sm font-semibold text-white">
            La Regla Editorial y Gobernanza de Marca de FINTERA (Verificación Automática en cada Publicación)
          </h2>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {FINTERA_EDITORIAL_COMPLIANCE_RULES.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg border border-slate-800 bg-[#0a192f] p-3"
            >
              <p className="text-xs font-semibold text-[#00C4B3]">{rule.title}</p>
              <p className="mt-1 text-xs text-slate-300">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Creating / Generating a New Piece */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="admin-card w-full max-w-2xl space-y-4 border-slate-700 bg-[#0A2342]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#00C4B3]" />
                <h3 className="text-base font-bold text-white">
                  Crear o Generar Nueva Pieza en FINTERA Insights
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-300 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-white">
                  Pilar Estratégico FINTERA
                </label>
                <select
                  value={newPillar}
                  onChange={(e) =>
                    setNewPillar(e.target.value as FinteraContentPillarKey)
                  }
                  className="admin-input mt-1 w-full bg-[#071120] text-white"
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
                <label className="block text-xs font-semibold text-white">
                  Formato Editorial
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ContentTypeKey)}
                  className="admin-input mt-1 w-full bg-[#071120] text-white"
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

            <div>
              <label className="block text-xs font-semibold text-white">
                Título o Tema Financiero a Desarrollar
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Cómo comparar dos ofertas de crédito hipotecario en pesos y UVR"
                className="admin-input mt-1 w-full bg-[#071120] text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white">
                Contenido en Markdown (Opcional si usas el Generador IA con
                Fuentes Oficiales)
              </label>
              <textarea
                rows={6}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Escribe el contenido o pulsa 'Generar con Motor IA FINTERA' para redactar automáticamente con citas de SFC, BanRep, DANE, DIAN/RADIAN y OCDE..."
                className="admin-input mt-1 w-full bg-[#071120] text-white"
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

      {showCarouselPdfModal && activeItem && (
        <LinkedinCarouselPdfModal
          item={activeItem}
          onClose={() => setShowCarouselPdfModal(false)}
        />
      )}
    </div>
  );
}
