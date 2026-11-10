/**
 * lib/services/ai-generation/index.ts
 *
 * Autonomous Financial Content & LinkedIn Drafting Engine for FINTERA Soluciones Financieras.
 * Uses the exact same Homelab + Cloud model cascade as apex-website (hermes-content-agent.ts):
 *   1. Homelab Hermes Agent: http://127.0.0.1:8642/v1/chat/completions (model: 'hermes-agent')
 *   2. NVIDIA NIM API: https://integrate.api.nvidia.com/v1/chat/completions (model: 'nvidia/nemotron-3.5-super-vl-120b-a12b')
 *   3. Qwen API: https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1/chat/completions (model: 'qwen3.7-plus-2026-05-26')
 *   4. Deterministic Institutional Fallback (when running offline/without tunnel)
 * Also loads ~/.hermes/.env and /home/jauria/.hermes/.env automatically on the homelab.
 */

import fs from "fs";
import path from "path";
import {
  buildFinteraBrandImagePrompt,
  ContentTypeKey,
  FINTERA_BRAND_BLUEPRINT,
  FINTERA_CONTENT_PILLARS,
  FinteraContentPillarKey,
} from "../../content-types";
import {
  FinteraContentItem,
  getFinteraContentByIdOrSlugWithDb,
  resolveArticleCoverImage,
  stripCalendarPrefixFromText,
  upsertFinteraContent,
} from "../../blog";
import { FINTERA_MONTH_1_CALENDAR } from "../../linkedin-strategy";
import { researchSignalEngine } from "../../research/signal-engine";

// Load Homelab .hermes/.env if present (matches packages/apex-website/scripts/hermes-content-agent.ts)
function loadHermesHomelabEnv(): void {
  const candidates = [
    path.join(process.env.HOME || "/home/jauria", ".hermes", ".env"),
    "/home/jauria/.hermes/.env",
  ];
  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx <= 0) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed
            .slice(eqIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore permission/fs errors in non-homelab containers
    }
  }
}

loadHermesHomelabEnv();

export interface GenerateFinteraDraftInput {
  topic?: string;
  pillar?: FinteraContentPillarKey;
  contentType?: ContentTypeKey;
  calendarPostId?: string;
  signalId?: string;
  publishImmediately?: boolean;
}

