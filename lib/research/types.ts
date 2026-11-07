/**
 * lib/research/types.ts
 *
 * Core type definitions for FINTERA Research Intelligence OS & Financial Sources Engine.
 * Grounded in the 14 Colombian, Sectoral, and Multilateral sources defined in the
 * FINTERA Strategic Brand Positioning Plan (Oct 2026 – Jan 2027).
 */

import { z } from "zod";
import { FinteraContentPillarKey } from "../content-types";

export type SignalVelocityStatus =
  | "EMERGING"
  | "HIGH_VELOCITY"
  | "STABLE"
  | "COOLING";

export type FinancialSourceTier =
  | "OFICIAL_COLOMBIA"
  | "GREMIAL_SECTORIAL"
  | "MULTILATERAL_INTERNACIONAL";

export interface AuthoritativeSourceDefinition {
  id: string;
  number: number;
  name: string;
  shortName: string;
  tier: FinancialSourceTier;
  url: string;
  rssOrDataUrl?: string;
  credibilityScore: number; // 0.0 - 1.0
  whatItProvides: string;
  howFinteraUsesIt: string;
  alignedPillars: FinteraContentPillarKey[];
}

export const FINTERA_AUTHORITATIVE_SOURCES: AuthoritativeSourceDefinition[] = [
  // Fuentes oficiales colombianas (1–6)
  {
    id: "sfc",
    number: 1,
    name: "Superintendencia Financiera de Colombia (SFC)",
    shortName: "Superfinanciera (SFC)",
    tier: "OFICIAL_COLOMBIA",
    url: "https://www.superfinanciera.gov.co",
    credibilityScore: 0.99,
    whatItProvides:
      "Tasas de interés efectivas anuales por entidad y modalidad (VIS y No VIS, UVR y Pesos), simuladores de tarifas, desembolsos semanales de crédito y registro de entidades vigiladas.",
    howFinteraUsesIt:
      "Explicar cómo varían las tasas entre bancos, qué significa la tasa efectiva anual (E.A.), cómo se comportan los desembolsos hipotecarios y qué revisar al comparar ofertas.",
    alignedPillars: ["VIVIENDA_B2C", "AUTORIDAD_MERCADO", "CONFIANZA_OPORTUNIDADES"],
  },
  {
    id: "banrep",
    number: 2,
    name: "Banco de la República",
    shortName: "Banco de la República",
    tier: "OFICIAL_COLOMBIA",
    url: "https://www.banrep.gov.co",
    credibilityScore: 0.99,
    whatItProvides:
      "Estadísticas sobre inflación (IPC), Unidad de Valor Real (UVR), tasas de interés de política monetaria, sector financiero e informes macroeconómicos.",
    howFinteraUsesIt:
      "Contextualizar por qué suben o bajan las tasas hipotecarias, cómo la inflación afecta la cuota en UVR vs. Pesos y el costo del financiamiento empresarial.",
    alignedPillars: ["AUTORIDAD_MERCADO", "VIVIENDA_B2C", "FACTORING_B2B"],
  },
  {
    id: "dane",
    number: 3,
    name: "Departamento Administrativo Nacional de Estadística (DANE)",
    shortName: "DANE",
    tier: "OFICIAL_COLOMBIA",
    url: "https://www.dane.gov.co",
    credibilityScore: 0.98,
    whatItProvides:
      "Indicadores de vivienda nueva, índice de precios de vivienda, censo de edificaciones, licencias de construcción, empleo e ingresos de los hogares.",
    howFinteraUsesIt:
      "Respaldar artículos sobre el mercado de vivienda, comportamiento de precios por ciudad, capacidad de compra de los hogares y dinámica de la construcción.",
    alignedPillars: ["VIVIENDA_B2C", "AUTORIDAD_MERCADO"],
  },
  {
    id: "fna",
    number: 4,
    name: "Fondo Nacional del Ahorro (FNA)",
    shortName: "Fondo Nacional del Ahorro",
    tier: "OFICIAL_COLOMBIA",
    url: "https://www.fna.gov.co",
    credibilityScore: 0.96,
    whatItProvides:
      "Información pública sobre financiación de vivienda por cesantías o ahorro voluntario, modalidades en UVR y pesos, leasing habitacional y líneas jóvenes.",
    howFinteraUsesIt:
      "Construir guías comparativas sobre tipos de crédito de vivienda, requisitos, plazos y diferencias entre crédito hipotecario tradicional y leasing habitacional.",
    alignedPillars: ["VIVIENDA_B2C", "CONFIANZA_OPORTUNIDADES"],
  },
  {
    id: "dian",
    number: 5,
    name: "Dirección de Impuestos y Aduanas Nacionales (DIAN)",
    shortName: "DIAN · RADIAN",
    tier: "OFICIAL_COLOMBIA",
    url: "https://www.dian.gov.co",
    credibilityScore: 0.99,
    whatItProvides:
      "Documentación oficial sobre facturación electrónica, registro RADIAN, eventos de la factura electrónica de venta como título valor (acuse de recibo, recibo del bien/servicio y aceptación expresa o tácita).",
    howFinteraUsesIt:
      "Explicar con rigor técnico y tributario qué condiciones debe cumplir una factura electrónica en Colombia para negociarse mediante factoring.",
    alignedPillars: ["FACTORING_B2B", "AUTORIDAD_MERCADO"],
  },
  {
    id: "supersociedades",
    number: 6,
    name: "Superintendencia de Sociedades",
    shortName: "Supersociedades",
    tier: "OFICIAL_COLOMBIA",
    url: "https://www.supersociedades.gov.co",
    credibilityScore: 0.98,
    whatItProvides:
      "Publicaciones, circulares e iniciativas sobre el marco normativo del factoring en Colombia, prevención de lavado de activos (SAGRILAFT) y alianzas con la IFC.",
    howFinteraUsesIt:
      "Sustentar publicaciones sobre la formalización del factoring, su relevancia como fuente legítima de liquidez para mipymes y seguridad jurídica.",
    alignedPillars: ["FACTORING_B2B", "CONFIANZA_OPORTUNIDADES"],
  },

  // Fuentes sectoriales (7–10)
  {
    id: "asobancaria",
    number: 7,
    name: "Asobancaria",
    shortName: "Asobancaria",
    tier: "GREMIAL_SECTORIAL",
    url: "https://www.asobancaria.com/informes/",
    credibilityScore: 0.94,
    whatItProvides:
      "Informes periódicos del sector financiero colombiano, incluyendo el Informe de Vivienda, Semana Económica, leasing habitacional y calidad de cartera.",
    howFinteraUsesIt:
      "Contextualizar la evolución del crédito hipotecario, el leasing habitacional y el apetito crediticio de la banca comercial en Colombia.",
    alignedPillars: ["VIVIENDA_B2C", "AUTORIDAD_MERCADO"],
  },
  {
    id: "camacol",
    number: 8,
    name: "Cámara Colombiana de la Construcción (Camacol)",
    shortName: "Camacol",
    tier: "GREMIAL_SECTORIAL",
    url: "https://camacol.co",
    credibilityScore: 0.93,
    whatItProvides:
      "Informes económicos de Coordenada Urbana, ventas de vivienda VIS y No VIS, lanzamientos, iniciaciones y desistimientos inmobiliarios.",
    howFinteraUsesIt:
      "Conectar la necesidad de cierre financiero y preaprobación hipotecaria oportuna con la realidad del mercado constructor e inmobiliario.",
    alignedPillars: ["VIVIENDA_B2C", "CONFIANZA_OPORTUNIDADES"],
  },
  {
    id: "confecamaras",
    number: 9,
    name: "Confecámaras",
    shortName: "Confecámaras",
    tier: "GREMIAL_SECTORIAL",
    url: "https://confecamaras.org.co",
    credibilityScore: 0.93,
    whatItProvides:
      "Estudios sobre demografía empresarial, supervivencia de mipymes, acceso a mercados y determinantes del crecimiento empresarial en Colombia.",
    howFinteraUsesIt:
      "Explicar los retos reales de caja, plazos de pago de grandes pagadores y necesidades de capital de trabajo del tejido empresarial colombiano.",
    alignedPillars: ["FACTORING_B2B", "AUTORIDAD_MERCADO"],
  },
  {
    id: "bancoldex",
    number: 10,
    name: "Bancóldex",
    shortName: "Bancóldex",
    tier: "GREMIAL_SECTORIAL",
    url: "https://www.bancoldex.com",
    credibilityScore: 0.95,
    whatItProvides:
      "Programas de financiación empresarial, redescuento, líneas de capital de trabajo, modernización e inclusión financiera para mipymes.",
    howFinteraUsesIt:
      "Educar sobre las diferentes alternativas de liquidez y financiamiento empresarial disponibles en el ecosistema colombiano.",
    alignedPillars: ["FACTORING_B2B", "CONFIANZA_OPORTUNIDADES"],
  },

  // Fuentes internacionales (11–14)
  {
    id: "ifc",
    number: 11,
    name: "International Finance Corporation (IFC · Grupo Banco Mundial)",
    shortName: "IFC · World Bank Group",
    tier: "MULTILATERAL_INTERNACIONAL",
    url: "https://www.ifc.org",
    credibilityScore: 0.97,
    whatItProvides:
      "Estudios sobre financiamiento de cadenas de suministro (Supply Chain Finance), brecha de crédito mipyme y programas de impulso al factoring en Colombia.",
    howFinteraUsesIt:
      "Mostrar por qué el factoring y el financiamiento de cuentas por cobrar son herramientas clave de desarrollo productivo en economías emergentes.",
    alignedPillars: ["FACTORING_B2B", "AUTORIDAD_MERCADO"],
  },
  {
    id: "oecd",
    number: 12,
    name: "OCDE (Organización para la Cooperación y el Desarrollo Económicos)",
    shortName: "OCDE · Financing SMEs",
    tier: "MULTILATERAL_INTERNACIONAL",
    url: "https://www.oecd.org",
    credibilityScore: 0.98,
    whatItProvides:
      "Informe Financing SMEs and Entrepreneurs 2026 (capítulo Colombia): datos sobre acceso al crédito de pymes, tasas, colaterales, leasing, factoring y RADIAN.",
    howFinteraUsesIt:
      "Respaldar con evidencia internacional comparada el papel del factoring electrónico y el crédito estructurado para pymes en Colombia.",
    alignedPillars: ["FACTORING_B2B", "AUTORIDAD_MERCADO"],
  },
  {
    id: "worldbank",
    number: 13,
    name: "Banco Mundial (World Bank)",
    shortName: "Banco Mundial",
    tier: "MULTILATERAL_INTERNACIONAL",
    url: "https://www.worldbank.org",
    credibilityScore: 0.98,
    whatItProvides:
      "Datos e investigaciones sobre inclusión financiera, profundización del crédito hipotecario (crédito de vivienda / PIB) y financiamiento pyme.",
    howFinteraUsesIt:
      "Aportar contexto macroeconómico regional en whitepapers e informes institucionales de FINTERA Insights.",
    alignedPillars: ["AUTORIDAD_MERCADO", "VIVIENDA_B2C"],
  },
  {
    id: "fci",
    number: 14,
    name: "Factors Chain International (FCI)",
    shortName: "FCI Global Factoring",
    tier: "MULTILATERAL_INTERNACIONAL",
    url: "https://fci.nl",
    credibilityScore: 0.95,
    whatItProvides:
      "Estadísticas mundiales y latinoamericanas anuales sobre volumen de factoring doméstico e internacional y penetración sobre el PIB.",
    howFinteraUsesIt:
      "Dimensionar la relevancia global del factoring como instrumento de liquidez y su potencial de crecimiento en el mercado colombiano.",
    alignedPillars: ["FACTORING_B2B", "AUTORIDAD_MERCADO"],
  },
];

