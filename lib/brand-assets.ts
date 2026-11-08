/**
 * lib/brand-assets.ts
 *
 * FINTERA Enterprise Brand Asset Registry & Intelligent Selection Engine.
 * Authoritative single-source-of-truth for all approved brand graphics,
 * financial icons, signature pathways, pillar identities and carousel backgrounds.
 * Built strictly according to FINTERA Brand Blueprint V1.0 (#0A2342, #00C4B3, #FFD447).
 */

import { FinteraContentPillarKey, ContentTypeKey } from "./content-types";

export type FinteraAssetRole =
  | "BRAND_ICON"
  | "SIGNATURE_GRAPHIC"
  | "DECORATIVE_OVERLAY"
  | "BACKGROUND_TEXTURE"
  | "EDITORIAL_COVER"
  | "PILLAR_COVER"
  | "CAROUSEL_BACKGROUND"
  | "CAROUSEL_ACCENT"
  | "LIFESTYLE_PHOTO"
  | "CTA_ASSET"
  | "LOGO_REFERENCE";

export interface FinteraBrandAsset {
  id: string;
  role: FinteraAssetRole;
  title: string;
  description: string;
  altText: string;
  publicUrl: string;
  masterUrl: string;
  contentHash: string;
  pillars: FinteraContentPillarKey[];
  tags: string[];
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  hasTransparency: boolean;
  backgroundCompatibility: "LIGHT" | "DARK" | "BOTH";
  focalPoint?: { x: number; y: number };
  approved: boolean;
  slideRoleHint?: "COVER" | "CONTEXT" | "INSIGHT" | "COMPARISON" | "CHECKLIST" | "CTA";
}

