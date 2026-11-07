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

interface CarouselSlide {
  slideNumber: number;
  role: "COVER" | "CONTEXT" | "INSIGHT" | "COMPARISON" | "CHECKLIST" | "CTA";
  eyebrow: string;
  headline: string;
  body: string;
  footerTag: string;
  gradientVariant: string;
  accentColor: string;
  bgImageUrl: string;
  iconImageUrl?: string;
}

interface LinkedinCarouselPdfModalProps {
  item: FinteraContentItem;
  onClose: () => void;
}

export function LinkedinCarouselPdfModal({
  item,
  onClose,
}: LinkedinCarouselPdfModalProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
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

  // Variable Enterprise Palettes based on FINTERA Brand Blueprint V1.0 (#0A2342, #00C4B3, #FFD447)
  const slideGradients = [
    {
      gradient: "from-[#07172B]/90 via-[#0A2342]/90 to-[#040D18]/95",
      accent: "#00C4B3",
      chip: "bg-[#00C4B3]/20 text-[#00C4B3] border-[#00C4B3]/40",
      bgImage: "/images/brand-system/carousel/carousel-cover-architecture.webp",
    },
    {
      gradient: "from-[#081F38]/90 via-[#0D2E55]/90 to-[#061426]/95",
      accent: "#FFD447",
      chip: "bg-[#FFD447]/20 text-[#FFD447] border-[#FFD447]/40",
      bgImage: "/images/brand-system/signatures/fintera-clarity-path.webp",
    },
    {
      gradient: "from-[#052136]/90 via-[#08384E]/90 to-[#031422]/95",
      accent: "#00C4B3",
      chip: "bg-[#00C4B3]/20 text-[#00C4B3] border-[#00C4B3]/40",
      bgImage: "/images/brand-system/signatures/fintera-financial-signal-network.webp",
    },
    {
      gradient: "from-[#091D33]/90 via-[#0F3155]/90 to-[#061424]/95",
      accent: "#38BDF8",
      chip: "bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40",
      bgImage: "/images/brand-system/carousel/carousel-data-comparison.webp",
    },
    {
      gradient: "from-[#082433]/90 via-[#0B3A48]/90 to-[#04151E]/95",
      accent: "#34D399",
      chip: "bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40",
      bgImage: "/images/brand-system/signatures/fintera-knowledge-grid.webp",
    },
    {
      gradient: "from-[#091C36]/90 via-[#0E2C52]/90 to-[#051122]/95",
      accent: "#FFD447",
      chip: "bg-[#FFD447]/20 text-[#FFD447] border-[#FFD447]/40",
      bgImage: "/images/brand-system/carousel/carousel-cta-final.webp",
    },
  ];

  const slides: CarouselSlide[] = useMemo(() => {
    const tutorialMeta = item.typeMetadata as unknown as TutorialMetadata;
    if (
      tutorialMeta?.carouselSlides &&
      Array.isArray(tutorialMeta.carouselSlides) &&
      tutorialMeta.carouselSlides.length > 0
    ) {
      return tutorialMeta.carouselSlides.map((s, idx) => {
        const styleVariant = slideGradients[idx % slideGradients.length];
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
          gradientVariant: styleVariant.gradient,
          accentColor: styleVariant.accent,
          bgImageUrl: styleVariant.bgImage,
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
      "gradientVariant" | "accentColor" | "bgImageUrl"
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
        iconImageUrl: "/images/brand-system/icons/icon-03-gestion-documental.webp",
      },
      {
        slideNumber: 6,
        role: "CTA",
        eyebrow: "HAGAMOS POSIBLE TU PRÓXIMO PROYECTO",
        headline: pillarCfg.defaultCtaLabel,
        body: `Consulta el análisis completo en www.finterasoluciones.co/insights/${item.slug} o simula tu operación en línea. Por seguridad (Ley 1581 Habeas Data), nunca compartas cédula, NIT ni extractos en comentarios públicos.`,
        footerTag: "www.finterasoluciones.co · Colombia",
      },
    ];

    return baseSlides.map((s, idx) => {
      const styleVariant = slideGradients[idx % slideGradients.length];
      return {
        ...s,
        gradientVariant: styleVariant.gradient,
        accentColor: styleVariant.accent,
        bgImageUrl: styleVariant.bgImage,
      };
    });
  }, [item, pillarCfg, pillarConceptIcon]);

  const utmUrl = `https://www.finterasoluciones.co/insights/${item.slug}?utm_source=linkedin&utm_medium=carousel_pdf&utm_campaign=${item.pillar.toLowerCase()}_2026`;

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
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const win = window.open("", "_blank", "width=1080,height=900");
    if (!win) return;

    const slidesHtml = slides
      .map(
        (s, idx) => `
      <div class="slide slide-${idx + 1}" style="background-image: linear-gradient(180deg, rgba(7, 23, 43, 0.88) 0%, rgba(10, 35, 66, 0.94) 100%), url('${origin}${s.bgImageUrl}');">
        <div class="top-row">
          <div class="brand-brandmark">
            <img src="${origin}/images/shieldlogo.png" alt="FINTERA" class="logo-shield" />
            <div>
              <span class="brand-title">FINTERA</span>
              <span class="brand-sub">Banca Hipotecaria & B2B</span>
            </div>
          </div>
          <div class="top-meta">
            <span class="eyebrow">${s.eyebrow}</span>
            <span class="slide-num">LÁMINA 0${s.slideNumber} / 0${slides.length}</span>
          </div>
        </div>

        <div class="middle">
          ${
            s.iconImageUrl
              ? `
            <div class="icon-container">
              <img src="${origin}${s.iconImageUrl}" alt="Icono" class="slide-icon" />
              <div class="accent-bar" style="background: ${s.accentColor};"></div>
            </div>
          `
              : `<div class="accent-bar" style="background: ${s.accentColor};"></div>`
          }
          <h1>${s.headline}</h1>
          <p>${s.body}</p>
        </div>

        <div class="bottom-row">
          <div>
            <span class="claim">${s.footerTag}</span>
            <span class="sub-claim">Inteligencia Financiera con Trato Humano · Colombia</span>
          </div>
          <div class="badge-wrapper">
            <span class="badge">Auditoría E-E-A-T · Fuentes Primarias</span>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Carrusel LinkedIn FINTERA (1080x1350) - ${item.slug}</title>
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
            width: 1080px;
            height: 1350px;
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

          .top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.22);
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
            color: #FFFFFF;
            display: block;
            line-height: 1;
          }
          .brand-sub {
            font-size: 16px;
            color: #00C4B3;
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
            color: #00C4B3;
            text-transform: uppercase;
          }
          .slide-num {
            font-size: 20px;
            font-weight: 800;
            color: #FFD447;
            background: rgba(255, 212, 71, 0.15);
            border: 1.5px solid rgba(255, 212, 71, 0.5);
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
            color: #FFFFFF;
            margin-bottom: 34px;
            letter-spacing: -0.01em;
            text-shadow: 0 2px 8px rgba(0,0,0,0.5);
          }
          p {
            font-size: 31px;
            line-height: 1.55;
            color: #F1F5F9;
            font-weight: 400;
            text-shadow: 0 1px 4px rgba(0,0,0,0.4);
          }
          .bottom-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid rgba(255,255,255,0.22);
            padding-top: 36px;
          }
          .claim {
            font-size: 22px;
            font-weight: 700;
            color: #00C4B3;
            display: block;
          }
          .sub-claim {
            font-size: 16px;
            color: #CBD5E1;
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
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="admin-card max-h-[92vh] w-full max-w-5xl overflow-y-auto space-y-5 border border-[#00C4B3]/40 bg-[#081226] text-white">
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C4B3] flex items-center gap-1.5">
                <Layers size={13} />
                FINTERA LinkedIn Carousel Studio · Sistema Visual de Marca V1.0 (4:5)
              </span>
              <h2 className="text-base font-extrabold text-white">
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
              className="admin-button text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <X size={15} />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* Copyable LinkedIn Post Caption + UTM */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD447]">
              Copy Sugerido para el Post de LinkedIn (Con Enlace UTM de Atribución)
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
          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
            {linkedinCaption}
          </pre>
        </div>

        {/* 6-Slide Visual Preview Grid with Dynamic Real Creative Assets, Logos & High-Contrast Typography */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Palette size={15} className="text-[#00C4B3]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Vista Previa de las {slides.length} Láminas · Arquitectura Creativa FINTERA (#0A2342, #00C4B3, #FFD447)
              </span>
            </div>
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <ShieldCheck size={14} />
              Cumple Ley 1581 y Regla Editorial FINTERA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((s, idx) => {
              const styleVariant = slideGradients[idx % slideGradients.length];
              return (
                <div
                  key={s.slideNumber}
                  className="flex flex-col justify-between rounded-2xl border border-slate-700/80 p-5 text-white shadow-2xl min-h-[340px] transition-transform hover:-translate-y-1 duration-200 relative overflow-hidden group"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(7, 23, 43, 0.88) 0%, rgba(10, 35, 66, 0.94) 100%), url('${s.bgImageUrl}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Subtle lighting mesh */}
                  <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-400/15 blur-2xl" />

                  <div className="space-y-3 relative z-10">
                    {/* Top Row with Official Shield Logo & Slide Number */}
                    <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Image
                          src="/images/shieldlogo.png"
                          width={20}
                          height={20}
                          alt="FINTERA"
                          unoptimized
                          className="object-contain shrink-0"
                        />
                        <span className="font-black text-[12px] tracking-wider text-white">
                          FINTERA
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${styleVariant.chip}`}
                      >
                        0{s.slideNumber}/0{slides.length}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00C4B3] block truncate">
                        {s.eyebrow}
                      </span>

                      {/* Concept icon if applicable */}
                      {s.iconImageUrl ? (
                        <div className="mt-2 mb-2 flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#00C4B3]/50 bg-slate-900/90 p-1 shadow-md">
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

                      <h3 className="text-sm font-extrabold leading-snug text-white drop-shadow-md">
                        {s.headline}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-100 font-normal drop-shadow-sm line-clamp-5">
                        {s.body}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-2.5 text-[10px] relative z-10">
                    <span className="font-semibold text-slate-300 truncate max-w-[190px]">
                      {s.footerTag}
                    </span>
                    <span className="font-bold text-[#00C4B3]">
                      Colombia
                    </span>
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
