// ============================================================================
// FINTERA SOLUCIONES FINANCIERAS — Multi-Format Content Types & Brand Strategy
// ============================================================================

export type ContentTypeKey =
  | "BLOG_POST"
  | "WHITEPAPER"
  | "CASE_STUDY"
  | "GUIDE"
  | "WEBINAR"
  | "TUTORIAL";

export type FinteraContentPillarKey =
  | "VIVIENDA_B2C"
  | "FACTORING_B2B"
  | "AUTORIDAD_MERCADO"
  | "CONFIANZA_OPORTUNIDADES";

export type FinteraAudienceKey =
  | "B2C_VIVIENDA"
  | "B2B_EMPRESAS"
  | "HIBRIDO_ALIADOS";

export interface FinteraPillarConfig {
  key: FinteraContentPillarKey;
  number: number;
  label: string;
  shortLabel: string;
  targetPercentage: number;
  audience: FinteraAudienceKey;
  color: string;
  coverImage: string;
  brandClaim: string;
  visualConcept: string;
  description: string;
  coreTopics: string[];
  defaultCtaLabel: string;
  defaultCtaUrl: string;
}

export const FINTERA_CONTENT_PILLARS: Record<
  FinteraContentPillarKey,
  FinteraPillarConfig
> = {
  VIVIENDA_B2C: {
    key: "VIVIENDA_B2C",
    number: 1,
    label: "Pilar 1 · Vivienda y financiación personal",
    shortLabel: "Vivienda B2C",
    targetPercentage: 35,
    audience: "B2C_VIVIENDA",
    color: "#0A2342", // Azul profundo FINTERA
    coverImage: "/images/pillars/pilar-1-vivienda-b2c.png",
    brandClaim: "Tu crédito, con más claridad.",
    visualConcept: "Señales de claridad · Rutas limpias y comprensión hipotecaria",
    description:
      "Educación y criterio financiero para compradores de vivienda, empleados y profesionales que evalúan crédito hipotecario o leasing habitacional en Colombia.",
    coreTopics: [
      "Cómo calcular la capacidad de endeudamiento e ingreso familiar",
      "Qué documentos preparar antes de solicitar un crédito hipotecario",
      "Cuota inicial, plazo, tasa efectiva anual (E.A.) y seguros obligatorios",
      "Errores frecuentes que pueden retrasar o frenar una solicitud hipotecaria",
      "Cómo comparar ofertas de crédito sin mirar únicamente la tasa",
      "Crédito hipotecario en pesos vs. UVR y leasing habitacional",
    ],
    defaultCtaLabel: "Explorar opciones en el Simulador",
    defaultCtaUrl:
      "/simulador?utm_source=linkedin&utm_medium=organic&utm_campaign=vivienda_b2c",
  },
  FACTORING_B2B: {
    key: "FACTORING_B2B",
    number: 2,
    label: "Pilar 2 · Liquidez empresarial y factoring",
    shortLabel: "Factoring B2B",
    targetPercentage: 30,
    audience: "B2B_EMPRESAS",
    color: "#00C4B3", // Turquesa digital FINTERA
    coverImage: "/images/pillars/pilar-2-factoring-b2b.png",
    brandClaim: "Mejores oportunidades. Procesos más inteligentes.",
    visualConcept: "Señales de claridad · Trazabilidad RADIAN y flujo de caja B2B",
    description:
      "Orientación para gerentes financieros, contadores y pymes sobre capital de trabajo, ciclo de caja, RADIAN y negociación de facturas electrónicas.",
    coreTopics: [
      "Qué es el factoring y cómo funciona en el marco normativo colombiano",
      "Diferencia entre negociar una factura por cobrar y solicitar un préstamo bancario",
      "Cómo las cuentas por cobrar a 60 o 90 días afectan el flujo de caja operativo",
      "Requisitos de la factura electrónica como título valor en RADIAN (DIAN)",
      "En qué casos conviene evaluar el factoring y cuándo optar por otra línea",
      "Estructuración de liquidez empresarial a través de aliados vigilados",
    ],
    defaultCtaLabel: "Solicitar diagnóstico de liquidez empresarial",
    defaultCtaUrl:
      "/contacto?linea=factoring&utm_source=linkedin&utm_medium=organic&utm_campaign=factoring_b2b",
  },
  AUTORIDAD_MERCADO: {
    key: "AUTORIDAD_MERCADO",
    number: 3,
    label: "Pilar 3 · Autoridad y análisis del mercado",
    shortLabel: "Autoridad y Mercado",
    targetPercentage: 20,
    audience: "HIBRIDO_ALIADOS",
    color: "#0A2342", // Azul profundo FINTERA
    coverImage: "/images/pillars/pilar-3-autoridad-mercado.png",
    brandClaim: "Inteligencia financiera con trato humano.",
    visualConcept: "Señales de claridad · Superficies de datos ordenados y fuentes oficiales",
    description:
      "Análisis riguroso de tasas de intervención, inflación, desembolsos hipotecarios y estadísticas sectoriales con fuentes oficiales verificables.",
    coreTopics: [
      "Cambios en las tasas de interés del Banco de la República y su transmisión al crédito",
      "Indicadores del mercado hipotecario colombiano (SFC, DANE, Camacol, Asobancaria)",
      "Análisis del costo financiero total de una operación (tasa, seguros, avalúo, estudio)",
      "Casos prácticos con cifras ilustrativas y supuestos transparentes",
      "Perspectivas de financiamiento para pymes en Colombia (OCDE, IFC, Supersociedades)",
    ],
    defaultCtaLabel: "Explorar informe completo en FINTERA Insights",
    defaultCtaUrl:
      "/insights?utm_source=linkedin&utm_medium=organic&utm_campaign=autoridad_mercado",
  },
  CONFIANZA_OPORTUNIDADES: {
    key: "CONFIANZA_OPORTUNIDADES",
    number: 4,
    label: "Pilar 4 · Confianza y generación de oportunidades",
    shortLabel: "Confianza y Conversión",
    targetPercentage: 15,
    audience: "HIBRIDO_ALIADOS",
    color: "#00C4B3", // Turquesa digital FINTERA
    coverImage: "/images/pillars/pilar-4-confianza-oportunidades.png",
    brandClaim: "Claridad que conecta oportunidades.",
    visualConcept: "Señales de claridad · El Sabio Estratega y el Cuidador Competente",
    description:
      "Transparencia sobre el modelo de acompañamiento multibanco de FINTERA, resolución de preguntas frecuentes y conversión consultiva hacia evaluación de perfil.",
    coreTopics: [
      "Cómo trabaja FINTERA: criterio financiero, acompañamiento y transparencia",
      "Explicación paso a paso de nuestro proceso de radicación y análisis multibanco",
      "Distinción transparente entre líneas vigentes y soluciones en estructuración",
      "Preguntas frecuentes sobre viabilidad crediticia, centrales de riesgo y tiempos",
      "Invitaciones directas a evaluar una necesidad de financiación personalizada",
    ],
    defaultCtaLabel: "Explorar opciones con un asesor",
    defaultCtaUrl:
      "/credit-request?utm_source=linkedin&utm_medium=organic&utm_campaign=confianza_fintera",
  },
};