export const FINTERA_BRAND_ASSET_REGISTRY: FinteraBrandAsset[] = [
  // =========================================================================
  // 1. FOUR STRATEGIC EDITORIAL PILLARS (Official High-Fidelity 16:9 Photography)
  // =========================================================================
  {
    id: "pillar_vivienda_b2c",
    role: "PILLAR_COVER",
    title: "Pilar 1 · Vivienda B2C: Tu crédito, con más claridad",
    description:
      "Familia contemporánea en apartamento colombiano con luz natural y visualización de rutas de crédito hipotecario limpias.",
    altText: "FINTERA Vivienda B2C - Crédito hipotecario y leasing habitacional en Colombia",
    publicUrl: "/images/brand-system/pillars/pilar-1-vivienda-b2c.webp",
    masterUrl: "/images/brand-system/raw/15. Vivienda B2C — Tu crédito, con más claridad.jpg",
    contentHash: "7b2e06a16188dc5c105176cd74c2b6369d7868e4293a41d3498a45de34e4ad9a",
    pillars: ["VIVIENDA_B2C"],
    tags: ["vivienda", "credito hipotecario", "leasing habitacional", "pesos", "uvr", "familia", "hogar"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    focalPoint: { x: 0.5, y: 0.5 },
    approved: true,
  },
  {
    id: "pillar_factoring_b2b",
    role: "PILLAR_COVER",
    title: "Pilar 2 · Factoring B2B: Mejores oportunidades, procesos más inteligentes",
    description:
      "Entorno corporativo contemporáneo con directores financieros revisando flujo de caja y trazabilidad RADIAN.",
    altText: "FINTERA Factoring B2B - Liquidez empresarial y negociación de facturas en Colombia",
    publicUrl: "/images/brand-system/pillars/pilar-2-factoring-b2b.webp",
    masterUrl: "/images/brand-system/raw/16. Factoring B2B — Mejores oportunidades, procesos más inteligentes.jpg",
    contentHash: "2f7572350470018315df0082a85f131f4fca9421e145ed54ea7ef320117856a8",
    pillars: ["FACTORING_B2B"],
    tags: ["factoring", "radian", "liquidez", "capital de trabajo", "empresas", "pymes", "dian"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    focalPoint: { x: 0.5, y: 0.5 },
    approved: true,
  },
  {
    id: "pillar_autoridad_mercado",
    role: "PILLAR_COVER",
    title: "Pilar 3 · Autoridad y Mercado: Inteligencia financiera con trato humano",
    description:
      "Superficies de datos ordenados, nodos macroeconómicos y gráficos ascendentes con respaldo en fuentes primarias.",
    altText: "FINTERA Autoridad y Análisis de Mercado - Estadísticas de crédito e inflación en Colombia",
    publicUrl: "/images/brand-system/pillars/pilar-3-autoridad-mercado.webp",
    masterUrl: "/images/brand-system/raw/17. Autoridad y Mercado — Inteligencia financiera con trato humano.jpg",
    contentHash: "45556abc8d6fc09be0a4519660e9b8ba37498c2ce652967f823dc15a58961f2c",
    pillars: ["AUTORIDAD_MERCADO"],
    tags: ["macroeconomia", "tasas", "banrep", "superfinanciera", "inflacion", "indicadores", "dane"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    focalPoint: { x: 0.5, y: 0.5 },
    approved: true,
  },
  {
    id: "pillar_confianza_oportunidades",
    role: "PILLAR_COVER",
    title: "Pilar 4 · Confianza y Oportunidades: Claridad que conecta",
    description:
      "Asesor patrimonial y cliente en diálogo transparente en entorno arquitectónico sobrio y profesional.",
    altText: "FINTERA Confianza y Oportunidades - Asesoría y acompañamiento financiero multibanco",
    publicUrl: "/images/brand-system/pillars/pilar-4-confianza-oportunidades.webp",
    masterUrl: "/images/brand-system/raw/18. Confianza y Oportunidades — Claridad que conecta.jpg",
    contentHash: "27b05641edd0f5d8ac87cb57825f9abb55c82491324cdb0131f6b0dcab5f7766",
    pillars: ["CONFIANZA_OPORTUNIDADES"],
    tags: ["confianza", "acompanamiento", "transparencia", "asesoria", "multibanco", "criterio"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    focalPoint: { x: 0.5, y: 0.5 },
    approved: true,
  },

  // =========================================================================
  // 2. SIGNATURE GRAPHICS & BRAND GEOMETRY (Signals of Clarity · #0A2342 & #00C4B3)
  // =========================================================================
  {
    id: "sig_clarity_path",
    role: "SIGNATURE_GRAPHIC",
    title: "Asset 09 · Ruta de Claridad (Clarity Path)",
    description:
      "Ruta geométrica ascendente en cyan digital (#00C4B3) sobre azul profundo (#0A2342), representando progreso financiero ordenado.",
    altText: "FINTERA Ruta de Claridad - Señales de progreso financiero ordenado",
    publicUrl: "/images/brand-system/signatures/fintera-clarity-path.webp",
    masterUrl: "/images/brand-system/raw/Asset 09 — Clarity Path  Ruta de claridad.jpg",
    contentHash: "96b8f581d013a18bbc889e8602dfa52882e33342447318497e75bfdbe1e9bb41",
    pillars: ["VIVIENDA_B2C", "FACTORING_B2B", "CONFIANZA_OPORTUNIDADES"],
    tags: ["clarity path", "ruta", "geometria", "progreso", "proceso", "firma"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
    slideRoleHint: "CONTEXT",
  },
  {
    id: "sig_ascending_geometry",
    role: "SIGNATURE_GRAPHIC",
    title: "Asset 10 · Geometría Ascendente FINTERA",
    description:
      "Líneas vectoriales ascendentes con checkpoints de validación, representando verificación documental rigurosa.",
    altText: "FINTERA Geometría Ascendente - Checkpoints de validación técnica",
    publicUrl: "/images/brand-system/signatures/fintera-ascending-geometry.webp",
    masterUrl: "/images/brand-system/raw/Asset 10 — FINTERA Ascending Geometry.jpg",
    contentHash: "3c0a485adee4aefbfd590e0b4a73f63177bdd0129552028be3f8810889b483dd",
    pillars: ["VIVIENDA_B2C", "AUTORIDAD_MERCADO"],
    tags: ["ascendente", "geometria", "validacion", "checkpoints", "aprobacion"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
    slideRoleHint: "INSIGHT",
  },
  {
    id: "sig_signal_network",
    role: "SIGNATURE_GRAPHIC",
    title: "Asset 11 · Red de Señales Financieras (Financial Signal Network)",
    description:
      "Nodos interconectados que ilustran la integración de las 14 fuentes oficiales y el ecosistema RADIAN.",
    altText: "FINTERA Red de Señales Financieras - Red de inteligencia de mercado",
    publicUrl: "/images/brand-system/signatures/fintera-financial-signal-network.webp",
    masterUrl: "/images/brand-system/raw/Asset 11 — Financial Signal Network.jpg",
    contentHash: "7ffbf08c81914f5f2aae1da8814cbf7a68c52251b392fd725a6d4db2c3682cd1",
    pillars: ["FACTORING_B2B", "AUTORIDAD_MERCADO"],
    tags: ["red", "nodos", "radian", "mercado", "interconexion", "inteligencia"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
    slideRoleHint: "CONTEXT",
  },
  {
    id: "sig_clarity_frame",
    role: "DECORATIVE_OVERLAY",
    title: "Asset 12 · Marco de Claridad (Clarity Frame)",
    description:
      "Marco perimetral sutil para encuadrar infografías, testimonios de transparencia y resúmenes ejecutivos.",
    altText: "FINTERA Marco de Claridad - Enmarcado editorial institucional",
    publicUrl: "/images/brand-system/signatures/fintera-clarity-frame.webp",
    masterUrl: "/images/brand-system/raw/Asset 12 — Clarity Frame.jpg",
    contentHash: "82e8a34751dd9300be684af710376f7690f4cbbee729c3a8f1d34171f06e920d",
    pillars: ["CONFIANZA_OPORTUNIDADES", "AUTORIDAD_MERCADO"],
    tags: ["marco", "borde", "enmarcado", "destacado", "editorial"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
  },
  {
    id: "sig_knowledge_grid",
    role: "BACKGROUND_TEXTURE",
    title: "Asset 13 · Cuadrícula de Conocimiento Financiero",
    description:
      "Superficie matemática sobria con retícula de análisis para respaldar tablas comparativas y balances.",
    altText: "FINTERA Cuadrícula de Conocimiento - Retícula matemática institucional",
    publicUrl: "/images/brand-system/signatures/fintera-knowledge-grid.webp",
    masterUrl: "/images/brand-system/raw/Asset 13 — Financial Knowledge Grid.jpg",
    contentHash: "8fad780ef5d5e1c5ee78ad329dba555a9eba08a0667b36ddedeae658b309e222",
    pillars: ["AUTORIDAD_MERCADO", "VIVIENDA_B2C"],
    tags: ["cuadricula", "reticula", "datos", "tablas", "comparativas", "pesos"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
    slideRoleHint: "COMPARISON",
  },
  {
    id: "sig_directional_accent",
    role: "DECORATIVE_OVERLAY",
    title: "Asset 14 · Divisor Editorial y Acento Direccional",
    description:
      "Separador minimalista con trazo cyan (#00C4B3) para estructurar secciones de lectura profunda.",
    altText: "FINTERA Acento Direccional - Separador de lectura",
    publicUrl: "/images/brand-system/signatures/fintera-directional-accent.webp",
    masterUrl: "/images/brand-system/raw/Asset 14 — Directional Accent  Editorial Divider.jpg",
    contentHash: "0380df7ae21d4d3203d6cd3d1d35864f38deece890c352f91d4108114aa719fd",
    pillars: ["VIVIENDA_B2C", "FACTORING_B2B", "AUTORIDAD_MERCADO", "CONFIANZA_OPORTUNIDADES"],
    tags: ["divisor", "separador", "acento", "linea", "minimalista"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
  },
  {
    id: "sig_abstract_mesh",
    role: "BACKGROUND_TEXTURE",
    title: "Asset Abstract Mesh · Malla Geométrica de Marca",
    description:
      "Malla geométrica tridimensional con iluminación azul profundo y turquesa para fondos hero.",
    altText: "FINTERA Malla Geométrica de Marca - Fondo hero institucional",
    publicUrl: "/images/brand-system/signatures/fintera-abstract-brand-mesh.webp",
    masterUrl: "/images/brand-system/raw/Creating_abstract_geometric_bran…_8e8f98b3.jpg",
    contentHash: "54b5cde0a0f26cebce5a961eff5bcc8fcec7e05cfb38034c25c361dc4b9e2f77",
    pillars: ["CONFIANZA_OPORTUNIDADES", "AUTORIDAD_MERCADO"],
    tags: ["malla", "mesh", "hero", "fondo", "textura", "tecnologia"],
    dimensions: { width: 1280, height: 714 },
    aspectRatio: 1.79,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
  },

  // =========================================================================
  // 3. CAROUSEL SLIDE COMPOSITIONS (Portrait 4:5 / 1080×1350 for LinkedIn PDF Studio)
  // =========================================================================
  {
    id: "carousel_cover_architecture",
    role: "CAROUSEL_BACKGROUND",
    title: "Asset 19 · Arquitectura de Portada de Carrusel (1080×1350)",
    description:
      "Composición vertical con espacio negativo superior para tipografía de alto impacto y base arquitectónica.",
    altText: "FINTERA Carrusel Slide 1 - Portada ejecutiva para LinkedIn",
    publicUrl: "/images/brand-system/carousel/carousel-cover-architecture.webp",
    masterUrl: "/images/brand-system/raw/Asset 19 — Carousel Cover Architecture.jpg",
    contentHash: "5363d0de82d39857519c725f69abec8aa1bea85df6e1ac7ba2883ca0c6dc49b0",
    pillars: ["VIVIENDA_B2C", "FACTORING_B2B", "AUTORIDAD_MERCADO", "CONFIANZA_OPORTUNIDADES"],
    tags: ["carrusel", "portada", "cover", "linkedin", "slide 1", "4:5"],
    dimensions: { width: 1080, height: 1350 },
    aspectRatio: 0.8,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
    slideRoleHint: "COVER",
  },
  {
    id: "carousel_data_comparison",
    role: "CAROUSEL_BACKGROUND",
    title: "Asset 20 · Lámina de Comparación de Datos y Balances (1080×1350)",
    description:
      "Composición vertical estructurada con zonas duales para contrastar escenarios (ej. Pesos vs UVR o Factoring vs Deuda).",
    altText: "FINTERA Carrusel Slide 4 - Comparación numérica y datos",
    publicUrl: "/images/brand-system/carousel/carousel-data-comparison.webp",
    masterUrl: "/images/brand-system/raw/Asset 20 — Financial Data Comparison Slide.jpg",
    contentHash: "2311f804465d03c330503ac07633122c05597c3d626ad1437c3d43da8dc69364",
    pillars: ["VIVIENDA_B2C", "FACTORING_B2B", "AUTORIDAD_MERCADO"],
    tags: ["carrusel", "datos", "comparacion", "slide 4", "simulacion", "numerico"],
    dimensions: { width: 1080, height: 1350 },
    aspectRatio: 0.8,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
    slideRoleHint: "COMPARISON",
  },
  {
    id: "carousel_cta_final",
    role: "CTA_ASSET",
    title: "Asset 21 · Lámina Final de Conversión y Llamado a la Acción (1080×1350)",
    description:
      "Composición de cierre con acento en oro cálido (#FFD447) y firma oficial de FINTERA para orientar hacia el simulador.",
    altText: "FINTERA Carrusel Slide 6 - Cierre y llamado a la acción",
    publicUrl: "/images/brand-system/carousel/carousel-cta-final.webp",
    masterUrl: "/images/brand-system/raw/Asset 21 — CTA  Final Carousel Slide.jpg",
    contentHash: "2bb03a59615f584d2cba2efe7e61743c52a034ba8c2358a84dc93a2d0bef46cc",
    pillars: ["VIVIENDA_B2C", "FACTORING_B2B", "CONFIANZA_OPORTUNIDADES"],
    tags: ["carrusel", "cta", "conversion", "slide 6", "cierre", "llamado"],
    dimensions: { width: 1080, height: 1350 },
    aspectRatio: 0.8,
    hasTransparency: false,
    backgroundCompatibility: "DARK",
    approved: true,
    slideRoleHint: "CTA",
  },

  // =========================================================================
  // 4. FINANCIAL CONCEPT ICONS (8 Core Functional Icons · 512×512)
  // =========================================================================
  {
    id: "icon_credito_vivienda",
    role: "BRAND_ICON",
    title: "Icon 01 · Crédito de Vivienda y Leasing Habitacional",
    description:
      "Arquitectura residencial limpia con líneas de validación geométrica en turquesa digital (#00C4B3).",
    altText: "Icono Crédito de Vivienda FINTERA",
    publicUrl: "/images/brand-system/icons/icon-01-credito-vivienda.webp",
    masterUrl: "/images/brand-system/raw/Icon 01 — Crédito de vivienda.jpg",
    contentHash: "1247425bc40f7314e026c2dd884b08de0bdf32a6ec262a81cbc4cc6d87fb634b",
    pillars: ["VIVIENDA_B2C"],
    tags: ["icono", "vivienda", "hipotecario", "leasing", "hogar", "casa"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "INSIGHT",
  },
  {
    id: "icon_comparador_multibanco",
    role: "BRAND_ICON",
    title: "Icon 02 · Comparador Multibanco de Tasas y Condiciones",
    description:
      "Múltiples columnas ordenadas de comparación de entidades financieras vigiladas por la Superfinanciera.",
    altText: "Icono Comparador Multibanco FINTERA",
    publicUrl: "/images/brand-system/icons/icon-02-comparador-multibanco.webp",
    masterUrl: "/images/brand-system/raw/Icon 02 — Comparador multibanco.jpg",
    contentHash: "f6a0c122a38b7b692fa0544433ede21fb90a64e8b4b29347b7ed60f2cd635506",
    pillars: ["VIVIENDA_B2C", "AUTORIDAD_MERCADO"],
    tags: ["icono", "comparador", "multibanco", "tasas", "sfc", "ofertas"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "COMPARISON",
  },
  {
    id: "icon_gestion_documental",
    role: "BRAND_ICON",
    title: "Icon 03 · Gestión Documental y Verificación Previa",
    description:
      "Expediente financiero ordenado con sello de verificación técnica, reduciendo reprocesos ante bancos.",
    altText: "Icono Gestión Documental FINTERA",
    publicUrl: "/images/brand-system/icons/icon-03-gestion-documental.webp",
    masterUrl: "/images/brand-system/raw/Icon 03 — Gestión documental.jpg",
    contentHash: "f2ffaf5e5e55ba6d9342b6f913ecfa6b5b0d2d7fb5797bbecff02c505d8fea4b",
    pillars: ["VIVIENDA_B2C", "FACTORING_B2B", "CONFIANZA_OPORTUNIDADES"],
    tags: ["icono", "documentos", "expediente", "verificacion", "extractos", "radicacion"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "CHECKLIST",
  },
  {
    id: "icon_acompanamiento_humano",
    role: "BRAND_ICON",
    title: "Icon 04 · Acompañamiento Humano y Criterio Financiero",
    description:
      "Símbolo del Cuidador Competente y el Sabio Estratega: escucha activa y guía paso a paso sin tecnicismos.",
    altText: "Icono Acompañamiento Humano FINTERA",
    publicUrl: "/images/brand-system/icons/icon-04-acompanamiento-humano.webp",
    masterUrl: "/images/brand-system/raw/Icon 04 — Acompañamiento humano.jpg",
    contentHash: "80b1cb335ada7009b1fbae516aba4d251fe8b64965bfc57e427ac4aae4b90fef",
    pillars: ["CONFIANZA_OPORTUNIDADES"],
    tags: ["icono", "acompanamiento", "humano", "asesoria", "criterio", "guia"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "INSIGHT",
  },
  {
    id: "icon_privacidad_datos",
    role: "BRAND_ICON",
    title: "Icon 05 · Privacidad de Datos Financieros (Ley 1581 Habeas Data)",
    description:
      "Blindaje y custodia de información crediticia sensible con cifrado institucional y respeto legal.",
    altText: "Icono Privacidad de Datos Ley 1581 FINTERA",
    publicUrl: "/images/brand-system/icons/icon-05-privacidad-datos.webp",
    masterUrl: "/images/brand-system/raw/Icon 05 — Privacidad de datos.jpg",
    contentHash: "d3453bfc7ff6638b6fa82c123aac1be36f5b04c5f5a71f4928bebf61f52e74c6",
    pillars: ["CONFIANZA_OPORTUNIDADES"],
    tags: ["icono", "seguridad", "habeas data", "privacidad", "ley 1581", "custodia"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "CHECKLIST",
  },
  {
    id: "icon_seguimiento_solicitudes",
    role: "BRAND_ICON",
    title: "Icon 06 · Trazabilidad y Seguimiento de Solicitudes",
    description:
      "Indicador de progreso en tiempo real que visibiliza en qué etapa se encuentra el trámite hipotecario o empresarial.",
    altText: "Icono Seguimiento de Solicitudes FINTERA",
    publicUrl: "/images/brand-system/icons/icon-06-seguimiento-solicitudes.webp",
    masterUrl: "/images/brand-system/raw/Icon 06 — Seguimiento de solicitudes.jpg",
    contentHash: "fbe30732530e159dd9ae2434d176625b7747415d64ed0b775a4bb6b06653b9b4",
    pillars: ["CONFIANZA_OPORTUNIDADES", "VIVIENDA_B2C"],
    tags: ["icono", "seguimiento", "trazabilidad", "etapas", "progreso", "estatus"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "CONTEXT",
  },
  {
    id: "icon_liquidez_factoring",
    role: "BRAND_ICON",
    title: "Icon 07 · Liquidez Empresarial y Descuento de Facturas (RADIAN)",
    description:
      "Flujo de conversión de cuentas por cobrar en capital de trabajo inmediato sin generar pasivo financiero tradicional.",
    altText: "Icono Factoring y Liquidez Empresarial FINTERA",
    publicUrl: "/images/brand-system/icons/icon-07-liquidez-factoring.webp",
    masterUrl: "/images/brand-system/raw/Icon 07 — Liquidez empresarial y factoring.jpg",
    contentHash: "b9447c94ce06abfd0d08780cbf973ab45aee2399578c74ffb04bf41c56706781",
    pillars: ["FACTORING_B2B"],
    tags: ["icono", "factoring", "liquidez", "caja", "radian", "empresas", "factura"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "INSIGHT",
  },
  {
    id: "icon_inteligencia_analitica",
    role: "BRAND_ICON",
    title: "Icon 08 · Inteligencia Financiera, Modelación y Analítica",
    description:
      "Composición de análisis matemático, simulaciones de amortización y monitoreo de tasas macroeconómicas.",
    altText: "Icono Inteligencia Financiera y Analítica FINTERA",
    publicUrl: "/images/brand-system/icons/icon-08-inteligencia-analitica.webp",
    masterUrl: "/images/brand-system/raw/Icon 08 — Inteligencia financiera y analítica.jpg",
    contentHash: "395d3bdee5e2363836ef50e4d8cc78d980b69e656541c609718b95581eef9c1a",
    pillars: ["AUTORIDAD_MERCADO"],
    tags: ["icono", "inteligencia", "analitica", "datos", "modelacion", "criterio"],
    dimensions: { width: 512, height: 512 },
    aspectRatio: 1.0,
    hasTransparency: false,
    backgroundCompatibility: "BOTH",
    approved: true,
    slideRoleHint: "INSIGHT",
  },
];

// =========================================================================
// 5. DETERMINISTIC ASSET RESOLUTION SERVICE
// =========================================================================

export interface ResolveFinteraAssetOptions {
  pillar?: FinteraContentPillarKey;
  topic?: string;
  contentType?: ContentTypeKey;
  surface?: "BLOG_HERO" | "ARTICLE_CARD" | "CAROUSEL_SLIDE" | "FEATURED_BANNER" | "WEBSITE_SECTION";
  visualRole?: FinteraAssetRole;
  slideRoleHint?: "COVER" | "CONTEXT" | "INSIGHT" | "COMPARISON" | "CHECKLIST" | "CTA";
  excludeAssetIds?: string[];
  explicitAssetId?: string;
}

export function resolveFinteraAsset(options: ResolveFinteraAssetOptions): FinteraBrandAsset {
  // Priority 1: Explicit ID override
  if (options.explicitAssetId) {
    const explicit = FINTERA_BRAND_ASSET_REGISTRY.find(
      (a) => a.id === options.explicitAssetId && a.approved
    );
    if (explicit) return explicit;
  }

  const pool = FINTERA_BRAND_ASSET_REGISTRY.filter((a) => {
    if (!a.approved) return false;
    if (options.excludeAssetIds && options.excludeAssetIds.includes(a.id)) {
      return false;
    }
    return true;
  });

  // Priority 2: Slide Role Hint match (for LinkedIn Carousel 6-slide architecture)
  if (options.slideRoleHint) {
    const slideMatch = pool.find((a) => {
      if (a.slideRoleHint !== options.slideRoleHint) return false;
      if (options.pillar && !a.pillars.includes(options.pillar)) return false;
      return true;
    }) || pool.find((a) => a.slideRoleHint === options.slideRoleHint);
    if (slideMatch) return slideMatch;
  }

  // Priority 3: Visual Role match
  if (options.visualRole) {
    const roleMatch = pool.find((a) => {
      if (a.role !== options.visualRole) return false;
      if (options.pillar && !a.pillars.includes(options.pillar)) return false;
      return true;
    }) || pool.find((a) => a.role === options.visualRole);
    if (roleMatch) return roleMatch;
  }

  // Priority 4: Topic semantic matching
  if (options.topic) {
    const lowerTopic = options.topic.toLowerCase();
    const topicMatch = pool.find((a) => {
      return a.tags.some((tag) => lowerTopic.includes(tag.toLowerCase()));
    });
    if (topicMatch) return topicMatch;
  }

  // Priority 5: Pillar Family
  if (options.pillar) {
    const pillarMatch = pool.find((a) => a.pillars.includes(options.pillar!));
    if (pillarMatch) return pillarMatch;
  }

  // Priority 6: Institutional Brand Fallback
  return pool.find((a) => a.id === "sig_clarity_path") || pool[0];
}

export function getApprovedAssetsByPillar(pillar: FinteraContentPillarKey): FinteraBrandAsset[] {
  return FINTERA_BRAND_ASSET_REGISTRY.filter((a) => a.approved && a.pillars.includes(pillar));
}

export function getApprovedAssetsByRole(role: FinteraAssetRole): FinteraBrandAsset[] {
  return FINTERA_BRAND_ASSET_REGISTRY.filter((a) => a.approved && a.role === role);
}
