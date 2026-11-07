"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  Mail,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import type {
  FinteraArticleAnalytics,
  FinteraHumanReviewMetadata,
  FinteraShareBreakdown,
} from "@/lib/blog";
import type { FinteraContentPillarKey } from "@/lib/content-types";

interface ArticleEngagementBarProps {
  slug: string;
  title: string;
  cutoffDate: string;
  readingTime: number;
  pillar: FinteraContentPillarKey;
  initialAnalytics: FinteraArticleAnalytics;
  humanReview: FinteraHumanReviewMetadata;
}

export function ArticleEngagementBar({
  slug,
  title,
  cutoffDate,
  readingTime,
  pillar,
  initialAnalytics,
  humanReview,
}: ArticleEngagementBarProps) {
  const [analytics, setAnalytics] =
    useState<FinteraArticleAnalytics>(initialAnalytics);
  const [hasVotedHelpful, setHasVotedHelpful] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  // Newsletter state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [segment, setSegment] = useState<
    "B2C_VIVIENDA" | "B2B_EMPRESAS" | "ALL_PILLARS"
  >(
    pillar === "VIVIENDA_B2C"
      ? "B2C_VIVIENDA"
      : pillar === "FACTORING_B2B"
      ? "B2B_EMPRESAS"
      : "ALL_PILLARS"
  );
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState<string | null>(
    null
  );

  useEffect(() => {
    const storageKey = `fintera_viewed_${slug}`;
    const alreadyViewedInSession =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(storageKey) === "1";

    if (!alreadyViewedInSession) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(storageKey, "1");
      }
      fetch("/api/insights/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, event: "VIEW" }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.analytics) {
            setAnalytics(data.analytics);
          }
        })
        .catch(() => {
          // Graceful fallback
        });
    } else {
      fetch(`/api/insights/telemetry?slug=${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && data.analytics) {
            setAnalytics(data.analytics);
          }
        })
        .catch(() => {
          // Graceful fallback
        });
    }
  }, [slug]);

  const getCanonicalShareUrl = (medium: string) => {
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}/insights/${slug}`
        : `https://www.finterasoluciones.co/insights/${slug}`;
    return `${base}?utm_source=${medium}&utm_medium=social_share&utm_campaign=fintera_insights`;
  };

  const trackShare = async (channel: keyof FinteraShareBreakdown) => {
    try {
      const res = await fetch("/api/insights/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, event: "SHARE", channel }),
      });
      const data = await res.json();
      if (data?.success && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch {
      // Safe fallback
    }
  };

  const handleShareClick = async (channel: keyof FinteraShareBreakdown) => {
    const shareUrl = getCanonicalShareUrl(channel);
    const shareText = `${title} (Corte oficial: ${cutoffDate} · FINTERA Insights)`;

    await trackShare(channel);

    if (channel === "copy") {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedChannel("copy");
        setTimeout(() => setCopiedChannel(null), 2600);
      }
      return;
    }

    let targetUrl = "";
    if (channel === "linkedin") {
      targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl
      )}`;
    } else if (channel === "whatsapp") {
      targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `📊 *${title}*\nFecha de corte oficial: ${cutoffDate} · FINTERA Soluciones Financieras\n\nConsulta el análisis completo aquí: ${shareUrl}`
      )}`;
    } else if (channel === "x") {
      targetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(shareUrl)}`;
    } else if (channel === "facebook") {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`;
    } else if (channel === "email") {
      targetUrl = `mailto:?subject=${encodeURIComponent(
        `[FINTERA Insights] ${title}`
      )}&body=${encodeURIComponent(
        `Te comparto este análisis financiero de FINTERA Soluciones Financieras (Fecha de corte oficial: ${cutoffDate}):\n\n${title}\n\nLeer informe completo: ${shareUrl}`
      )}`;
    }

    if (targetUrl && typeof window !== "undefined") {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleHelpfulVote = async () => {
    if (hasVotedHelpful) return;
    setHasVotedHelpful(true);
    try {
      const res = await fetch("/api/insights/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, event: "HELPFUL_VOTE" }),
      });
      const data = await res.json();
      if (data?.success && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch {
      // Safe fallback
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubscribing) return;
    setIsSubscribing(true);
    setNewsletterFeedback(null);
    try {
      const res = await fetch("/api/insights/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBSCRIBE",
          email,
          fullName,
          segment,
          sourceSlug: slug,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterFeedback(data.message);
        setEmail("");
        setFullName("");
        setAnalytics((prev) => ({
          ...prev,
          newsletterSignups: (prev.newsletterSignups || 0) + 1,
        }));
      } else {
        setNewsletterFeedback(data.error || "No se pudo procesar la suscripción.");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. LIVE TELEMETRY & SOCIAL SHARE BAR */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-bold text-[#0A2342]">
            <Eye size={14} className="text-[#0284c7]" />
            <span>
              {analytics.views.toLocaleString("es-CO")} lecturas verificadas
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            <Share2 size={13} className="text-[#00C4B3]" />
            <span>{analytics.shares} compartidos</span>
          </span>

          <button
            type="button"
            onClick={handleHelpfulVote}
            disabled={hasVotedHelpful}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold transition ${
              hasVotedHelpful
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:text-[#0A2342]"
            }`}
          >
            <ThumbsUp size={13} />
            <span>
              {hasVotedHelpful ? "¡Gracias por tu voto!" : "¿Te aportó claridad?"}{" "}
              ({analytics.helpfulVotes})
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-slate-500">
            Compartir análisis:
          </span>

          <button
            type="button"
            onClick={() => handleShareClick("whatsapp")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            title="Compartir por WhatsApp"
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareClick("linkedin")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#084e96]"
            title="Compartir en LinkedIn"
          >
            <Share2 size={13} />
            <span>LinkedIn</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareClick("x")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
            title="Compartir en X / Twitter"
          >
            <span>𝕏</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareClick("email")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            title="Enviar por correo electrónico"
          >
            <Mail size={13} />
            <span>Correo</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareClick("copy")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#0A2342] transition hover:bg-slate-100"
            title="Copiar enlace con trazabilidad UTM"
          >
            {copiedChannel === "copy" ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-700">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copiar link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. GOOGLE E-E-A-T & YMYL HUMAN EDITORIAL REVIEW GATE BOX */}
      <div className="rounded-3xl border border-[#00C4B3]/40 bg-gradient-to-br from-[#0A2342] via-[#0d2d54] to-[#0A2342] p-6 text-white shadow-lg sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00C4B3]/20 border border-[#00C4B3]/50 text-[#00C4B3]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#00C4B3]/20 border border-[#00C4B3]/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00C4B3]">
                  Sello E-E-A-T · Curaduría y Verificación Humana FINTERA
                </span>
                <span className="text-[11px] text-slate-300">
                  Código: {humanReview.verificationHash}
                </span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white">
                Revisado y validado en mesa por: {humanReview.reviewerName}
              </h3>
              <p className="text-xs text-slate-200">{humanReview.reviewerRole}</p>
              <p className="mt-0.5 text-[11px] text-[#FFD447]">
                {humanReview.reviewerCredentials}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 px-3 py-2 text-right text-[11px] text-slate-200">
            <div className="font-bold text-[#00C4B3]">
              Fuentes Primarias Verificadas
            </div>
            <div>Corte: {cutoffDate} · Lectura: {readingTime} min</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#FFD447]">
            Nota de Criterio Experto en Mesa (Experiencia Práctica FINTERA en Colombia)
          </span>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-100">
            {humanReview.expertMesaNote}
          </p>
        </div>
      </div>

      {/* 3. RESEND NEWSLETTER SUBSCRIPTION MODULE */}
      <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700">
              <Send size={12} />
              <span>Boletín Mensual FINTERA Insights · Vía Resend</span>
            </span>
            <h3 className="text-xl font-extrabold text-[#0A2342]">
              Recibe nuestros Dossiers Mensuales y señales financieras en tu correo
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Cada mes sintetizamos las actualizaciones de tasas hipotecarias (SFC),
              decisiones del Banco de la República, inflación/UVR (DANE) y
              lineamientos de factoring electrónico RADIAN (DIAN) con criterio
              práctico para familias y gerentes financieros.
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubmit}
            className="lg:col-span-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre o empresa"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.co *"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <select
                value={segment}
                onChange={(e) =>
                  setSegment(
                    e.target.value as
                      | "B2C_VIVIENDA"
                      | "B2B_EMPRESAS"
                      | "ALL_PILLARS"
                  )
                }
                aria-label="Seleccionar mesa de interés"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-600 focus:outline-none"
              >
                <option value="ALL_PILLARS">
                  Todos los Dossiers (Vivienda B2C + Liquidez B2B)
                </option>
                <option value="B2C_VIVIENDA">
                  Pilar 1: Crédito de Vivienda, UVR vs. Pesos (Personas)
                </option>
                <option value="B2B_EMPRESAS">
                  Pilar 2: Liquidez Empresarial, RADIAN y Factoring (Pymes)
                </option>
              </select>

              <button
                type="submit"
                disabled={isSubscribing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A2342] px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-sky-700 disabled:opacity-50"
              >
                <Send size={13} />
                <span>
                  {isSubscribing
                    ? "Suscribiendo..."
                    : "Suscribirme al Boletín"}
                </span>
              </button>
            </div>

            {newsletterFeedback && (
              <p className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800">
                {newsletterFeedback}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

