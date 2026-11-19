"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  FileDown,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  X,
  FileText,
  BadgeCheck,
} from "lucide-react";
import {
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
  TutorialMetadata,
} from "@/lib/content-types";
import type { FinteraContentItem } from "@/lib/blog";
import { isDevelopedCalendarItem } from "@/lib/linkedin-calendar";
import "./linkedin-carousel.css";

function escapeHtml(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  const clean = String(url).trim();
  if (/^(?:https?:|\/|data:image\/)/i.test(clean)) {
    return clean.replace(/"/g, "%22").replace(/'/g, "%27");
  }
  return "";
}

interface CarouselSlide {
  slideNumber: number;
  role: "COVER" | "CONTEXT" | "INSIGHT" | "COMPARISON" | "CHECKLIST" | "CTA";
  eyebrow: string;
  headline: string;
  body: string;
  footerTag: string;
  accentColor: string;
  bgImageUrl: string;
  tone: "light" | "dark";
  iconImageUrl?: string;
}

interface LinkedinCarouselPdfModalProps {
  item: FinteraContentItem;
  onClose: () => void;
}

// Variable Enterprise Palettes based on FINTERA Brand Blueprint V1.0 (#0A2342, #00C4B3, #FFD447)
const slideStyles = [
  {
    accent: "#00C4B3",
    tone: "dark" as const,
    bgImage: "/images/brand-system/carousel/carousel-cover-architecture.webp",
  },
  {
    accent: "#FFD447",
    tone: "light" as const,
    bgImage: "/images/brand-system/signatures/fintera-clarity-path.webp",
  },
  {
    accent: "#00C4B3",
    tone: "light" as const,
    bgImage:
      "/images/brand-system/signatures/fintera-financial-signal-network.webp",
  },
  {
    accent: "#38BDF8",
    tone: "light" as const,
    bgImage: "/images/brand-system/carousel/carousel-data-comparison.webp",
  },
  {
    accent: "#34D399",
    tone: "dark" as const,
    bgImage: "/images/brand-system/signatures/fintera-knowledge-grid.webp",
  },
  {
    accent: "#FFD447",
    tone: "dark" as const,
    bgImage: "/images/brand-system/carousel/carousel-cta-final.webp",
  },
];

export function LinkedinCarouselPdfModal({
  item,
  onClose,
}: LinkedinCarouselPdfModalProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const exportBlocked = !isDevelopedCalendarItem(item);
  const pillarCfg =
    FINTERA_CONTENT_PILLARS[item.pillar as FinteraContentPillarKey] ||
    FINTERA_CONTENT_PILLARS.VIVIENDA_B2C;

  // Resolving Pillar-Specific Concept Icon for Slide 3
  const pillarConceptIcon = useMemo(() => {
    switch (item.pillar) {
      case "FACTORING_B2B":
        return "/images/brand-system/icons/icon-07-liquidez-factoring.webp";
      case "AUTORIDAD_MERCADO":
        return "/images/brand-system/icons/icon-08-inteligencia-analitica.webp";
      case "CONFIANZA_OPORTUNIDADES":
        return "/images/brand-system/icons/icon-02-comparador-multibanco.webp";
      case "VIVIENDA_B2C":
      default:
        return "/images/brand-system/icons/icon-01-credito-vivienda.webp";
    }
  }, [item.pillar]);

  const slides: CarouselSlide[] = useMemo(() => {
    const tutorialMeta = item.typeMetadata as unknown as TutorialMetadata;
    if (
      tutorialMeta?.carouselSlides &&
      Array.isArray(tutorialMeta.carouselSlides) &&
      tutorialMeta.carouselSlides.length > 0
    ) {
      return tutorialMeta.carouselSlides.map((s, idx) => {
        const styleVariant = slideStyles[idx % slideStyles.length];
        const roles: CarouselSlide["role"][] = [
          "COVER",
          "CONTEXT",
          "INSIGHT",
          "COMPARISON",
          "CHECKLIST",
          "CTA",
        ];
        return {
          slideNumber: s.slideNumber,
          role: roles[idx % roles.length],
          eyebrow: `${pillarCfg.shortLabel} · Corte: ${item.cutoffDate || "Octubre 2026"}`,
          headline: s.headline,
          body: s.body,
          footerTag: pillarCfg.brandClaim,
          accentColor: styleVariant.accent,
          bgImageUrl: styleVariant.bgImage,
          tone: styleVariant.tone,
          iconImageUrl:
            idx === 2
              ? pillarConceptIcon
              : idx === 4
                ? "/images/brand-system/icons/icon-03-gestion-documental.webp"
                : undefined,
        };
      });
    }

    // Auto-extract headings and paragraphs from Markdown content to build a cohesive 6-slide deck
    const h2Matches = item.content
      .split(/\n+/)
      .filter((line) => line.trim().startsWith("## "))
      .map((line) => line.replace(/^##\s+/, "").trim());

    const baseSlides: Omit<
      CarouselSlide,
      "accentColor" | "bgImageUrl" | "tone"
    >[] = [
      {
        slideNumber: 1,
        role: "COVER",
        eyebrow: `FINTERA INSIGHTS · ${pillarCfg.shortLabel.toUpperCase()}`,
        headline: item.title,
        body:
          item.subtitle ||
          item.excerpt ||
          "Análisis estructurado con fuentes oficiales de Colombia y criterio financiero FINTERA.",
        footerTag: `“${pillarCfg.brandClaim}”`,
      },
      {
        slideNumber: 2,
        role: "CONTEXT",
        eyebrow: `1. HECHO Y CONTEXTO OFICIAL (${item.cutoffDate || "Octubre 2026"})`,
        headline:
          h2Matches[0] || "Contexto Regulatorio y de Mercado en Colombia",
        body:
          item.excerpt ||
          "Separamos el dato oficial publicado por Superfinanciera, Banco de la República, DANE y DIAN/RADIAN de nuestra interpretación consultiva.",
        footerTag: "Fuentes Oficiales · Regla Editorial FINTERA",
      },
      {
        slideNumber: 3,
        role: "INSIGHT",
        eyebrow: "2. CRITERIO FINANCIERO FINTERA",
        headline:
          h2Matches[1] ||
          "Variables Críticas más allá de la Tasa de Interés Nominal",
        body:
          item.pillar === "FACTORING_B2B"
            ? "Antes de descontar una factura electrónica, verifica los 3 eventos obligatorios en RADIAN (030 Acuse, 032 Recibo del bien/servicio y 033/034 Aceptación) y compara el costo financiero frente al descuento por pronto pago de tus proveedores."
            : "Antes de elegir entre pesos (cuota fija), UVR o leasing habitacional, evalúa la cuota total con seguros, el límite DTI del 30%–40% (Ley 546) y reserva entre 3% y 4% para gastos de escrituración y registro.",
        footerTag: "Criterio Financiero · Acompañamiento · Transparencia",
        iconImageUrl: pillarConceptIcon,
      },
      {
        slideNumber: 4,
        role: "COMPARISON",
        eyebrow: "3. EJERCICIO PRÁCTICO CON SUPUESTOS TRANSPARENTES",
        headline:
          h2Matches[2] || "Simulación Ilustrativa para Tomar Decisiones Claras",
        body:
          item.pillar === "FACTORING_B2B"
            ? "En una factura a 90 días, liberar caja en 48–72 horas permite capturar descuentos comerciales por pronto pago de insumos que frecuentemente superan el costo del descuento financiero."
            : "En un crédito de vivienda a 15 o 20 años, comparar entre 8+ entidades vigiladas y preparar tu carpeta documental sin inconsistencias reduce reprocesos y mejora las condiciones de aprobación.",
        footerTag: "Nota: Simulación pedagógica sujeta a estudio de crédito",
      },
      {
        slideNumber: 5,
        role: "CHECKLIST",
        eyebrow: "4. LISTA DE VERIFICACIÓN EJECUTIVA",
        headline: "3 Preguntas Clave antes de Radicar tu Operación",
        body:
          item.pillar === "FACTORING_B2B"
            ? "1) ¿Tus facturas tienen los 3 eventos inscritos en RADIAN (DIAN)? 2) ¿Cuánto te cuesta esperar 60–90 días frente a comprar insumos de contado? 3) ¿Conoces el cupo crediticio de tu pagador?"
            : "1) ¿Tu primera cuota mensual (incluyendo seguros) respeta el tope de Ley 546? 2) ¿Tienes listos tus extractos y soportes vigentes en un solo expediente? 3) ¿Comparaste más de una entidad vigilada?",
        footerTag: "Señales de Claridad · FINTERA Soluciones Financieras",
        iconImageUrl:
          "/images/brand-system/icons/icon-03-gestion-documental.webp",
      },
      {
        slideNumber: 6,
        role: "CTA",
        eyebrow: "HAGAMOS POSIBLE TU PRÓXIMO PROYECTO",
        headline: pillarCfg.defaultCtaLabel,
        body: "Lee el análisis completo y explora tu escenario en el simulador.",
        footerTag: "www.finterasoluciones.co · Colombia",
      },
    ];

    return baseSlides.map((s, idx) => {
      const styleVariant = slideStyles[idx % slideStyles.length];
      return {
        ...s,
        accentColor: styleVariant.accent,
        bgImageUrl: styleVariant.bgImage,
        tone: styleVariant.tone,
      };
    });
  }, [item, pillarCfg, pillarConceptIcon]);

  const utmUrl = `https://www.finterasoluciones.co/insights/${encodeURIComponent(item.slug)}?utm_source=linkedin&utm_medium=carousel_pdf&utm_campaign=${item.pillar.toLowerCase()}_2026`;
  const simulatorUrl = `https://www.finterasoluciones.co/simulador?utm_source=linkedin&utm_medium=carousel_pdf&utm_campaign=${item.pillar.toLowerCase()}_2026`;
  const privacyCopy =
    "Protege tus datos (Ley 1581 · Habeas Data): no compartas cédula, NIT ni extractos en comentarios públicos. Usa los canales privados de FINTERA.";

  const linkedinCaption = useMemo(() => {
    return `${item.title}\n\n${item.excerpt}\n\n📌 Principio FINTERA ("Primero la respuesta"):\n• Fecha de corte de fuentes oficiales: ${
      item.cutoffDate || "Octubre 2026"
    }\n• “${pillarCfg.brandClaim}”\n\n👉 Lee el análisis completo y simula tu escenario aquí:\n${utmUrl}\n\n🔒 Nota de seguridad (Ley 1581 Habeas Data): Nunca compartas datos confidenciales (cédula, NIT, ingresos o extractos) en comentarios públicos.\n\n#Fintera #Colombia #EducacionFinanciera #${
      item.pillar === "FACTORING_B2B"
        ? "Factoring #RADIAN #LiquidezEmpresarial #PymesColombia"
        : "CreditoDeVivienda #ViviendaColombia #FinanzasPersonales"
    }`;
  }, [item, pillarCfg, utmUrl]);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(linkedinCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      // Ignore clipboard fallback
    }
  };

  const handlePrintPdfDeck = () => {
    if (exportBlocked) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const win = window.open("", "_blank", "width=1080,height=900");
    if (!win) return;

    const slidesHtml = slides
      .map(
        (s, idx) => `
      <div class="slide slide-${idx + 1}" data-tone="${s.tone}" style="background-image: url('${sanitizeUrl(origin + s.bgImageUrl)}');">
        <div class="top-row">
          <div class="brand-brandmark">
            <img src="${sanitizeUrl(origin + "/images/shieldlogo.png")}" alt="FINTERA" class="logo-shield" />
            <div>
              <span class="brand-title">FINTERA</span>
              <span class="brand-sub">Banca Hipotecaria & B2B</span>
            </div>
          </div>
          <div class="top-meta">
            <span class="eyebrow">${escapeHtml(s.eyebrow)}</span>
            <span class="slide-num">LÁMINA 0${escapeHtml(s.slideNumber)} / 0${escapeHtml(slides.length)}</span>
          </div>
        </div>

        <div class="middle">
          ${
            s.iconImageUrl
              ? `
            <div class="icon-container">
              <img src="${sanitizeUrl(origin + s.iconImageUrl)}" alt="Icono" class="slide-icon" />
              <div class="accent-bar" style="background: ${escapeHtml(s.accentColor)};"></div>
            </div>
          `
              : `<div class="accent-bar" style="background: ${escapeHtml(s.accentColor)};"></div>`
          }
          <h1>${escapeHtml(s.headline)}</h1>
          ${
            s.role === "CTA"
              ? `
          <div class="cta-content">
            <p class="slide-prose">Lee el análisis completo y explora tu escenario en el simulador.</p>
            <a class="cta-link" href="${escapeHtml(utmUrl)}" target="_blank" rel="noopener noreferrer"><strong>Leer el análisis completo</strong><span>finterasoluciones.co/insights</span></a>
            <a class="cta-link" href="${escapeHtml(simulatorUrl)}" target="_blank" rel="noopener noreferrer"><strong>Explorar el simulador</strong><span>finterasoluciones.co/simulador</span></a>
            <p class="slide-prose privacy-note">${escapeHtml(privacyCopy)}</p>
          </div>`
              : `<p class="slide-prose">${escapeHtml(s.body)}</p>`
          }
        </div>

        <div class="bottom-row">
          <div>
            <span class="claim">${escapeHtml(s.footerTag)}</span>
            <span class="sub-claim">Inteligencia Financiera con Trato Humano · Colombia</span>
          </div>
          <div class="badge-wrapper">
            <span class="badge">Auditoría E-E-A-T · Fuentes Primarias</span>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Carrusel LinkedIn FINTERA (1080x1350) - ${escapeHtml(item.slug)}</title>
        <style>
          @page {
            size: 1080px 1350px;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #061529;
            color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .slide {
            --deck-text: #ffffff;
            --deck-body: #f1f5f9;
            --deck-muted: #cbd5e1;
            --deck-accent: #00c4b3;
            --deck-warm: #ffd447;
            --deck-line: rgba(255,255,255,0.22);
            --deck-chip-bg: rgba(255,212,71,0.15);
            --deck-chip-line: rgba(255,212,71,0.5);
            --deck-shadow: 0 1px 4px rgba(0,0,0,0.4);
            width: 1080px;
            height: 1350px;
            aspect-ratio: 4/5;
            padding: 96px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            position: relative;
            background-size: cover;
            background-position: center;
            border-bottom: 12px solid #00C4B3;
          }

          .slide[data-tone="light"] {
            --deck-text: #0a2342;
            --deck-body: #0a2342;
            --deck-muted: #334155;
            --deck-accent: #006b62;
            --deck-warm: #805600;
            --deck-line: rgba(10,35,66,0.25);
            --deck-chip-bg: rgba(128,86,0,0.08);
            --deck-chip-line: rgba(128,86,0,0.5);
            --deck-shadow: none;
          }
          .top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--deck-line);
            padding-bottom: 34px;
          }
          .brand-brandmark {
            display: flex;
            align-items: center;
            gap: 18px;
          }
          .logo-shield {
            width: 62px;
            height: 62px;
            object-fit: contain;
          }
          .brand-title {
            font-size: 30px;
            font-weight: 900;
            letter-spacing: 0.12em;
            color: var(--deck-text);
            display: block;
            line-height: 1;
          }
          .brand-sub {
            font-size: 16px;
            color: var(--deck-accent);
            letter-spacing: 0.05em;
            margin-top: 6px;
            display: block;
          }
          .top-meta {
            display: flex;
            align-items: center;
            gap: 18px;
          }
          .eyebrow {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: var(--deck-accent);
            text-transform: uppercase;
          }
          .slide-num {
            font-size: 20px;
            font-weight: 800;
            color: var(--deck-warm);
            background: var(--deck-chip-bg);
            border: 1.5px solid var(--deck-chip-line);
            padding: 10px 24px;
            border-radius: 999px;
          }
          .middle {
            margin: auto 0;
            max-width: 900px;
          }
          .icon-container {
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 32px;
          }
          .slide-icon {
            width: 88px;
            height: 88px;
            border-radius: 20px;
            border: 2px solid rgba(0, 196, 179, 0.5);
            background: rgba(10, 35, 66, 0.9);
            padding: 8px;
            object-fit: contain;
            box-shadow: 0 12px 24px rgba(0,0,0,0.4);
          }
          .accent-bar {
            width: 110px;
            height: 10px;
            border-radius: 999px;
            margin-bottom: 32px;
          }
          h1 {
            font-size: 54px;
            line-height: 1.2;
            font-weight: 900;
            color: var(--deck-text);
            margin-bottom: 34px;
            letter-spacing: -0.01em;
            text-shadow: var(--deck-shadow);
          }
          .slide-prose {
            text-align: justify;
            text-align-last: start;
            overflow-wrap: break-word;
            hyphens: auto;
            font-size: 31px;
            line-height: 1.55;
            color: var(--deck-body);
            font-weight: 400;
            text-shadow: var(--deck-shadow);
          }
          .cta-content { display: grid; gap: 24px; }
          .cta-link { display: block; width: fit-content; max-width: 100%; color: var(--deck-text); text-align: left; text-decoration: none; }
          .cta-link strong { display: block; font-size: 29px; line-height: 1.3; text-decoration: underline; text-underline-offset: 5px; }
          .cta-link span { display: block; font-size: 23px; line-height: 1.4; color: var(--deck-muted); margin-top: 5px; overflow-wrap: anywhere; }
          .privacy-note { font-size: 24px; line-height: 1.5; padding-top: 22px; border-top: 1px solid var(--deck-line); }
          .bottom-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid var(--deck-line);
            padding-top: 36px;
          }
          .claim {
            font-size: 22px;
            font-weight: 700;
            color: var(--deck-accent);
            display: block;
          }
          .sub-claim {
            font-size: 16px;
            color: var(--deck-muted);
            margin-top: 6px;
            display: block;
          }
          .badge {
            font-size: 19px;
            font-weight: 800;
            color: #0A2342;
            background: #00C4B3;
            padding: 14px 28px;
            border-radius: 14px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        ${slidesHtml}
        <script>
          async function waitForAssetsAndPrint() {
            try {
              // 1. Wait for document fonts
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }
              // Background images must load as well as logos before printing.
              const backgroundUrls = ${JSON.stringify(slides.map((slide) => origin + slide.bgImageUrl))};
              await Promise.all(backgroundUrls.map((url) => new Promise((resolve, reject) => {
                const asset = new Image(); asset.onload = resolve; asset.onerror = reject; asset.src = url;
              })));
              const images = Array.from(document.querySelectorAll('img'));
              await Promise.all(images.map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true });
                });
              }));
              // 3. Render stabilization tick
              await new Promise((r) => setTimeout(r, 150));
              window.print();
            } catch (err) {
              console.warn('Print assets unavailable:', err);
              document.title = 'No se pudo cargar una imagen. Recarga la exportación antes de imprimir.';
            }
          }

          if (document.readyState === 'complete') {
            waitForAssetsAndPrint();
          } else {
            window.addEventListener('load', waitForAssetsAndPrint, { once: true });
          }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (exportBlocked) {
    const state = item.typeMetadata.calendarGenerationStatus;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="carousel-unavailable-title"
          className="fintera-carousel-studio admin-card w-full max-w-lg space-y-4"
        >
          <h2
            id="carousel-unavailable-title"
            className="carousel-studio-heading text-lg font-bold"
          >
            Carrusel todavía no disponible
          </h2>
          <p className="carousel-studio-copy text-sm">
            {state === "PENDING"
              ? "La pieza se está desarrollando. Espera a que el contenido esté confirmado antes de abrir su carrusel."
              : state === "FAILED"
                ? "El desarrollo de la pieza no se completó. Revisa su estado en el calendario; no se ha preparado un carrusel sustituto."
                : "Esta pieza aún no tiene contenido desarrollado confirmado. No se puede previsualizar ni exportar como un artículo terminado."}
          </p>
          <button type="button" onClick={onClose} className="admin-button">
            Cerrar
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="fintera-carousel-studio admin-card max-h-[92vh] w-full max-w-5xl overflow-y-auto space-y-5 border border-[#00C4B3]/40">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
              <Image
                src="/images/shieldlogo.png"
                width={28}
                height={28}
                alt="FINTERA"
                unoptimized
                className="object-contain"
              />
            </div>
            <div>
              <span className="carousel-studio-label text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} />
                FINTERA LinkedIn Carousel Studio · Sistema Visual de Marca V1.0
                (4:5)
              </span>
              <h2 className="carousel-studio-heading text-base font-extrabold">
                {item.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdfDeck}
              className="admin-button admin-button-primary text-xs flex items-center gap-2"
            >
              <FileDown size={15} />
              <span>Exportar PDF 1080×1350 para LinkedIn</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="admin-button text-xs flex items-center gap-1.5"
            >
              <X size={15} />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Copyable LinkedIn Post Caption + UTM */}
        <div className="carousel-caption rounded-xl border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="carousel-studio-label text-xs font-bold uppercase tracking-wider">
              Copy Sugerido para el Post de LinkedIn (Con Enlace UTM de
              Atribución)
            </span>
            <button
              type="button"
              onClick={handleCopyCaption}
              className="admin-button text-xs"
            >
              {copiedCaption ? (
                <CheckCircle2 size={13} className="text-emerald-400" />
              ) : (
                <ClipboardCopy size={13} />
              )}
              <span>
                {copiedCaption
                  ? "¡Copy y UTM Copiados!"
                  : "Copiar Texto para LinkedIn"}
              </span>
            </button>
          </div>
          <pre
            tabIndex={0}
            role="region"
            aria-label="Texto sugerido para LinkedIn; desplázate para leerlo completo"
            className="carousel-studio-copy whitespace-pre-wrap font-sans text-xs leading-relaxed max-h-36 overflow-y-auto"
          >
            {linkedinCaption}
          </pre>
        </div>

        {/* 6-Slide Visual Preview Grid with Dynamic Real Creative Assets, Logos & High-Contrast Typography */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Palette size={15} className="text-[#00C4B3]" />
              <span className="carousel-studio-label text-xs font-bold uppercase tracking-wider">
                Vista Previa de las {slides.length} Láminas · Arquitectura
                Creativa FINTERA (#0A2342, #00C4B3, #FFD447)
              </span>
            </div>
            <span className="carousel-studio-label text-xs flex items-center gap-1 font-semibold">
              <ShieldCheck size={14} />
              Cumple Ley 1581 y Regla Editorial FINTERA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((s) => {
              return (
                <div
                  key={s.slideNumber}
                  data-tone={s.tone}
                  className="fintera-carousel-slide flex flex-col justify-between rounded-2xl border border-slate-700/80 p-6 shadow-2xl aspect-[4/5] min-h-[420px] transition-transform hover:-translate-y-1 duration-200 relative overflow-hidden group"
                  style={{
                    backgroundImage: `url('${s.bgImageUrl}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="space-y-3 relative z-10">
                    {/* Top Row with Official Shield Logo & Slide Number */}
                    <div className="carousel-top flex items-center justify-between border-b pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Image
                          src="/images/shieldlogo.png"
                          width={20}
                          height={20}
                          alt="FINTERA"
                          unoptimized
                          className="object-contain shrink-0"
                        />
                        <span className="carousel-brand font-black text-[12px] tracking-wider">
                          FINTERA
                        </span>
                      </div>
                      <span className="carousel-number rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border">
                        0{s.slideNumber}/0{slides.length}
                      </span>
                    </div>

                    <div>
                      <span className="carousel-eyebrow text-[10px] font-bold uppercase tracking-wider block">
                        {s.eyebrow}
                      </span>

                      {/* Concept icon if applicable */}
                      {s.iconImageUrl ? (
                        <div className="mt-2 mb-2 flex items-center gap-3">
                          <div className="carousel-icon h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#00C4B3]/50 p-1 shadow-md">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.iconImageUrl}
                              alt="Icono"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div
                            className="h-1 w-12 rounded-full"
                            style={{ backgroundColor: s.accentColor }}
                          />
                        </div>
                      ) : (
                        <div
                          className="h-1 w-10 rounded-full mt-1.5 mb-2.5"
                          style={{ backgroundColor: s.accentColor }}
                        />
                      )}

                      <h3 className="carousel-heading text-sm font-extrabold leading-snug">
                        {s.headline}
                      </h3>
                      {s.role === "CTA" ? (
                        <div className="carousel-cta mt-3 space-y-3">
                          <p className="carousel-prose text-xs leading-relaxed">
                            Lee el análisis completo y explora tu escenario en
                            el simulador.
                          </p>
                          <a
                            className="carousel-link"
                            href={utmUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <strong>Leer el análisis completo</strong>
                            <span>finterasoluciones.co/insights</span>
                          </a>
                          <a
                            className="carousel-link"
                            href={simulatorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <strong>Explorar el simulador</strong>
                            <span>finterasoluciones.co/simulador</span>
                          </a>
                          <p className="carousel-prose carousel-privacy text-[10px] leading-relaxed">
                            {privacyCopy}
                          </p>
                        </div>
                      ) : (
                        <p className="carousel-prose mt-2 text-xs leading-relaxed font-normal">
                          {s.body}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="carousel-bottom mt-4 flex items-center justify-between border-t pt-2.5 text-[10px] relative z-10">
                    <span className="carousel-footer font-semibold max-w-[190px]">
                      {s.footerTag}
                    </span>
                    <span className="carousel-country font-bold">Colombia</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
