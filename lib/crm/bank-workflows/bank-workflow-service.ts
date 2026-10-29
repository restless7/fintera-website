/**
 * MÁQUINA DE ESTADOS TRANSACCIONAL (BANK WORKFLOW SERVICE)
 * FASE 6.3: GATE D — D03
 * 
 * Centraliza el 100% de las transiciones de etapa bancaria bajo control ACID,
 * verificación estricta RBAC/ABAC, control de concurrencia optimista (OCC),
 * protección de estados terminales y registro inmutable de auditoría.
 */

import prisma from "@/lib/prisma";
import { BankStage } from "@/prisma/generated/client";
import { UserRole } from "@/lib/auth/types";
import { BankWorkflowRegistry } from "./registry";
import { SlaService } from "../sla/sla-service";
import { AdministrativeExceptionTransitionInput } from "./types";

export interface TransitionStageInput {
  bankApplicationId: string;
  targetStage: BankStage;
  expectedVersion: number;
  reason: string;
  supportingEvidence?: {
    evidenceType?: string;
    evidenceReference?: string;
    metadata?: Record<string, unknown>;
  };
  actorUserId: string;
  actorRole: UserRole;
  approvedAmount?: number;
  approvedRateEA?: number;
  approvedTermMonths?: number;
  bankFilingNumber?: string;
  rejectionReason?: string;
}

export interface TransitionStageResult {
  success: boolean;
  bankApplicationId: string;
  previousStage: BankStage;
  newStage: BankStage;
  version: number;
  transitionEventId: string;
  customerVisibleStage: string;
  slaDeadline: Date | null;
  message: string;
}

export class BankWorkflowError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "BankWorkflowError";
  }
}

