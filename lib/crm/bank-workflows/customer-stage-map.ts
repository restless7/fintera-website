/**
 * MAPEO DE PROYECCIÓN DE ESTADOS HACIA EL CLIENTE (CUSTOMER STAGE PROJECTION)
 * FASE 6.3: GATE D — CUSTOMER-SAFE PROJECTIONS
 * 
 * Regla de Oro: Las notas internas, causales de riesgo confidenciales y nombres
 * de ejecutivos bancarios privados NUNCA se exponen al cliente.
 */

import { BankStage } from "@/prisma/generated/client";
import { CustomerStageProjection } from "./types";

export const DEFAULT_CUSTOMER_STAGE_MAP: Record<BankStage, CustomerStageProjection> = {
  STAGE_01_PRE_FILE: {
    customerVisibleStage: "Integración de Documentos",
    publicDescription: "Estamos preparando tu expediente financiero para radicación ante la entidad bancaria.",
    actionRequiredByClient: "Adjuntar documentos solicitados por tu asesor",
    isPubliclyVisible: true,
  },
  STAGE_02_INTERNAL_QA: {
    customerVisibleStage: "Verificación de Calidad Fintera",
    publicDescription: "Nuestro equipo de control de calidad está auditando los soportes para asegurar la viabilidad ante el banco.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
  STAGE_03_READY_FOR_BANK: {
    customerVisibleStage: "Listo para Radicación",
    publicDescription: "Tu solicitud ha superado el control de calidad y está programada para ingreso al banco.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
  STAGE_04_BANK_SUBMITTED: {
    customerVisibleStage: "Radicado ante el Banco",
    publicDescription: "El expediente ha sido radicado oficialmente en la entidad financiera con número de trámite asignado.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
  STAGE_05_RISK_EVALUATION: {
    customerVisibleStage: "En Estudio de Crédito",
    publicDescription: "La entidad bancaria está analizando tu perfil financiero y capacidad de endeudamiento.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
  STAGE_06_CONDITIONAL_APPROVAL: {
    customerVisibleStage: "Preaprobado con Condiciones",
    publicDescription: "El banco ha emitido un concepto favorable sujeto a verificación de condiciones específicas.",
    actionRequiredByClient: "Validar con tu asesor las condiciones solicitadas por el banco",
    isPubliclyVisible: true,
  },
  STAGE_07_DEFINITIVE_APPROVAL: {
    customerVisibleStage: "Crédito Aprobado",
    publicDescription: "¡Felicitaciones! Tu crédito hipotecario ha sido formalmente aprobado con carta de compromiso emitida.",
    actionRequiredByClient: "Iniciar entrega de documentación del inmueble objeto de compra",
    isPubliclyVisible: true,
  },
  STAGE_08_APPRAISAL_LEGAL: {
    customerVisibleStage: "Avalúo y Legalización",
    publicDescription: "El banco se encuentra realizando el peritaje del inmueble y el estudio de títulos para firma de escrituras.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
  STAGE_09_DISBURSED: {
    customerVisibleStage: "Crédito Desembolsado",
    publicDescription: "Los recursos del crédito hipotecario han sido girados exitosamente al vendedor o constructora.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
  STAGE_BANK_REJECTED: {
    customerVisibleStage: "No Viable en este Banco",
    publicDescription: "La entidad financiera no pudo aprobar este trámite bajo sus políticas actuales. Seguimos evaluando otras opciones.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
  STAGE_BANK_SUSPENDED: {
    customerVisibleStage: "En Espera",
    publicDescription: "El trámite con esta entidad se encuentra en pausa a solicitud del cliente o a la espera de un requisito.",
    actionRequiredByClient: "Contacta a tu asesor para reactivar este trámite",
    isPubliclyVisible: true,
  },
  STAGE_BANK_TRANSFERRED: {
    customerVisibleStage: "Trasladado a Otra Entidad",
    publicDescription: "Hemos priorizado una mejor alternativa bancaria para tu solicitud hipotecaria.",
    actionRequiredByClient: null,
    isPubliclyVisible: true,
  },
};
