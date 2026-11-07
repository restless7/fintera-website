/**
 * lib/linkedin-generator.ts
 *
 * Agnostic, Multi-Month & Trend-Driven LinkedIn Calendar & Post Generator.
 * Dynamically synthesizes LinkedIn publication calendars for any month/year
 * using real-time signals from the 14 Authoritative Sources and the 4 Strategic Desks.
 */

import { ContentTypeKey, FinteraContentPillarKey } from "./content-types";
import { LinkedinCalendarPostSpec } from "./linkedin-strategy";
import { ResearchSignal } from "./research/types";

export interface MonthCalendarConfig {
  monthName: string;
  year: number;
  focusTheme: string;
}

export const MONTH_THEMES: Record<number, string> = {
  1: "Planeación Financiera Anual, Metas de Ahorro y Reactivación Hipotecaria",
  2: "Cesantías para Vivienda, Cierre Contable y Capital de Trabajo",
  3: "Declaración de Renta Persona Jurídica, Liquidez y RADIAN",
  4: "Tasas de Intervención BanRep, UVR vs. Pesos y Crédito Constructor",
  5: "Día de la Madre, Decisiones Patrimoniales y Leasing Habitacional",
  6: "Cierre Primer Semestre, Prima de Servicios y Abono a Capital",
  7: "Perspectivas Macroeconómicas DANE y Balance de Cartera",
  8: "Declaración de Renta Personas Naturales y Capacidad de Pago",
  9: "Semana del Tejido Empresarial, Pymes y Factoring Electrónico",
  10: "Presentación y Posicionamiento Multibanco con Fuentes Oficiales",
  11: "Cierre Financiero de Proyectos Inmobiliarios y Liquidez de Fin de Año",
  12: "Planificación de Cuota Inicial, Primas y Estrategia Tributaria",
};

