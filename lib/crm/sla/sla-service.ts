/**
 * SERVICIO CENTRALIZADO DE GESTIÓN Y EVALUACIÓN DE SLA
 * FASE 6.3: GATE D — OPERATIONAL SLA MANAGEMENT
 */

import { ColombianBusinessCalendar } from "./business-calendar";
import { STAGE_SLA_POLICIES, SlaStagePolicy } from "./sla-policy";
import { BankStage } from "@/prisma/generated/client";

export type SlaStatus = "ON_TRACK" | "AT_RISK" | "BREACHED" | "PAUSED" | "NOT_APPLICABLE";

export interface SlaEvaluationResult {
  status: SlaStatus;
  deadline: Date | null;
  effectiveDeadline: Date | null;
  totalPausedMs: number;
  isPaused: boolean;
  businessHoursRemaining: number;
  policy: SlaStagePolicy;
}

export class SlaService {
  /**
   * Calcula la fecha límite (SLA Deadline) inicial para una etapa bancaria
   */
  static calculateInitialDeadline(stage: BankStage, startDate: Date = new Date()): Date | null {
    const policy = STAGE_SLA_POLICIES[stage];
    if (!policy || policy.standardBusinessHours <= 0) {
      return null;
    }
    return ColombianBusinessCalendar.addBusinessHours(startDate, policy.standardBusinessHours);
  }

  /**
   * Evalúa el estado del SLA para un subexpediente bancario
   */
  static evaluateStatus(params: {
    stage: BankStage;
    createdAt: Date;
    updatedAt: Date;
    slaDeadline: Date | null;
    slaPausedAt: Date | null;
    slaTotalPausedMs: bigint | number;
    now?: Date;
  }): SlaEvaluationResult {
    const { stage, slaDeadline, slaPausedAt, slaTotalPausedMs } = params;
    const now = params.now || new Date();
    const policy = STAGE_SLA_POLICIES[stage];

    if (!policy || policy.standardBusinessHours <= 0 || !slaDeadline) {
      return {
        status: "NOT_APPLICABLE",
        deadline: null,
        effectiveDeadline: null,
        totalPausedMs: Number(slaTotalPausedMs || 0),
        isPaused: false,
        businessHoursRemaining: 0,
        policy,
      };
    }

    const isPaused = !!slaPausedAt;
    const totalPausedMs = Number(slaTotalPausedMs || 0) + (isPaused ? now.getTime() - slaPausedAt.getTime() : 0);

    // Fecha límite efectiva desplazada por el tiempo en pausa
    const effectiveDeadline = new Date(slaDeadline.getTime() + totalPausedMs);

    if (isPaused) {
      return {
        status: "PAUSED",
        deadline: slaDeadline,
        effectiveDeadline,
        totalPausedMs,
        isPaused: true,
        businessHoursRemaining: Math.max(0, (effectiveDeadline.getTime() - now.getTime()) / (3600 * 1000)),
        policy,
      };
    }

    if (now >= effectiveDeadline) {
      return {
        status: "BREACHED",
        deadline: slaDeadline,
        effectiveDeadline,
        totalPausedMs,
        isPaused: false,
        businessHoursRemaining: 0,
        policy,
      };
    }

    // Calcular horas hábiles restantes
    const elapsedBusinessMs = ColombianBusinessCalendar.getBusinessElapsedMs(now, effectiveDeadline);
    const businessHoursRemaining = elapsedBusinessMs / (3600 * 1000);

    if (businessHoursRemaining <= policy.atRiskThresholdHours) {
      return {
        status: "AT_RISK",
        deadline: slaDeadline,
        effectiveDeadline,
        totalPausedMs,
        isPaused: false,
        businessHoursRemaining,
        policy,
      };
    }

    return {
      status: "ON_TRACK",
      deadline: slaDeadline,
      effectiveDeadline,
      totalPausedMs,
      isPaused: false,
      businessHoursRemaining,
      policy,
    };
  }

  /**
   * Pausa el reloj de SLA (ej. requerimiento de documentos adicionales al cliente)
   */
  static pause(currentPausedAt: Date | null): { slaPausedAt: Date } {
    return {
      slaPausedAt: currentPausedAt || new Date(),
    };
  }

  /**
   * Reanuda el reloj de SLA acumulando el tiempo pausado
   */
  static resume(slaPausedAt: Date | null, existingPausedMs: bigint | number): {
    slaPausedAt: null;
    slaTotalPausedMs: bigint;
  } {
    if (!slaPausedAt) {
      return {
        slaPausedAt: null,
        slaTotalPausedMs: BigInt(existingPausedMs || 0),
      };
    }
    const elapsed = Date.now() - slaPausedAt.getTime();
    const newTotal = BigInt(existingPausedMs || 0) + BigInt(elapsed);
    return {
      slaPausedAt: null,
      slaTotalPausedMs: newTotal,
    };
  }

  /**
   * Extiende el SLA con una causal tipificada y autorizada
   */
  static extend(currentDeadline: Date, additionalBusinessHours: number): Date {
    return ColombianBusinessCalendar.addBusinessHours(currentDeadline, additionalBusinessHours);
  }
}