export interface ContentTypeConfig {
  key: ContentTypeKey;
  label: string;
  pluralLabel: string;
  description: string;
  color: string;
  icon: string;
  urlPrefix: string;
  defaultReadingTime: number;
  supportsGating: boolean;
  supportsDownload: boolean;
}

export const CONTENT_TYPES: Record<ContentTypeKey, ContentTypeConfig> = {
  BLOG_POST: {
    key: "BLOG_POST",
    label: "Artículo de Análisis",
    pluralLabel: "Artículos de Análisis",
    description:
      "Análisis editorial profundo sobre crédito de vivienda, liquidez empresarial, tasas de interés y educación financiera para Colombia.",
    color: "#0284c7",
    icon: "FileText",
    urlPrefix: "/insights",
    defaultReadingTime: 6,
    supportsGating: false,
    supportsDownload: false,
  },
  WHITEPAPER: {
    key: "WHITEPAPER",
    label: "Whitepaper / Informe",
    pluralLabel: "Whitepapers e Informes",
    description:
      "Documento de investigación institucional descargable con fuentes oficiales (SFC, BanRep, DANE, DIAN, OCDE) y metodología de evaluación financiera.",
    color: "#4338ca",
    icon: "BookOpen",
    urlPrefix: "/insights",
    defaultReadingTime: 18,
    supportsGating: true,
    supportsDownload: true,
  },
  CASE_STUDY: {
    key: "CASE_STUDY",
    label: "Caso Práctico / Simulación",
    pluralLabel: "Casos Prácticos y Simulaciones",
    description:
      "Ejercicio numérico documentado con supuestos transparentes sobre costos de espera de facturas, comparativas UVR vs. Pesos o estructuración hipotecaria.",
    color: "#059669",
    icon: "TrendingUp",
    urlPrefix: "/insights",
    defaultReadingTime: 10,
    supportsGating: false,
    supportsDownload: true,
  },
  GUIDE: {
    key: "GUIDE",
    label: "Guía Práctica",
    pluralLabel: "Guías Prácticas",
    description:
      "Guía paso a paso y lista de chequeo documental para solicitantes de crédito hipotecario, leasing habitacional o validación RADIAN.",
    color: "#d97706",
    icon: "Compass",
    urlPrefix: "/insights",
    defaultReadingTime: 12,
    supportsGating: true,
    supportsDownload: true,
  },
  WEBINAR: {
    key: "WEBINAR",
    label: "Webinar Educativo",
    pluralLabel: "Webinars Educativos",
    description:
      "Sesión ejecutiva de 30–40 minutos + 15 min de preguntas para compradores de vivienda, gerentes financieros, contadores y aliados inmobiliarios.",
    color: "#dc2626",
    icon: "Video",
    urlPrefix: "/insights",
    defaultReadingTime: 45,
    supportsGating: true,
    supportsDownload: false,
  },
  TUTORIAL: {
    key: "TUTORIAL",
    label: "Publicación / Carrusel LinkedIn",
    pluralLabel: "Publicaciones LinkedIn",
    description:
      "Pieza estructurada para el calendario de posicionamiento en LinkedIn (Carrusel educativo, post de autoridad o guía interactiva de conversión).",
    color: "#0f766e",
    icon: "Code",
    urlPrefix: "/insights",
    defaultReadingTime: 4,
    supportsGating: false,
    supportsDownload: false,
  },
};

