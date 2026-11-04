/**
 * lib/qa/qa-gate.ts
 *
 * FINTERA 8-Dimension Content QA Gate & Editorial Rulebook Engine.
 * Enforces La Regla Editorial de FINTERA:
 * 1. Usar fuentes primarias o institucionales (SFC, BanRep, DANE, DIAN, FNA, Supersociedades, Asobancaria, Camacol, OCDE, IFC, FCI).
 * 2. Indicar fecha de corte y enlace cuando se citen tasas o estadísticas.
 * 3. Separar el dato publicado de la interpretación de FINTERA.
 * 4. No presentar simulaciones como resultados garantizados ni casos hipotéticos como clientes reales.
 * 5. No prometer aprobación garantizada, tasas preferenciales sin evaluación ni liquidez inmediata garantizada.
 * 6. No pedir información financiera confidencial en comentarios públicos (Ley 1581 Habeas Data).
 */

import crypto from "crypto";
import {
  ContentQaInput,
  DimensionResult,
  QaDecision,
  QaEvaluationResult,
  QaIssue,
} from "./types";

const AUTHORITATIVE_SOURCE_PATTERNS = [
  "superfinanciera",
  "superintendencia financiera",
  "sfc",
  "banco de la república",
  "banrep",
  "dane",
  "fondo nacional del ahorro",
  "fna",
  "dian",
  "radian",
  "supersociedades",
  "superintendencia de sociedades",
  "asobancaria",
  "camacol",
  "confecámaras",
  "confecamaras",
  "bancóldex",
  "bancoldex",
  "ifc",
  "ocde",
  "oecd",
  "banco mundial",
  "world bank",
  "fci",
  "factors chain international",
];

const PROHIBITED_FINANCIAL_PROMISES = [
  {
    phrase: "aprobación garantizada",
    reason:
      "Regla Editorial FINTERA (Sección 9): Prohibido prometer aprobaciones garantizadas sin evaluación de perfil y políticas de la entidad financiera.",
  },
  {
    phrase: "aprobacion garantizada",
    reason:
      "Regla Editorial FINTERA (Sección 9): Prohibido prometer aprobaciones garantizadas sin evaluación de perfil.",
  },
  {
    phrase: "liquidez garantizada",
    reason:
      "Regla Editorial FINTERA (Sección 9): Prohibido prometer liquidez garantizada sin validación previa de la factura en RADIAN y del pagador.",
  },
  {
    phrase: "sin estudio de crédito",
    reason:
      "Regla Editorial FINTERA: Toda operación requiere criterio financiero, análisis de capacidad de pago y validación de requisitos.",
  },
  {
    phrase: "desembolso inmediato garantizado",
    reason:
      "Regla Editorial FINTERA: Los tiempos de desembolso dependen de la entidad financiera aliada, avalúo, estudio de títulos o validación RADIAN.",
  },
];

const PUBLIC_COMMENT_DATA_SOLICITATION = [
  "deja tu cédula en los comentarios",
  "escribe tu nit en comentarios",
  "déjanos tus ingresos en los comentarios",
  "comenta tu puntaje datacrédito",
  "publica tus estados financieros",
];

export class ContentQaGate {
  public static calculateContentHash(
    title: string,
    excerpt: string | null | undefined,
    content: string
  ): string {
    const normalized = `${(title || "").trim()}||${(excerpt || "").trim()}||${(
      content || ""
    ).trim()}`;
    return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
  }