export class BankWorkflowService {
  /**
   * Ejecuta la transición de etapa bancaria garantizando atomicidad y validaciones de negocio
   */
  static async transitionStage(input: TransitionStageInput): Promise<TransitionStageResult> {
    const {
      bankApplicationId,
      targetStage,
      expectedVersion,
      reason,
      supportingEvidence,
      actorUserId,
      actorRole,
      approvedAmount,
      approvedRateEA,
      approvedTermMonths,
      bankFilingNumber,
      rejectionReason,
    } = input;

    // 1. Cargar el subexpediente actual con su expediente comercial
    const currentBankApp = await prisma.bankApplication.findUnique({
      where: { id: bankApplicationId },
      include: {
        application: {
          include: {
            assignedAdvisor: true,
          },
        },
      },
    });

    if (!currentBankApp) {
      throw new BankWorkflowError(404, `Subexpediente bancario con ID ${bankApplicationId} no existe`, "RESOURCE_NOT_FOUND");
    }

    const currentStage = currentBankApp.stage;
    const currentVersion = currentBankApp.version;
    const bankId = currentBankApp.bankId;

    // 2. Control de Concurrencia Optimista (OCC)
    if (currentVersion !== expectedVersion) {
      throw new BankWorkflowError(
        409,
        `Conflicto de concurrencia: El subexpediente fue modificado por otro operador (Versión esperada: ${expectedVersion}, Versión actual: ${currentVersion}). Recargue la página.`,
        "CONCURRENCY_CONFLICT",
        { expectedVersion, currentVersion }
      );
    }

    // 3. Protección de Estados Terminales e Inmutables
    if (currentStage === BankStage.STAGE_09_DISBURSED) {
      throw new BankWorkflowError(
        422,
        "El crédito se encuentra en estado DESEMBOLSADO (STAGE_09_DISBURSED). Es un estado terminal protegido que no admite transiciones ordinarias.",
        "TERMINAL_STATE_IMMUTABLE"
      );
    }

    if (currentStage === BankStage.STAGE_BANK_REJECTED && targetStage !== BankStage.STAGE_01_PRE_FILE && targetStage !== BankStage.STAGE_BANK_SUSPENDED) {
      throw new BankWorkflowError(
        422,
        "Un trámite bancario negado por la entidad solo puede ser reabierto a subsanación o suspendido.",
        "TERMINAL_STATE_REJECTED"
      );
    }

    // 4. Cargar Definición de Workflow para la entidad
    const workflow = BankWorkflowRegistry.getWorkflow(bankId, currentBankApp.workflowVersion);
    const permittedTargets = workflow.permittedTransitions[currentStage] || [];

    if (!permittedTargets.includes(targetStage)) {
      throw new BankWorkflowError(
        422,
        `Transición no permitida en ${workflow.displayName}: No se puede avanzar de ${currentStage} a ${targetStage}.`,
        "INVALID_STAGE_TRANSITION",
        { currentStage, targetStage, permittedTargets }
      );
    }

    // 5. Verificación de Regla de Transición y Roles Autorizados
    const rule = workflow.transitionRules.find((r) => r.fromStage === currentStage && r.toStage === targetStage);
    if (rule) {
      if (!rule.allowedRoles.includes(actorRole)) {
        throw new BankWorkflowError(
          403,
          `Acceso denegado: El rol ${actorRole} no está autorizado para autorizar la transición de ${currentStage} a ${targetStage}.`,
          "INSUFFICIENT_ROLE_PERMISSION",
          { requiredRoles: rule.allowedRoles, actorRole }
        );
      }

      if (rule.requiresReason && (!reason || reason.trim().length < 5)) {
        throw new BankWorkflowError(
          422,
          `La transición a ${targetStage} exige registrar un motivo u observación detallada (mínimo 5 caracteres).`,
          "REASON_REQUIRED"
        );
      }

      if (rule.requiresEvidence && (!supportingEvidence?.evidenceReference && !supportingEvidence?.evidenceType && !bankFilingNumber)) {
        throw new BankWorkflowError(
          422,
          `La transición a ${targetStage} requiere suministrar una constancia o referencia de soporte verificable.`,
          "EVIDENCE_REQUIRED"
        );
      }

      // Validar prerrequisitos específicos
      const context = {
        bankApplicationId,
        bankId,
        productType: currentBankApp.productType,
        currentStage,
        targetStage,
        bankFilingNumber: bankFilingNumber !== undefined ? bankFilingNumber : currentBankApp.bankFilingNumber,
        approvedAmount: approvedAmount !== undefined ? approvedAmount : currentBankApp.approvedAmount,
        approvedRateEA: approvedRateEA !== undefined ? approvedRateEA : currentBankApp.approvedRateEA,
        approvedTermMonths: approvedTermMonths !== undefined ? approvedTermMonths : currentBankApp.approvedTermMonths,
        rejectionReason: rejectionReason !== undefined ? rejectionReason : currentBankApp.rejectionReason,
        evidenceType: supportingEvidence?.evidenceType,
        evidenceReference: supportingEvidence?.evidenceReference,
        actorRole,
        actorUserId,
      };

      for (const prereq of rule.prerequisites) {
        if (prereq.isMandatory && prereq.validationFn) {
          const isValid = await prereq.validationFn(context);
          if (!isValid) {
            const errorCode =
              prereq.code === "DOCUMENTARY_EVIDENCE_COMPLETE"
                ? "DOCUMENTARY_EVIDENCE_INCOMPLETE"
                : "PREREQUISITE_FAILED";
            throw new BankWorkflowError(
              422,
              `Prerrequisito no cumplido: ${prereq.name}. ${prereq.description}`,
              errorCode,
              { prerequisiteCode: prereq.code }
            );
          }
        }
      }
    }

    // 6. Proyección hacia el cliente y cálculo de nuevo SLA
    const customerProjection = workflow.customerStageMap[targetStage] || {
      customerVisibleStage: targetStage,
      publicDescription: "En proceso",
      actionRequiredByClient: null,
      isPubliclyVisible: true,
    };

    const newSlaDeadline = SlaService.calculateInitialDeadline(targetStage, new Date());

    let validActorId: string | null = null;
    if (actorUserId) {
      const userExists = await prisma.appUser.findUnique({ where: { id: actorUserId } });
      if (userExists) {
        validActorId = userExists.id;
      }
    }

    // 7. Transacción Atómica ACID
    const result = await prisma.$transaction(async (tx) => {
      // 7.1 Compare-and-Swap atómico incrementando version
      const updateResult = await tx.bankApplication.updateMany({
        where: {
          id: bankApplicationId,
          version: expectedVersion, // Condición de concurrencia
        },
        data: {
          stage: targetStage,
          version: expectedVersion + 1,
          customerVisibleStage: customerProjection.customerVisibleStage,
          customerVisible: customerProjection.isPubliclyVisible,
          slaDeadline: newSlaDeadline,
          slaStatus: "ON_TRACK",
          slaPausedAt: null,
          slaBreached: false,
          bankFilingNumber: bankFilingNumber !== undefined ? bankFilingNumber : undefined,
          approvedAmount: approvedAmount !== undefined ? Number(approvedAmount) : undefined,
          approvedRateEA: approvedRateEA !== undefined ? Number(approvedRateEA) : undefined,
          approvedTermMonths: approvedTermMonths !== undefined ? Number(approvedTermMonths) : undefined,
          rejectionReason: rejectionReason !== undefined ? rejectionReason : undefined,
          notes: reason ? `${currentBankApp.notes || ""}\n[${targetStage}]: ${reason}`.trim() : undefined,
        },
      });

      if (updateResult.count === 0) {
        throw new BankWorkflowError(
          409,
          "Conflicto de concurrencia detectado durante la persistencia. La versión fue modificada concurrentemente.",
          "CONCURRENCY_CONFLICT_AT_COMMIT"
        );
      }

      // 7.2 Registrar Evento Inmutable de Transición de Etapa
      const transitionEvent = await tx.bankStageTransitionEvent.create({
        data: {
          bankApplicationId,
          fromStage: currentStage,
          toStage: targetStage,
          workflowVersion: workflow.version,
          actorUserId: validActorId,
          actorRole: actorRole.toString(),
          reason,
          evidenceType: supportingEvidence?.evidenceType || null,
          evidenceReference: supportingEvidence?.evidenceReference || null,
          evidenceMetadata: (supportingEvidence?.metadata as any) || null,
        },
      });

      // 7.3 Registrar Bitácora de Actividad Interna
      await tx.crmActivity.create({
        data: {
          applicationId: currentBankApp.applicationId,
          authorId: validActorId,
          type: "BANK_UPDATE",
          title: `Transición Bancaria [${bankId.toUpperCase()}]: ${currentStage} -> ${targetStage}`,
          description: `Motivo: ${reason}. Radicado: ${bankFilingNumber || currentBankApp.bankFilingNumber || "N/A"}. Versión WF: ${workflow.version}`,
          isInternalOnly: true,
        },
      });

      // 7.4 Registrar Evento en Outbox Transaccional
      await tx.domainOutboxEvent.create({
        data: {
          aggregateType: "BankApplication",
          aggregateId: bankApplicationId,
          eventType: "BANK_STAGE_TRANSITIONED",
          payload: {
            applicationId: currentBankApp.applicationId,
            bankApplicationId,
            bankId,
            fromStage: currentStage,
            toStage: targetStage,
            version: expectedVersion + 1,
            transitionEventId: transitionEvent.id,
            actorUserId,
            actorRole,
            transitionedAt: new Date().toISOString(),
          },
        },
      });

      // 7.5 Auditoría Inmutable de Seguridad
      await tx.accessAuditEvent.create({
        data: {
          userId: validActorId,
          action: "BANK_STAGE_TRANSITION",
          resourceType: "BankApplication",
          resourceId: bankApplicationId,
          applicationId: currentBankApp.applicationId,
          decision: "GRANTED",
          reason: `Transición autorizada a ${targetStage}: ${reason}`,
          metadata: {
            bankId,
            previousStage: currentStage,
            newStage: targetStage,
            version: expectedVersion + 1,
            workflowVersion: workflow.version,
          },
        },
      });

      return {
        transitionEventId: transitionEvent.id,
        newVersion: expectedVersion + 1,
      };
    });

    return {
      success: true,
      bankApplicationId,
      previousStage: currentStage,
      newStage: targetStage,
      version: result.newVersion,
      transitionEventId: result.transitionEventId,
      customerVisibleStage: customerProjection.customerVisibleStage,
      slaDeadline: newSlaDeadline,
      message: `Subexpediente ${bankId.toUpperCase()} transicionado exitosamente de ${currentStage} a ${targetStage}.`,
    };
  }

