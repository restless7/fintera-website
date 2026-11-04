/**
 * lib/research/theme-clustering.ts
 *
 * Research Theme Clustering & Velocity Analytics for FINTERA Soluciones Financieras.
 * Groups incoming financial signals into FINTERA's 4 strategic pillars.
 */

import { ResearchTheme } from "./types";
import { researchSignalEngine } from "./signal-engine";

export class ResearchThemeEngine {
  private curatedThemes: ResearchTheme[] = [
    {
      id: "theme_vivienda_tasas",
      name: "Crédito de Vivienda y Tasas Hipotecarias",
      slug: "credito-vivienda-tasas-colombia",
      pillar: "VIVIENDA_B2C",
      description:
        "Tasas efectivas anuales (SFC), comparación pesos vs. UVR, leasing habitacional, cuota inicial y capacidad de endeudamiento familiar.",
      velocityStatus: "HIGH_VELOCITY",
      velocityIndex: 4.9,
      signalCount: 16,
      uniqueSourcesCount: 6,
      topEntities: [
        "Superfinanciera (SFC)",
        "Banco de la República",
        "DANE",
        "Fondo Nacional del Ahorro",
        "Asobancaria",
        "Camacol",
      ],
      isEditorCurated: true,
      associatedDeskSlug: "vivienda-financiacion-personal",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "theme_factoring_radian",
      name: "Liquidez Empresarial, RADIAN y Factoring",
      slug: "liquidez-empresarial-radian-factoring",
      pillar: "FACTORING_B2B",
      description:
        "Ciclo de conversión de efectivo, factura electrónica como título valor en RADIAN (DIAN), descuento de facturas vs. endeudamiento bancario.",
      velocityStatus: "HIGH_VELOCITY",
      velocityIndex: 4.5,
      signalCount: 14,
      uniqueSourcesCount: 7,
      topEntities: [
        "DIAN · RADIAN",
        "Supersociedades",
        "OCDE",
        "IFC",
        "Confecámaras",
        "Bancóldex",
        "FCI",
      ],
      isEditorCurated: true,
      associatedDeskSlug: "liquidez-empresarial-factoring",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "theme_macro_costo_credito",
      name: "Macroeconomía y Costo del Crédito en Colombia",
      slug: "macroeconomia-costo-credito-colombia",
      pillar: "AUTORIDAD_MERCADO",
      description:
        "Política monetaria del Banco de la República, inflación IPC, evolución de la UVR y análisis del costo total de endeudamiento.",
      velocityStatus: "EMERGING",
      velocityIndex: 3.4,
      signalCount: 10,
      uniqueSourcesCount: 5,
      topEntities: [
        "Banco de la República",
        "Superfinanciera (SFC)",
        "OCDE",
        "Banco Mundial",
        "DANE",
      ],
      isEditorCurated: true,
      associatedDeskSlug: "autoridad-analisis-mercado",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "theme_confianza_acompanamiento",
      name: "Transparencia, Cumplimiento y Acompañamiento FINTERA",
      slug: "transparencia-acompanamiento-fintera",
      pillar: "CONFIANZA_OPORTUNIDADES",
      description:
        "Criterio financiero, preparación documental libre de rechazos, distinción transparente de servicios activos vs. en estructuración.",
      velocityStatus: "STABLE",
      velocityIndex: 2.8,
      signalCount: 8,
      uniqueSourcesCount: 4,
      topEntities: [
        "FINTERA",
        "Superfinanciera (SFC)",
        "Supersociedades",
        "Camacol",
      ],
      isEditorCurated: true,
      associatedDeskSlug: "confianza-oportunidades-fintera",
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
    },
  ];

  public getActiveThemes(): ResearchTheme[] {
    const signals = researchSignalEngine.getSignals();
    const themesMap = new Map<string, ResearchTheme>();

    for (const t of this.curatedThemes) {
      themesMap.set(t.name.toLowerCase(), { ...t });
    }

    for (const sig of signals) {
      const key = (sig.primaryTheme || "").toLowerCase();
      const theme = themesMap.get(key);
      if (theme) {
        theme.signalCount += 1;
        for (const ent of sig.entityHints) {
          if (!theme.topEntities.includes(ent)) {
            theme.topEntities.push(ent);
          }
        }
      }
    }

    return Array.from(themesMap.values()).sort(
      (a, b) => b.velocityIndex - a.velocityIndex
    );
  }
}

export const researchThemeEngine = new ResearchThemeEngine();