// ============================================================================
// Type-Specific Metadata Interfaces
// ============================================================================

export interface PrimarySourceCitation {
  institution: string; // e.g., "Superintendencia Financiera de Colombia (SFC)"
  documentTitle: string;
  url: string;
  cutoffDate: string; // e.g., "Octubre 2026"
  usageNote?: string;
}

export interface WhitepaperMetadata {
  version?: string;
  pageCount?: number;
  executiveSummary?: string;
  methodology?: string;
  keyFindings?: string[];
  targetAudience?: string[];
  coAuthors?: string[];
  doiOrCitation?: string;
  pdfAssetUrl?: string;
  primarySources?: PrimarySourceCitation[];
}

export interface CaseStudyMetadata {
  clientName?: string;
  clientIndustry?: string;
  clientSize?: string;
  isHypotheticalSimulation?: boolean; // Must be true when using illustrative numbers per FINTERA rule
  challenge?: string;
  solution?: string;
  results?: {
    metric: string;
    value: string;
    description?: string;
  }[];
  testimonialQuote?: string;
  testimonialAuthor?: string;
  testimonialRole?: string;
  technologiesUsed?: string[];
  timeline?: string;
}

export interface GuideMetadata {
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedCompletionTime?: string;
  prerequisites?: string[];
  chapters?: {
    number: number;
    title: string;
    summary?: string;
  }[];
  keyTakeaways?: string[];
  checklistItems?: string[];
}