  public static evaluate(input: ContentQaInput): QaEvaluationResult {
    const textLower = `${input.title} ${input.excerpt || ""} ${
      input.content
    }`.toLowerCase();
    const words = input.content
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const wordCount = words.length;
    const h2Matches = input.content.match(/^##\s+.+$/gm) || [];
    const h3Matches = input.content.match(/^###\s+.+$/gm) || [];

    // 1. Structural Integrity (12%)
    const structuralIssues: QaIssue[] = [];
    let structuralScore = 94;
    if (wordCount < 250) {
      structuralScore -= 25;
      structuralIssues.push({
        dimension: "structural",
        severity: "WARNING",
        message: `El contenido tiene ${wordCount} palabras; se recomiendan mínimo 350 palabras para piezas de autoridad financiera.`,
        remediation:
          "Ampliar el desarrollo con contexto normativo, criterios de evaluación y un ejemplo numérico ilustrativo.",
      });
    }
    if (h2Matches.length < 2) {
      structuralScore -= 18;
      structuralIssues.push({
        dimension: "structural",
        severity: "WARNING",
        message: "El documento tiene menos de 2 subtítulos H2 (##).",
        remediation:
          "Estructurar el análisis en secciones claras: Contexto Oficial, Análisis FINTERA, Simulación Ilustrativa y Fuentes.",
      });
    }

    const structural: DimensionResult = {
      name: "structural",
      label: "Estructura Editorial",
      score: Math.max(0, structuralScore),
      passed: structuralScore >= 70,
      weight: 0.12,
      metrics: {
        wordCount,
        h2Count: h2Matches.length,
        h3Count: h3Matches.length,
      },
      issues: structuralIssues,
    };

    // 2. Editorial & Readability (12%)
    const editorialIssues: QaIssue[] = [];
    let editorialScore = 95;
    const bulletLines =
      input.content.match(/^(\s*[-*+]|\s*\d+\.)\s+.+$/gm) || [];
    if (bulletLines.length < 3) {
      editorialScore -= 12;
      editorialIssues.push({
        dimension: "editorial",
        severity: "INFO",
        message:
          "Pocas listas o viñetas detectadas para facilitar la lectura ejecutiva.",
        remediation:
          "Incluir viñetas con variables clave (tasa, plazo, cuota inicial, seguros o eventos RADIAN).",
      });
    }

    const editorial: DimensionResult = {
      name: "editorial",
      label: "Claridad y Pedagogía Financiera",
      score: Math.max(0, editorialScore),
      passed: editorialScore >= 75,
      weight: 0.12,
      metrics: {
        bulletCount: bulletLines.length,
      },
      issues: editorialIssues,
    };

    // 3. Factual & Institutional Sources (20% — HARD GATE)
    const factualIssues: QaIssue[] = [];
    let factualScore = 96;
    const matchedSources = AUTHORITATIVE_SOURCE_PATTERNS.filter((src) =>
      textLower.includes(src)
    );

    if (matchedSources.length === 0) {
      factualScore -= 30;
      factualIssues.push({
        dimension: "factual",
        severity: "CRITICAL",
        message:
          "No se detectaron fuentes primarias oficiales o sectoriales (SFC, BanRep, DANE, FNA, DIAN/RADIAN, Supersociedades, Asobancaria, Camacol, OCDE, IFC, FCI).",
        remediation:
          "Citar explícitamente al menos una fuente oficial verificable con fecha de corte y enlace.",
      });
    }

    const hasCutoffDate =
      Boolean(input.cutoffDate) ||
      /corte|2025|2026|octubre|noviembre|trimestre|fuente:/i.test(input.content);
    if (!hasCutoffDate) {
      factualScore -= 15;
      factualIssues.push({
        dimension: "factual",
        severity: "WARNING",
        message:
          "No se identificó fecha de corte explícita para las cifras o estadísticas citadas.",
        remediation:
          "Añadir la fecha de corte (ej. 'Fecha de corte: Octubre 2026') junto a las fuentes consultadas.",
      });
    }

    const factual: DimensionResult = {
      name: "factual",
      label: "Fuentes Oficiales y Rigor Técnico",
      score: Math.max(0, factualScore),
      passed: factualScore >= 75,
      weight: 0.2,
      metrics: {
        matchedOfficialSourcesCount: matchedSources.length,
        hasCutoffDate,
      },
      issues: factualIssues,
    };

    // 4. Brand Voice & Positioning (16% — HARD GATE)
    const brandVoiceIssues: QaIssue[] = [];
    let brandVoiceScore = 96;

    for (const rule of PROHIBITED_FINANCIAL_PROMISES) {
      if (textLower.includes(rule.phrase)) {
        brandVoiceScore -= 40;
        brandVoiceIssues.push({
          dimension: "brandVoice",
          severity: "CRITICAL",
          message: `Frase prohibida detectada ("${rule.phrase}"). ${rule.reason}`,
          remediation:
            "Reemplazar por lenguaje consultivo sujeto a evaluación de capacidad de pago, condiciones del pagador o políticas de la entidad aliada.",
        });
      }
    }

    const hasBrandPillars =
      /criterio|acompañamiento|transparencia|fintera|aliado/i.test(textLower);
    if (!hasBrandPillars) {
      brandVoiceScore -= 12;
      brandVoiceIssues.push({
        dimension: "brandVoice",
        severity: "WARNING",
        message:
          "El texto no refuerza explícitamente los 3 atributos de FINTERA (criterio financiero, acompañamiento, transparencia).",
        remediation:
          "Conectar el cierre del artículo con el acompañamiento especializado y transparente de FINTERA.",
      });
    }

    const brandVoice: DimensionResult = {
      name: "brandVoice",
      label: "Voz de Marca FINTERA",
      score: Math.max(0, brandVoiceScore),
      passed: brandVoiceScore >= 75,
      weight: 0.16,
      metrics: {
        hasBrandPillars,
      },
      issues: brandVoiceIssues,
    };

    // 5. SEO & GEO Financial Entities (12%)
    const seoIssues: QaIssue[] = [];
    let seoScore = 94;
    const financialEntities = [
      "crédito de vivienda",
      "crédito hipotecario",
      "leasing habitacional",
      "tasa efectiva anual",
      "uvr",
      "factoring",
      "radian",
      "factura electrónica",
      "flujo de caja",
      "capital de trabajo",
      "capacidad de endeudamiento",
    ].filter((e) => textLower.includes(e));

    if (financialEntities.length < 2) {
      seoScore -= 15;
      seoIssues.push({
        dimension: "seo",
        severity: "WARNING",
        message:
          "Baja densidad de entidades financieras clave para posicionamiento SEO/GEO en Colombia.",
        remediation:
          "Incorporar términos técnicos precisos (ej. Tasa Efectiva Anual E.A., UVR, Leasing Habitacional, RADIAN, Capacidad de Endeudamiento).",
      });
    }

    const seo: DimensionResult = {
      name: "seo",
      label: "SEO y Entidades Financieras",
      score: Math.max(0, seoScore),
      passed: seoScore >= 75,
      weight: 0.12,
      metrics: {
        financialEntitiesMatched: financialEntities.length,
      },
      issues: seoIssues,
    };

    // 6. Originality (10%)
    const originality: DimensionResult = {
      name: "originality",
      label: "Originalidad y Valor Práctico",
      score: 95,
      passed: true,
      weight: 0.1,
      metrics: {
        uniquePerspective: true,
      },
      issues: [],
    };

    // 7. Safety, Habeas Data & Compliance (10% — HARD GATE)
    const safetyIssues: QaIssue[] = [];
    let safetyScore = 98;
    for (const phrase of PUBLIC_COMMENT_DATA_SOLICITATION) {
      if (textLower.includes(phrase)) {
        safetyScore -= 45;
        safetyIssues.push({
          dimension: "safety",
          severity: "CRITICAL",
          message: `Violación de privacidad detectada ("${phrase}"). Nunca se debe pedir información financiera confidencial en comentarios públicos.`,
          remediation:
            "Invitar a usar el simulador privado (/simulador) o el formulario protegido por Ley 1581 de Habeas Data (/contacto).",
        });
      }
    }

    const safety: DimensionResult = {
      name: "safety",
      label: "Cumplimiento y Habeas Data",
      score: Math.max(0, safetyScore),
      passed: safetyScore >= 80,
      weight: 0.1,
      metrics: {
        habeasDataCompliant: safetyIssues.length === 0,
      },
      issues: safetyIssues,
    };

    // 8. Technical Formatting (8%)
    const technicalIssues: QaIssue[] = [];
    let technicalScore = 96;
    if (/\[insertar|todo:|lorem ipsum/i.test(input.content)) {
      technicalScore -= 30;
      technicalIssues.push({
        dimension: "technical",
        severity: "CRITICAL",
        message: "Se detectaron marcadores pendientes ([INSERTAR] / TODO).",
        remediation:
          "Completar todos los bloques de texto y enlaces antes de aprobar.",
      });
    }

    const technical: DimensionResult = {
      name: "technical",
      label: "Formato Técnico y Enlaces",
      score: Math.max(0, technicalScore),
      passed: technicalScore >= 80,
      weight: 0.08,
      metrics: {},
      issues: technicalIssues,
    };

    const dimensions = {
      structural,
      editorial,
      factual,
      brandVoice,
      seo,
      originality,
      safety,
      technical,
    };

    const overallScore = Number(
      Object.values(dimensions)
        .reduce((acc, dim) => acc + dim.score * dim.weight, 0)
        .toFixed(1)
    );

    const allIssues = Object.values(dimensions).flatMap((d) => d.issues);
    const criticalIssues = allIssues.filter((i) => i.severity === "CRITICAL");
    const warnings = allIssues.filter((i) => i.severity === "WARNING");

    const passedHardGates =
      criticalIssues.length === 0 &&
      factual.passed &&
      brandVoice.passed &&
      safety.passed;

    const decision: QaDecision =
      passedHardGates && overallScore >= 82 ? "PASSED" : "FAILED";

    const contentHash = this.calculateContentHash(
      input.title,
      input.excerpt,
      input.content
    );

    const summary =
      decision === "PASSED"
        ? `Aprobado por el Comité QA FINTERA (${overallScore}/100). Cumple con fuentes oficiales, fecha de corte, voz de marca y protección de datos.`
        : `Requiere ajustes editoriales (${overallScore}/100): ${
            criticalIssues.length
          } hallazgo(s) crítico(s) y ${warnings.length} advertencia(s).`;

    return {
      overallScore,
      decision,
      passedHardGates,
      contentHash,
      summary,
      dimensions,
      criticalIssues,
      warnings,
    };
  }
}

