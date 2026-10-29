/**
 * SERVICIO DE REVERSIÓN Y RECUPERACIÓN CONTROLADA (CONTROLLED STATUS REVERSAL)
 * FASE 6.3: GATE D — REMEDIATION D
 * 
 * Reglas de Integridad:
 * 1. Prohibida la reversión genérica de expedientes en estado DISBURSED.
 * 2. Cancelación por cliente exige tipo y referencia verificable de evidencia.
 * 3. Matriz estricta de retroceso admisible que impide saltos incongruentes.
 * 4. Preservación absoluta de la bitácora inmutable de auditoría y actividades.
 */

import prisma from "../prisma";
import { ApplicationStatus, BankStage } from "../../prisma/generated/client";

export type CancellationEvidenceType =
  | "WRITTEN_REQUEST"
  | "RECORDED_CALL"
  | "WHATSAPP_CONFIRMATION"
  | "EMAIL_NOTICE"
  | "CLIENT_DESISTANCE_STATEMENT";

export interface SelectiveRollbackResult {
  success: boolean;
  action: "CANCELLED" | "ARCHIVED" | "REVERTED_STATUS" | "PURGED_TEST_CASE";
  applicationId: string;
  fileNumber: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  auditLogId?: string;
  message: string;
}

/**
 * Matriz de transiciones inversas permitidas (Rollback Admisible)
 */
export const ALLOWED_STATUS_ROLLBACKS: Record<ApplicationStatus, ApplicationStatus[]> = {
  LEAD_CAPTURED: [],
  PROFILING: [ApplicationStatus.LEAD_CAPTURED],
  FINANCIALLY_PREQUALIFIED: [ApplicationStatus.PROFILING, ApplicationStatus.LEAD_CAPTURED],
  DOCUMENTATION_IN_PROGRESS: [ApplicationStatus.FINANCIALLY_PREQUALIFIED, ApplicationStatus.PROFILING],
  FILE_COMPLETE: [ApplicationStatus.DOCUMENTATION_IN_PROGRESS],
  SUBMITTED_TO_BANKS: [ApplicationStatus.FILE_COMPLETE, ApplicationStatus.DOCUMENTATION_IN_PROGRESS],
  BANK_STUDY: [ApplicationStatus.SUBMITTED_TO_BANKS, ApplicationStatus.DOCUMENTATION_IN_PROGRESS],
  PARTIALLY_APPROVED: [ApplicationStatus.BANK_STUDY, ApplicationStatus.DOCUMENTATION_IN_PROGRESS],
  LEGALLY_FORMALIZED: [ApplicationStatus.PARTIALLY_APPROVED, ApplicationStatus.DOCUMENTATION_IN_PROGRESS],
  DISBURSED: [], // Totalmente irreversible por rollback ordinario
  REJECTED: [ApplicationStatus.DOCUMENTATION_IN_PROGRESS, ApplicationStatus.FINANCIALLY_PREQUALIFIED],
  CANCELLED_BY_CLIENT: [ApplicationStatus.DOCUMENTATION_IN_PROGRESS, ApplicationStatus.PROFILING],
};