export interface WebinarMetadata {
  eventDate?: string;
  durationMinutes?: number;
  qaMinutes?: number;
  isOnDemand?: boolean;
  videoUrl?: string;
  slidesUrl?: string;
  registrationUrl?: string;
  speakers?: {
    name: string;
    role: string;
    company?: string;
    avatarUrl?: string;
  }[];
  agendaTopics?: string[];
}

export interface TutorialMetadata {
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedMinutes?: number;
  linkedinWeek?: number;
  linkedinDay?: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes";
  linkedinFormat?:
    | "Carrusel institucional"
    | "Carrusel educativo"
    | "Post de análisis"
    | "Caso numérico"
    | "Guía paso a paso"
    | "Post de conversión";
  carouselSlides?: {
    slideNumber: number;
    headline: string;
    body: string;
  }[];
  prerequisites?: string[];
  toolsRequired?: string[];
  steps?: {
    stepNumber: number;
    title: string;
    description?: string;
  }[];
}

export type ContentTypeMetadata =
  | WhitepaperMetadata
  | CaseStudyMetadata
  | GuideMetadata
  | WebinarMetadata
  | TutorialMetadata
  | Record<string, unknown>;

export function getContentTypeConfig(type?: string | null): ContentTypeConfig {
  if (type && type in CONTENT_TYPES) {
    return CONTENT_TYPES[type as ContentTypeKey];
  }
  return CONTENT_TYPES.BLOG_POST;
}

export function getFinteraPillarConfig(
  pillar?: string | null
): FinteraPillarConfig {
  if (pillar && pillar in FINTERA_CONTENT_PILLARS) {
    return FINTERA_CONTENT_PILLARS[pillar as FinteraContentPillarKey];
  }
  return FINTERA_CONTENT_PILLARS.VIVIENDA_B2C;
}

/**
 * FINTERA Brand Blueprint V1.0 (Octubre 2026) — Visual Identity & Prompt Builder
 */
export const FINTERA_BRAND_BLUEPRINT = {
  version: "Octubre 2026 · V1.0",
  masterConcept: "Señales de claridad",
  positioning: "FINTERA: inteligencia financiera con trato humano.",
  claims: {
    b2c: "Tu crédito, con más claridad.",
    institutional: "Claridad que conecta oportunidades.",
    b2b: "Mejores oportunidades. Procesos más inteligentes.",
  },
  archetypes: {
    primary: "El Sabio Estratega (analiza, discrimina y hace entendible lo complejo)",
    secondary: "El Cuidador Competente (escucha necesidades reales y ofrece pasos claros)",
  },
  palette: {
    azulProfundo: "#0A2342",
    turquesaDigital: "#00C4B3",
    blancoGrisLuz: "#F7F7F7",
    amarilloEnergia: "#FFD447",
  },
  prohibitedVisuals:
    "No usar billetes volando, manos sosteniendo montañas de efectivo, sellos falsos de 'aprobado', iconografía bancaria genérica en exceso o recursos de urgencia artificiosa.",
};

