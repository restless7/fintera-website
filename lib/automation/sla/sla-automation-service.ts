/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G03: Servicio de Automatización de SLAs, Tareas y Escalaciones Proactivas
 */

import prisma from "@/lib/prisma";
import { SlaService } from "@/lib/crm/sla/sla-service";
import { ColombianBusinessCalendar } from "@/lib/crm/sla/business-calendar";
import { ApplicationStatus, BankStage } from "@/prisma/generated/client";

export class SlaAutomationService {
  /**
   * 1. Detecta etapas bancarias vencidas (SLA BREACHED) respetando calendario hábil y pausas
   */
  public static async checkOverdueBankStages(): Promise<{ createdCount: number; evaluatedCount: number }> {
    const nonTerminalStages: BankStage[] = [
      BankStage.STAGE_01_PRE_FILE,
      BankStage.STAGE_02_INTERNAL_QA,
      BankStage.STAGE_03_READY_FOR_BANK,
      BankStage.STAGE_04_BANK_SUBMITTED,
      BankStage.STAGE_05_RISK_EVALUATION,
      BankStage.STAGE_06_CONDITIONAL_APPROVAL,
      BankStage.STAGE_07_DEFINITIVE_APPROVAL,
      BankStage.STAGE_08_APPRAISAL_LEGAL,
      BankStage.STAGE_BANK_SUSPENDED,
    ];

    const activeBankApps = await prisma.bankApplication.findMany({
      where: {
        stage: { in: nonTerminalStages },
        slaDeadline: { not: null },
      },
      include: {
        application: {
          select: { id: true, assignedAdvisorId: true },
        },
      },
    });

    let createdCount = 0;
    const now = new Date();

    for (const bankApp of activeBankApps) {
      const evaluation = SlaService.evaluateStatus({
        stage: bankApp.stage,
        createdAt: bankApp.createdAt,
        updatedAt: bankApp.updatedAt,
        slaDeadline: bankApp.slaDeadline,
        slaPausedAt: bankApp.slaPausedAt,
        slaTotalPausedMs: bankApp.slaTotalPausedMs,
        now,
      });

      if (evaluation.status === "BREACHED" && evaluation.effectiveDeadline) {
        // Clave determinista de deduplicación para evitar duplicados en ciclos repetidos
        const dedupKey = `BANK_STAGE_OVERDUE:${bankApp.id}:${bankApp.stage}:${evaluation.effectiveDeadline.toISOString().slice(0, 10)}`;

        const existingTask = await prisma.slaAutomationTask.findUnique({
          where: { dedupKey },
        });

        if (!existingTask) {
          await prisma.slaAutomationTask.create({
            data: {
              ruleCode: "BANK_STAGE_OVERDUE",
              dedupKey,
              applicationId: bankApp.applicationId,
              bankApplicationId: bankApp.id,
              severity: "CRITICAL",
              title: `Vencimiento de SLA Bancario en ${bankApp.bankId}`,
              description: `El subexpediente en ${bankApp.bankId} superó la fecha límite efectiva (${evaluation.effectiveDeadline.toISOString()}) en etapa ${bankApp.stage}.`,
              assignedRole: "COMMERCIAL_DIRECTOR",
              assignedUserId: bankApp.application.assignedAdvisorId,
              status: "OPEN",
              actionRequired: "Contactar a la mesa de radicación del banco o registrar justificación de atraso.",
            },
          });
          createdCount++;
        }
      }
    }

    return { createdCount, evaluatedCount: activeBankApps.length };
  }