export const SPANISH_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function generateAgnosticMonthCalendar(params: {
  monthIndex: number; // 0-11
  year: number;
  signals: ResearchSignal[];
}): LinkedinCalendarPostSpec[] {
  const monthName = SPANISH_MONTHS[params.monthIndex] || "Noviembre";
  const cutoffDate = `${monthName} ${params.year}`;

  const signalsByPillar: Record<FinteraContentPillarKey, ResearchSignal[]> = {
    VIVIENDA_B2C: params.signals.filter((s) => s.pillar === "VIVIENDA_B2C"),
    FACTORING_B2B: params.signals.filter((s) => s.pillar === "FACTORING_B2B"),
    AUTORIDAD_MERCADO: params.signals.filter((s) => s.pillar === "AUTORIDAD_MERCADO"),
    CONFIANZA_OPORTUNIDADES: params.signals.filter((s) => s.pillar === "CONFIANZA_OPORTUNIDADES"),
  };

  const getSignalFor = (pillar: FinteraContentPillarKey, idx: number) => {
    const list = signalsByPillar[pillar];
    if (list && list.length > 0) {
      return list[idx % list.length];
    }
    return null;
  };

  const weeksSpecs = [
    {
      week: 1 as const,
      theme: `Semana 1 · Contexto Macroeconómico y Criterio Financiero (${cutoffDate})`,
      posts: [
        {
          day: "Lunes" as const,
          categoryBadge: "Marca" as const,
          pillar: "CONFIANZA_OPORTUNIDADES" as FinteraContentPillarKey,
          title: `Criterio financiero y acompañamiento: ¿Por qué FINTERA no promete aprobaciones sin estudio?`,
          format: "Carrusel institucional (1080×1350)",
          contentType: "TUTORIAL" as ContentTypeKey,
          objective:
            "Explicar el modelo de acompañamiento técnico multibanco frente al riesgo de presentar solicitudes a ciegas.",
          sources: ["Superintendencia Financiera de Colombia (SFC)", "Asobancaria"],
          sig: getSignalFor("CONFIANZA_OPORTUNIDADES", 0),
        },
        {
          day: "Martes" as const,
          categoryBadge: "Vivienda" as const,
          pillar: "VIVIENDA_B2C" as FinteraContentPillarKey,
          title: `Variables críticas en crédito de vivienda para ${cutoffDate}: Más allá de la tasa anunciada`,
          format: "Carrusel educativo (1080×1350)",
          contentType: "GUIDE" as ContentTypeKey,
          objective:
            "Educar en la evaluación del costo financiero total: seguros de vida/incendio, UVR vs. pesos y Ley 546.",
          sources: ["Superfinanciera (SFC)", "Banco de la República", "DANE"],
          sig: getSignalFor("VIVIENDA_B2C", 0),
        },
        {
          day: "Miércoles" as const,
          categoryBadge: "Empresas" as const,
          pillar: "FACTORING_B2B" as FinteraContentPillarKey,
          title: `Cuentas por cobrar a 60–90 días: El costo oculto en el flujo de caja pyme (${cutoffDate})`,
          format: "Post de análisis",
          contentType: "BLOG_POST" as ContentTypeKey,
          objective:
            "Analizar el desfase de caja entre ventas a crédito y compra de inventario de contado.",
          sources: ["DIAN (RADIAN)", "Confecámaras", "OCDE"],
          sig: getSignalFor("FACTORING_B2B", 0),
        },
        {
          day: "Jueves" as const,
          categoryBadge: "Conversión" as const,
          pillar: "CONFIANZA_OPORTUNIDADES" as FinteraContentPillarKey,
          title: `¿Planeando comprar vivienda o expandir tu empresa en ${monthName}?`,
          format: "Guía de conversión consultiva",
          contentType: "BLOG_POST" as ContentTypeKey,
          objective:
            "Invitar a una pre-evaluación con enlace seguro y sin compartir datos sensibles en redes públicas.",
          sources: ["FINTERA Soluciones Financieras", "Ley 1581 Habeas Data"],
          sig: getSignalFor("CONFIANZA_OPORTUNIDADES", 1),
        },
      ],
    },
    {
      week: 2 as const,
      theme: `Semana 2 · Metodología Numérica y Casos Prácticos (${cutoffDate})`,
      posts: [
        {
          day: "Lunes" as const,
          categoryBadge: "Vivienda" as const,
          pillar: "VIVIENDA_B2C" as FinteraContentPillarKey,
          title: `Caso numérico: Cómo estimar tu capacidad de endeudamiento real con la regla del 30%`,
          format: "Caso numérico ilustrativo",
          contentType: "CASE_STUDY" as ContentTypeKey,
          objective:
            "Desglosar el cálculo de ingreso requerido, primera cuota y gastos notariales con supuestos transparentes.",
          sources: ["Superfinanciera (SFC)", "DANE", "FNA"],
          sig: getSignalFor("VIVIENDA_B2C", 1),
        },
        {
          day: "Martes" as const,
          categoryBadge: "Empresas" as const,
          pillar: "FACTORING_B2B" as FinteraContentPillarKey,
          title: `Factoring vs. Crédito Tradicional: Matriz de decisión financiera para gerentes`,
          format: "Tabla comparativa en carrusel",
          contentType: "TUTORIAL" as ContentTypeKey,
          objective:
            "Diferenciar la cesión de derechos económicos sobre facturas frente al endeudamiento bancario en balance.",
          sources: ["DIAN (RADIAN)", "Superintendencia de Sociedades", "Bancóldex"],
          sig: getSignalFor("FACTORING_B2B", 1),
        },
        {
          day: "Miércoles" as const,
          categoryBadge: "Mercado" as const,
          pillar: "AUTORIDAD_MERCADO" as FinteraContentPillarKey,
          title: `Pulso de tasas y transmisión de política monetaria del BanRep (${cutoffDate})`,
          format: "Post de autoridad y análisis",
          contentType: "BLOG_POST" as ContentTypeKey,
          objective:
            "Interpretar la trayectoria de inflación y tasas efectivas anuales para deudores hipotecarios y pymes.",
          sources: ["Banco de la República", "DANE (IPC)", "Superfinanciera"],
          sig: getSignalFor("AUTORIDAD_MERCADO", 0),
        },
        {
          day: "Jueves" as const,
          categoryBadge: "Conversión" as const,
          pillar: "CONFIANZA_OPORTUNIDADES" as FinteraContentPillarKey,
          title: `Lista de chequeo: Documentos que debes preparar antes de radicar tu solicitud`,
          format: "Checklist interactivo",
          contentType: "GUIDE" as ContentTypeKey,
          objective:
            "Disminuir reprocesos bancarios organizando extractos, PILA y soportes tributarios con antelación.",
          sources: ["Asobancaria", "FINTERA Soluciones Financieras"],
          sig: getSignalFor("CONFIANZA_OPORTUNIDADES", 2),
        },
      ],
    },
    {
      week: 3 as const,
      theme: `Semana 3 · Profundización Técnica y Mitigación de Errores (${cutoffDate})`,
      posts: [
        {
          day: "Lunes" as const,
          categoryBadge: "Vivienda" as const,
          pillar: "VIVIENDA_B2C" as FinteraContentPillarKey,
          title: `Pesos a cuota fija vs. UVR: ¿Cuál conviene según tu perfil y expectativa de inflación?`,
          format: "Carrusel comparativo (1080×1350)",
          contentType: "TUTORIAL" as ContentTypeKey,
          objective:
            "Aclarar cuándo la UVR permite mayor apalancamiento inicial y cuándo los pesos protegen el saldo a largo plazo.",
          sources: ["Banco de la República", "Superfinanciera", "DANE"],
          sig: getSignalFor("VIVIENDA_B2C", 2),
        },
        {
          day: "Martes" as const,
          categoryBadge: "Empresas" as const,
          pillar: "FACTORING_B2B" as FinteraContentPillarKey,
          title: `Los 3 eventos en RADIAN que toda factura debe cumplir para ser título valor`,
          format: "Guía técnica RADIAN",
          contentType: "GUIDE" as ContentTypeKey,
          objective:
            "Detallar los eventos de Acuse, Recibo de mercancía y Aceptación expresa/tácita ante la DIAN.",
          sources: ["DIAN (RADIAN)", "Superintendencia de Sociedades"],
          sig: getSignalFor("FACTORING_B2B", 2),
        },
        {
          day: "Miércoles" as const,
          categoryBadge: "Mercado" as const,
          pillar: "AUTORIDAD_MERCADO" as FinteraContentPillarKey,
          title: `¿Cuánto cuesta realmente escriturar una vivienda en Colombia en ${params.year}?`,
          format: "Desglose numérico",
          contentType: "BLOG_POST" as ContentTypeKey,
          objective:
            "Explicar derechos notariales, beneficencia, registro y gastos de avalúo que no cubre el banco.",
          sources: ["Supernotariado", "Camacol", "DANE"],
          sig: getSignalFor("AUTORIDAD_MERCADO", 1),
        },
        {
          day: "Jueves" as const,
          categoryBadge: "Conversión" as const,
          pillar: "CONFIANZA_OPORTUNIDADES" as FinteraContentPillarKey,
          title: `Diagnóstico sin costo: Cómo evaluar tu escenario financiero con un asesor FINTERA`,
          format: "Post de conversión y confianza",
          contentType: "BLOG_POST" as ContentTypeKey,
          objective:
            "Canalizar a usuarios calificados hacia el simulador o formulario privado bajo Ley 1581.",
          sources: ["FINTERA Soluciones Financieras"],
          sig: getSignalFor("CONFIANZA_OPORTUNIDADES", 0),
        },
      ],
    },
    {
      week: 4 as const,
      theme: `Semana 4 · Cierre de Mes, Síntesis de Inteligencia y Conversión (${cutoffDate})`,
      posts: [
        {
          day: "Lunes" as const,
          categoryBadge: "Vivienda" as const,
          pillar: "VIVIENDA_B2C" as FinteraContentPillarKey,
          title: `Relación entre plazo, cuota inicial y costo total de intereses: Simulador práctico`,
          format: "Carrusel de simulación (1080×1350)",
          contentType: "TUTORIAL" as ContentTypeKey,
          objective:
            "Demostrar cómo un abono extraordinario a capital o un 10% adicional de cuota inicial transforma el crédito.",
          sources: ["Superfinanciera", "DANE", "FNA"],
          sig: getSignalFor("VIVIENDA_B2C", 0),
        },
        {
          day: "Martes" as const,
          categoryBadge: "Empresas" as const,
          pillar: "FACTORING_B2B" as FinteraContentPillarKey,
          title: `Costo de anticipar vs. Costo de oportunidad: ¿Cuándo conviene hacer factoring?`,
          format: "Post de análisis gerencial",
          contentType: "BLOG_POST" as ContentTypeKey,
          objective:
            "Evaluar el descuento comercial de proveedores por pronto pago frente a la tasa de descuento financiero.",
          sources: ["Confecámaras", "OCDE", "DIAN"],
          sig: getSignalFor("FACTORING_B2B", 0),
        },
        {
          day: "Miércoles" as const,
          categoryBadge: "Mercado" as const,
          pillar: "AUTORIDAD_MERCADO" as FinteraContentPillarKey,
          title: `Dossier Mensual de Inteligencia: Tendencias del mercado financiero (${cutoffDate})`,
          format: "Resumen ejecutivo del Dossier",
          contentType: "WHITEPAPER" as ContentTypeKey,
          objective:
            "Sintetizar los hallazgos de las 4 Mesas de Investigación de FINTERA con fuentes primarias auditadas.",
          sources: ["SFC", "BanRep", "DANE", "DIAN", "OCDE"],
          sig: getSignalFor("AUTORIDAD_MERCADO", 0),
        },
        {
          day: "Jueves" as const,
          categoryBadge: "Conversión" as const,
          pillar: "CONFIANZA_OPORTUNIDADES" as FinteraContentPillarKey,
          title: `Hablemos de tu próximo proyecto: Vivienda o liquidez para tu empresa (${cutoffDate})`,
          format: "Cierre mensual de oportunidades",
          contentType: "BLOG_POST" as ContentTypeKey,
          objective:
            "Cerrar la cadencia mensual convirtiendo lectores calificados en evaluaciones personalizadas.",
          sources: ["FINTERA Soluciones Financieras", "Superfinanciera (SFC)"],
          sig: getSignalFor("CONFIANZA_OPORTUNIDADES", 1),
        },
      ],
    },
  ];

  const generatedSpecs: LinkedinCalendarPostSpec[] = [];

  for (const w of weeksSpecs) {
    for (const p of w.posts) {
      const dayAbbr = p.day.slice(0, 3).toLowerCase();
      const id = `cal_${params.year}_m${params.monthIndex + 1}_w${w.week}_${dayAbbr}`;
      const sigData = p.sig;

      const draftOutlineMarkdown = `## ${p.title}

*Fecha de corte oficial: ${cutoffDate} · Fuentes verificadas: ${p.sources.join(", ")}*

${
  sigData
    ? `> **Dato Oficial Reportado**: ${sigData.summary}\n>\n> **Criterio FINTERA**: ${sigData.finteraAngle}\n\n`
    : ""
}### Puntos Clave de Análisis
1. **Separación de Hechos y Opinión**: Respaldo en datos emitidos por entidades reguladoras colombianas.
2. **Criterio Financiero FINTERA**: Cómo aplicar este análisis en la práctica sin incurrir en sobreendeudamiento.
3. **Acompañamiento y Transparencia**: Evaluación sin promesas de aprobación automática.

*Consulta el informe completo y simula tu operación en www.finterasoluciones.co/insights.*`;

      generatedSpecs.push({
        id,
        week: w.week,
        weekTheme: w.theme,
        day: p.day,
        categoryBadge: p.categoryBadge,
        pillar: p.pillar,
        title: p.title,
        format: p.format,
        contentType: p.contentType,
        objective: p.objective,
        primarySources: p.sources,
        ctaText:
          p.pillar === "VIVIENDA_B2C"
            ? "Simula tu crédito de vivienda con criterio financiero"
            : p.pillar === "FACTORING_B2B"
            ? "Solicita un diagnóstico de liquidez empresarial"
            : "Conversemos sobre tu necesidad de financiación",
        ctaUrlWithUtm: `/insights?utm_source=linkedin&utm_medium=organic&utm_campaign=${id}`,
        draftOutlineMarkdown,
      });
    }
  }

  return generatedSpecs;
}

