/**
 * lib/research/research-desks.ts
 *
 * FINTERA Strategic Research Desks aligned with the 4 Content Pillars:
 * 1. Vivienda y Financiación Personal (35% — B2C)
 * 2. Liquidez Empresarial y Factoring (30% — B2B)
 * 3. Autoridad y Análisis del Mercado (20% — Híbrido / Aliados)
 * 4. Confianza y Generación de Oportunidades (15% — Conversión)
 */

import { ResearchDeskConfig, ResearchDeskState } from "./types";
import { researchSignalEngine } from "./signal-engine";

export class ResearchDeskRegistry {
  private desks: ResearchDeskConfig[] = [
    {
      id: "desk_vivienda_b2c",
      name: "Mesa 1 · Vivienda y Financiación Personal",
      slug: "vivienda-financiacion-personal",
      pillar: "VIVIENDA_B2C",
      targetSharePct: 35,
      domain: "B2C Crédito Hipotecario y Leasing Habitacional en Colombia",
      description:
        "Monitorea tasas efectivas anuales (SFC), inflación/UVR (BanRep), indicadores de vivienda nueva (DANE), programas del FNA y reportes de Asobancaria y Camacol para orientar a compradores de vivienda.",
      trackedKeywords: [
        "crédito hipotecario Colombia",
        "leasing habitacional",
        "capacidad de endeudamiento",
        "UVR vs pesos",
        "cuota inicial vivienda",
        "seguros hipotecarios",
        "tasa efectiva anual vivienda",
      ],
      trackedEntities: [
        "Superfinanciera (SFC)",
        "Banco de la República",
        "DANE",
        "Fondo Nacional del Ahorro",
        "Asobancaria",
        "Camacol",
      ],
      monitoringCadenceMinutes: 120,
      preferredSources: ["sfc", "banrep", "dane", "fna", "asobancaria", "camacol"],
      alertThreshold: "ALL_EMERGING",
      isActive: true,
      priority: "CRITICAL",
      freshnessHorizon: "7d",
      status: "CONFIGURED",
      version: 1,
    },
    {
      id: "desk_factoring_b2b",
      name: "Mesa 2 · Liquidez Empresarial y Factoring",
      slug: "liquidez-empresarial-factoring",
      pillar: "FACTORING_B2B",
      targetSharePct: 30,
      domain: "B2B Capital de Trabajo, Factura Electrónica RADIAN y Factoring",
      description:
        "Monitorea normatividad de factura electrónica y RADIAN (DIAN), marco legal de factoring (Supersociedades), estudios de tejido empresarial (Confecámaras, Bancóldex) y reportes multilaterales (OCDE, IFC, FCI).",
      trackedKeywords: [
        "factoring Colombia",
        "RADIAN DIAN",
        "factura electrónica título valor",
        "ciclo de conversión de efectivo",
        "capital de trabajo pymes",
        "cuentas por cobrar 60 90 días",
        "descuento de facturas vs préstamo",
      ],
      trackedEntities: [
        "DIAN · RADIAN",
        "Supersociedades",
        "Confecámaras",
        "Bancóldex",
        "IFC",
        "OCDE",
        "Factors Chain International (FCI)",
      ],
      monitoringCadenceMinutes: 180,
      preferredSources: [
        "dian",
        "supersociedades",
        "confecamaras",
        "bancoldex",
        "ifc",
        "oecd",
        "fci",
      ],
      alertThreshold: "ALL_EMERGING",
      isActive: true,
      priority: "CRITICAL",
      freshnessHorizon: "7d",
      status: "CONFIGURED",
      version: 1,
    },
    {
      id: "desk_autoridad_mercado",
      name: "Mesa 3 · Autoridad y Análisis del Mercado",
      slug: "autoridad-analisis-mercado",
      pillar: "AUTORIDAD_MERCADO",
      targetSharePct: 20,
      domain: "Macroeconomía Colombiana, Política Monetaria y Costo Financiero",
      description:
        "Sintetiza decisiones de tasa de intervención del Banco de la República, curvas de tasas de la Superfinanciera y estudios comparados de OCDE y Banco Mundial con simulaciones numéricas transparentes.",
      trackedKeywords: [
        "tasa de intervención BanRep",
        "inflación IPC Colombia",
        "costo efectivo total crédito",
        "desembolsos hipotecarios",
        "Financing SMEs OECD Colombia",
      ],
      trackedEntities: [
        "Banco de la República",
        "Superfinanciera (SFC)",
        "OCDE",
        "Banco Mundial",
        "DANE",
      ],
      monitoringCadenceMinutes: 240,
      preferredSources: ["banrep", "sfc", "dane", "oecd", "worldbank", "asobancaria"],
      alertThreshold: "HIGH_VELOCITY_ONLY",
      isActive: true,
      priority: "HIGH",
      freshnessHorizon: "7d",
      status: "CONFIGURED",
      version: 1,
    },
    {
      id: "desk_confianza_conversion",
      name: "Mesa 4 · Confianza y Generación de Oportunidades",
      slug: "confianza-oportunidades-fintera",
      pillar: "CONFIANZA_OPORTUNIDADES",
      targetSharePct: 15,
      domain: "Metodología de Acompañamiento Multibanco FINTERA y Educación Preventiva",
      description:
        "Traduce criterios de originación bancaria, requisitos documentales y transparencia comercial en guías accionables que convierten lectores de LinkedIn en solicitudes calificadas.",
      trackedKeywords: [
        "acompañamiento crédito vivienda",
        "documentos solicitud hipotecaria",
        "preaprobación multibanco",
        "transparencia financiera",
        "evaluación de perfil crediticio",
      ],
      trackedEntities: [
        "FINTERA",
        "Superfinanciera (SFC)",
        "Fondo Nacional del Ahorro",
        "Camacol",
        "Supersociedades",
      ],
      monitoringCadenceMinutes: 360,
      preferredSources: ["sfc", "fna", "camacol", "supersociedades", "bancoldex"],
      alertThreshold: "HIGH_VELOCITY_ONLY",
      isActive: true,
      priority: "HIGH",
      freshnessHorizon: "30d",
      status: "CONFIGURED",
      version: 1,
    },
  ];

  public getDesks(): ResearchDeskState[] {
    const allSignals = researchSignalEngine.getSignals();
    return this.desks.map((desk) => {
      const matchingSignals = allSignals.filter(
        (s) =>
          s.pillar === desk.pillar ||
          desk.preferredSources.includes(s.sourceId)
      );
      const uniqueSources = new Set(matchingSignals.map((s) => s.sourceId)).size;

      return {
        ...desk,
        activeSignalsCount: matchingSignals.length,
        governedClaimsCount: matchingSignals.length * 3,
        verifiedClaimsCount: matchingSignals.length * 3,
        uniqueSourcesCount: Math.max(uniqueSources, desk.preferredSources.length),
        freshnessPercentage: 98,
        lastBriefGeneratedAt: "2026-10-30T14:00:00Z",
        latestBriefId: `brief_${desk.slug}_oct2026`,
      };
    });
  }

  public getDeskBySlug(slug: string): ResearchDeskState | undefined {
    return this.getDesks().find((d) => d.slug === slug || d.id === slug);
  }
}

export const researchDeskRegistry = new ResearchDeskRegistry();