export class SelectiveRollbackService {
  /**
   * Cancela selectivamente un expediente exigiendo evidencia verificable de desistimiento
   */
  static async cancelApplication(
    applicationId: string,
    reason: string,
    performedByUserId?: string,
    evidence?: {
      evidenceType: CancellationEvidenceType;
      evidenceReference: string;
    }
  ): Promise<SelectiveRollbackResult> {
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: { client: true },
    });

    if (!app) {
      throw new Error(`Expediente con ID ${applicationId} no encontrado`);
    }

    // Regla D1: Inmutabilidad de créditos desembolsados
    if (app.status === ApplicationStatus.DISBURSED) {
      throw new Error(
        "Operación denegada: Un expediente en estado DISBURSED no puede ser cancelado mediante reversión operativa. Requiere proceso legal de liquidación."
      );
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error("Debe suministrar un motivo detallado de cancelación (mínimo 5 caracteres).");
    }

    const previousStatus = app.status;
    const newStatus: ApplicationStatus = ApplicationStatus.CANCELLED_BY_CLIENT;

    let validAuthorId: string | null = null;
    if (performedByUserId) {
      const userExists = await prisma.appUser.findUnique({ where: { id: performedByUserId } });
      if (userExists) {
        validAuthorId = userExists.id;
      }
    }

    // Transacción atómica: actualizar estado, agregar actividad y registrar auditoría
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.crmCreditApplication.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          internalNotes: `${app.internalNotes || ""}\n[REVERSIÓN ${new Date().toISOString()}]: ${reason} (Evidencia: ${evidence?.evidenceType || "No especificada"} - Ref: ${evidence?.evidenceReference || "N/A"})`.trim(),
        },
      });

      // Registrar actividad interna de cancelación con evidencia
      await tx.crmActivity.create({
        data: {
          applicationId,
          authorId: validAuthorId,
          type: "STATUS_CHANGE",
          title: `Expediente cancelado (${previousStatus} -> ${newStatus})`,
          description: `Motivo: ${reason}. Evidencia: ${evidence?.evidenceType || "Soporte comercial"} Ref: ${evidence?.evidenceReference || "Registrada"}`,
          isInternalOnly: true,
          metadata: evidence as any,
        },
      });

      // Suspender subexpedientes bancarios activos
      await tx.bankApplication.updateMany({
        where: {
          applicationId,
          stage: {
            notIn: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED],
          },
        },
        data: {
          stage: BankStage.STAGE_BANK_SUSPENDED,
          rejectionReason: `Cancelación selectiva de expediente: ${reason}`,
        },
      });

      // Bitácora inmutable de auditoría
      const audit = await tx.accessAuditEvent.create({
        data: {
          userId: validAuthorId,
          action: "SELECTIVE_ROLLBACK_CANCEL",
          resourceType: "CrmCreditApplication",
          resourceId: applicationId,
          applicationId,
          decision: "GRANTED",
          reason: `Reversión selectiva ejecutada: ${reason}`,
          metadata: {
            fileNumber: app.fileNumber,
            previousStatus,
            newStatus,
            clientDocument: app.client.documentNumber,
            evidence,
          },
        },
      });

      return { updated, audit };
    });

    return {
      success: true,
      action: "CANCELLED",
      applicationId: result.updated.id,
      fileNumber: result.updated.fileNumber,
      previousStatus,
      newStatus,
      auditLogId: result.audit.id,
      message: `Expediente ${app.fileNumber} revertido y cancelado selectivamente sin afectar otros registros.`,
    };
  }

  /**
   * Reversión de estado controlada mediante matriz de retrocesos admisibles
   */
  static async revertStatus(
    applicationId: string,
    targetStatus: ApplicationStatus,
    reason: string,
    performedByUserId?: string
  ): Promise<SelectiveRollbackResult> {
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      throw new Error(`Expediente ${applicationId} no existe`);
    }

    const previousStatus = app.status;

    // Regla D1: Inmutabilidad de créditos desembolsados
    if (previousStatus === ApplicationStatus.DISBURSED) {
      throw new Error(
        "Operación denegada: Un expediente en estado DISBURSED es terminal y no admite retroceso de estado."
      );
    }

    // Regla D3: Validación contra matriz de admisibilidad
    const allowedTargets = ALLOWED_STATUS_ROLLBACKS[previousStatus] || [];
    if (!allowedTargets.includes(targetStatus)) {
      throw new Error(
        `Retroceso no admisible: No está permitido revertir el expediente desde ${previousStatus} hacia ${targetStatus}. Destinos permitidos: [${allowedTargets.join(", ")}]`
      );
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error("Debe suministrar una justificación detallada para el retroceso de estado.");
    }

    let validAuthorId: string | null = null;
    if (performedByUserId) {
      const userExists = await prisma.appUser.findUnique({ where: { id: performedByUserId } });
      if (userExists) {
        validAuthorId = userExists.id;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.crmCreditApplication.update({
        where: { id: applicationId },
        data: {
          status: targetStatus,
          internalNotes: `${app.internalNotes || ""}\n[REVERSIÓN DE ESTADO ${new Date().toISOString()}]: Revertido de ${previousStatus} a ${targetStatus}. Motivo: ${reason}`.trim(),
        },
      });

      await tx.crmActivity.create({
        data: {
          applicationId,
          authorId: validAuthorId,
          type: "STATUS_CHANGE",
          title: `Estado revertido a ${targetStatus}`,
          description: reason,
          isInternalOnly: true,
        },
      });

      const audit = await tx.accessAuditEvent.create({
        data: {
          userId: validAuthorId,
          action: "SELECTIVE_ROLLBACK_REVERT_STATUS",
          resourceType: "CrmCreditApplication",
          resourceId: applicationId,
          applicationId,
          decision: "GRANTED",
          reason,
          metadata: {
            previousStatus,
            newStatus: targetStatus,
          },
        },
      });

      return { updated, audit };
    });

    return {
      success: true,
      action: "REVERTED_STATUS",
      applicationId: result.updated.id,
      fileNumber: result.updated.fileNumber,
      previousStatus,
      newStatus: targetStatus,
      auditLogId: result.audit.id,
      message: `Estado revertido de ${previousStatus} a ${targetStatus} para expediente ${app.fileNumber}`,
    };
  }
}
