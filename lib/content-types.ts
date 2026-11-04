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
    shortLabel: "Vivienda B2C (35%)",
    targetPercentage: 35,
    audience: "B2C_VIVIENDA",
    color: "#0284c7", // Sky 600
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
    defaultCtaLabel: "Simular mi crédito de vivienda",
    defaultCtaUrl:
      "/simulador?utm_source=linkedin&utm_medium=organic&utm_campaign=vivienda_b2c",
  },
  FACTORING_B2B: {
    key: "FACTORING_B2B",
    number: 2,
    label: "Pilar 2 · Liquidez empresarial y factoring",
    shortLabel: "Factoring B2B (30%)",
    targetPercentage: 30,
    audience: "B2B_EMPRESAS",
    color: "#0f766e", // Teal 700
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
      "/contacto?utm_source=linkedin&utm_medium=organic&utm_campaign=factoring_b2b",
  },
  AUTORIDAD_MERCADO: {
    key: "AUTORIDAD_MERCADO",
    number: 3,
    label: "Pilar 3 · Autoridad y análisis del mercado",
    shortLabel: "Autoridad y Mercado (20%)",
    targetPercentage: 20,
    audience: "HIBRIDO_ALIADOS",
    color: "#4338ca", // Indigo 700
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
    shortLabel: "Confianza y Conversión (15%)",
    targetPercentage: 15,
    audience: "HIBRIDO_ALIADOS",
    color: "#059669", // Emerald 600
    description:
      "Transparencia sobre el modelo de acompañamiento multibanco de FINTERA, resolución de preguntas frecuentes y conversión consultiva hacia evaluación de perfil.",
    coreTopics: [
      "Cómo trabaja FINTERA: criterio financiero, acompañamiento y transparencia",
      "Explicación paso a paso de nuestro proceso de radicación y análisis multibanco",
      "Distinción transparente entre líneas vigentes y soluciones en estructuración",
      "Preguntas frecuentes sobre viabilidad crediticia, centrales de riesgo y tiempos",
      "Invitaciones directas a evaluar una necesidad de financiación personalizada",
    ],
    defaultCtaLabel: "Iniciar estudio de viabilidad sin costo",
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

