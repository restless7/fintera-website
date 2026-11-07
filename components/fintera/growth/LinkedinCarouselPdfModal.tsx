"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCopy,
  FileDown,
  Layers,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
  TutorialMetadata,
} from "@/lib/content-types";
import type { FinteraContentItem } from "@/lib/blog";

interface CarouselSlide {
  slideNumber: number;
  eyebrow: string;
  headline: string;
  body: string;
  footerTag: string;
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

  const slides: CarouselSlide[] = useMemo(() => {
    const tutorialMeta = item.typeMetadata as unknown as TutorialMetadata;
    if (
      tutorialMeta?.carouselSlides &&
      Array.isArray(tutorialMeta.carouselSlides) &&
      tutorialMeta.carouselSlides.length > 0
    ) {
      return tutorialMeta.carouselSlides.map((s) => ({
        slideNumber: s.slideNumber,
        eyebrow: `${pillarCfg.shortLabel} · Corte: ${item.cutoffDate || "Octubre 2026"}`,
        headline: s.headline,
        body: s.body,
        footerTag: pillarCfg.brandClaim,
      }));
    }

    // Auto-extract headings and paragraphs from Markdown content to build a 6-slide deck
    const h2Matches = item.content
      .split(/\n+/)
      .filter((line) => line.trim().startsWith("## "))
      .map((line) => line.replace(/^##\s+/, "").trim());

    return [
      {
        slideNumber: 1,
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
        eyebrow: "2. CRITERIO FINANCIERO FINTERA",
        headline:
          h2Matches[1] ||
          "Variables Críticas más allá de la Tasa de Interés Nominal",
        body:
          item.pillar === "FACTORING_B2B"
            ? "Antes de descontar una factura electrónica, verifica los 3 eventos obligatorios en RADIAN (030 Acuse, 032 Recibo del bien/servicio y 033/034 Aceptación) y compara el costo financiero frente al descuento por pronto pago de tus proveedores."
            : "Antes de elegir entre pesos (cuota fija), UVR o leasing habitacional, evalúa la cuota total con seguros, el límite DTI del 30%–40% (Ley 546) y reserva entre 3% y 4% para gastos de escrituración y registro.",
        footerTag: "Criterio Financiero · Acompañamiento · Transparencia",
      },
      {
        slideNumber: 4,
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
        eyebrow: "4. LISTA DE VERIFICACIÓN EJECUTIVA",
        headline: "3 Preguntas Clave antes de Radicar tu Operación",
        body:
          item.pillar === "FACTORING_B2B"
            ? "1) ¿Tus facturas tienen los 3 eventos inscritos en RADIAN (DIAN)? 2) ¿Cuánto te cuesta esperar 60–90 días frente a comprar insumos de contado? 3) ¿Conoces el cupo crediticio de tu pagador?"
            : "1) ¿Tu primera cuota mensual (incluyendo seguros) respeta el tope de Ley 546? 2) ¿Tienes listos tus extractos y soportes vigentes en un solo expediente? 3) ¿Comparaste más de una entidad vigilada?",
        footerTag: "Señales de Claridad · FINTERA Soluciones Financieras",
      },
      {
        slideNumber: 6,
        eyebrow: "HAGAMOS POSIBLE TU PRÓXIMO PROYECTO",
        headline: pillarCfg.defaultCtaLabel,
        body: `Consulta el análisis completo en www.finterasoluciones.co/insights/${item.slug} o simula tu operación en línea. Por seguridad (Ley 1581 Habeas Data), nunca compartas cédula, NIT ni extractos en comentarios públicos.`,
        footerTag: "www.finterasoluciones.co · Colombia",
      },
    ];
  }, [item, pillarCfg]);

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
    const win = window.open("", "_blank", "width=1080,height=900");
    if (!win) return;

    const slidesHtml = slides
      .map(
        (s) => `
      <div class="slide">
        <div class="top-row">
          <span class="eyebrow">${s.eyebrow}</span>
          <span class="slide-num">LÁMINA 0${s.slideNumber} / 0${slides.length}</span>
        </div>
        <div class="middle">
          <div class="accent-bar"></div>
          <h1>${s.headline}</h1>
          <p>${s.body}</p>
        </div>
        <div class="bottom-row">
          <div>
            <strong class="brand">FINTERA</strong>
            <span class="claim">${s.footerTag}</span>
          </div>
          <span class="badge">QA Verificado · ${item.qaScore}/100</span>
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
        <title>Carrusel LinkedIn FINTERA - ${item.slug}</title>
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
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #061529;
            color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .slide {
            width: 1080px;
            height: 1350px;
            padding: 88px;
            background: radial-gradient(circle at top right, rgba(0, 196, 179, 0.22), transparent 55%), #0A2342;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            border-bottom: 8px solid #00C4B3;
            position: relative;
          }
          .top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.15);
            padding-bottom: 28px;
          }
          .eyebrow {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.08em;
            color: #00C4B3;
            text-transform: uppercase;
          }
          .slide-num {
            font-size: 20px;
            font-weight: 700;
            color: #FFD447;
            background: rgba(255, 212, 71, 0.14);
            border: 1px solid rgba(255, 212, 71, 0.4);
            padding: 10px 22px;
            border-radius: 999px;
          }
          .middle {
            margin: auto 0;
          }
          .accent-bar {
            width: 96px;
            height: 10px;
            background: #00C4B3;
            border-radius: 999px;
            margin-bottom: 36px;
          }
          h1 {
            font-size: 58px;
            line-height: 1.16;
            font-weight: 800;
            color: #FFFFFF;
            margin-bottom: 38px;
          }
          p {
            font-size: 32px;
            line-height: 1.5;
            color: #E2E8F0;
          }
          .bottom-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid rgba(255,255,255,0.15);
            padding-top: 32px;
          }
          .brand {
            font-size: 30px;
            letter-spacing: 0.14em;
            color: #FFFFFF;
            display: block;
          }
          .claim {
            font-size: 20px;
            color: #00C4B3;
            margin-top: 6px;
            display: block;
          }
          .badge {
            font-size: 20px;
            font-weight: 700;
            color: #0A2342;
            background: #00C4B3;
            padding: 12px 24px;
            border-radius: 14px;
          }
        </style>
      </head>
      <body>
        ${slidesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 350);
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="admin-card max-h-[92vh] w-full max-w-5xl overflow-y-auto space-y-5 border border-[#00C4B3]/40 bg-[#081226]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers size={20} className="text-[#00C4B3]" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C4B3]">
                FINTERA LinkedIn Carousel PDF Studio · Formato 1080×1350 (4:5)
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
              className="admin-button admin-button-primary text-xs"
            >
              <FileDown size={15} />
              <span>Exportar PDF 1080×1350 para LinkedIn</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="admin-button text-xs"
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

        {/* 6-Slide Visual Preview Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Vista Previa de las {slides.length} Láminas del Carrusel (Brand
              Blueprint V1.0 · #0A2342 + #00C4B3 + #FFD447)
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={14} />
              Cumple Ley 1581 y Regla Editorial FINTERA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((s) => (
              <div
                key={s.slideNumber}
                className="flex flex-col justify-between rounded-2xl border border-[#00C4B3]/30 bg-gradient-to-br from-[#0A2342] via-[#0d2d54] to-[#061529] p-5 text-white shadow-lg min-h-[270px]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-[#00C4B3] truncate max-w-[180px]">
                      {s.eyebrow}
                    </span>
                    <span className="rounded-full bg-[#FFD447]/20 border border-[#FFD447]/40 px-2 py-0.5 font-bold text-[#FFD447]">
                      0{s.slideNumber}/0{slides.length}
                    </span>
                  </div>
                  <div className="h-1 w-10 rounded-full bg-[#00C4B3]" />
                  <h3 className="text-sm font-extrabold leading-snug text-white">
                    {s.headline}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-200">
                    {s.body}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-2.5 text-[10px]">
                  <span className="font-bold text-[#00C4B3] truncate">
                    {s.footerTag}
                  </span>
                  <span className="font-extrabold tracking-widest text-white">
                    FINTERA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
