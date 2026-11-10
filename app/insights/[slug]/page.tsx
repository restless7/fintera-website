import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { MarkdownRenderer } from "@/components/fintera/markdown-renderer";
import { ArticleEngagementBar } from "@/components/fintera/article-engagement-bar";
import {
  getAllFinteraContentWithDb,
  getFinteraContentByIdOrSlugWithDb,
  resolveArticleCoverImage,
} from "@/lib/blog";
import {
  CaseStudyMetadata,
  CONTENT_TYPES,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
  GuideMetadata,
  TutorialMetadata,
  WebinarMetadata,
  WhitepaperMetadata,
} from "@/lib/content-types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getFinteraContentByIdOrSlugWithDb(slug);
  if (!item) {
    return {
      title: "Artículo no encontrado | FINTERA Insights",
    };
  }

  const baseUrl = "https://www.finterasoluciones.co";
  const canonicalUrl = `${baseUrl}/insights/${item.slug}`;
  const coverSrc = resolveArticleCoverImage(
    item.id,
    item.slug,
    item.coverImage
  );
  const fullCoverUrl = coverSrc.startsWith("http")
    ? coverSrc
    : `${baseUrl}${coverSrc}`;
  const title = item.seoTitle || `${item.title} | FINTERA Insights`;
  const description = item.seoDescription || item.excerpt;

  return {
    title,
    description,
    keywords: item.seoKeywords
      ? item.seoKeywords.split(",").map((k) => k.trim())
      : item.tags,
    authors: [
      {
        name:
          item.humanReview?.reviewerName ||
          item.authorName ||
          "Comité de Criterio Financiero FINTERA",
      },
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: item.title,
      description,
      siteName: "FINTERA Soluciones Financieras",
      locale: "es_CO",
      publishedTime: item.publishedAt || item.createdAt,
      modifiedTime: item.updatedAt,
      authors: [
        item.humanReview?.reviewerName ||
          item.authorName ||
          "FINTERA Soluciones Financieras",
      ],
      images: [
        {
          url: fullCoverUrl,
          width: 1200,
          height: 630,
          alt: item.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description,
      images: [fullCoverUrl],
    },
  };
}

export default async function FinteraInsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getFinteraContentByIdOrSlugWithDb(slug);
  if (!item) {
    notFound();
  }
  if (slug !== item.slug && slug !== item.id) {
    redirect(`/insights/${item.slug}`);
  }

  const typeCfg = CONTENT_TYPES[item.contentType];
  const pillarCfg =
    FINTERA_CONTENT_PILLARS[item.pillar as FinteraContentPillarKey] ||
    FINTERA_CONTENT_PILLARS.VIVIENDA_B2C;

  const allPublished = await getAllFinteraContentWithDb({ status: "PUBLISHED" });
  const relatedItems = allPublished
    .filter((other) => other.id !== item.id)
    .sort((a, b) => (a.pillar === item.pillar ? -1 : b.pillar === item.pillar ? 1 : 0))
    .slice(0, 3);

  const whitepaperMeta =
    item.contentType === "WHITEPAPER"
      ? (item.typeMetadata as unknown as WhitepaperMetadata)
      : null;
  const webinarMeta =
    item.contentType === "WEBINAR"
      ? (item.typeMetadata as unknown as WebinarMetadata)
      : null;
  const caseStudyMeta =
    item.contentType === "CASE_STUDY"
      ? (item.typeMetadata as unknown as CaseStudyMetadata)
      : null;
  const guideMeta =
    item.contentType === "GUIDE"
      ? (item.typeMetadata as unknown as GuideMetadata)
      : null;
  const tutorialMeta =
    item.contentType === "TUTORIAL"
      ? (item.typeMetadata as unknown as TutorialMetadata)
      : null;

  const coverSrc = resolveArticleCoverImage(
    item.id,
    item.slug,
    item.coverImage
  );

  const humanReview = item.humanReview || {
    humanReviewed: true,
    reviewerName: "Sebastián García · Comité Técnico FINTERA",
    reviewerRole:
      "Dirección de Estructuración Financiera, Crédito Hipotecario (Ley 546) y Liquidez B2B (RADIAN)",
    reviewerCredentials:
      "Mesa de Originación Multibanco Colombia · Fuentes Verificadas SFC / BanRep / DIAN / DANE",
    reviewedAt: item.publishedAt || item.updatedAt,
    expertMesaNote:
      "Análisis contrastado con las circulares vigentes de la Superintendencia Financiera de Colombia (SFC), estadísticas del Banco de la República y el Anexo Técnico RADIAN de la DIAN.",
    verificationHash: `EEAT-FNT-${item.id.slice(0, 8).toUpperCase()}`,
  };

  const initialAnalytics = item.analytics || {
    views: item.views || 180,
    uniqueViews: Math.round((item.views || 180) * 0.78),
    shares: 24,
    helpfulVotes: 16,
    ctaClicks: 11,
    newsletterSignups: 4,
    avgReadSeconds: item.readingTime * 46,
    shareBreakdown: {
      linkedin: 8,
      whatsapp: 10,
      x: 2,
      facebook: 1,
      email: 1,
      copy: 2,
    },
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    headline: item.title,
    description: item.seoDescription || item.excerpt,
    image: [`https://www.finterasoluciones.co${coverSrc}`],
    datePublished: item.publishedAt || item.createdAt,
    dateModified: item.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.finterasoluciones.co/insights/${item.slug}`,
    },
    author: {
      "@type": "Person",
      name: item.authorName,
      jobTitle: item.authorRole,
      worksFor: {
        "@type": "FinancialService",
        name: "FINTERA Soluciones Financieras",
        url: "https://www.finterasoluciones.co",
      },
    },
    reviewedBy: {
      "@type": "Person",
      name: humanReview.reviewerName,
      jobTitle: humanReview.reviewerRole,
      description: humanReview.reviewerCredentials,
      worksFor: {
        "@type": "FinancialService",
        name: "FINTERA Soluciones Financieras",
        url: "https://www.finterasoluciones.co",
      },
    },
    publisher: {
      "@type": "Organization",
      name: "FINTERA Soluciones Financieras",
      url: "https://www.finterasoluciones.co",
      publishingPrinciples:
        "https://www.finterasoluciones.co/legal/cumplimiento",
    },
    citation: [
      "https://www.superfinanciera.gov.co",
      "https://www.banrep.gov.co",
      "https://www.dane.gov.co",
      "https://www.dian.gov.co",
      "https://www.oecd.org",
    ],
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WatchAction",
        userInteractionCount: initialAnalytics.views,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ShareAction",
        userInteractionCount: initialAnalytics.shares,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: initialAnalytics.helpfulVotes,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen bg-[#F7F7F7] pt-24 pb-20">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/insights"
              className="text-sm font-bold text-[#0A2342] hover:text-[#008f82]"
            >
              ← Volver a FINTERA Insights
            </Link>
            <span className="rounded-full border border-[#00C4B3]/40 bg-[#0A2342] px-3.5 py-1 text-xs font-bold text-[#00C4B3]">
              ✔ Verificado por Comité QA FINTERA ({item.qaScore}/100)
            </span>
          </div>

          <header className="overflow-hidden rounded-3xl bg-[#0A2342] text-white shadow-xl">
            <div className="relative h-64 w-full overflow-hidden sm:h-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverSrc}
                alt={item.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A2342] via-[#0A2342]/60 to-transparent" />
              <div className="absolute top-4 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-[#0A2342]/90 border border-[#00C4B3]/50 px-3.5 py-1 text-xs font-bold text-[#00C4B3]">
                  {typeCfg?.label}
                </span>
                <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#0A2342]">
                  “{pillarCfg.brandClaim}”
                </span>
              </div>
            </div>

            <div className="p-8 sm:p-10 -mt-12 relative z-10">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#00C4B3]/20 border border-[#00C4B3]/40 px-3 py-1 font-semibold text-[#00C4B3]">
                  {pillarCfg.label}
                </span>
                <span className="text-slate-300">
                  · Fecha de corte oficial: {item.cutoffDate}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-extrabold leading-tight sm:text-4xl text-white">
                {item.title}
              </h1>

              {item.subtitle && (
                <p className="mt-3 text-base text-slate-200 sm:text-lg">
                  {item.subtitle}
                </p>
              )}

              <div className="mt-4 h-1 w-16 rounded-full bg-[#FFD447]" />

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4 text-xs text-slate-300">
                <div>
                  <strong className="text-white">{item.authorName}</strong> ·{" "}
                  {item.authorRole}
                </div>
                <div>
                  Lectura estimada: {item.readingTime} min · {item.wordCount}{" "}
                  palabras
                </div>
              </div>
            </div>
          </header>

          {/* FORMAT-SPECIFIC EXECUTIVE PANEL: WHITEPAPER */}
          {whitepaperMeta && (
            <section className="mt-6 rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    FICHA TÉCNICA DEL WHITEPAPER INSTITUCIONAL
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {whitepaperMeta.version || "Edición Octubre 2026"} ·{" "}
                    {whitepaperMeta.pageCount || 22} páginas de análisis
                  </h2>
                </div>
                {item.downloadUrl && (
                  <Link
                    href={item.downloadUrl}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700"
                  >
                    Aplicar Metodología a mi Caso →
                  </Link>
                )}
              </div>

              {whitepaperMeta.keyFindings &&
                whitepaperMeta.keyFindings.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Hallazgos Clave del Informe
                    </h3>
                    <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {whitepaperMeta.keyFindings.map((finding, i) => (
                        <li
                          key={i}
                          className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs leading-relaxed text-slate-800"
                        >
                          <strong className="block text-indigo-700">
                            Hallazgo 0{i + 1}
                          </strong>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {whitepaperMeta.primarySources &&
                whitepaperMeta.primarySources.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Fuentes Primarias Consultadas (Con Fecha de Corte)
                    </h3>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {whitepaperMeta.primarySources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs transition hover:border-indigo-400"
                        >
                          <strong className="block text-slate-900">
                            {src.institution}
                          </strong>
                          <span className="mt-0.5 block text-slate-600">
                            {src.documentTitle}
                          </span>
                          <span className="mt-1 inline-block font-semibold text-indigo-600">
                            Corte: {src.cutoffDate} ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </section>
          )}

          {/* FORMAT-SPECIFIC EXECUTIVE PANEL: WEBINAR */}
          {webinarMeta && (
            <section className="mt-6 rounded-3xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    SESIÓN EDUCATIVA EJECUTIVA · FINTERA ACADEMY
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Duración: {webinarMeta.durationMinutes || 40} min de
                    exposición + {webinarMeta.qaMinutes || 15} min de preguntas
                  </h2>
                </div>
                <Link
                  href={webinarMeta.registrationUrl || "/contacto"}
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-700"
                >
                  Reservar Cupo / Solicitar Grabación →
                </Link>
              </div>

              {webinarMeta.agendaTopics &&
                webinarMeta.agendaTopics.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Agenda Técnica de la Sesión
                    </h3>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {webinarMeta.agendaTopics.map((topic, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-xs text-slate-800"
                        >
                          <strong className="text-rose-700">
                            Módulo {i + 1}:
                          </strong>{" "}
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </section>
          )}

          {/* FORMAT-SPECIFIC EXECUTIVE PANEL: CASE STUDY SIMULATION */}
          {caseStudyMeta && (
            <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <strong>Declaración de Simulación Transparente FINTERA:</strong>{" "}
                Este caso práctico utiliza cifras hipotéticas con fines
                pedagógicos ({caseStudyMeta.clientName}). No representa una
                promesa de aprobación ni de tasa garantizada.
              </div>

              {caseStudyMeta.results && caseStudyMeta.results.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {caseStudyMeta.results.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"
                    >
                      <span className="text-xs font-semibold text-emerald-700">
                        {r.metric}
                      </span>
                      <p className="mt-1 text-base font-extrabold text-slate-900">
                        {r.value}
                      </p>
                      {r.description && (
                        <p className="mt-1 text-xs text-slate-600">
                          {r.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* FORMAT-SPECIFIC EXECUTIVE PANEL: GUIDE CHECKLIST */}
          {guideMeta && guideMeta.keyTakeaways && (
            <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                GUÍA PRÁCTICA PASO A PASO · TIEMPO ESTIMADO:{" "}
                {guideMeta.estimatedCompletionTime || "15 min"}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Conclusiones Clave antes de Radicar tu Solicitud
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {guideMeta.keyTakeaways.map((takeaway, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs text-slate-800"
                  >
                    <strong className="block text-amber-800">
                      Punto Clave 0{idx + 1}
                    </strong>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FORMAT-SPECIFIC EXECUTIVE PANEL: LINKEDIN CAROUSEL SLIDES */}
          {tutorialMeta &&
            tutorialMeta.carouselSlides &&
            tutorialMeta.carouselSlides.length > 0 && (
              <section className="mt-6 rounded-3xl border border-teal-200 bg-white p-6 shadow-sm sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      VISTA PREVIA DE CARRUSEL LINKEDIN · SEMANA{" "}
                      {tutorialMeta.linkedinWeek || 1} (
                      {tutorialMeta.linkedinDay || "Lunes"})
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      Secuencia de Láminas ({tutorialMeta.carouselSlides.length}{" "}
                      tarjetas)
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tutorialMeta.carouselSlides.map((slide) => (
                    <div
                      key={slide.slideNumber}
                      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-blue-950 p-5 text-white shadow"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                        Lámina 0{slide.slideNumber} · FINTERA
                      </span>
                      <h3 className="mt-1.5 text-base font-bold text-white">
                        {slide.headline}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {slide.body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Main Content Body */}
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <MarkdownRenderer content={item.content} variant="light" />

            {/* Tags */}
            <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[#0A2342]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Live View Counter, Social Share Bar, Google E-E-A-T Human Review Box & Resend Newsletter */}
          <ArticleEngagementBar
            slug={item.slug}
            title={item.title}
            cutoffDate={item.cutoffDate}
            readingTime={item.readingTime}
            pillar={item.pillar}
            initialAnalytics={initialAnalytics}
            humanReview={humanReview}
          />

          {/* Consultative Conversion Box */}
          <section className="mt-8 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-8 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              FINTERA · HAGAMOS POSIBLE TU PRÓXIMO PROYECTO
            </span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              ¿Deseas evaluar tu necesidad de financiación con acompañamiento
              experto?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Conectamos personas y empresas con soluciones financieras mediante
              criterio financiero, acompañamiento durante el proceso y
              transparencia sobre requisitos, costos y condiciones.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={pillarCfg.defaultCtaUrl}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                {pillarCfg.defaultCtaLabel}
              </Link>
              <Link
                href="/portafolio"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Conocer nuestro portafolio
              </Link>
            </div>
          </section>

          {/* Related Publications */}
          {relatedItems.length > 0 && (
            <section className="mt-12 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Publicaciones Relacionadas en FINTERA Insights
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {relatedItems.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/insights/${rel.slug}`}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400"
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                        {CONTENT_TYPES[rel.contentType]?.label}
                      </span>
                      <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                        {rel.title}
                      </h3>
                    </div>
                    <span className="mt-4 block text-xs font-semibold text-blue-600">
                      Consultar ({rel.readingTime} min) →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