async function generateWithHermesHomelab(
  prompt: string,
  systemPrompt: string
): Promise<{ text: string; provider: string; model: string }> {
  const hermesUrl =
    process.env.HERMES_API_URL || "http://127.0.0.1:8642/v1/chat/completions";
  const hermesModel = process.env.HERMES_MODEL || "hermes-agent";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(hermesUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: hermesModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.65,
        max_tokens: 16384,
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Hermes API error ${res.status}: ${errorBody.slice(0, 200)}`
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text || text.length < 250) {
      throw new Error("Hermes returned insufficient content");
    }

    return {
      text,
      provider: "Homelab-Hermes",
      model: hermesModel,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateWithNvidiaNim(
  prompt: string,
  systemPrompt: string
): Promise<{ text: string; provider: string; model: string }> {
  const apiKey =
    process.env.NVIDIA_API_KEY ||
    process.env.NIM_API_KEY ||
    process.env.NEMOTRON_API_KEY;
  const model =
    process.env.NVIDIA_MODEL ||
    process.env.NEMOTRON_MODEL ||
    "nvidia/nemotron-3.5-super-vl-120b-a12b";
  if (!apiKey || apiKey.includes("your_")) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          max_tokens: 16384,
          temperature: 0.65,
          top_p: 0.9,
        }),
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`NVIDIA API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text || text.length < 250) {
      throw new Error("NVIDIA returned empty/short text");
    }

    return {
      text,
      provider: "NVIDIA-NIM",
      model,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateWithQwen(
  prompt: string,
  systemPrompt: string
): Promise<{ text: string; provider: string; model: string }> {
  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
  const baseUrl =
    process.env.QWEN_BASE_URL ||
    "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1";
  const model =
    process.env.QWEN_GENERATION_MODEL ||
    process.env.QWEN_MODEL ||
    "qwen3.7-plus-2026-05-26";
  if (!apiKey) {
    throw new Error("QWEN_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_completion_tokens: 8192,
        temperature: 0.65,
        enable_thinking: false,
        preserve_thinking: false,
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Qwen API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    if (!text || text.length < 250) {
      throw new Error("Qwen API returned empty/short text");
    }

    return {
      text,
      provider: "Qwen-API",
      model,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function generateFinteraContentDraft(
  input: GenerateFinteraDraftInput
): Promise<{
  item: FinteraContentItem;
  providerUsed: string;
  modelUsed: string;
}> {
  const calendarSlot = input.calendarPostId
    ? FINTERA_MONTH_1_CALENDAR.find((c) => c.id === input.calendarPostId)
    : undefined;

  const signal = input.signalId
    ? researchSignalEngine.getSignals().find((s) => s.id === input.signalId)
    : researchSignalEngine.getSignals({
      pillar: calendarSlot?.pillar || input.pillar,
    })[0];

  const pillar: FinteraContentPillarKey =
    calendarSlot?.pillar || input.pillar || signal?.pillar || "VIVIENDA_B2C";
  const pillarCfg = FINTERA_CONTENT_PILLARS[pillar];
  const contentType: ContentTypeKey =
    calendarSlot?.contentType || input.contentType || "BLOG_POST";

  const rawTitle =
    calendarSlot?.title ||
    input.topic ||
    signal?.title ||
    "Análisis FINTERA: Cómo evaluar alternativas de financiación en Colombia con criterio financiero";
  const title = stripCalendarPrefixFromText(rawTitle);

  const subtitle = calendarSlot
    ? `Análisis estratégico y criterio financiero FINTERA · Formato: ${calendarSlot.format}`
    : `Análisis técnico respaldado en fuentes oficiales de Colombia (${pillarCfg.shortLabel})`;

  const systemPrompt = `Eres el Director de Criterio Financiero de FINTERA Soluciones Financieras (https://www.finterasoluciones.co/) en Colombia.
Escribe en español profesional, claro y ejecutivo siguiendo estrictamente la Regla Editorial de FINTERA:
1. Usa fuentes primarias oficiales de Colombia e internacionales (Superintendencia Financiera de Colombia SFC, Banco de la República, DANE, Fondo Nacional del Ahorro FNA, DIAN / RADIAN, Superintendencia de Sociedades, Asobancaria, Camacol, Confecámaras, Bancóldex, IFC, OCDE, Banco Mundial, FCI).
2. Indica explícitamente "Fecha de corte: Octubre 2026".
3. Separa el dato publicado por las fuentes oficiales de la interpretación y criterio financiero de FINTERA.
4. Si incluyes cifras o ejemplos numéricos, aclara que son simulaciones ilustrativas con supuestos transparentes y no resultados garantizados.
5. NUNCA prometas "aprobación garantizada", "liquidez garantizada" ni pidas datos confidenciales en comentarios públicos.
6. Refuerza los 3 atributos de FINTERA: criterio financiero, acompañamiento y transparencia.
7. NUNCA incluyas etiquetas de calendario interno como "Semana 1", "Semana 2", "Lunes:", "Viernes:" ni referencias al cronograma interno en el título, subtítulos ni cuerpo del artículo.`;

  const userPrompt = `Desarrolla una pieza completa tipo ${contentType} titulada: "${title}".
Pilar: ${pillarCfg.label}.
${calendarSlot ? `Guía base del calendario:\n${calendarSlot.draftOutlineMarkdown}` : ""}
${signal ? `Señal oficial de referencia: ${signal.sourceName} - ${signal.summary} (Ángulo: ${signal.finteraAngle})` : ""}
Estructura el documento en Markdown limpio (sin bloques de código JSON envolventes) con subtítulos H2 (##), viñetas accionables, un ejemplo práctico transparente y cierre consultivo hacia FINTERA.`;

  let generatedMarkdown = "";
  let providerUsed = "FINTERA-Institutional-Synthesizer";
  let modelUsed = "fintera-financial-editorial-v1";

  // Same 3-tier cascade as apex-website: 1) Homelab Hermes -> 2) NVIDIA NIM -> 3) Qwen API
  const providers = [
    {
      name: "Hermes (Homelab 127.0.0.1:8642)",
      fn: () => generateWithHermesHomelab(userPrompt, systemPrompt),
    },
    {
      name: "NVIDIA NIM (nvidia/nemotron-3.5-super-vl-120b-a12b)",
      fn: () => generateWithNvidiaNim(userPrompt, systemPrompt),
    },
    {
      name: "Qwen API (qwen3.7-plus-2026-05-26)",
      fn: () => generateWithQwen(userPrompt, systemPrompt),
    },
  ];

  for (const provider of providers) {
    try {
      const res = await provider.fn();
      generatedMarkdown = res.text;
      providerUsed = res.provider;
      modelUsed = res.model;
      break;
    } catch {
      // Continue to next provider in cascade
    }
  }

  if (!generatedMarkdown) {
    generatedMarkdown = buildDeterministicFinteraDraft({
      title,
      pillar,
      contentType,
      calendarSlot,
      signal,
    });
  }

  let item = await upsertFinteraContent({
    title,
    subtitle,
    content: generatedMarkdown,
    contentType,
    pillar,
    cutoffDate: "Octubre 2026",
    status: input.publishImmediately ? "PUBLISHED" : "DRAFT",
    aiGenerated: true,
    aiModel: `${providerUsed}/${modelUsed}`,
    typeMetadata: calendarSlot
      ? {
        linkedinWeek: calendarSlot.week,
        linkedinDay: calendarSlot.day,
        linkedinFormat: calendarSlot.format,
        ctaUrlWithUtm: calendarSlot.ctaUrlWithUtm,
      }
      : {},
    tags:
      pillar === "VIVIENDA_B2C"
        ? [
          "Crédito de Vivienda",
          "Superfinanciera",
          "Capacidad de Endeudamiento",
          "UVR vs Pesos",
        ]
        : pillar === "FACTORING_B2B"
          ? [
            "Factoring",
            "RADIAN",
            "DIAN",
            "Liquidez Empresarial",
            "Capital de Trabajo",
          ]
          : [
            "Análisis Financiero",
            "Banco de la República",
            "FINTERA",
            "Colombia",
          ],
  });

  // Dedicated Creative Pipeline: Automatically generate a bespoke cover image for every newly created article
  try {
    const creativeRes = await generateFinteraCreativeImage({
      idOrSlug: item.id,
      setAsCover: true,
      size: "1280x720",
    });
    if (creativeRes.item) {
      item = creativeRes.item;
    }
  } catch {
    // Non-blocking fallback if image API is temporarily unreachable
  }

  return {
    item,
    providerUsed,
    modelUsed,
  };
}

function buildDeterministicFinteraDraft(params: {
  title: string;
  pillar: FinteraContentPillarKey;
  contentType: ContentTypeKey;
  calendarSlot?: (typeof FINTERA_MONTH_1_CALENDAR)[number];
  signal?: ReturnType<typeof researchSignalEngine.getSignals>[number];
}): string {
  const { title, pillar, calendarSlot, signal } = params;
  const pillarCfg = FINTERA_CONTENT_PILLARS[pillar];

  const baseIntro = calendarSlot
    ? calendarSlot.draftOutlineMarkdown
    : `## Contexto Estratégico: ${title}\n\nEn el mercado financiero colombiano, tomar decisiones sobre endeudamiento hipotecario o liquidez empresarial exige contrastar datos oficiales verificables con la realidad del flujo de caja de cada persona o empresa (*Fecha de corte de referencia: Octubre 2026*).`;

  const officialFactsSection =
    pillar === "FACTORING_B2B"
      ? `## 1. Datos Publicados por Fuentes Oficiales (Fecha de Corte: Octubre 2026)

- **Dirección de Impuestos y Aduanas Nacionales (DIAN — Registro RADIAN)**: De acuerdo con el Anexo Técnico de RADIAN, para que una factura electrónica de venta constituya un **título valor negociable** mediante factoring en Colombia, debe registrar el acuse de recibo de la factura, el recibo del bien o servicio y la aceptación expresa o tácita. ([Fuente: DIAN](https://www.dian.gov.co))
- **Superintendencia de Sociedades & IFC**: El marco de supervisión societaria y los programas conjuntos con la Corporación Financiera Internacional (IFC) destacan al factoring como un instrumento formal para fortalecer la liquidez de las cadenas de suministro de mipymes en Colombia. ([Fuente: Supersociedades](https://www.supersociedades.gov.co))
- **OCDE (*Financing SMEs and Entrepreneurs 2026* — Capítulo Colombia) y Confecámaras**: Los reportes evidencian que las ventas a plazo de 60 a 90 días presionan el capital de trabajo de los proveedores empresariales, haciendo indispensable evaluar el costo del tiempo de espera frente a alternativas de descuento de títulos valores. ([Fuente: OCDE](https://www.oecd.org))`
      : `## 1. Datos Publicados por Fuentes Oficiales (Fecha de Corte: Octubre 2026)

- **Superintendencia Financiera de Colombia (SFC)**: El reporte público de tasas de interés efectivas anuales (E.A.) por establecimiento de crédito evidencia diferencias relevantes entre entidades para créditos de vivienda VIS y No VIS, tanto en modalidades en **pesos** como en **UVR**. ([Fuente: Superfinanciera](https://www.superfinanciera.gov.co))
- **Banco de la República y DANE**: El comportamiento del Índice de Precios al Consumidor (IPC) determina el ajuste de la Unidad de Valor Real (UVR), mientras que las estadísticas de vivienda nueva del DANE y del **Fondo Nacional del Ahorro (FNA)** recuerdan el límite prudencial del **30% en la relación primera cuota / ingreso familiar** bajo la Ley 546 de 1999. ([Fuente: BanRep](https://www.banrep.gov.co) · [Fuente: DANE](https://www.dane.gov.co))
- **Asobancaria y Camacol**: Los informes sectoriales subrayan la importancia de estructurar adecuadamente el cierre financiero (cuota inicial, avalúo, estudio de títulos y seguros obligatorios) para prevenir desistimientos. ([Fuente: Asobancaria](https://www.asobancaria.com/informes/))`;

  const interpretationSection = `## 2. Criterio e Interpretación de FINTERA (Separado del Dato Oficial)

${signal
      ? `A partir de la señal monitoreada en **${signal.sourceName}** (*"${signal.title}"*), nuestra lectura técnica en **FINTERA Soluciones Financieras** se centra en tres recomendaciones prácticas:`
      : `Desde la metodología de **FINTERA Soluciones Financieras**, fundamentada en **criterio financiero**, **acompañamiento** y **transparencia**, recomendamos evaluar los siguientes puntos antes de tomar una decisión:`
    }

1. **Analizar el costo financiero integral, no solo la tasa nominal**: En vivienda deben sumarse las pólizas de seguro de vida deudor e incendio/terremoto, gastos de avalúo y escrituración; en liquidez empresarial debe compararse la tasa de descuento frente al costo de oportunidad de esperar 60 o 90 días.
2. **Preparar los soportes antes de iniciar la gestión**: La consistencia entre extractos bancarios, información tributaria ante la **DIAN** y certificados de ingresos o eventos en **RADIAN** reduce reprocesos y protege el perfil crediticio.
3. **Distinguir condiciones reales según el perfil**: En FINTERA no prometemos resultados ni aprobaciones sin evaluación previa; cada alternativa se estructura de acuerdo con la capacidad de pago del solicitante o la calidad crediticia del pagador.`;

  const simulationSection =
    pillar === "FACTORING_B2B"
      ? `## 3. Simulación Ilustrativa con Supuestos Transparentes

> **Nota de transparencia editorial**: *El siguiente ejercicio emplea cifras hipotéticas con fines estrictamente pedagógicos y no representa una promesa de liquidez ni el caso de un cliente real.*

- **Escenario**: Una pyme emite una factura electrónica por **COP \\$90.000.000** a **60 días** a favor de un gran pagador corporativo, con sus tres eventos debidamente inscritos en **RADIAN (DIAN)**.
- **Evaluación financiera**: Si la empresa requiere comprar insumos en el día 10 con un descuento por pronto pago del **3,5% (COP \\$3.150.000)**, el director financiero debe comparar ese ahorro comercial directo frente al costo efectivo de anticipar la factura a través de un aliado autorizado.`
      : `## 3. Simulación Ilustrativa con Supuestos Transparentes

> **Nota de transparencia editorial**: *El siguiente ejercicio emplea cifras hipotéticas con fines estrictamente pedagógicos. Toda solicitud real está sujeta al estudio de crédito y políticas de cada entidad financiera vigilada.*

- **Escenario**: Compra de vivienda por **COP \\$300.000.000** con cuota inicial del **30% (COP \\$90.000.000)** y saldo a financiar de **COP \\$210.000.000** a **15 años**.
- **Evaluación financiera**: Antes de elegir entre **crédito hipotecario en pesos (cuota fija)**, **UVR** o **leasing habitacional**, el comprador debe verificar que la primera cuota mensual (incluyendo seguros) no supere el **30% de sus ingresos familiares demostrables** y reservar entre un **3% y 4%** adicional para gastos de cierre y registro.`;

  const ctaSection = `## 4. Hagamos Posible tu Próximo Proyecto con FINTERA

En **FINTERA Soluciones Financieras** conectamos personas y empresas con alternativas de financiación adecuadas mediante orientación especializada y acompañamiento durante el proceso.

- **Llamado a la acción**: [${pillarCfg.defaultCtaLabel}](${pillarCfg.defaultCtaUrl})
- **Protección de datos (Ley 1581 Habeas Data)**: *Por tu seguridad financiera, nunca compartas cédula, NIT, ingresos ni extractos en comentarios públicos; utiliza siempre nuestros canales privados de evaluación.*`;

  return [
    baseIntro,
    officialFactsSection,
    interpretationSection,
    simulationSection,
    ctaSection,
  ].join("\n\n");
}

export interface RewriteFinteraContentInput {
  idOrSlug: string;
  instructions: string;
  newTitle?: string;
  cutoffDate?: string;
}

export async function rewriteFinteraContentWithAi(
  input: RewriteFinteraContentInput
): Promise<{
  item: FinteraContentItem;
  providerUsed: string;
  modelUsed: string;
  previousQaScore: number;
  newQaScore: number;
}> {
  const existing = await getFinteraContentByIdOrSlugWithDb(input.idOrSlug);
  if (!existing) {
    throw new Error(`No se encontró la pieza editorial: ${input.idOrSlug}`);
  }

  const previousQaScore = existing.qaScore;
  const targetTitle = input.newTitle?.trim() || existing.title;
  const targetCutoff =
    input.cutoffDate?.trim() || existing.cutoffDate || "Octubre 2026";
  const pillarCfg = FINTERA_CONTENT_PILLARS[existing.pillar];

  const systemPrompt = `Eres el Editor Jefe y Director de Criterio Financiero de FINTERA Soluciones Financieras en Colombia.
Tu misión es reescribir y perfeccionar piezas editoriales siguiendo las instrucciones del editor humano y el FINTERA Brand Blueprint (${FINTERA_BRAND_BLUEPRINT.version}):
1. Posicionamiento: "${FINTERA_BRAND_BLUEPRINT.positioning}"
2. Arquetipos: ${FINTERA_BRAND_BLUEPRINT.archetypes.primary} + ${FINTERA_BRAND_BLUEPRINT.archetypes.secondary}. Personalidad: Clara, Criteriosa, Cercana, Responsable y Resuelta.
3. Principio "Primero la respuesta": explica requisitos, criterios y pasos visibles desde el inicio sin rodeos innecesarios.
4. Regla Editorial FINTERA:
   - Mantén y refuerza las referencias a fuentes oficiales (Superfinanciera SFC, Banco de la República, DANE, FNA, DIAN / RADIAN, Supersociedades, Asobancaria, Camacol, Confecámaras, Bancóldex, OCDE, IFC).
   - Incluye explícitamente "Fecha de corte: ${targetCutoff}".
   - Separa los datos publicados por las fuentes oficiales del criterio financiero de FINTERA.
   - Si hay cifras o tablas comparativas, declara que son simulaciones ilustrativas con supuestos transparentes y no resultados garantizados.
   - PROHIBIDO usar frases como "crédito aprobado", "aprobación garantizada", "liquidez garantizada", "tasa asegurada" o "sin requisitos".
   - Incluye siempre nota de privacidad Ley 1581 de 2012 (Habeas Data).
5. Devuelve ÚNICAMENTE el contenido reescrito en Markdown limpio (con encabezados ##, listas y tablas Markdown bien formadas), sin comentarios meta ni bloques \`\`\`markdown envolventes.`;

  const userPrompt = `PIEZA ACTUAL A REESCRIBIR:
Título: "${targetTitle}"
Pilar: ${pillarCfg.label} (${pillarCfg.brandClaim})
Formato: ${existing.contentType}

INSTRUCCIONES ESPECÍFICAS DEL EDITOR PARA ESTA REESCRITURA:
"${input.instructions}"

CONTENIDO MARKDOWN ACTUAL:
${existing.content}

Por favor reescribe y entrega la versión mejorada completa en Markdown limpio aplicando las instrucciones del editor y conservando el máximo rigor técnico y cumplimiento QA de FINTERA:`;

  let rewrittenMarkdown = "";
  let providerUsed = "FINTERA-Brand-Blueprint-Editor";
  let modelUsed = "fintera-editorial-rewriter-v1";

  const providers = [
    {
      name: "Hermes (Homelab 127.0.0.1:8642)",
      fn: () => generateWithHermesHomelab(userPrompt, systemPrompt),
    },
    {
      name: "NVIDIA NIM (nvidia/nemotron-3.5-super-vl-120b-a12b)",
      fn: () => generateWithNvidiaNim(userPrompt, systemPrompt),
    },
    {
      name: "Qwen API (qwen3.7-plus-2026-05-26)",
      fn: () => generateWithQwen(userPrompt, systemPrompt),
    },
  ];

  for (const provider of providers) {
    try {
      const res = await provider.fn();
      const cleaned = res.text
        .replace(/^```(?:markdown|md)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      if (cleaned.length >= 250) {
        rewrittenMarkdown = cleaned;
        providerUsed = res.provider;
        modelUsed = res.model;
        break;
      }
    } catch {
      // Try next provider in cascade
    }
  }

  if (!rewrittenMarkdown) {
    rewrittenMarkdown = `${existing.content.trim()}

---

## Síntesis de Claridad FINTERA (${pillarCfg.brandClaim})

> **Actualización Editorial (${targetCutoff} · Directriz Aplicada)**: *${input.instructions}*

- **Lo que debes verificar primero**: En **FINTERA** organizamos la información con **criterio financiero**, **acompañamiento** y **transparencia** para que comprendas los requisitos, costos efectivos (según reportes de la **Superintendencia Financiera de Colombia — SFC**, **Banco de la República**, **DANE** y **DIAN / RADIAN**) y el siguiente paso antes de radicar.
- **Alcance transparente**: Este análisis es orientativo y sujeto a evaluación de cada aliado financiero vigilado. Protegemos tu información bajo la **Ley 1581 de 2012 (Habeas Data)**.`;
  }

  const updatedItem = await upsertFinteraContent({
    ...existing,
    title: targetTitle,
    cutoffDate: targetCutoff,
    content: rewrittenMarkdown,
    aiGenerated: true,
    aiModel: `${providerUsed}/${modelUsed}`,
  });

  return {
    item: updatedItem,
    providerUsed,
    modelUsed,
    previousQaScore,
    newQaScore: updatedItem.qaScore,
  };
}

export interface GenerateFinteraCreativeImageInput {
  idOrSlug?: string;
  prompt?: string;
  setAsCover?: boolean;
  size?: "1024x1024" | "1280x720" | "720x1280";
}

export async function generateFinteraCreativeImage(
  input: GenerateFinteraCreativeImageInput
): Promise<{
  imageUrl: string;
  promptUsed: string;
  modelUsed: string;
  item?: FinteraContentItem;
}> {
  const existing = input.idOrSlug
    ? await getFinteraContentByIdOrSlugWithDb(input.idOrSlug)
    : undefined;

  const promptUsed =
    input.prompt?.trim() ||
    existing?.imagePrompt ||
    buildFinteraBrandImagePrompt({
      title: existing?.title || "FINTERA Claridad Financiera en Colombia",
      pillar: existing?.pillar || "VIVIENDA_B2C",
      contentType: existing?.contentType || "BLOG_POST",
    });

  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
  const baseUrl =
    process.env.QWEN_BASE_URL ||
    "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1";
  const imageModel = process.env.QWEN_IMAGE_MODEL || "qwen-image-3.0";

  let generatedUrl = "";
  let modelUsed = imageModel;

  if (apiKey) {
    try {
      const res = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: imageModel,
          prompt: promptUsed,
          n: 1,
          size: input.size || "1024x1024",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        generatedUrl = data?.data?.[0]?.url || "";
      }
    } catch {
      // Fallback to multimodal endpoint below
    }

    if (!generatedUrl) {
      try {
        const dashscopeHost = baseUrl.replace(/\/compatible-mode\/v1\/?$/, "");
        const res = await fetch(
          `${dashscopeHost}/api/v1/services/aigc/multimodal-generation/generation`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: imageModel,
              input: {
                messages: [
                  {
                    role: "user",
                    content: [{ text: promptUsed }],
                  },
                ],
              },
              parameters: {
                size: (input.size || "1024x1024").replace("x", "*"),
                n: 1,
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const contentArr =
            data?.output?.choices?.[0]?.message?.content || [];
          const imgObj = contentArr.find(
            (c: { image?: string }) => typeof c?.image === "string"
          );
          if (imgObj?.image) {
            generatedUrl = imgObj.image;
          }
        }
      } catch {
        // Graceful fallback
      }
    }
  }

  let finalImageUrl = generatedUrl;

  // If we obtained a remote image URL from Qwen, persist it locally into public/images/insights when writable
  if (generatedUrl) {
    try {
      const imgRes = await fetch(generatedUrl);
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const insightsDir = path.join(
          process.cwd(),
          "public",
          "images",
          "insights"
        );
        fs.mkdirSync(insightsDir, { recursive: true });
        const safeSlug = (existing?.slug || "fintera-creative")
          .slice(0, 48)
          .replace(/[^a-z0-9-]/g, "-");
        const fileName = `${safeSlug}-${Date.now()}.png`;
        const filePath = path.join(insightsDir, fileName);
        fs.writeFileSync(filePath, buffer);
        finalImageUrl = `/images/insights/${fileName}`;
      }
    } catch {
      // On read-only serverless filesystems, keep the signed HTTPS URL directly
      finalImageUrl = generatedUrl;
    }
  }

  if (!finalImageUrl) {
    finalImageUrl = resolveArticleCoverImage(
      existing?.id || "fintera_creative",
      existing?.slug || "fintera-creative"
    );
    modelUsed = "fintera-article-creative-pool";
  }

  let updatedItem: FinteraContentItem | undefined;
  if (existing) {
    const newAsset = {
      url: finalImageUrl,
      prompt: promptUsed,
      model: `Qwen-API/${modelUsed}`,
      createdAt: new Date().toISOString(),
    };
    const existingAssets = Array.isArray(existing.creativeAssets)
      ? existing.creativeAssets
      : [];
    updatedItem = await upsertFinteraContent({
      ...existing,
      coverImage:
        input.setAsCover !== false ? finalImageUrl : existing.coverImage,
      imagePrompt: promptUsed,
      creativeAssets: [newAsset, ...existingAssets],
    });
  }

  return {
    imageUrl: finalImageUrl,
    promptUsed,
    modelUsed: `Qwen-API/${modelUsed}`,
    item: updatedItem,
  };
}