export function buildFinteraBrandImagePrompt(input: {
  title: string;
  pillar?: FinteraContentPillarKey | string;
  contentType?: ContentTypeKey | string;
}): string {
  const pillarCfg = getFinteraPillarConfig(input.pillar);
  const sceneByPillar: Record<FinteraContentPillarKey, string> = {
    VIVIENDA_B2C:
      "Authentic Colombian contemporary apartment interior with warm daylight overlooking Andean city skyline, a professional couple reviewing a clean minimalist financial path interface with ascending turquoise validation lines",
    FACTORING_B2B:
      "Modern Colombian executive glass office and clean enterprise operations setting, a CFO and financial strategist reviewing structured invoice cash-flow pathways and digital validation nodes",
    AUTORIDAD_MERCADO:
      "Institutional financial intelligence editorial composition with ordered glassmorphic data surfaces, clean ascending geometric pathways and macroeconomic equilibrium nodes",
    CONFIANZA_OPORTUNIDADES:
      "Credible Colombian financial advisor in smart contemporary attire guiding a client with clarity and human warmth in a minimalist architectural studio",
  };

  const scene =
    sceneByPillar[pillarCfg.key] || sceneByPillar.VIVIENDA_B2C;

  return `High-end institutional financial editorial photography and graphic design for FINTERA ("${input.title}"). Visual concept: "Señales de claridad" (${pillarCfg.visualConcept}). Scene: ${scene}. Strict FINTERA Brand Blueprint color palette: Deep Navy (#0A2342) dominant architectural base, Digital Turquoise (#00C4B3) ascending progress lines and validation checkpoints, crisp light gray/white (#F7F7F7) negative space, and a subtle exceptional accent of Energy Yellow (#FFD447). Clean, modern, trustworthy, human and precise. STRICT NEGATIVE PROMPT: NO flying banknotes, NO piles of cash, NO fake "approved" stamps, NO cluttered text overlays, NO generic cartoon banking clichés.`;
}

export const FINTERA_AI_REWRITE_PRESETS = [
  {
    id: "brand_clarity",
    label: "1. Principio 'Primero la Respuesta' (Manual de Marca)",
    instruction:
      "Reescribe aplicando la Identidad Verbal de FINTERA (Sección 06 del Brand Blueprint): 'Primero la respuesta' (presentar requisitos y pasos claros desde el primer párrafo sin introducciones largas), tono del Sabio Estratega y Cuidador Competente (clara, criteriosa, cercana, responsable y resuelta), manteniendo las tablas y fuentes oficiales.",
  },
  {
    id: "add_simulation_table",
    label: "2. Enriquecer con Tabla Comparativa y Simulación",
    instruction:
      "Amplía el análisis incorporando una tabla Markdown comparativa detallada con una simulación numérica ilustrativa en pesos colombianos (COP), declarando explícitamente los supuestos transparentes y que no constituye oferta ni promesa de aprobación.",
  },
  {
    id: "b2c_focus",
    label: "3. Enfoque B2C ('Tu crédito, con más claridad')",
    instruction:
      "Ajusta la pieza hacia la audiencia B2C de compra de vivienda y personas naturales bajo el claim 'Tu crédito, con más claridad': explica sin tecnicismos excluyentes los pasos visibles, documentos requeridos, relación cuota/ingreso del 30% (Ley 546) y comparación Pesos vs. UVR.",
  },
  {
    id: "b2b_focus",
    label: "4. Enfoque B2B ('Mejores oportunidades. Procesos más inteligentes')",
    instruction:
      "Ajusta la pieza hacia la audiencia B2B (gerentes financieros, contadores, pymes y aliados) bajo el claim 'Mejores oportunidades. Procesos más inteligentes': profundiza en ciclo de conversión de caja, los 3 eventos obligatorios en RADIAN (DIAN), elegibilidad y trazabilidad documental.",
  },
  {
    id: "compliance_audit",
    label: "5. Blindaje de Reputación por Diseño (Sección 10)",
    instruction:
      "Audita y perfecciona el texto bajo la Política de Promesas del Brand Blueprint (Sección 10): elimina cualquier expresión que sugiera aprobación automática, tasa asegurada o desembolso garantizado; refuerza que toda operación está sujeta a evaluación del aliado financiero y añade aviso de privacidad Ley 1581 Habeas Data.",
  },
];


