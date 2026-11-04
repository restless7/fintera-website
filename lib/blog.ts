/**
 * lib/blog.ts
 *
 * FINTERA Insights & Multi-Format Content Repository.
 * Supports BLOG_POST, WHITEPAPER, WEBINAR, CASE_STUDY, GUIDE, and TUTORIAL (LinkedIn Carousel).
 * Combines Prisma PostgreSQL persistence with a deterministic JSON cache fallback
 * pre-seeded with FINTERA's 5 Flagship Research Pieces and Month 1 LinkedIn Publications.
 */

import fs from "fs";
import path from "path";
import prisma from "./prisma";
import {
  ContentTypeKey,
  FinteraAudienceKey,
  FinteraContentPillarKey,
} from "./content-types";
import { ContentQaGate } from "./qa/qa-gate";
import { QaEvaluationResult } from "./qa/types";

export interface FinteraContentItem {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string;
  content: string;
  status: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  contentType: ContentTypeKey;
  pillar: FinteraContentPillarKey;
  audience: FinteraAudienceKey;
  cutoffDate: string;
  featured: boolean;
  gated: boolean;
  downloadUrl: string | null;
  typeMetadata: Record<string, unknown>;
  aiGenerated: boolean;
  aiModel: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  readingTime: number;
  wordCount: number;
  qaStatus: "UNVERIFIED" | "PASSED" | "FAILED" | "REMEDIATED" | "BYPASSED";
  qaScore: number;
  qaApprovalHash: string | null;
  qaReport: QaEvaluationResult | null;
  authorName: string;
  authorRole: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  views: number;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CACHE_DIR = path.join(process.cwd(), ".cache");
const POSTS_CACHE_FILE = path.join(CACHE_DIR, "fintera_insights_posts.json");

function buildSeededItem(
  partial: Omit<
    FinteraContentItem,
    "qaStatus" | "qaScore" | "qaApprovalHash" | "qaReport" | "wordCount"
  >
): FinteraContentItem {
  const qa = ContentQaGate.evaluate({
    postId: partial.id,
    title: partial.title,
    slug: partial.slug,
    excerpt: partial.excerpt,
    content: partial.content,
    metaTitle: partial.seoTitle,
    metaDescription: partial.seoDescription,
    tags: partial.tags,
    contentType: partial.contentType,
    pillar: partial.pillar,
    cutoffDate: partial.cutoffDate,
  });

  const wordCount = partial.content.trim().split(/\s+/).filter(Boolean).length;

  return {
    ...partial,
    wordCount,
    qaStatus: qa.decision === "PASSED" ? "PASSED" : "UNVERIFIED",
    qaScore: qa.overallScore,
    qaApprovalHash: qa.contentHash,
    qaReport: qa,
  };
}

const SEEDED_FINTERA_INSIGHTS: FinteraContentItem[] = [
  // 1. WHITEPAPER 01 — Vivienda B2C
  buildSeededItem({
    id: "fintera_wp_01_vivienda",
    title:
      "Crédito de vivienda en Colombia: cómo evaluar las alternativas de financiación",
    slug: "whitepaper-credito-vivienda-colombia-como-evaluar-alternativas",
    subtitle:
      "Guía técnica sobre tasas efectivas anuales, crédito en pesos vs. UVR, leasing habitacional, cuota inicial y costo total de endeudamiento",
    excerpt:
      "Informe institucional de FINTERA que explica con fuentes oficiales (Superfinanciera, Banco de la República, DANE, FNA y Asobancaria) cómo analizar y comparar ofertas de financiación de vivienda en Colombia más allá de la tasa nominal.",
    content: `## Resumen Ejecutivo

Comprar vivienda en Colombia es una de las decisiones patrimoniales más importantes para una persona o familia. Sin embargo, comparar alternativas de financiación fijándose únicamente en la tasa de interés publicitada suele llevar a errores de cálculo en el flujo de caja mensual y en el costo total de la operación.

En **FINTERA Soluciones Financieras** conectamos personas con alternativas de financiación acordes con su perfil y capacidad de pago, mediante **criterio financiero**, **acompañamiento cercano** y **transparencia**. Este whitepaper integra datos públicos con **fecha de corte Octubre 2026** para ofrecer una metodología clara de evaluación.

## 1. Datos Publicados por Fuentes Oficiales (Fecha de Corte: Octubre 2026)

- **Superintendencia Financiera de Colombia (SFC)**: Los reportes semanales de tasas de interés efectivas anuales (E.A.) por establecimiento de crédito muestran diferenciales significativos entre entidades para adquisición de vivienda VIS y No VIS, tanto en modalidades denominadas en **pesos (cuota fija)** como en **Unidad de Valor Real (UVR)**. ([Ver portal SFC](https://www.superfinanciera.gov.co))
- **Banco de la República**: La evolución de la inflación (IPC) determina la variación diaria de la UVR y las decisiones sobre la tasa de intervención monetaria se transmiten gradualmente al costo del crédito hipotecario. ([Ver estadísticas BanRep](https://www.banrep.gov.co))
- **DANE y Fondo Nacional del Ahorro (FNA)**: El Índice de Precios de la Vivienda Nueva (IPVN) y los lineamientos de originación hipotecaria recuerdan que, bajo la Ley 546 de 1999, la primera cuota del crédito de vivienda no puede superar el **30% de los ingresos familiares demostrables** (o hasta el 40% en casos específicos de vivienda VIS según reglamentación vigente). ([Ver DANE](https://www.dane.gov.co) · [Ver FNA](https://www.fna.gov.co))
- **Asobancaria**: El Informe de Vivienda destaca el peso creciente del **leasing habitacional** como instrumento para financiar vivienda No VIS con porcentajes de financiación de hasta el 80%–85% del valor comercial del inmueble. ([Ver Asobancaria](https://www.asobancaria.com/informes/))

## 2. Criterio e Interpretación de FINTERA: Las 5 Variables que Definen una Buena Decisión

Más allá del dato estadístico publicado por las autoridades, el análisis de FINTERA recomienda evaluar cinco dimensiones antes de radicar una solicitud:

1. **Tasa Efectiva Anual (E.A.) vs. Costo Total con Seguros**: Toda obligación hipotecaria incluye seguros obligatorios de vida deudor e incendio y terremoto. Una tasa ligeramente inferior puede resultar más costosa si las pólizas asociadas o los costos de administración son más elevados.
2. **Denominación en Pesos vs. UVR**:
   - **Crédito en Pesos (Cuota Fija)**: Permite certidumbre sobre el valor de la cuota durante todo el plazo (de 5 a 20 años), aunque exige mayor capacidad de pago en la primera cuota.
   - **Crédito en UVR**: Inicia con una cuota mensual más baja, pero tanto el saldo de capital como la cuota se ajustan con la inflación certificada por el DANE.
3. **Crédito Hipotecario vs. Leasing Habitacional**: En el crédito hipotecario el comprador adquiere la propiedad desde el desembolso (financiando generalmente hasta el 70% en No VIS y 80% en VIS); en el leasing habitacional la entidad financiera es propietaria durante el contrato y el locatario ejerce la opción de compra al final.
4. **Cuota Inicial y Gastos de Cierre**: Además del 20% o 30% de cuota inicial, el comprador debe presupuestar avalúo comercial, estudio de títulos, gastos notariales, beneficencia y registro.
5. **Perfil Documental y Capacidad de Endeudamiento**: La consistencia entre extractos bancarios, declaración de renta, certificados laborales o soportes de ingresos independientes es determinante para evitar rechazos.

## 3. Simulación Ilustrativa con Supuestos Transparentes

> **Nota de transparencia editorial**: *El siguiente ejercicio utiliza cifras hipotéticas con fines exclusivamente pedagógicos. No constituye una oferta comercial garantizada; las condiciones reales dependen del estudio de crédito de cada entidad vigilada.*

- **Valor del inmueble (No VIS)**: COP \\$350.000.000
- **Cuota inicial (30%)**: COP \\$105.000.000
- **Monto a financiar (70%)**: COP \\$245.000.000 a un plazo de **15 años (180 meses)**
- **Ingreso familiar mínimo estimado**: Para que la primera cuota (incluyendo seguros) no supere el 30% del ingreso neto familiar, el hogar debe demostrar ingresos consolidados acordes con el sistema de amortización elegido y descontar obligaciones rotativas vigentes en centrales de riesgo.

## 4. Cómo Acompaña FINTERA tu Proceso

En FINTERA no prometemos aprobaciones sin evaluar tu perfil. Nuestro equipo analiza gratuitamente tu capacidad de endeudamiento, compara alternativas en múltiples bancos aliados y te acompaña desde la estructuración documental hasta el desembolso.`,
    status: "PUBLISHED",
    contentType: "WHITEPAPER",
    pillar: "VIVIENDA_B2C",
    audience: "B2C_VIVIENDA",
    cutoffDate: "Octubre 2026",
    featured: true,
    gated: true,
    downloadUrl: "/simulador?utm_source=insights&utm_medium=whitepaper_01",
    typeMetadata: {
      version: "Edición Octubre 2026 · v1.0",
      pageCount: 22,
      executiveSummary:
        "Metodología técnica de FINTERA para comparar créditos hipotecarios en pesos, UVR y leasing habitacional en Colombia con fuentes oficiales de la SFC, BanRep, DANE, FNA y Asobancaria.",
      methodology:
        "Análisis comparativo de tasas efectivas anuales publicadas por la Superintendencia Financiera de Colombia y simulación de flujos de caja bajo Ley 546 de 1999.",
      keyFindings: [
        "Comparar únicamente la tasa nominal ignora el impacto de seguros de vida/incendio y gastos de escrituración.",
        "La elección entre Pesos y UVR depende de la sensibilidad del ingreso familiar frente a la inflación (IPC).",
        "La preparación previa de soportes tributarios y bancarios reduce significativamente los reprocesos en bancos.",
      ],
      targetAudience: [
        "Compradores de vivienda en Colombia",
        "Empleados y profesionales independientes",
        "Agentes inmobiliarios y constructores aliados",
      ],
      primarySources: [
        {
          institution: "Superintendencia Financiera de Colombia (SFC)",
          documentTitle: "Tasas de interés efectivas anuales de vivienda por entidad",
          url: "https://www.superfinanciera.gov.co",
          cutoffDate: "Octubre 2026",
        },
        {
          institution: "Banco de la República",
          documentTitle: "Estadísticas de inflación (IPC), UVR y política monetaria",
          url: "https://www.banrep.gov.co",
          cutoffDate: "Octubre 2026",
        },
        {
          institution: "DANE & Fondo Nacional del Ahorro (FNA)",
          documentTitle: "Indicadores de vivienda nueva y modalidades de financiación",
          url: "https://www.dane.gov.co",
          cutoffDate: "Octubre 2026",
        },
      ],
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "Whitepaper: Crédito de Vivienda en Colombia — Cómo Evaluar Alternativas | FINTERA",
    seoDescription:
      "Descarga el informe técnico de FINTERA sobre tasas efectivas anuales, crédito en pesos vs. UVR, leasing habitacional y capacidad de endeudamiento en Colombia.",
    seoKeywords:
      "crédito de vivienda Colombia, crédito hipotecario, leasing habitacional, UVR vs pesos, tasa efectiva anual, Superfinanciera, FINTERA",
    readingTime: 16,
    authorName: "Dirección de Criterio Financiero FINTERA",
    authorRole: "Comité Técnico Hipotecario",
    categoryName: "Vivienda y Financiación Personal",
    categorySlug: "vivienda-b2c",
    tags: [
      "Crédito de Vivienda",
      "UVR vs Pesos",
      "Leasing Habitacional",
      "Superfinanciera",
      "Capacidad de Endeudamiento",
    ],
    views: 420,
    publishedAt: "2026-10-28T10:00:00Z",
    scheduledAt: null,
    createdAt: "2026-10-25T10:00:00Z",
    updatedAt: "2026-10-28T10:00:00Z",
  }),

  // 2. WHITEPAPER 02 — Factoring B2B
  buildSeededItem({
    id: "fintera_wp_02_factoring",
    title:
      "Liquidez empresarial: alternativas para financiar el crecimiento sin esperar el pago de las facturas",
    slug: "whitepaper-liquidez-empresarial-factoring-radian-colombia",
    subtitle:
      "Análisis del ciclo de conversión de efectivo, el registro RADIAN de la DIAN y el funcionamiento del factoring frente al crédito empresarial tradicional",
    excerpt:
      "Informe técnico para gerentes financieros, contadores y empresarios en Colombia sobre cómo gestionar cuentas por cobrar a 30, 60 y 90 días, con datos de la DIAN (RADIAN), Supersociedades, OCDE (2026), IFC y FCI.",
    content: `## Resumen Ejecutivo

En el tejido empresarial colombiano, vender más no siempre equivale a tener mayor disponibilidad de caja. Cuando una pyme proveedora vende a crédito con plazos de **30, 60 o 90 días**, pero debe pagar nómina, impuestos y proveedores de contado, su crecimiento comercial puede generar un estrechamiento crítico de capital de trabajo.

En **FINTERA Soluciones Financieras** trabajamos en el desarrollo y conexión de soluciones financieras que contribuyan a gestionar las necesidades de liquidez empresarial —incluyendo la orientación técnica sobre operaciones de factoring a través de aliados vigilados— bajo principios de **criterio financiero**, **acompañamiento** y **transparencia**.

## 1. Marco Institucional y Datos Oficiales (Fecha de Corte: Octubre 2026)

- **Dirección de Impuestos y Aduanas Nacionales (DIAN — RADIAN)**: Para que una factura electrónica de venta sea considerada un **título valor negociable** en Colombia, debe cumplir con los requisitos del Código de Comercio y registrar en la plataforma **RADIAN** los eventos de: (1) acuse de recibo de la factura, (2) recibo del bien o prestación del servicio, y (3) aceptación expresa o tácita dentro de los tres días hábiles siguientes. ([Ver documentación DIAN](https://www.dian.gov.co))
- **Superintendencia de Sociedades & IFC (Grupo Banco Mundial)**: La alianza entre Supersociedades y la Corporación Financiera Internacional (IFC) impulsa el factoring como un instrumento formal de financiamiento de cadenas de suministro (Supply Chain Finance) bajo estrictos estándares de debida diligencia y prevención de riesgos (SAGRILAFT). ([Ver Supersociedades](https://www.supersociedades.gov.co) · [Ver IFC](https://www.ifc.org))
- **OCDE (*Financing SMEs and Entrepreneurs 2026* — Capítulo Colombia)**: El informe internacional de la OCDE destaca la evolución del factoring y el leasing en Colombia, señalando que la digitalización mediante facturación electrónica y RADIAN amplía el acceso a liquidez para pymes que carecen de garantías inmobiliarias para préstamos bancarios tradicionales. ([Ver OCDE](https://www.oecd.org))
- **Factors Chain International (FCI) y Confecámaras**: Las estadísticas globales de FCI y los estudios de supervivencia empresarial de Confecámaras confirman que la gestión eficiente de las cuentas por cobrar es uno de los principales determinantes de la continuidad operativa de las mipymes. ([Ver FCI](https://fci.nl) · [Ver Confecámaras](https://confecamaras.org.co))

## 2. Criterio Financiero FINTERA: Vender una Factura vs. Solicitar un Préstamo

Es indispensable distinguir técnicamente dos mecanismos de financiamiento de capital de trabajo:

- **Préstamo de Capital de Trabajo o Cupo Rotativo**: La empresa contrae un pasivo financiero en su balance, consume su cupo de endeudamiento bancario y la evaluación recae principalmente sobre el historial crediticio y garantías del solicitante.
- **Operación de Factoring (Descuento de Facturas)**: La empresa negocia un activo existente (una cuenta por cobrar documentada en una factura electrónica título valor en RADIAN). El análisis crediticio pondera de manera central la solvencia y calidad de pago del **pagador de la factura** (deudor comercial), además de la validez jurídica del título.

## 3. Cuándo Conviene Evaluar el Factoring y Cuándo No

1. **Cuándo conviene evaluarlo**:
   - Cuando la empresa tiene clientes corporativos sólidos que pagan a 60 o 90 días y necesita liquidez para aprovechar descuentos por pronto pago de insumos o atender nuevos pedidos rentables.
   - Cuando el margen bruto del negocio absorbe holgadamente la tasa de descuento financiera de la operación.
2. **Cuándo NO conviene**:
   - Cuando las facturas presentan controversias comerciales, entregas parciales no aceptadas o no tienen registrados los eventos obligatorios en RADIAN.
   - Cuando el margen operativo de la venta es tan estrecho que el descuento financiero compromete la rentabilidad neta.

## 4. Transparencia sobre el Portafolio Empresarial de FINTERA

En FINTERA distinguimos con total claridad entre el contenido educativo sobre mecanismos de liquidez y la disponibilidad operativa de cada línea. Toda evaluación de liquidez empresarial o vinculación con aliados de factoring requiere validación previa del perfil societario, verificación de facturas en RADIAN y análisis de las condiciones comerciales vigentes.`,
    status: "PUBLISHED",
    contentType: "WHITEPAPER",
    pillar: "FACTORING_B2B",
    audience: "B2B_EMPRESAS",
    cutoffDate: "Octubre 2026",
    featured: true,
    gated: true,
    downloadUrl: "/contacto?utm_source=insights&utm_medium=whitepaper_02",
    typeMetadata: {
      version: "Edición Octubre 2026 · v1.0",
      pageCount: 26,
      executiveSummary:
        "Guía ejecutiva para directores financieros, contadores y gerentes de pymes sobre el ciclo de conversión de efectivo, los requisitos de RADIAN (DIAN) y la evaluación técnica del factoring en Colombia.",
      methodology:
        "Revisión normativa del Anexo Técnico RADIAN de la DIAN, lineamientos de la Superintendencia de Sociedades y análisis comparado del reporte Financing SMEs and Entrepreneurs 2026 de la OCDE.",
      keyFindings: [
        "Una factura electrónica solo puede negociarse mediante factoring si cumple los tres eventos de título valor en RADIAN.",
        "El costo de descontar una factura debe compararse frente al costo de oportunidad de frenar la operación o perder descuentos de proveedores.",
        "El factoring evalúa primordialmente la calidad crediticia del pagador y la trazabilidad del título valor.",
      ],
      targetAudience: [
        "Gerentes financieros (CFOs) y directores administrativos",
        "Contadores públicos y revisores fiscales",
        "Gerentes de pymes proveedoras de grandes empresas",
      ],
      primarySources: [
        {
          institution: "DIAN (Dirección de Impuestos y Aduanas Nacionales)",
          documentTitle: "Documentación oficial de Facturación Electrónica y RADIAN",
          url: "https://www.dian.gov.co",
          cutoffDate: "Octubre 2026",
        },
        {
          institution: "OCDE",
          documentTitle: "Financing SMEs and Entrepreneurs 2026 — Capítulo Colombia",
          url: "https://www.oecd.org",
          cutoffDate: "Octubre 2026",
        },
        {
          institution: "Superintendencia de Sociedades & IFC",
          documentTitle: "Marco normativo del factoring y financiamiento de cadenas productivas",
          url: "https://www.supersociedades.gov.co",
          cutoffDate: "Octubre 2026",
        },
      ],
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "Whitepaper: Liquidez Empresarial, RADIAN y Factoring en Colombia | FINTERA",
    seoDescription:
      "Informe técnico sobre ciclo de conversión de efectivo, requisitos de factura electrónica en RADIAN (DIAN) y evaluación de factoring para empresas en Colombia.",
    seoKeywords:
      "factoring Colombia, RADIAN DIAN, factura electrónica título valor, liquidez empresarial, capital de trabajo pymes, OCDE Colombia, FINTERA",
    readingTime: 18,
    authorName: "Unidad de Soluciones Empresariales FINTERA",
    authorRole: "Comité de Estructuración B2B",
    categoryName: "Liquidez Empresarial y Factoring",
    categorySlug: "factoring-b2b",
    tags: [
      "Factoring",
      "RADIAN",
      "DIAN",
      "Capital de Trabajo",
      "Flujo de Caja",
      "OCDE",
    ],
    views: 365,
    publishedAt: "2026-10-29T09:00:00Z",
    scheduledAt: null,
    createdAt: "2026-10-26T09:00:00Z",
    updatedAt: "2026-10-29T09:00:00Z",
  }),

  // 3. WEBINAR 01 — Vivienda B2C
  buildSeededItem({
    id: "fintera_webinar_01_vivienda",
    title:
      "Webinar 01 · ¿Cómo elegir un crédito de vivienda sin fijarse únicamente en la tasa?",
    slug: "webinar-como-elegir-credito-vivienda-mas-alla-de-la-tasa",
    subtitle:
      "Sesión práctica de 40 minutos + 15 minutos de preguntas para compradores de vivienda, profesionales y agentes inmobiliarios en Colombia",
    excerpt:
      "En este webinar educativo analizamos un caso comparativo real entre ofertas de crédito hipotecario en pesos, UVR y leasing habitacional, desglosando seguros, plazo, cuota inicial y capacidad de endeudamiento.",
    content: `## Propósito de la Sesión

Muchos compradores de vivienda en Colombia inician su búsqueda preguntando únicamente qué banco ofrece la tasa de interés más baja del mes. Sin embargo, como muestran las estadísticas de la **Superintendencia Financiera de Colombia (SFC)** y del **Banco de la República** (*Fecha de corte: Octubre 2026*), el costo efectivo de una operación hipotecaria depende de la combinación entre tasa efectiva anual (E.A.), sistema de amortización (Pesos vs. UVR), primas de seguros obligatorios y plazo.

## Estructura del Webinar (30–40 min de exposición + 15 min de preguntas)

1. **Bloque 1 (10 min) · Cómo leer las tasas de la Superfinanciera**:
   - Diferencia entre tasa nominal mes vencido y **Tasa Efectiva Anual (E.A.)**.
   - Por qué las tasas varían entre vivienda VIS y No VIS.
2. **Bloque 2 (15 min) · Ejercicio comparativo en vivo (Pesos vs. UVR vs. Leasing Habitacional)**:
   - Simulación transparente con cifras ilustrativas sobre un inmueble de COP \\$320.000.000.
   - Impacto de la inflación certificada por el **DANE** sobre el saldo en UVR frente a la estabilidad de la cuota fija en pesos.
3. **Bloque 3 (15 min) · Preparación documental y acompañamiento FINTERA**:
   - Cómo calcular tu relación cuota/ingreso antes de firmar promesa de compraventa.
   - Los 4 errores documentales que más retrasan el estudio de crédito en bancos.
4. **Bloque 4 (15 min) · Sesión abierta de preguntas y respuestas**:
   - Resolución de dudas generales (sin solicitar información financiera confidencial en el chat público, en cumplimiento de la Ley 1581 de Habeas Data).

## ¿Para quién está diseñado este Webinar?

- **Personas y familias** que planean comprar vivienda nueva o usada en los próximos 3 a 12 meses.
- **Empleados y profesionales independientes** que desean organizar sus ingresos y capacidad de endeudamiento.
- **Agentes inmobiliarios y asesores de constructoras** que buscan herramientas técnicas para acompañar el cierre financiero de sus compradores.`,
    status: "PUBLISHED",
    contentType: "WEBINAR",
    pillar: "VIVIENDA_B2C",
    audience: "B2C_VIVIENDA",
    cutoffDate: "Octubre 2026",
    featured: true,
    gated: true,
    downloadUrl: "/simulador?utm_source=insights&utm_medium=webinar_01",
    typeMetadata: {
      eventDate: "2026-11-18T18:00:00-05:00",
      durationMinutes: 40,
      qaMinutes: 15,
      isOnDemand: false,
      registrationUrl: "/contacto?utm_source=insights&utm_medium=webinar_01",
      speakers: [
        {
          name: "Especialista en Originación Hipotecaria",
          role: "Líder de Acompañamiento B2C",
          company: "FINTERA Soluciones Financieras",
        },
        {
          name: "Analista de Riesgo y Capacidad de Pago",
          role: "Comité de Criterio Financiero",
          company: "FINTERA Soluciones Financieras",
        },
      ],
      agendaTopics: [
        "Lectura práctica de tasas efectivas anuales (SFC y BanRep)",
        "Comparación numérica: Crédito en Pesos vs. UVR vs. Leasing Habitacional",
        "Impacto de seguros de vida e incendio, avalúo y gastos notariales",
        "Checklist documental para evitar rechazos bancarios",
      ],
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "Webinar: ¿Cómo elegir un crédito de vivienda sin fijarse solo en la tasa? | FINTERA",
    seoDescription:
      "Regístrate al webinar educativo de FINTERA sobre comparación de créditos hipotecarios en pesos, UVR, seguros y capacidad de endeudamiento en Colombia.",
    seoKeywords:
      "webinar crédito de vivienda, comparar crédito hipotecario Colombia, UVR vs pesos, leasing habitacional, FINTERA",
    readingTime: 45,
    authorName: "Equipo Educativo FINTERA",
    authorRole: "FINTERA Academy",
    categoryName: "Vivienda y Financiación Personal",
    categorySlug: "vivienda-b2c",
    tags: ["Webinar", "Crédito de Vivienda", "Tasa Efectiva Anual", "UVR"],
    views: 275,
    publishedAt: "2026-10-30T11:00:00Z",
    scheduledAt: null,
    createdAt: "2026-10-27T11:00:00Z",
    updatedAt: "2026-10-30T11:00:00Z",
  }),

  // 4. WEBINAR 02 — Factoring B2B
  buildSeededItem({
    id: "fintera_webinar_02_factoring",
    title:
      "Webinar 02 · Factoring en Colombia: cómo convertir cuentas por cobrar en liquidez",
    slug: "webinar-factoring-colombia-convertir-cuentas-por-cobrar-en-liquidez",
    subtitle:
      "Sesión ejecutiva de 40 minutos + 15 minutos de preguntas para gerentes administrativos, directores financieros, contadores y empresarios",
    excerpt:
      "Analizamos el funcionamiento jurídico y financiero del factoring en Colombia, los eventos obligatorios de la factura electrónica en RADIAN (DIAN) y cómo evaluar el costo-beneficio de anticipar facturas.",
    content: `## Propósito de la Sesión

Las empresas proveedoras de grandes compañías en Colombia suelen enfrentar plazos de pago de 60 a 90 días que inmovilizan su capital de trabajo. Este webinar ejecutivo ofrece un marco técnico, transparente y respaldado en fuentes oficiales (**DIAN**, **Superintendencia de Sociedades**, **OCDE** e **IFC**, *Fecha de corte: Octubre 2026*) para comprender cómo funciona el factoring electrónico en Colombia.

## Estructura del Webinar (30–40 min de exposición + 15 min de preguntas)

1. **Bloque 1 (10 min) · El ciclo de caja y el costo oculto de esperar**:
   - Por qué una empresa rentable en el estado de resultados puede sufrir falta de liquidez operativa.
   - Diferencias contables y financieras entre solicitar un préstamo bancario y descontar una factura por cobrar.
2. **Bloque 2 (15 min) · Requisitos técnicos en RADIAN (DIAN)**:
   - Qué convierte a una factura electrónica de venta en un **título valor** endosable.
   - Revisión práctica de los eventos obligatorios: acuse de recibo, recibo de mercancía/servicio y aceptación expresa o tácita.
3. **Bloque 3 (15 min) · Evaluación de costos, riesgos y debida diligencia**:
   - Cómo evalúan los compradores de facturas al emisor y al pagador bajo lineamientos de **Supersociedades**.
   - Cuándo conviene utilizar factoring y cuándo es preferible otra alternativa de capital de trabajo (como líneas **Bancóldex** o crédito rotativo).
4. **Bloque 4 (15 min) · Preguntas y respuestas con especialistas**:
   - Espacio consultivo e invitación a diagnóstico privado de necesidades de liquidez empresarial.

## Audiencia Objetivo

- **Directores financieros (CFOs)** y gerentes administrativos.
- **Contadores públicos** y responsables de facturación electrónica y cartera.
- **Gerentes de pymes** que venden a crédito y buscan optimizar su flujo de caja.`,
    status: "PUBLISHED",
    contentType: "WEBINAR",
    pillar: "FACTORING_B2B",
    audience: "B2B_EMPRESAS",
    cutoffDate: "Octubre 2026",
    featured: false,
    gated: true,
    downloadUrl: "/contacto?utm_source=insights&utm_medium=webinar_02",
    typeMetadata: {
      eventDate: "2026-11-25T17:00:00-05:00",
      durationMinutes: 40,
      qaMinutes: 15,
      isOnDemand: false,
      registrationUrl: "/contacto?utm_source=insights&utm_medium=webinar_02",
      speakers: [
        {
          name: "Director de Estructuración Empresarial",
          role: "Especialista en Liquidez y Capital de Trabajo",
          company: "FINTERA Soluciones Financieras",
        },
        {
          name: "Consultor Invitado en Facturación Electrónica y RADIAN",
          role: "Auditor Tributario y de Títulos Valores",
          company: "Red de Aliados FINTERA",
        },
      ],
      agendaTopics: [
        "Diferencia entre venta de factura (factoring) y endeudamiento bancario",
        "Los 3 eventos obligatorios en RADIAN (DIAN) para negociar una factura",
        "Cálculo del costo efectivo de descuento frente al margen operativo",
        "Buenas prácticas de gestión de cartera para pymes en Colombia",
      ],
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "Webinar: Factoring en Colombia y Registro RADIAN para Liquidez Empresarial | FINTERA",
    seoDescription:
      "Participa en el webinar ejecutivo de FINTERA sobre factoring electrónico en Colombia, requisitos en RADIAN (DIAN) y gestión de capital de trabajo.",
    seoKeywords:
      "webinar factoring Colombia, RADIAN DIAN factura electrónica, liquidez empresarial pymes, cuentas por cobrar, FINTERA",
    readingTime: 45,
    authorName: "Unidad de Soluciones Empresariales FINTERA",
    authorRole: "FINTERA B2B",
    categoryName: "Liquidez Empresarial y Factoring",
    categorySlug: "factoring-b2b",
    tags: ["Webinar", "Factoring", "RADIAN", "DIAN", "Liquidez Empresarial"],
    views: 210,
    publishedAt: "2026-10-30T15:00:00Z",
    scheduledAt: null,
    createdAt: "2026-10-28T15:00:00Z",
    updatedAt: "2026-10-30T15:00:00Z",
  }),

  // 5. CASE STUDY — Simulación Numérica Documentada (Factoring / Liquidez)
  buildSeededItem({
    id: "fintera_case_01_costo_esperar_facturas",
    title:
      "Caso práctico: Cómo una empresa puede evaluar el costo de esperar el pago de sus facturas",
    slug: "caso-practico-evaluar-costo-esperar-pago-facturas-factoring",
    subtitle:
      "Simulación numérica documentada con supuestos transparentes sobre una factura comercial a 90 días, descuento por pronto pago de insumos y flujo de caja",
    excerpt:
      "Ejercicio financiero ilustrativo diseñado por FINTERA bajo su regla de transparencia editorial: cómo comparar matemáticamente el costo de anticipar una cuenta por cobrar frente al costo de oportunidad de esperar 90 días.",
    content: `## Nota de Transparencia Editorial FINTERA

> **Declaración explícita de simulación**: *Siguiendo la Regla Editorial de FINTERA, este documento presenta un **caso práctico con cifras ilustrativas e hipotéticas**. No corresponde al testimonio de un cliente real ni constituye una promesa de tasa o liquidez garantizada. Toda operación real está sujeta al registro válido en RADIAN (DIAN), evaluación del pagador y condiciones comerciales de los aliados financieros.*

## 1. Planteamiento del Escenario Ilustrativo

Imaginemos una empresa industrial colombiana proveedora de empaques que realiza una entrega a una gran cadena comercial bajo las siguientes condiciones hipotéticas (*Contexto de mercado: Octubre 2026, referencias DIAN / Supersociedades / Confecámaras*):

- **Valor de la factura electrónica emitida (neto de impuestos para el ejemplo)**: **COP \\$120.000.000**
- **Plazo contractual de pago del cliente (gran pagador)**: **90 días**
- **Estado en RADIAN (DIAN)**: Factura electrónica con acuse de recibo, recibo de mercancía y aceptación expresa registrada.
- **Necesidad operativa inmediata de la pyme**: La empresa necesita comprar materia prima por **COP \\$85.000.000** en el día 10; su proveedor de resina le ofrece un **descuento por pronto pago del 4,0%** (equivalente a **COP \\$3.400.000**) si paga de contado.

## 2. Comparación de Dos Decisiones Financieras

### Escenario A · Esperar los 90 días sin anticipar la factura
- La empresa recibe los **COP \\$120.000.000** en el día 90.
- Al no contar con liquidez en el día 10, pierde el descuento por pronto pago de su proveedor de materia prima (**costo de oportunidad directo: COP \\$3.400.000**) o debe frenar la toma de un nuevo pedido comercial.

### Escenario B · Evaluar el anticipo de la factura (Simulación Ilustrativa)
- Supongamos, únicamente a título pedagógico, que tras la validación del pagador y del título valor en RADIAN, una operación de descuento por los 80 días restantes representa un costo financiero total estimado de **COP \\$3.100.000**.
- **Efecto neto en caja**:
  1. La empresa recibe liquidez anticipada para cubrir su nómina y pagar de contado la materia prima.
  2. Captura el descuento comercial de **COP \\$3.400.000** otorgado por su proveedor de insumos, el cual compensa el costo financiero del anticipo (**COP \\$3.100.000**) y libera capital de trabajo para rotar nuevamente su inventario.

## 3. Lecciones de Criterio Financiero para el Empresario

1. **No mirar el descuento de forma aislada**: El costo financiero de anticipar una factura debe contrastarse siempre contra el **costo de oportunidad** (descuentos por pronto pago perdidos, recargos por mora en impuestos o ventas rechazadas por falta de capital de trabajo).
2. **Verificar primero la trazabilidad en RADIAN**: Según la normativa de la **DIAN**, sin los eventos electrónicos de aceptación, la factura no constituye título valor negociable.
3. **Acompañamiento transparente**: En FINTERA orientamos a las empresas para analizar su estructura de cuentas por cobrar y evaluar con rigor técnico qué alternativa de financiación se ajusta mejor a su flujo de caja.`,
    status: "PUBLISHED",
    contentType: "CASE_STUDY",
    pillar: "FACTORING_B2B",
    audience: "B2B_EMPRESAS",
    cutoffDate: "Octubre 2026",
    featured: true,
    gated: false,
    downloadUrl: "/contacto?utm_source=insights&utm_medium=case_study_01",
    typeMetadata: {
      clientName: "Simulación Ilustrativa FINTERA (Pyme Industrial Hipotética)",
      clientIndustry: "Manufactura y Suministros B2B en Colombia",
      clientSize: "Pyme (Ventas anuales ilustrativas: COP $3.500M)",
      isHypotheticalSimulation: true,
      challenge:
        "Factura emitida por COP $120.000.000 a 90 días que inmoviliza el capital de trabajo necesario para comprar materia prima con descuento por pronto pago.",
      solution:
        "Modelo de evaluación comparativa de FINTERA entre el costo de espera de 90 días y el costo efectivo de anticipar el título valor registrado en RADIAN.",
      results: [
        {
          metric: "Plazo de cuenta por cobrar",
          value: "90 días → Liquidez anticipada",
          description: "Sujeto a eventos de aceptación en RADIAN (DIAN)",
        },
        {
          metric: "Descuento por pronto pago capturado",
          value: "COP $3.400.000 (4,0%)",
          description: "En compra de materia prima (cifra ilustrativa)",
        },
        {
          metric: "Criterio de decisión",
          value: "Costo descuento vs. Costo de oportunidad",
          description: "Metodología transparente sin promesas garantizadas",
        },
      ],
      technologiesUsed: [
        "Factura Electrónica DIAN",
        "Registro RADIAN",
        "Modelado de Ciclo de Conversión de Efectivo",
      ],
      timeline: "Horizonte de evaluación de 90 días",
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "Caso Práctico: Cómo Evaluar el Costo de Esperar el Pago de tus Facturas | FINTERA",
    seoDescription:
      "Simulación numérica transparente de FINTERA sobre el costo de oportunidad de esperar facturas a 90 días frente a alternativas de liquidez y factoring en Colombia.",
    seoKeywords:
      "caso práctico factoring Colombia, costo de esperar facturas, simulación flujo de caja pymes, RADIAN DIAN, FINTERA",
    readingTime: 9,
    authorName: "Comité de Análisis Financiero FINTERA",
    authorRole: "Criterio Financiero Aplicado",
    categoryName: "Autoridad y Análisis del Mercado",
    categorySlug: "autoridad-mercado",
    tags: [
      "Caso Práctico",
      "Simulación Financiera",
      "Factoring",
      "Flujo de Caja",
      "RADIAN",
    ],
    views: 310,
    publishedAt: "2026-10-31T08:30:00Z",
    scheduledAt: null,
    createdAt: "2026-10-29T08:30:00Z",
    updatedAt: "2026-10-31T08:30:00Z",
  }),

  // 6. GUIDE — Vivienda B2C (Semana 1 Martes & Semana 2 Martes del Calendario)
  buildSeededItem({
    id: "fintera_guide_01_cinco_variables_hipotecarias",
    title:
      "Guía práctica: Antes de solicitar un crédito hipotecario en Colombia, revisa estas 5 variables y tu carpeta documental",
    slug: "guia-antes-de-solicitar-credito-hipotecario-5-variables-documentos",
    subtitle:
      "Lista de chequeo paso a paso para empleados, independientes y compradores de vivienda en Colombia",
    excerpt:
      "Conoce las 5 variables financieras y los documentos clave que evalúan los bancos en Colombia para aprobar un crédito de vivienda o leasing habitacional, con referencias de la Superfinanciera y el FNA.",
    content: `## Introducción: Prepararse antes de radicar

Uno de los errores más frecuentes al comprar vivienda en Colombia es firmar una promesa de compraventa sin haber validado previamente la capacidad real de endeudamiento ni tener lista la carpeta de soportes financieros. Con base en los parámetros públicos de la **Superintendencia Financiera de Colombia (SFC)**, el **Fondo Nacional del Ahorro (FNA)** y los informes sectoriales de **Asobancaria** y **Camacol** (*Fecha de corte: Octubre 2026*), en **FINTERA** estructuramos esta guía práctica.

## Las 5 Variables que Debes Revisar Antes de Solicitar tu Crédito

1. **Capacidad de endeudamiento y relación cuota/ingreso**:
   - Verifica que la primera cuota proyectada del crédito de vivienda no supere el **30% de tus ingresos mensuales demostrables** (conforme a la Ley 546 de 1999).
2. **Nivel actual de endeudamiento financiero y cupos rotativos**:
   - Las tarjetas de crédito con cupos altos (incluso si no están utilizados al 100%) y los créditos de libre inversión reducen tu capacidad de pago mensual ante el motor de riesgo de los bancos.
3. **Cuota inicial y costos adicionales de cierre**:
   - En crédito hipotecario tradicional necesitas al menos el **30% de cuota inicial** en vivienda No VIS (o 20% en VIS), más un **3% a 4% adicional** para avalúo, estudio de títulos, escrituración y registro.
4. **Modalidad de amortización (Pesos vs. UVR) y plazo (5 a 20 años)**:
   - Evalúa cómo se comporta la cuota mensual bajo inflación (**Banco de la República / DANE**) y cuál es el costo total incluyendo seguros de vida e incendio.
5. **Consistencia tributaria y bancaria de tus ingresos**:
   - Los bancos cruzan tus extractos bancarios de los últimos 3 a 6 meses con tu certificado de ingresos y retenciones o declaración de renta ante la **DIAN**.

## Lista de Documentos Según tu Perfil Laboral

- **Empleados**:
  - Certificación laboral vigente (no mayor a 30 días) indicando cargo, antigüedad, salario y tipo de contrato.
  - Desprendibles de nómina de los últimos 3 meses.
  - Certificado de Ingresos y Retenciones y/o Declaración de Renta.
- **Profesionales Independientes y Rentistas de Capital**:
  - Extractos bancarios de los últimos 6 meses.
  - Declaración de Renta de los últimos 1 o 2 años gravables (según política del banco).
  - RUT actualizado (**DIAN**), Cámara de Comercio (si aplica) y contratos o certificaciones de prestación de servicios.

## Evalúa tu Caso con el Acompañamiento de FINTERA

En FINTERA revisamos tu perfil antes de presentar la solicitud ante nuestras entidades financieras aliadas, cuidando tu historial en centrales de riesgo y explicándote con transparencia cada condición.`,
    status: "PUBLISHED",
    contentType: "GUIDE",
    pillar: "VIVIENDA_B2C",
    audience: "B2C_VIVIENDA",
    cutoffDate: "Octubre 2026",
    featured: false,
    gated: false,
    downloadUrl: "/simulador?utm_source=insights&utm_medium=guide_01",
    typeMetadata: {
      difficulty: "beginner",
      estimatedCompletionTime: "15 minutos de autoevaluación",
      prerequisites: [
        "Conocer tus ingresos mensuales brutos y netos",
        "Tener a la mano el valor estimado de tus deudas actuales",
      ],
      chapters: [
        {
          number: 1,
          title: "Cálculo de capacidad de endeudamiento (Límite del 30%)",
          summary: "Cómo proyectar la primera cuota según la Ley 546 de 1999.",
        },
        {
          number: 2,
          title: "Cuota inicial, avalúo, estudio de títulos y escrituración",
          summary: "Presupuesto integral para evitar sorpresas en el cierre financiero.",
        },
        {
          number: 3,
          title: "Checklist documental para empleados e independientes",
          summary: "Soportes exigidos por las entidades vigiladas por la Superfinanciera.",
        },
      ],
      keyTakeaways: [
        "Nunca comprometas recursos de cuota inicial sin una preevaluación realista de capacidad de pago.",
        "Reducir cupos ociosos en tarjetas de crédito mejora tu flujo disponible para la cuota hipotecaria.",
        "El acompañamiento multibanco permite identificar qué entidad se adapta mejor a tu tipo de ingresos.",
      ],
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "Guía: 5 Variables y Documentos antes de Solicitar un Crédito Hipotecario | FINTERA",
    seoDescription:
      "Revisa las 5 variables críticas y la lista de documentos para solicitar un crédito de vivienda o leasing habitacional en Colombia con el acompañamiento de FINTERA.",
    seoKeywords:
      "documentos crédito hipotecario Colombia, requisitos crédito de vivienda, capacidad de endeudamiento vivienda, FINTERA",
    readingTime: 10,
    authorName: "Equipo de Acompañamiento Hipotecario FINTERA",
    authorRole: "Originación Multibanco",
    categoryName: "Vivienda y Financiación Personal",
    categorySlug: "vivienda-b2c",
    tags: [
      "Guía Práctica",
      "Crédito Hipotecario",
      "Requisitos",
      "Capacidad de Pago",
    ],
    views: 290,
    publishedAt: "2026-11-01T09:00:00Z",
    scheduledAt: null,
    createdAt: "2026-10-30T09:00:00Z",
    updatedAt: "2026-11-01T09:00:00Z",
  }),

  // 7. BLOG_POST — Semana 1 Miércoles: Vender más no siempre significa tener más liquidez
  buildSeededItem({
    id: "fintera_post_01_vender_mas_vs_liquidez",
    title:
      "Vender más no siempre significa tener más liquidez: el impacto de las cuentas por cobrar en el flujo de caja",
    slug: "vender-mas-no-siempre-significa-tener-mas-liquidez-flujo-de-caja",
    subtitle:
      "Por qué las empresas en crecimiento enfrentan tensiones de tesorería cuando venden a 60 o 90 días y cómo analizar alternativas de capital de trabajo",
    excerpt:
      "Analizamos con datos de Confecámaras, la OCDE y la DIAN por qué la brecha temporal entre la facturación y el recaudo efectivo puede frenar a una pyme saludable.",
    content: `## El espejismo de la facturación creciente

En la gestión financiera de muchas pequeñas y medianas empresas en Colombia existe una paradoja frecuente: el estado de resultados muestra ventas récord y utilidad contable positiva, pero la cuenta bancaria no tiene saldo suficiente para cubrir la nómina del día 15, los pagos de seguridad social o las obligaciones tributarias ante la **DIAN**.

Como documentan los estudios de **Confecámaras** sobre el tejido empresarial colombiano y el informe *Financing SMEs and Entrepreneurs 2026* de la **OCDE** (*Fecha de corte: Octubre 2026*), uno de los mayores retos para las pymes proveedoras es la asimetría en los plazos de pago.

## 1. ¿Cómo se genera el bache de capital de trabajo?

Cuando una empresa acepta un nuevo contrato importante para suministrar bienes o servicios a una gran compañía, su ciclo operativo suele seguir esta secuencia:

- **Día 1**: Compra materias primas o contrata personal operativo (pago de contado o a 15–30 días).
- **Día 30**: Entrega el producto o servicio y emite la **factura electrónica de venta**.
- **Día 90 o 120**: Recibe finalmente el desembolso de la factura por parte del pagador.

Durante esos **60 a 90 días de espera**, cada peso adicional vendido exige más efectivo inmovilizado en la cuenta de *Clientes / Cuentas por Cobrar*. Si las ventas se duplican bajo las mismas condiciones de plazo, la necesidad de capital de trabajo también se multiplica.

## 2. Alternativas para gestionar la brecha de liquidez con criterio financiero

En **FINTERA Soluciones Financieras** recomendamos a los gerentes administrativos, directores financieros y contadores evaluar tres frentes complementarios:

1. **Disciplina en el registro RADIAN (DIAN)**: Asegurar que cada factura electrónica emitida a crédito cuente oportunamente con el acuse de recibo de la factura, el recibo del bien o servicio y la aceptación expresa o tácita en el sistema **RADIAN**, requisito indispensable para que constituya título valor.
2. **Comparación entre crédito tradicional y factoring**: Evaluar si conviene utilizar líneas de capital de trabajo (como redescuento **Bancóldex** o cupos bancarios) o si resulta más eficiente negociar las facturas por cobrar mediante **factoring** con entidades vigiladas por la **Superintendencia de Sociedades** o la **Superintendencia Financiera**.
3. **Cálculo del costo efectivo vs. margen comercial**: Antes de comprometer plazos de pago de 60 o 90 días con un cliente corporativo, incorporar el costo financiero del tiempo de espera dentro de la estructura de precios.

## 3. Hablemos sobre las necesidades de financiación de tu empresa

En FINTERA conectamos personas y empresas con soluciones financieras mediante orientación especializada y transparente. Si deseas analizar alternativas para tu necesidad de financiación o capital de trabajo, agenda una conversación con nuestro equipo.`,
    status: "PUBLISHED",
    contentType: "BLOG_POST",
    pillar: "FACTORING_B2B",
    audience: "B2B_EMPRESAS",
    cutoffDate: "Octubre 2026",
    featured: false,
    gated: false,
    downloadUrl: null,
    typeMetadata: {
      linkedinWeek: 1,
      linkedinDay: "Miércoles",
      linkedinFormat: "Post de análisis",
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "Vender más no siempre significa tener más liquidez: Cuentas por Cobrar y Factoring | FINTERA",
    seoDescription:
      "Descubre por qué vender a crédito a 60 o 90 días presiona el flujo de caja de las empresas en Colombia y cómo evaluar alternativas de liquidez y factoring.",
    seoKeywords:
      "flujo de caja pymes Colombia, cuentas por cobrar, liquidez empresarial, factoring RADIAN, Confecámaras, OCDE, FINTERA",
    readingTime: 6,
    authorName: "Dirección de Criterio Financiero FINTERA",
    authorRole: "Análisis Empresarial B2B",
    categoryName: "Liquidez Empresarial y Factoring",
    categorySlug: "factoring-b2b",
    tags: ["Flujo de Caja", "Cuentas por Cobrar", "Factoring", "RADIAN", "Pymes"],
    views: 195,
    publishedAt: "2026-11-02T10:00:00Z",
    scheduledAt: null,
    createdAt: "2026-10-31T10:00:00Z",
    updatedAt: "2026-11-02T10:00:00Z",
  }),

  // 8. TUTORIAL / CARRUSEL LINKEDIN — Semana 1 Lunes: ¿Qué hace FINTERA?
  buildSeededItem({
    id: "fintera_tutorial_01_que_hace_fintera_carrusel",
    title:
      "Carrusel Institucional (Semana 1 · Lunes): ¿Qué hace FINTERA y cómo acompañamos las decisiones de financiación?",
    slug: "carrusel-linkedin-que-hace-fintera-acompanamiento-financiacion",
    subtitle:
      "Pieza inaugural del Plan de Posicionamiento de 90 días en LinkedIn: Criterio financiero, acompañamiento y transparencia",
    excerpt:
      "Estructura lámina por lámina del carrusel institucional de presentación de FINTERA en LinkedIn: posicionamiento como aliado estratégico en crédito de vivienda y soluciones empresariales.",
    content: `## Propósito de la Publicación (Semana 1 · Lunes)

Esta pieza inaugura el calendario editorial de 90 días de **FINTERA Soluciones Financieras** en LinkedIn. Su objetivo es establecer desde el primer día nuestra propuesta de valor: **no somos una marca que simplemente vende créditos; somos un aliado estratégico que conecta necesidades de financiación con alternativas adecuadas**, bajo los estándares regulatorios del mercado colombiano (**Superintendencia Financiera de Colombia**, **DIAN / RADIAN**, **Superintendencia de Sociedades**, *Corte: Octubre 2026*).

## Estructura del Carrusel para LinkedIn (6 Láminas)

- **Lámina 1 (Portada)**:
  - **Titular**: *Hagamos posible tu próximo proyecto.*
  - **Subtítulo**: ¿Qué hace FINTERA y cómo acompañamos las decisiones de financiación de personas y empresas en Colombia?
- **Lámina 2 (El Problema)**:
  - Tomar una decisión de financiación sin comparar condiciones, costos totales y requisitos suele generar rechazos bancarios, sobrecostos en seguros o falta de liquidez operativa.
- **Lámina 3 (Nuestros 3 Pilares Diferenciadores)**:
  1. **Criterio financiero**: Analizamos tu capacidad de pago, flujo de caja y condiciones reales.
  2. **Acompañamiento**: Te orientamos paso a paso durante la estructuración y radicación.
  3. **Transparencia**: Explicamos requisitos, tasas efectivas anuales (E.A.), costos y riesgos sin promesas engañosas.
- **Lámina 4 (Soluciones para Personas · B2C)**:
  - **Crédito de vivienda y leasing habitacional**: Comparación multibanco en pesos y UVR, validación de capacidad de endeudamiento y preparación documental.
- **Lámina 5 (Soluciones para Empresas · B2B)**:
  - **Liquidez empresarial y capital de trabajo**: Educación y estructuración sobre flujo de caja, factura electrónica en RADIAN y alternativas de factoring a través de aliados cuando estén operativas.
- **Lámina 6 (Llamado a la Acción — CTA)**:
  - *¿Estás evaluando comprar vivienda o fortalecer la liquidez de tu empresa?*
  - Conoce nuestras soluciones y conversemos sobre tu necesidad de financiación en \`finterasoluciones.co\`.`,
    status: "PUBLISHED",
    contentType: "TUTORIAL",
    pillar: "CONFIANZA_OPORTUNIDADES",
    audience: "HIBRIDO_ALIADOS",
    cutoffDate: "Octubre 2026",
    featured: false,
    gated: false,
    downloadUrl: null,
    typeMetadata: {
      difficulty: "beginner",
      estimatedMinutes: 4,
      linkedinWeek: 1,
      linkedinDay: "Lunes",
      linkedinFormat: "Carrusel institucional",
      carouselSlides: [
        {
          slideNumber: 1,
          headline: "Hagamos posible tu próximo proyecto",
          body: "Conectamos personas y empresas con soluciones financieras mediante orientación especializada y acompañamiento.",
        },
        {
          slideNumber: 2,
          headline: "1. Criterio Financiero",
          body: "Evaluamos tu capacidad de endeudamiento, plazos, tasas efectivas anuales (SFC) y estructura de flujo de caja.",
        },
        {
          slideNumber: 3,
          headline: "2. Acompañamiento Cercano",
          body: "Te guiamos en la preparación documental y comparación multibanco desde la simulación hasta el desembolso.",
        },
        {
          slideNumber: 4,
          headline: "3. Transparencia Absoluta",
          body: "Explicamos costos, seguros, requisitos en RADIAN (DIAN) y riesgos reales. Sin promesas de aprobación sin evaluación.",
        },
      ],
    },
    aiGenerated: false,
    aiModel: null,
    seoTitle:
      "¿Qué hace FINTERA y cómo acompañamos tus decisiones de financiación? | FINTERA",
    seoDescription:
      "Conoce el modelo de trabajo de FINTERA Soluciones Financieras en Colombia: criterio financiero, acompañamiento multibanco y transparencia en vivienda y empresas.",
    seoKeywords:
      "FINTERA Soluciones Financieras, aliado financiero Colombia, acompañamiento crédito de vivienda, soluciones empresariales, factoring",
    readingTime: 4,
    authorName: "Equipo de Marca FINTERA",
    authorRole: "Comunicaciones Institucionales",
    categoryName: "Confianza y Generación de Oportunidades",
    categorySlug: "confianza-oportunidades",
    tags: [
      "Carrusel LinkedIn",
      "Marca FINTERA",
      "Transparencia",
      "Acompañamiento",
    ],
    views: 180,
    publishedAt: "2026-11-03T08:00:00Z",
    scheduledAt: null,
    createdAt: "2026-11-01T08:00:00Z",
    updatedAt: "2026-11-03T08:00:00Z",
  }),
];

function loadCachedPosts(): FinteraContentItem[] {
  try {
    if (fs.existsSync(POSTS_CACHE_FILE)) {
      const raw = fs.readFileSync(POSTS_CACHE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seeded insights
  }
  return [...SEEDED_FINTERA_INSIGHTS];
}

function saveCachedPosts(posts: FinteraContentItem[]): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(POSTS_CACHE_FILE, JSON.stringify(posts, null, 2), "utf8");
  } catch {
    // Safe fallback if read-only filesystem
  }
}

export function getAllFinteraContent(options?: {
  status?: FinteraContentItem["status"];
  contentType?: ContentTypeKey;
  pillar?: FinteraContentPillarKey;
  audience?: FinteraAudienceKey;
}): FinteraContentItem[] {
  let items = loadCachedPosts();
  if (options?.status) {
    items = items.filter((item) => item.status === options.status);
  }
  if (options?.contentType) {
    items = items.filter((item) => item.contentType === options.contentType);
  }
  if (options?.pillar) {
    items = items.filter((item) => item.pillar === options.pillar);
  }
  if (options?.audience) {
    items = items.filter((item) => item.audience === options.audience);
  }
  return items.sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
  );
}

export function getFinteraContentByIdOrSlug(
  idOrSlug: string
): FinteraContentItem | undefined {
  const items = loadCachedPosts();
  return items.find((i) => i.id === idOrSlug || i.slug === idOrSlug);
}

export async function upsertFinteraContent(
  input: Partial<FinteraContentItem> & { title: string; content: string }
): Promise<FinteraContentItem> {
  const items = loadCachedPosts();
  const existingIndex = items.findIndex(
    (i) => (input.id && i.id === input.id) || (input.slug && i.slug === input.slug)
  );
  const existing = existingIndex >= 0 ? items[existingIndex] : undefined;

  const slug =
    input.slug ||
    existing?.slug ||
    input.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const id = input.id || existing?.id || `fintera_${Date.now()}`;
  const excerpt =
    input.excerpt ??
    existing?.excerpt ??
    input.content.replace(/[#>*_`-]/g, "").slice(0, 220).trim();
  const cutoffDate = input.cutoffDate || existing?.cutoffDate || "Octubre 2026";
  const pillar: FinteraContentPillarKey =
    input.pillar || existing?.pillar || "VIVIENDA_B2C";
  const contentType: ContentTypeKey =
    input.contentType || existing?.contentType || "BLOG_POST";

  const qa = ContentQaGate.evaluate({
    postId: id,
    title: input.title,
    slug,
    excerpt,
    content: input.content,
    metaTitle: input.seoTitle ?? existing?.seoTitle,
    metaDescription: input.seoDescription ?? existing?.seoDescription,
    tags: input.tags ?? existing?.tags ?? [],
    contentType,
    pillar,
    cutoffDate,
  });

  const wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime =
    input.readingTime || Math.max(3, Math.ceil(wordCount / 180));

  const updatedItem: FinteraContentItem = {
    id,
    title: input.title,
    slug,
    subtitle: input.subtitle ?? existing?.subtitle ?? null,
    excerpt,
    content: input.content,
    status: input.status || existing?.status || "DRAFT",
    contentType,
    pillar,
    audience:
      input.audience ||
      existing?.audience ||
      (pillar === "VIVIENDA_B2C"
        ? "B2C_VIVIENDA"
        : pillar === "FACTORING_B2B"
        ? "B2B_EMPRESAS"
        : "HIBRIDO_ALIADOS"),
    cutoffDate,
    featured: input.featured ?? existing?.featured ?? false,
    gated: input.gated ?? existing?.gated ?? false,
    downloadUrl: input.downloadUrl ?? existing?.downloadUrl ?? null,
    typeMetadata: input.typeMetadata ?? existing?.typeMetadata ?? {},
    aiGenerated: input.aiGenerated ?? existing?.aiGenerated ?? false,
    aiModel: input.aiModel ?? existing?.aiModel ?? null,
    seoTitle: input.seoTitle ?? existing?.seoTitle ?? `${input.title} | FINTERA`,
    seoDescription: input.seoDescription ?? existing?.seoDescription ?? excerpt,
    seoKeywords:
      input.seoKeywords ??
      existing?.seoKeywords ??
      "FINTERA, soluciones financieras, crédito de vivienda, factoring Colombia",
    readingTime,
    wordCount,
    qaStatus:
      input.qaStatus ||
      (qa.decision === "PASSED" ? "PASSED" : "FAILED"),
    qaScore: qa.overallScore,
    qaApprovalHash: qa.contentHash,
    qaReport: qa,
    authorName:
      input.authorName ||
      existing?.authorName ||
      "Comité de Criterio Financiero FINTERA",
    authorRole:
      input.authorRole || existing?.authorRole || "FINTERA Insights",
    categoryName:
      input.categoryName ||
      existing?.categoryName ||
      (pillar === "VIVIENDA_B2C"
        ? "Vivienda y Financiación Personal"
        : pillar === "FACTORING_B2B"
        ? "Liquidez Empresarial y Factoring"
        : pillar === "AUTORIDAD_MERCADO"
        ? "Autoridad y Análisis del Mercado"
        : "Confianza y Generación de Oportunidades"),
    categorySlug:
      input.categorySlug ||
      existing?.categorySlug ||
      pillar.toLowerCase().replace(/_/g, "-"),
    tags: input.tags || existing?.tags || ["FINTERA", "Colombia"],
    views: input.views ?? existing?.views ?? 1,
    publishedAt:
      input.status === "PUBLISHED"
        ? existing?.publishedAt || new Date().toISOString()
        : input.publishedAt ?? existing?.publishedAt ?? null,
    scheduledAt: input.scheduledAt ?? existing?.scheduledAt ?? null,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    items[existingIndex] = updatedItem;
  } else {
    items.unshift(updatedItem);
  }
  saveCachedPosts(items);

  // Best-effort sync to Prisma BlogPost table when DB has the table migrated
  try {
    await prisma.blogPost.upsert({
      where: { slug: updatedItem.slug },
      update: {
        title: updatedItem.title,
        subtitle: updatedItem.subtitle,
        excerpt: updatedItem.excerpt,
        content: updatedItem.content,
        status: updatedItem.status,
        contentType: updatedItem.contentType,
        pillar: updatedItem.pillar,
        audience: updatedItem.audience,
        cutoffDate: updatedItem.cutoffDate,
        featured: updatedItem.featured,
        gated: updatedItem.gated,
        downloadUrl: updatedItem.downloadUrl,
        typeMetadata: updatedItem.typeMetadata as object,
        aiGenerated: updatedItem.aiGenerated,
        aiModel: updatedItem.aiModel,
        seoTitle: updatedItem.seoTitle,
        seoDescription: updatedItem.seoDescription,
        seoKeywords: updatedItem.seoKeywords,
        readingTime: updatedItem.readingTime,
        wordCount: updatedItem.wordCount,
        qaStatus: updatedItem.qaStatus,
        qaScore: updatedItem.qaScore,
        qaApprovalHash: updatedItem.qaApprovalHash,
        qaReport: (updatedItem.qaReport || {}) as object,
      },
      create: {
        id: updatedItem.id,
        title: updatedItem.title,
        slug: updatedItem.slug,
        subtitle: updatedItem.subtitle,
        excerpt: updatedItem.excerpt,
        content: updatedItem.content,
        status: updatedItem.status,
        contentType: updatedItem.contentType,
        pillar: updatedItem.pillar,
        audience: updatedItem.audience,
        cutoffDate: updatedItem.cutoffDate,
        featured: updatedItem.featured,
        gated: updatedItem.gated,
        downloadUrl: updatedItem.downloadUrl,
        typeMetadata: updatedItem.typeMetadata as object,
        aiGenerated: updatedItem.aiGenerated,
        aiModel: updatedItem.aiModel,
        seoTitle: updatedItem.seoTitle,
        seoDescription: updatedItem.seoDescription,
        seoKeywords: updatedItem.seoKeywords,
        readingTime: updatedItem.readingTime,
        wordCount: updatedItem.wordCount,
        qaStatus: updatedItem.qaStatus,
        qaScore: updatedItem.qaScore,
        qaApprovalHash: updatedItem.qaApprovalHash,
        qaReport: (updatedItem.qaReport || {}) as object,
      },
    });
  } catch {
    // Graceful fallback to JSON cache
  }

  return updatedItem;
}

export async function remediateFinteraContent(
  idOrSlug: string
): Promise<{
  item: FinteraContentItem;
  previousScore: number;
  newScore: number;
  appliedFixes: string[];
}> {
  const item = getFinteraContentByIdOrSlug(idOrSlug);
  if (!item) {
    throw new Error(`No se encontró la pieza editorial: ${idOrSlug}`);
  }

  const previousScore = item.qaScore;
  const appliedFixes: string[] = [];
  let updatedContent = item.content;

  // 1. Remove any prohibited financial promises
  if (/aprobaci[oó]n garantizada/i.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      /aprobaci[oó]n garantizada/gi,
      "evaluación sujeta a capacidad de pago y políticas de la entidad aliada"
    );
    appliedFixes.push(
      "Se reemplazó 'aprobación garantizada' por lenguaje consultivo sujeto a evaluación de perfil."
    );
  }
  if (/liquidez garantizada/i.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      /liquidez garantizada/gi,
      "alternativas de liquidez sujetas a validación del título valor en RADIAN y del pagador"
    );
    appliedFixes.push(
      "Se corrigió 'liquidez garantizada' según la Regla Editorial de FINTERA."
    );
  }

  // 2. Ensure authoritative sources & cutoff date block if missing
  if (
    !/superfinanciera|banco de la rep[uú]blica|dian|radian|dane|fna|supersociedades/i.test(
      updatedContent
    )
  ) {
    updatedContent += `\n\n## Fuentes Oficiales y Fecha de Corte\n\n- **Fuentes primarias consultadas**: Superintendencia Financiera de Colombia (SFC), Banco de la República, DANE y DIAN (Registro RADIAN).\n- **Fecha de corte de referencia**: Octubre 2026.\n- **Nota de transparencia FINTERA**: *La información presentada distingue entre datos públicos oficiales y el criterio de análisis de FINTERA. Toda solicitud está sujeta a estudio de crédito y validación de requisitos.*`;
    appliedFixes.push(
      "Se añadió sección de Fuentes Oficiales (SFC, BanRep, DANE, DIAN) y Fecha de Corte (Octubre 2026)."
    );
  }

  // 3. Ensure FINTERA brand attributes & consultative CTA
  if (!/criterio financiero|acompañamiento|transparencia/i.test(updatedContent)) {
    updatedContent += `\n\n## El Acompañamiento de FINTERA\n\nEn **FINTERA Soluciones Financieras** conectamos personas y empresas con soluciones financieras mediante **criterio financiero**, **acompañamiento** durante la gestión y **transparencia** sobre costos, requisitos y condiciones.`;
    appliedFixes.push(
      "Se integraron los 3 atributos diferenciadores de FINTERA (criterio financiero, acompañamiento y transparencia)."
    );
  }

  const updatedItem = await upsertFinteraContent({
    ...item,
    content: updatedContent,
    qaStatus: "REMEDIATED",
  });

  return {
    item: updatedItem,
    previousScore,
    newScore: updatedItem.qaScore,
    appliedFixes,
  };
}