  /**
   * 2. Detecta expedientes inactivos sin avance sustantivo en >= 7 días hábiles colombianos
   */
  public static async checkInactiveCases(businessDaysThreshold: number = 7): Promise<{ createdCount: number }> {
    const activeApps = await prisma.crmCreditApplication.findMany({
      where: {
        status: { notIn: [ApplicationStatus.REJECTED, ApplicationStatus.DISBURSED, ApplicationStatus.CANCELLED_BY_CLIENT] },
      },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    let createdCount = 0;
    const now = new Date();
    const currentWeekWindow = `${now.getFullYear()}-W${Math.ceil((now.getDate() + 6) / 7)}`;

    for (const app of activeApps) {
      const lastActivityDate = app.activities[0]?.createdAt || app.updatedAt;
      const elapsedBusinessMs = ColombianBusinessCalendar.getBusinessElapsedMs(lastActivityDate, now);
      const elapsedBusinessHours = elapsedBusinessMs / (3600 * 1000);
      const elapsedBusinessDays = elapsedBusinessHours / 9; // 9 horas hábiles por día

      if (elapsedBusinessDays >= businessDaysThreshold) {
        const dedupKey = `INACTIVE_CASE_ALERT:${app.id}:${currentWeekWindow}`;

        const existingTask = await prisma.slaAutomationTask.findUnique({
          where: { dedupKey },
        });

        if (!existingTask) {
          await prisma.slaAutomationTask.create({
            data: {
              ruleCode: "INACTIVE_CASE_ALERT",
              dedupKey,
              applicationId: app.id,
              severity: "HIGH",
              title: "Expediente Inactivo sin Avance",
              description: `La solicitud no registra actividades comerciales o bancarias en los últimos ${Math.round(elapsedBusinessDays)} días hábiles.`,
              assignedRole: "COMMERCIAL_ADVISOR",
              assignedUserId: app.assignedAdvisorId,
              status: "OPEN",
              actionRequired: "Realizar llamada de seguimiento al cliente y registrar bitácora.",
            },
          });
          createdCount++;
        }
      }
    }

    return { createdCount };
  }

  /**
   * 3. Detecta documentos próximos a caducar (ventana de 5 días hábiles)
   */
  public static async checkExpiringDocuments(warningDaysThreshold: number = 5): Promise<{ createdCount: number }> {
    const now = new Date();
    const warningHorizon = new Date(now.getTime() + warningDaysThreshold * 24 * 3600 * 1000);

    const expiringReviews = await prisma.documentBankReview.findMany({
      where: {
        validUntil: {
          gt: now,
          lte: warningHorizon,
        },
      },
      include: {
        bankApplication: {
          select: { applicationId: true, bankId: true },
        },
        requirement: {
          include: {
            requirementDefinition: {
              select: { requirementCode: true, title: true },
            },
          },
        },
      },
    });

    let createdCount = 0;

    for (const review of expiringReviews) {
      if (!review.bankApplication?.applicationId || !review.validUntil) continue;

      const expiryDateStr = review.validUntil.toISOString().slice(0, 10);
      const reqCode = review.requirement?.requirementDefinition?.requirementCode || "DOC";
      const dedupKey = `DOCUMENT_EXPIRING_WARNING:${review.id}:${expiryDateStr}`;

      const existingTask = await prisma.slaAutomationTask.findUnique({
        where: { dedupKey },
      });

      if (!existingTask) {
        await prisma.slaAutomationTask.create({
          data: {
            ruleCode: "DOCUMENT_EXPIRING_WARNING",
            dedupKey,
            applicationId: review.bankApplication.applicationId,
            severity: "MEDIUM",
            title: `Documento Próximo a Caducar (${reqCode})`,
            description: `El documento ${reqCode} para ${review.bankApplication.bankId} vence el ${expiryDateStr}. Requiere renovación antes de radicación o desembolso.`,
            assignedRole: "COMMERCIAL_ADVISOR",
            status: "OPEN",
            actionRequired: "Solicitar al cliente extractos o certificados laborales actualizados.",
          },
        });
        createdCount++;
      }
    }

    return { createdCount };
  }

  /**
   * 4. Detecta mensajes de clientes sin respuesta de su asesor (> 24 horas hábiles)
   */
  public static async checkPendingCustomerMessages(hoursThreshold: number = 24): Promise<{ createdCount: number }> {
    const unreadMessages = await prisma.customerMessage.findMany({
      where: {
        senderType: "CUSTOMER",
        isRead: false,
      },
      include: {
        application: {
          select: { assignedAdvisorId: true },
        },
      },
    });

    let createdCount = 0;
    const now = new Date();

    for (const msg of unreadMessages) {
      const elapsedMs = ColombianBusinessCalendar.getBusinessElapsedMs(msg.createdAt, now);
      const elapsedHours = elapsedMs / (3600 * 1000);

      if (elapsedHours >= hoursThreshold) {
        const dedupKey = `CUSTOMER_MESSAGE_PENDING:${msg.id}`;

        const existingTask = await prisma.slaAutomationTask.findUnique({
          where: { dedupKey },
        });

        if (!existingTask) {
          await prisma.slaAutomationTask.create({
            data: {
              ruleCode: "CUSTOMER_MESSAGE_PENDING",
              dedupKey,
              applicationId: msg.applicationId,
              severity: "HIGH",
              title: `Mensaje Pendiente de Respuesta (${msg.senderName})`,
              description: `El cliente envió una consulta hace ${Math.round(elapsedHours)} horas hábiles sin respuesta registrada.`,
              assignedRole: "COMMERCIAL_ADVISOR",
              assignedUserId: msg.application.assignedAdvisorId,
              status: "OPEN",
              actionRequired: "Responder al cliente a través del canal seguro de mensajería del portal.",
            },
          });
          createdCount++;
        }
      }
    }

    return { createdCount };
  }

  /**
   * Ejecuta el escaneo completo de automatización de SLAs
   */
  public static async runFullScan(): Promise<{
    overdueTasksCreated: number;
    inactiveTasksCreated: number;
    expiringDocTasksCreated: number;
    pendingMessageTasksCreated: number;
    totalTasksCreated: number;
  }> {
    const [overdue, inactive, expiring, pendingMsg] = await Promise.all([
      this.checkOverdueBankStages(),
      this.checkInactiveCases(7),
      this.checkExpiringDocuments(5),
      this.checkPendingCustomerMessages(24),
    ]);

    return {
      overdueTasksCreated: overdue.createdCount,
      inactiveTasksCreated: inactive.createdCount,
      expiringDocTasksCreated: expiring.createdCount,
      pendingMessageTasksCreated: pendingMsg.createdCount,
      totalTasksCreated:
        overdue.createdCount + inactive.createdCount + expiring.createdCount + pendingMsg.createdCount,
    };
  }
}