  /**
   * Transición por Excepción Administrativa Auditada (E-R01)
   * Reservado exclusivamente para SUPER_ADMIN o COMMERCIAL_DIRECTOR.
   * Exige código formal de autorización y justificación de negocio (mínimo 20 caracteres).
   * Registra inmutablemente la excepción en access_audit_events y en los metadatos de la transición.
   */
  public static async transitionWithAdministrativeException(
    input: AdministrativeExceptionTransitionInput
  ): Promise<TransitionStageResult> {
    const {
      bankApplicationId,
      targetStage,
      expectedVersion,
      reason,
      actorUserId,
      actorRole,
      exceptionApprovalCode,
      exceptionReason,
      supportingEvidenceReference,
      bankFilingNumber,
      approvedAmount,
      approvedRateEA,
      approvedTermMonths,
      rejectionReason,
    } = input;

    // 1. Autorización estricta por rol
    if (actorRole !== UserRole.SUPER_ADMIN && actorRole !== UserRole.COMMERCIAL_DIRECTOR) {
      throw new BankWorkflowError(
        403,
        `Acceso denegado: El rol ${actorRole} no tiene facultades para autorizar excepciones administrativas. Requiere SUPER_ADMIN o COMMERCIAL_DIRECTOR.`,
        "UNAUTHORIZED_ADMINISTRATIVE_EXCEPTION",
        { actorRole }
      );
    }

    if (!exceptionApprovalCode || exceptionApprovalCode.trim().length < 8) {
      throw new BankWorkflowError(
        422,
        "La excepción administrativa requiere un código oficial de autorización (mínimo 8 caracteres, e.g. EXC-DIR-2026-XXXX).",
        "EXCEPTION_APPROVAL_CODE_REQUIRED"
      );
    }

    if (!exceptionReason || exceptionReason.trim().length < 20) {
      throw new BankWorkflowError(
        422,
        "La excepción administrativa exige una justificación formal fundamentada de negocio (mínimo 20 caracteres).",
        "EXCEPTION_REASON_TOO_SHORT"
      );
    }

    // 1.1 Prevención de Reúso Absoluto de Código de Excepción (Uso Único Global en todo el Sistema)
    const existingCodeUsage = await prisma.administrativeExceptionRecord.findFirst({
      where: {
        approvalCode: exceptionApprovalCode,
      },
    });
    if (existingCodeUsage) {
      throw new BankWorkflowError(
        422,
        `El código de autorización ${exceptionApprovalCode} ya fue utilizado previamente. Los códigos de excepción son de estricto uso único y no pueden reutilizarse en ningún expediente.`,
        "EXCEPTION_CODE_ALREADY_USED"
      );
    }

    // 1.2 Regla de 4 ojos: Presencia y autenticidad obligatoria de Solicitante y Aprobador independientes
    const { requestedByUserId, approvedByUserId } = input;
    const effectiveApproverId = approvedByUserId || actorUserId;
    const effectiveRequesterId = requestedByUserId;

    if (!effectiveRequesterId || !effectiveApproverId) {
      throw new BankWorkflowError(
        422,
        "Principio de 4 ojos: Se requiere explícitamente identificar tanto al solicitante (requestedByUserId) como al oficial aprobador (approvedByUserId) para autorizar una excepción administrativa.",
        "BOTH_ACTORS_REQUIRED"
      );
    }

    if (effectiveRequesterId === effectiveApproverId) {
      throw new BankWorkflowError(
        422,
        "Principio de 4 ojos violado: El solicitante no puede auto-aprobarse una excepción administrativa de impacto bancario.",
        "SELF_APPROVAL_PROHIBITED"
      );
    }

    // Verificar existencia y autenticidad en base de datos de ambos intervinientes
    const [requesterExists, approverExists] = await Promise.all([
      prisma.appUser.findUnique({ where: { id: effectiveRequesterId } }),
      prisma.appUser.findUnique({ where: { id: effectiveApproverId } }),
    ]);

    if (!requesterExists || !approverExists) {
      throw new BankWorkflowError(
        422,
        "Principio de 4 ojos: Los identificadores de solicitante y aprobador deben corresponder a usuarios internos válidos y activos en el CRM.",
        "INVALID_ACTORS_IDENTIFIER"
      );
    }

    const currentBankApp = await prisma.bankApplication.findUnique({
      where: { id: bankApplicationId },
      include: { application: true },
    });

    if (!currentBankApp) {
      throw new BankWorkflowError(404, `Subexpediente bancario ${bankApplicationId} no encontrado.`, "BANK_APPLICATION_NOT_FOUND");
    }

    const currentVersion = currentBankApp.version;
    const currentStage = currentBankApp.stage;
    const bankId = currentBankApp.bankId;

    if (currentVersion !== expectedVersion) {
      throw new BankWorkflowError(
        409,
        `Conflicto de concurrencia: Versión esperada ${expectedVersion} vs versión actual ${currentVersion}.`,
        "CONCURRENCY_CONFLICT",
        { expectedVersion, currentVersion }
      );
    }

    if (currentStage === BankStage.STAGE_09_DISBURSED) {
      throw new BankWorkflowError(422, "El crédito en estado DESEMBOLSADO no admite transiciones por excepción.", "TERMINAL_STATE_IMMUTABLE");
    }

    const workflow = BankWorkflowRegistry.getWorkflow(bankId, currentBankApp.workflowVersion);
    const permittedTargets = workflow.permittedTransitions[currentStage] || [];
    if (!permittedTargets.includes(targetStage)) {
      throw new BankWorkflowError(
        422,
        `Transición no permitida de ${currentStage} a ${targetStage}.`,
        "INVALID_STAGE_TRANSITION"
      );
    }

    const customerProjection = workflow.customerStageMap[targetStage] || {
      customerVisibleStage: targetStage,
      publicDescription: "En proceso excepcional",
      actionRequiredByClient: null,
      isPubliclyVisible: true,
    };

    const newSlaDeadline = SlaService.calculateInitialDeadline(targetStage, new Date());

    let validActorId: string | null = null;
    if (actorUserId) {
      const userExists = await prisma.appUser.findUnique({ where: { id: actorUserId } });
      if (userExists) validActorId = userExists.id;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBankApp = await tx.bankApplication.update({
        where: { id: bankApplicationId },
        data: {
          stage: targetStage,
          version: { increment: 1 },
          customerVisibleStage: customerProjection.customerVisibleStage,
          customerVisible: customerProjection.isPubliclyVisible,
          slaDeadline: newSlaDeadline,
          slaStatus: "ON_TRACK",
          bankFilingNumber: bankFilingNumber !== undefined ? bankFilingNumber : undefined,
          approvedAmount: approvedAmount !== undefined ? approvedAmount : undefined,
          approvedRateEA: approvedRateEA !== undefined ? approvedRateEA : undefined,
          approvedTermMonths: approvedTermMonths !== undefined ? approvedTermMonths : undefined,
          rejectionReason: rejectionReason !== undefined ? rejectionReason : undefined,
        },
      });

      const transitionEvent = await tx.bankStageTransitionEvent.create({
        data: {
          bankApplicationId,
          fromStage: currentStage,
          toStage: targetStage,
          workflowVersion: workflow.version,
          reason: `[EXCEPCIÓN ADMINISTRATIVA: ${exceptionApprovalCode}] ${reason}. Justificación: ${exceptionReason}`,
          evidenceType: "ADMINISTRATIVE_EXCEPTION",
          evidenceReference: exceptionApprovalCode,
          evidenceMetadata: {
            exceptionApprovalCode,
            exceptionReason,
            supportingEvidenceReference,
            waivedPrerequisites: ["DOCUMENTARY_EVIDENCE_COMPLETE"],
          },
          actorUserId: validActorId,
          actorRole,
        },
      });

      await tx.accessAuditEvent.create({
        data: {
          userId: validActorId,
          applicationId: currentBankApp.applicationId,
          action: "WORKFLOW_ADMINISTRATIVE_EXCEPTION",
          resourceType: "BankApplication",
          resourceId: bankApplicationId,
          decision: "GRANTED",
          reason: `Excepción administrativa ${exceptionApprovalCode} autorizada por ${actorRole}: ${exceptionReason}`,
          metadata: {
            bankId,
            fromStage: currentStage,
            toStage: targetStage,
            exceptionApprovalCode,
            exceptionReason,
          },
        },
      });

      if (validActorId) {
        await tx.administrativeExceptionRecord.create({
          data: {
            bankApplicationId,
            targetStage,
            requestedByUserId: requestedByUserId || validActorId,
            approvedByUserId: approvedByUserId || validActorId,
            approvalCode: exceptionApprovalCode,
            reason: exceptionReason,
            supportingEvidenceRef: supportingEvidenceReference || "EVIDENCIA_DOCUMENTAL_PREVIA_CERTIFICADA",
            bankFilingNumber: bankFilingNumber !== undefined ? bankFilingNumber : null,
            version: updatedBankApp.version,
          },
        });
      }

      return {
        transitionEventId: transitionEvent.id,
        newVersion: updatedBankApp.version,
      };
    });

    return {
      success: true,
      bankApplicationId,
      previousStage: currentStage,
      newStage: targetStage,
      version: result.newVersion,
      transitionEventId: result.transitionEventId,
      customerVisibleStage: customerProjection.customerVisibleStage,
      slaDeadline: newSlaDeadline,
      message: `Transición a ${targetStage} ejecutada exitosamente bajo excepción administrativa ${exceptionApprovalCode}.`,
    };
  }
}

