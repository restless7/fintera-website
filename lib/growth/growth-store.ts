import fs from "fs";
import path from "path";
import { FinteraContentPillarKey } from "@/lib/content-types";

export type GrowthLeadChannel =
  | "B2B_FACTORING_CALCULATOR"
  | "PARTNER_REFERRAL_B2C"
  | "PARTNER_REFERRAL_B2B"
  | "INSIGHTS_UTM_CONVERSION"
  | "B2C_SIMULATOR_FASTTRACK";

export type PartnerCategory =
  | "INMOBILIARIA"
  | "CONSTRUCTORA"
  | "CONTADOR_PUBLICO"
  | "CONSULTOR_FINANCIERO"
  | "BROKER_INDEPENDIENTE";

export type GrowthLeadStage =
  | "DIAGNOSTICO_INICIAL"
  | "CARPETA_DOCUMENTAL"
  | "RADICADO_ENTIDADES"
  | "ESTUDIO_PAGADOR_O_AVALUO"
  | "APROBADO_DESEMBOLSADO";

export interface FinteraGrowthLead {
  id: string;
  trackingCode: string;
  channel: GrowthLeadChannel;
  pillar: FinteraContentPillarKey;
  stage: GrowthLeadStage;
  stageProgress: number; // 20 to 100
  // Client / Company Info
  clientName: string;
  companyName?: string;
  nitOrCedulaMasked: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  // Financial Metrics
  amountCOP: number;
  termDaysOrMonths: number;
  productLabel: string;
  // B2B Factoring Specifics
  radianReady?: boolean;
  radianEventsCompleted?: number; // 0 to 3
  estimatedNetBenefitCOP?: number;
  // Partner / Broker Specifics
  partnerName?: string;
  partnerCategory?: PartnerCategory;
  partnerEmail?: string;
  estimatedCommissionCOP?: number;
  // Content / UTM Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sourceArticleSlug?: string;
  sourceArticleTitle?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const CACHE_DIR = path.join(process.cwd(), ".cache");
const GROWTH_CACHE_FILE = path.join(CACHE_DIR, "fintera_growth_leads.json");

const SEEDED_GROWTH_LEADS: FinteraGrowthLead[] = [
  {
    id: "growth-b2b-001",
    trackingCode: "FIN-B2B-2610-841",
    channel: "B2B_FACTORING_CALCULATOR",
    pillar: "FACTORING_B2B",
    stage: "ESTUDIO_PAGADOR_O_AVALUO",
    stageProgress: 80,
    clientName: "Carlos Andrés Mejía (Director Financiero)",
    companyName: "Insumos Industriales del Valle S.A.S.",
    nitOrCedulaMasked: "NIT 900.***.*42-1",
    contactEmail: "cmejia@insumosvalle.co",
    contactPhone: "+57 315 *** 4820",
    city: "Cali",
    amountCOP: 185000000,
    termDaysOrMonths: 90,
    productLabel: "Factoring Electrónico RADIAN · Descuento Factura 90 Días",
    radianReady: true,
    radianEventsCompleted: 3,
    estimatedNetBenefitCOP: 3885000,
    utmSource: "linkedin",
    utmMedium: "organic_carousel",
    utmCampaign: "radian_factoring_oct2026",
    sourceArticleSlug:
      "lineamientos-tecnicos-del-registro-radian-y-eventos-obligatorios-para-que-la-factura-electronica-sea-titulo-valor-negociable",
    sourceArticleTitle:
      "Lineamientos técnicos del registro RADIAN y eventos obligatorios para que la factura electrónica sea título valor negociable",
    notes:
      "3 eventos RADIAN verificados (030, 032, 033). Pagador triple A del sector alimentos.",
    createdAt: "2026-10-28T14:20:00.000Z",
    updatedAt: "2026-11-05T16:10:00.000Z",
  },
  {
    id: "growth-ali-002",
    trackingCode: "FIN-ALI-2610-319",
    channel: "PARTNER_REFERRAL_B2C",
    pillar: "VIVIENDA_B2C",
    stage: "RADICADO_ENTIDADES",
    stageProgress: 60,
    clientName: "Familia Gómez Restrepo",
    nitOrCedulaMasked: "CC 1.037.***.*18",
    contactEmail: "lgomez@correo.co",
    contactPhone: "+57 310 *** 9102",
    city: "Medellín",
    amountCOP: 340000000,
    termDaysOrMonths: 240,
    productLabel: "Leasing Habitacional No VIS (Pesos Cuota Fija)",
    partnerName: "Inmobiliaria Escala Urbana S.A.S.",
    partnerCategory: "INMOBILIARIA",
    partnerEmail: "gerencia@escalaurbana.co",
    estimatedCommissionCOP: 2040000,
    utmSource: "portal_aliados",
    utmMedium: "referral",
    utmCampaign: "aliados_inmobiliarios_q4",
    sourceArticleSlug:
      "guia-2026-credito-de-vivienda-en-colombia-como-evaluar-alternativas-requisitos-y-costos",
    sourceArticleTitle:
      "Guía 2026 · Crédito de vivienda en Colombia: cómo evaluar alternativas, requisitos y costos",
    notes:
      "Radicado simultáneamente en Bancolombia e Itaú. Ingreso familiar consolidado con cónyuge (DTI 27%).",
    createdAt: "2026-10-30T10:15:00.000Z",
    updatedAt: "2026-11-06T09:45:00.000Z",
  },
  {
    id: "growth-ali-003",
    trackingCode: "FIN-ALI-2611-504",
    channel: "PARTNER_REFERRAL_B2B",
    pillar: "FACTORING_B2B",
    stage: "APROBADO_DESEMBOLSADO",
    stageProgress: 100,
    clientName: "Patricia Londoño (Gerente General)",
    companyName: "Logística y Empaques Andinos S.A.S.",
    nitOrCedulaMasked: "NIT 901.***.*89-4",
    contactEmail: "gerencia@empaquesandinos.co",
    contactPhone: "+57 318 *** 2219",
    city: "Bogotá D.C.",
    amountCOP: 260000000,
    termDaysOrMonths: 60,
    productLabel: "Factoring Corporativo · Anticipo Cartera Comercial",
    radianReady: true,
    radianEventsCompleted: 3,
    estimatedNetBenefitCOP: 5460000,
    partnerName: "Jorge E. Castellanos · Contador Público & Revisor Fiscal",
    partnerCategory: "CONTADOR_PUBLICO",
    partnerEmail: "jcastellanos@contadores.co",
    estimatedCommissionCOP: 1300000,
    utmSource: "portal_aliados",
    utmMedium: "contador_aliado",
    utmCampaign: "contadores_b2b_oct2026",
    sourceArticleSlug:
      "caso-practico-como-una-empresa-puede-evaluar-el-costo-de-esperar-el-pago-de-sus-facturas",
    sourceArticleTitle:
      "Caso práctico: Cómo una empresa puede evaluar el costo de esperar el pago de sus facturas",
    notes:
      "Operación estructurada con aliado fondeador y desembolsada en 48h tras validación RADIAN.",
    createdAt: "2026-11-01T11:30:00.000Z",
    updatedAt: "2026-11-06T12:00:00.000Z",
  },
  {
    id: "growth-utm-004",
    trackingCode: "FIN-VIV-2611-612",
    channel: "B2C_SIMULATOR_FASTTRACK",
    pillar: "VIVIENDA_B2C",
    stage: "CARPETA_DOCUMENTAL",
    stageProgress: 40,
    clientName: "Andrés Felipe Duarte",
    nitOrCedulaMasked: "CC 80.***.*94",
    contactEmail: "aduarte@empresa.co",
    contactPhone: "+57 320 *** 7741",
    city: "Bogotá D.C.",
    amountCOP: 210000000,
    termDaysOrMonths: 180,
    productLabel: "Crédito Hipotecario VIS · Pesos Cuota Fija",
    utmSource: "linkedin",
    utmMedium: "organic",
    utmCampaign: "vivienda_oct2026",
    sourceArticleSlug:
      "que-mirar-ademas-de-la-tasa-de-interes-al-comparar-alternativas-de-financiacion",
    sourceArticleTitle:
      "Qué mirar además de la tasa de interés al comparar alternativas de financiación en Colombia",
    notes:
      "Ingresó desde artículo en FINTERA Insights → Simulador Multibanco → Bóveda Documental.",
    createdAt: "2026-11-04T15:40:00.000Z",
    updatedAt: "2026-11-06T14:20:00.000Z",
  },
];

function loadCachedGrowthLeads(): FinteraGrowthLead[] {
  try {
    if (fs.existsSync(GROWTH_CACHE_FILE)) {
      const raw = fs.readFileSync(GROWTH_CACHE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const byCode = new Map<string, FinteraGrowthLead>();
        for (const seed of SEEDED_GROWTH_LEADS) {
          byCode.set(seed.trackingCode, seed);
        }
        for (const item of parsed) {
          byCode.set(item.trackingCode, item);
        }
        return Array.from(byCode.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    }
  } catch {
    // Fallback to seeded leads
  }
  return [...SEEDED_GROWTH_LEADS];
}

function saveCachedGrowthLeads(leads: FinteraGrowthLead[]): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(GROWTH_CACHE_FILE, JSON.stringify(leads, null, 2), "utf8");
  } catch {
    // Ignore read-only filesystem errors in serverless edge environments
  }
}

export function getAllGrowthLeads(): FinteraGrowthLead[] {
  return loadCachedGrowthLeads();
}

export function getGrowthLeadByTrackingCode(
  trackingCode: string
): FinteraGrowthLead | null {
  const normalized = trackingCode.trim().toUpperCase();
  const all = loadCachedGrowthLeads();
  return (
    all.find((l) => l.trackingCode.toUpperCase() === normalized) || null
  );
}

export function createGrowthLead(
  input: Omit<
    FinteraGrowthLead,
    "id" | "trackingCode" | "stage" | "stageProgress" | "createdAt" | "updatedAt"
  > & {
    stage?: GrowthLeadStage;
    stageProgress?: number;
  }
): FinteraGrowthLead {
  const now = new Date().toISOString();
  const prefix =
    input.channel === "B2B_FACTORING_CALCULATOR"
      ? "FIN-B2B"
      : input.channel === "PARTNER_REFERRAL_B2C" ||
          input.channel === "PARTNER_REFERRAL_B2B"
        ? "FIN-ALI"
        : "FIN-VIV";
  const randomDigits = Math.floor(100 + Math.random() * 900);
  const trackingCode = `${prefix}-2611-${randomDigits}`;

  const newLead: FinteraGrowthLead = {
    ...input,
    id: `growth-${Date.now()}-${randomDigits}`,
    trackingCode,
    stage: input.stage || "DIAGNOSTICO_INICIAL",
    stageProgress: input.stageProgress || 25,
    createdAt: now,
    updatedAt: now,
  };

  const existing = loadCachedGrowthLeads();
  const updated = [newLead, ...existing];
  saveCachedGrowthLeads(updated);
  return newLead;
}

export function getGrowthAnalyticsSummary() {
  const leads = loadCachedGrowthLeads();
  const b2bFactoringLeads = leads.filter(
    (l) =>
      l.channel === "B2B_FACTORING_CALCULATOR" ||
      l.channel === "PARTNER_REFERRAL_B2B"
  );
  const partnerReferrals = leads.filter(
    (l) =>
      l.channel === "PARTNER_REFERRAL_B2C" ||
      l.channel === "PARTNER_REFERRAL_B2B"
  );
  const totalPipelineCOP = leads.reduce((acc, l) => acc + l.amountCOP, 0);
  const b2bVolumeCOP = b2bFactoringLeads.reduce(
    (acc, l) => acc + l.amountCOP,
    0
  );
  const partnerVolumeCOP = partnerReferrals.reduce(
    (acc, l) => acc + l.amountCOP,
    0
  );

  const byPillar: Record<
    FinteraContentPillarKey,
    { count: number; volumeCOP: number }
  > = {
    VIVIENDA_B2C: { count: 0, volumeCOP: 0 },
    FACTORING_B2B: { count: 0, volumeCOP: 0 },
    AUTORIDAD_MERCADO: { count: 0, volumeCOP: 0 },
    CONFIANZA_OPORTUNIDADES: { count: 0, volumeCOP: 0 },
  };

  for (const lead of leads) {
    const p = byPillar[lead.pillar] || byPillar.VIVIENDA_B2C;
    p.count += 1;
    p.volumeCOP += lead.amountCOP;
  }

  return {
    totalLeads: leads.length,
    totalPipelineCOP,
    b2bFactoringCount: b2bFactoringLeads.length,
    b2bVolumeCOP,
    partnerReferralsCount: partnerReferrals.length,
    partnerVolumeCOP,
    byPillar,
    recentLeads: leads.slice(0, 8),
  };
}

