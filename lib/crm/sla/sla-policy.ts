/**
 * POLÍTICAS Y REGLAS DE TIEMPOS DE RESPUESTA (SLA POLICIES)
 * FASE 6.3: GATE D — OPERATIONAL SLA MANAGEMENT
 * 
 * Separa explícitamente:
 * 1. Compromisos Operativos Internos de Fintera (Auditoría, Control de Calidad y Radicación)
 * 2. Tiempos Estimados de Trámite Bancario (No contractuales de Fintera, sujetos a la entidad)
 */

import { BankStage } from "@/prisma/generated/client";

export type SlaCategory = "FINTERA_INTERNAL" | "ESTIMATED_BANK_TARGET";

export interface SlaStagePolicy {
  stage: BankStage;
  category: SlaCategory;
  standardBusinessHours: number;
  atRiskThresholdHours: number; // Cuando restan menos de estas horas, se marca AT_RISK
  description: string;
}

/**
 * Matriz de políticas SLA por etapa operativa (Versión canónica v1.0)
 */
export const STAGE_SLA_POLICIES: Record<BankStage, SlaStagePolicy> = {
  STAGE_01_PRE_FILE: {
    stage: BankStage.STAGE_01_PRE_FILE,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 48, // 48 horas hábiles para recopilar anexos
    atRiskThresholdHours: 8,
    description: "Recopilación y estructuración preliminar del expediente con el solicitante",
  },
  STAGE_02_INTERNAL_QA: {
    stage: BankStage.STAGE_02_INTERNAL_QA,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 24, // 24 horas hábiles para control de calidad y revisión documental
    atRiskThresholdHours: 4,
    description: "Revisión documental interna por el área de Calidad y Operaciones",
  },
  STAGE_03_READY_FOR_BANK: {
    stage: BankStage.STAGE_03_READY_FOR_BANK,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 12, // 12 horas hábiles para presentar o radicar ante el banco
    atRiskThresholdHours: 2,
    description: "Expediente auditado listo para radicación formal ante el ejecutivo bancario",
  },
  STAGE_04_BANK_SUBMITTED: {
    stage: BankStage.STAGE_04_BANK_SUBMITTED,
    category: "ESTIMATED_BANK_TARGET",
    standardBusinessHours: 72, // 72 horas hábiles (3 días hábiles) estimadas para ingreso a fábrica
    atRiskThresholdHours: 12,
    description: "Radicado ante el banco. Tiempo estimado para asignación a fábrica de crédito",
  },
  STAGE_05_RISK_EVALUATION: {
    stage: BankStage.STAGE_05_RISK_EVALUATION,
    category: "ESTIMATED_BANK_TARGET",
    standardBusinessHours: 96, // 4 días hábiles promedio para scoring y análisis de riesgo
    atRiskThresholdHours: 16,
    description: "Evaluación de capacidad de pago y scoring de riesgo por la entidad financiera",
  },
  STAGE_06_CONDITIONAL_APPROVAL: {
    stage: BankStage.STAGE_06_CONDITIONAL_APPROVAL,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 36, // Fintera debe gestionar las condiciones del banco en 36h hábiles
    atRiskThresholdHours: 6,
    description: "Subsanación de condiciones previas a la carta definitiva",
  },
  STAGE_07_DEFINITIVE_APPROVAL: {
    stage: BankStage.STAGE_07_DEFINITIVE_APPROVAL,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 24, // Notificación al cliente y solicitud de documentos del inmueble
    atRiskThresholdHours: 4,
    description: "Aprobación definitiva vigente. Handoff hacia avalúo y títulos",
  },
  STAGE_08_APPRAISAL_LEGAL: {
    stage: BankStage.STAGE_08_APPRAISAL_LEGAL,
    category: "ESTIMATED_BANK_TARGET",
    standardBusinessHours: 216, // ~24 días hábiles de trámite legal y notarial
    atRiskThresholdHours: 24,
    description: "Elaboración de avalúo comercial, estudio de títulos y firma de escrituras",
  },
  STAGE_09_DISBURSED: {
    stage: BankStage.STAGE_09_DISBURSED,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 0, // Terminal
    atRiskThresholdHours: 0,
    description: "Crédito desembolsado exitosamente",
  },
  STAGE_BANK_REJECTED: {
    stage: BankStage.STAGE_BANK_REJECTED,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 0, // Terminal
    atRiskThresholdHours: 0,
    description: "Solicitud negada por la entidad financiera",
  },
  STAGE_BANK_SUSPENDED: {
    stage: BankStage.STAGE_BANK_SUSPENDED,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 0, // Pausado
    atRiskThresholdHours: 0,
    description: "Trámite suspendido o pausado temporalmente",
  },
  STAGE_BANK_TRANSFERRED: {
    stage: BankStage.STAGE_BANK_TRANSFERRED,
    category: "FINTERA_INTERNAL",
    standardBusinessHours: 0, // Terminal
    atRiskThresholdHours: 0,
    description: "Expediente trasladado hacia otra alternativa bancaria",
  },
};