export interface ResearchSignal {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceTier: FinancialSourceTier;
  sourceCredibility: number;
  title: string;
  url: string;
  publishedAt: string;
  discoveredAt: string;
  cutoffDate: string;
  summary: string;
  pillar: FinteraContentPillarKey;
  topicHints: string[];
  entityHints: string[];
  noveltyScore: number;
  velocityScore: number;
  velocityStatus: SignalVelocityStatus;
  primaryTheme: string;
  finteraAngle: string;
  processingStatus: "RAW" | "DECOMPOSED" | "PACKED" | "ARCHIVED";
}

export interface ResearchTheme {
  id: string;
  name: string;
  slug: string;
  pillar: FinteraContentPillarKey;
  description: string;
  velocityStatus: SignalVelocityStatus;
  velocityIndex: number;
  signalCount: number;
  uniqueSourcesCount: number;
  topEntities: string[];
  isEditorCurated: boolean;
  associatedDeskSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchDeskConfig {
  id: string;
  name: string;
  slug: string;
  pillar: FinteraContentPillarKey;
  targetSharePct: number;
  domain: string;
  description: string;
  trackedKeywords: string[];
  trackedEntities: string[];
  monitoringCadenceMinutes: number;
  preferredSources: string[];
  alertThreshold: "HIGH_VELOCITY_ONLY" | "ALL_EMERGING";
  isActive: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  freshnessHorizon: "24h" | "7d" | "30d";
  status: "CONFIGURED" | "DORMANT" | "ARCHIVED";
  version: number;
}

export interface ResearchDeskState extends ResearchDeskConfig {
  activeSignalsCount: number;
  governedClaimsCount: number;
  verifiedClaimsCount: number;
  uniqueSourcesCount: number;
  freshnessPercentage: number;
  lastBriefGeneratedAt?: string;
  latestBriefId?: string;
}

export interface ResearchCitationRef {
  claimId: string;
  claimStatement: string;
  claimConfidence: number;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  cutoffDate: string;
  sourceCredibility: number;
  isFactSeparatedFromOpinion: boolean;
}

export interface ResearchBriefSection {
  id: string;
  type:
    | "EXECUTIVE_SUMMARY"
    | "PUBLISHED_FACTS"
    | "FINTERA_INTERPRETATION"
    | "NUMERICAL_SIMULATION"
    | "LINKEDIN_CADENCE_HOOKS"
    | "SOURCES_AND_CUTOFF";
  title: string;
  contentMarkdown: string;
  citations: ResearchCitationRef[];
}

export interface ResearchBrief {
  id: string;
  title: string;
  slug: string;
  deskSlug: string;
  deskName: string;
  pillar: FinteraContentPillarKey;
  timeWindow: "24h" | "7d" | "30d";
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED";
  cutoffDate: string;
  editionPeriod?: string;
  versionNumber?: number;
  executiveSummary: string;
  sections: ResearchBriefSection[];
  metrics: {
    totalClaimsCited: number;
    verifiedClaimsCount: number;
    uniqueSourcesCited: number;
    freshnessScore: number;
    generationDurationMs: number;
  };
  generatedAt: string;
  publishedAt?: string;
  author: string;
}

export const CreateBriefInputSchema = z.object({
  deskSlug: z.string().min(1),
  timeWindow: z.enum(["24h", "7d", "30d"]).default("30d"),
  editionPeriod: z.string().max(60).optional(),
  customTitle: z.string().max(180).optional(),
});

