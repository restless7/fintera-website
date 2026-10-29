/**
 * FASE 6.4: GATE E — DOCUMENT REQUIREMENT CATALOG
 * Catálogo canónico de requisitos documentales para las ocho entidades bancarias aliadas
 */

import { DocumentCategory, RequirementClassification } from "@/prisma/generated/client";

export interface RequirementDefinitionSeed {
  requirementCode: string;
  bankId: string | null; // null = transversal a todos los bancos
  productType: string | null;
  applicantProfile: "ASALARIADO" | "INDEPENDIENTE" | "PENSIONADO" | "COLEX" | "TODOS";
  category: DocumentCategory;
  title: string;
  description: string;
  isMandatory: boolean;
  validityDays: number | null;
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  sourceClassification: RequirementClassification;
}

export const OFFICIAL_DOCUMENT_REQUIREMENTS: RequirementDefinitionSeed[] = [
  // =========================================================================
  // REQUISITOS TRANSVERSALES (APLICAN A TODOS LOS BANCOS)
  // =========================================================================
  {
    requirementCode: "GLOBAL_CC_TITULAR",
    bankId: null,
    productType: null,
    applicantProfile: "TODOS",
    category: DocumentCategory.IDENTIFICATION,
    title: "Cédula de Ciudadanía al 150%",
    description: "Fotocopia legible por ambas caras de la cédula del solicitante principal",
    isMandatory: true,
    validityDays: null, // Permanente
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },
  {
    requirementCode: "GLOBAL_FORMULARIO_SOLICITUD",
    bankId: null,
    productType: null,
    applicantProfile: "TODOS",
    category: DocumentCategory.BANK_FORMS,
    title: "Formulario Oficial de Vinculación y Crédito",
    description: "Formulario de la entidad bancaria completamente diligenciado y firmado con huella",
    isMandatory: true,
    validityDays: 60,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 1. BANCOLOMBIA
  // =========================================================================
  {
    requirementCode: "BCOL_EMP_CERT_LABORAL",
    bankId: "bancolombia",
    productType: null,
    applicantProfile: "ASALARIADO",
    category: DocumentCategory.LABOR_INCOME,
    title: "Certificado Laboral Bancolombia",
    description: "Certificado con cargo, sueldo, antigüedad y tipo de contrato. Vigencia no mayor a 30 días.",
    isMandatory: true,
    validityDays: 30,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },
  {
    requirementCode: "BCOL_EMP_DESPRENDIBLES",
    bankId: "bancolombia",
    productType: null,
    applicantProfile: "ASALARIADO",
    category: DocumentCategory.LABOR_INCOME,
    title: "Desprendibles de Nómina (3 últimos meses)",
    description: "Comprobantes de pago de nómina de los últimos 3 periodos quincenales o mensuales.",
    isMandatory: true,
    validityDays: 45,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 2. BANCO DE BOGOTÁ
  // =========================================================================
  {
    requirementCode: "BOG_EMP_CERT_LABORAL",
    bankId: "banco-de-bogota",
    productType: null,
    applicantProfile: "ASALARIADO",
    category: DocumentCategory.LABOR_INCOME,
    title: "Certificado Laboral Banco de Bogotá",
    description: "Certificado laboral expedido en papel membrete oficial. Vigencia máxima 15 días.",
    isMandatory: true,
    validityDays: 15, // Más estricto que Bancolombia
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },
  {
    requirementCode: "BOG_IND_EXTRACTOS",
    bankId: "banco-de-bogota",
    productType: null,
    applicantProfile: "INDEPENDIENTE",
    category: DocumentCategory.INDEPENDENT_INCOME,
    title: "Extractos Bancarios Banco de Bogotá (6 meses)",
    description: "Extractos bancarios completos de los últimos 6 meses demostrando flujos de caja continuos.",
    isMandatory: true,
    validityDays: 30,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 3. BANCO AV VILLAS
  // =========================================================================
  {
    requirementCode: "AVV_EMP_CERT_LABORAL",
    bankId: "av-villas",
    productType: null,
    applicantProfile: "ASALARIADO",
    category: DocumentCategory.LABOR_INCOME,
    title: "Certificado Laboral AV Villas",
    description: "Certificado laboral vigente con especificación de deducciones y retenciones.",
    isMandatory: true,
    validityDays: 30,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 4. BBVA COLOMBIA
  // =========================================================================
  {
    requirementCode: "BBVA_EMP_CERT_LABORAL",
    bankId: "bbva",
    productType: null,
    applicantProfile: "ASALARIADO",
    category: DocumentCategory.LABOR_INCOME,
    title: "Certificado Laboral Digital BBVA",
    description: "Certificado con código de verificación QR o enlace de autenticación digital.",
    isMandatory: true,
    validityDays: 45,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 5. BANCO DE OCCIDENTE
  // =========================================================================
  {
    requirementCode: "OCC_LEASING_RUT",
    bankId: "banco-de-occidente",
    productType: "leasing-habitacional",
    applicantProfile: "TODOS",
    category: DocumentCategory.INDEPENDENT_INCOME,
    title: "RUT Actualizado Banco de Occidente",
    description: "Registro Único Tributario con fecha de generación no mayor al año en curso.",
    isMandatory: true,
    validityDays: 90,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 6. BANCO CAJA SOCIAL
  // =========================================================================
  {
    requirementCode: "BCS_VIS_CERT_AHORRO",
    bankId: "caja-social",
    productType: "hipotecario-vis",
    applicantProfile: "TODOS",
    category: DocumentCategory.TAX_FINANCIAL,
    title: "Certificado de Cuenta de Ahorro Programado / Cesantías",
    description: "Constancia de inmovilización de recursos para cuota inicial del subsidio VIS.",
    isMandatory: true,
    validityDays: 30,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 7. CREDIFAMILIA
  // =========================================================================
  {
    requirementCode: "CFAM_ACABADOS_PRESUPUESTO",
    bankId: "credifamilia",
    productType: "consumo-acabados",
    applicantProfile: "TODOS",
    category: DocumentCategory.PROPERTY_DOCS,
    title: "Presupuesto de Remodelación o Acabados",
    description: "Cotización formal de materiales y mano de obra para adecuación del inmueble.",
    isMandatory: true,
    validityDays: 60,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },

  // =========================================================================
  // 8. BANCO UNIÓN / COLEX
  // =========================================================================
  {
    requirementCode: "UNION_COLEX_PODER_CONSULAR",
    bankId: "banco-union-colex",
    productType: "colex-exterior",
    applicantProfile: "COLEX",
    category: DocumentCategory.COLEX_CONSULAR,
    title: "Poder Especial Consular Apostillado",
    description: "Poder otorgado ante consulado colombiano o notario local debidamente apostillado.",
    isMandatory: true,
    validityDays: 90,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },
  {
    requirementCode: "UNION_COLEX_TAX_RETURN",
    bankId: "banco-union-colex",
    productType: "colex-exterior",
    applicantProfile: "COLEX",
    category: DocumentCategory.COLEX_CONSULAR,
    title: "Declaración de Impuestos Exterior (W2 / Form 1040 / P60)",
    description: "Soporte fiscal del país de residencia del solicitante en el exterior.",
    isMandatory: true,
    validityDays: 365,
    allowedMimeTypes: ["application/pdf"],
    maxSizeBytes: 15 * 1024 * 1024,
    sourceClassification: RequirementClassification.OFFICIAL_DOCUMENTED,
  },
];
