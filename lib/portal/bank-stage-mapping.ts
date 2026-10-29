/**
 * FINTERA ENTERPRISE CRM — FASE 6.5: GATE F
 * Mapeo Canónico de Etapas Bancarias y Proyección Pública para el Cliente
 * Corrige estrictamente cualquier valor no canónico y alinea 1:1 con BankStage de Gate D.
 */

import { BankStage } from "@/prisma/generated/client";

export interface PublicStageInfo {
  stage: BankStage;
  publicTitle: string;
  publicDescription: string;
  badgeVariant: "default" | "secondary" | "success" | "warning" | "destructive" | "info";
  iconName: string;
  milestoneIndex: number; // 1 a 6 hitos principales
  isTerminal: boolean;
  isApproval: boolean;
  isConditionalApproval: boolean;
  isDefinitiveApproval: boolean;
}

export const CANONICAL_PUBLIC_STAGE_MAP: Record<BankStage, PublicStageInfo> = {
  [BankStage.STAGE_01_PRE_FILE]: {
    stage: BankStage.STAGE_01_PRE_FILE,
    publicTitle: "Preparación documental",
    publicDescription: "Estamos recopilando y organizando los documentos requeridos para presentar una solicitud sólida.",
    badgeVariant: "secondary",
    iconName: "FileText",
    milestoneIndex: 1,
    isTerminal: false,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_02_INTERNAL_QA]: {
    stage: BankStage.STAGE_02_INTERNAL_QA,
    publicTitle: "Revisión documental Fintera",
    publicDescription: "Nuestro equipo de analistas especializados está verificando que los soportes cumplan con las políticas del banco.",
    badgeVariant: "info",
    iconName: "Search",
    milestoneIndex: 1,
    isTerminal: false,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_03_READY_FOR_BANK]: {
    stage: BankStage.STAGE_03_READY_FOR_BANK,
    publicTitle: "Preparación para radicación",
    publicDescription: "Expediente completo y validado. En proceso de asignación con el ejecutivo bancario aliado.",
    badgeVariant: "info",
    iconName: "CheckCircle",
    milestoneIndex: 2,
    isTerminal: false,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_04_BANK_SUBMITTED]: {
    stage: BankStage.STAGE_04_BANK_SUBMITTED,
    publicTitle: "Radicada ante la entidad",
    publicDescription: "La solicitud fue ingresada oficialmente en el sistema del banco y cuenta con número de radicado asignado.",
    badgeVariant: "default",
    iconName: "Building2",
    milestoneIndex: 3,
    isTerminal: false,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_05_RISK_EVALUATION]: {
    stage: BankStage.STAGE_05_RISK_EVALUATION,
    publicTitle: "En estudio bancario",
    publicDescription: "El comité de crédito y riesgos del banco está analizando la capacidad de pago y perfil financiero.",
    badgeVariant: "warning",
    iconName: "Clock",
    milestoneIndex: 3,
    isTerminal: false,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_06_CONDITIONAL_APPROVAL]: {
    stage: BankStage.STAGE_06_CONDITIONAL_APPROVAL,
    publicTitle: "Aprobación condicionada",
    publicDescription: "El banco emitió concepto favorable sujeto al cumplimiento de condiciones o documentos adicionales previos a la carta definitiva.",
    badgeVariant: "warning",
    iconName: "AlertTriangle",
    milestoneIndex: 4,
    isTerminal: false,
    isApproval: true,
    isConditionalApproval: true,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_07_DEFINITIVE_APPROVAL]: {
    stage: BankStage.STAGE_07_DEFINITIVE_APPROVAL,
    publicTitle: "Aprobación definitiva",
    publicDescription: "¡Felicitaciones! El banco ha emitido carta de aprobación formal y definitiva para tu crédito hipotecario.",
    badgeVariant: "success",
    iconName: "Award",
    milestoneIndex: 4,
    isTerminal: false,
    isApproval: true,
    isConditionalApproval: false,
    isDefinitiveApproval: true,
  },
  [BankStage.STAGE_08_APPRAISAL_LEGAL]: {
    stage: BankStage.STAGE_08_APPRAISAL_LEGAL,
    publicTitle: "Avalúo y estudio de títulos",
    publicDescription: "En legalización del inmueble: se realiza la visita del perito avaluador y el estudio jurídico de la propiedad.",
    badgeVariant: "info",
    iconName: "Home",
    milestoneIndex: 5,
    isTerminal: false,
    isApproval: true,
    isConditionalApproval: false,
    isDefinitiveApproval: true,
  },
  [BankStage.STAGE_09_DISBURSED]: {
    stage: BankStage.STAGE_09_DISBURSED,
    publicTitle: "Crédito desembolsado",
    publicDescription: "Operación formalizada y culminada exitosamente. Los recursos han sido desembolsados por la entidad.",
    badgeVariant: "success",
    iconName: "DollarSign",
    milestoneIndex: 6,
    isTerminal: true,
    isApproval: true,
    isConditionalApproval: false,
    isDefinitiveApproval: true,
  },
  [BankStage.STAGE_BANK_REJECTED]: {
    stage: BankStage.STAGE_BANK_REJECTED,
    publicTitle: "Trámite no viable en esta entidad",
    publicDescription: "Esta entidad bancaria no pudo aprobar el cupo solicitado. Continuamos gestionando tus opciones activas en los demás bancos aliados.",
    badgeVariant: "destructive",
    iconName: "XCircle",
    milestoneIndex: 0,
    isTerminal: true,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_BANK_SUSPENDED]: {
    stage: BankStage.STAGE_BANK_SUSPENDED,
    publicTitle: "Proceso en pausa",
    publicDescription: "El trámite se encuentra temporalmente detenido por solicitud del cliente o a la espera de un evento comercial específico.",
    badgeVariant: "secondary",
    iconName: "PauseCircle",
    milestoneIndex: 0,
    isTerminal: false,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
  [BankStage.STAGE_BANK_TRANSFERRED]: {
    stage: BankStage.STAGE_BANK_TRANSFERRED,
    publicTitle: "Proceso trasladado",
    publicDescription: "El caso fue redirigido a otra sucursal o canal especializado de la misma entidad para optimizar su trámite.",
    badgeVariant: "secondary",
    iconName: "Share2",
    milestoneIndex: 0,
    isTerminal: false,
    isApproval: false,
    isConditionalApproval: false,
    isDefinitiveApproval: false,
  },
};

/**
 * Obtiene la información pública garantizando que no se filtren detalles internos
 */
export function getPublicStageInfo(stage: BankStage): PublicStageInfo {
  return (
    CANONICAL_PUBLIC_STAGE_MAP[stage] || {
      stage,
      publicTitle: "En trámite",
      publicDescription: "Tu solicitud está siendo gestionada por nuestro equipo comercial.",
      badgeVariant: "secondary",
      iconName: "Clock",
      milestoneIndex: 1,
      isTerminal: false,
      isApproval: false,
      isConditionalApproval: false,
      isDefinitiveApproval: false,
    }
  );
}

/**
 * Hitos ordenados del ciclo de originación para el renderizado del Stepper en UI
 */
export const PUBLIC_MILESTONES = [
  { index: 1, label: "Documentos", description: "Recopilación y validación técnica" },
  { index: 2, label: "Preparación", description: "Expediente listo para banco" },
  { index: 3, label: "Radicación", description: "Ingreso formal y estudio de crédito" },
  { index: 4, label: "Aprobación", description: "Decisión y carta de crédito" },
  { index: 5, label: "Legalización", description: "Avalúo y estudio de títulos" },
  { index: 6, label: "Desembolso", description: "Operación completada" },
];
