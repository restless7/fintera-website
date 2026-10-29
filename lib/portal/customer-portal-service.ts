/**
 * FINTERA ENTERPRISE CRM — FASE 6.5: GATE F
 * CustomerPortalService: Capa de Proyección de Privacidad y Consulta Segura del Cliente
 * Implementa control de acceso por objeto (BOLA) y filtrado estricto de campos confidenciales.
 */

import prisma from "@/lib/prisma";
import { BankStage, CustomerGrantRole } from "@/prisma/generated/client";
import { CustomerIdentityService, CustomerSecurityError } from "@/lib/auth/customer-identity-service";
import { getPublicStageInfo, PUBLIC_MILESTONES } from "./bank-stage-mapping";

export interface CustomerDashboardApplicationSummary {
  id: string;
  fileNumber: string;
  productCategory: string;
  requestedAmount: number;
  termMonths: number;
  createdAt: Date;
  status: string;
  overallPublicStage: string;
  overallProgressPercentage: number;
  assignedAdvisor: {
    name: string;
    email: string;
    phone: string;
  } | null;
  bankCases: Array<{
    id: string;
    bankId: string;
    productType: string;
    publicStageTitle: string;
    publicExplanation: string;
    badgeVariant: string;
    actionRequiredNote: string | null;
    filingNumber: string | null;
    lastUpdated: Date;
  }>;
  actionRequiredAlerts: string[];
}

export interface CustomerDashboardResponse {
  isLinked: boolean;
  client: {
    fullName: string;
    documentType: string;
    documentNumberMasked: string;
    email: string;
    phoneMasked: string;
  } | null;
  applications: CustomerDashboardApplicationSummary[];
}

export class CustomerPortalService {
  /**
   * Genera el Dashboard seguro para el cliente autenticado
   */
  public static async getCustomerDashboard(clerkUserId: string): Promise<CustomerDashboardResponse> {
    const context = await CustomerIdentityService.resolveCustomerContext(clerkUserId);

    if (!context.isLinked && context.grants.length === 0) {
      return {
        isLinked: false,
        client: null,
        applications: [],
      };
    }

    // Identificar qué expedientes tiene autorizados
    let applicationIds: string[] = [];

    if (context.client) {
      // Titular principal: consulta todos sus expedientes
      const clientApps = await prisma.crmCreditApplication.findMany({
        where: { clientId: context.client.id },
        select: { id: true },
      });
      applicationIds = clientApps.map((a) => a.id);
    }

    // Agregar solicitudes autorizadas por CustomerAccessGrant (co-deudores)
    for (const grant of context.grants) {
      if (grant.applicationId && !applicationIds.includes(grant.applicationId)) {
        applicationIds.push(grant.applicationId);
      }
    }

    if (applicationIds.length === 0) {
      return {
        isLinked: context.isLinked,
        client: context.client
          ? {
              fullName: `${context.client.firstName} ${context.client.firstLastName}`,
              documentType: context.client.documentType,
              documentNumberMasked: `****${context.client.documentNumber.slice(-4)}`,
              email: context.client.email,
              phoneMasked: `(***) ***-${context.client.phone.slice(-4)}`,
            }
          : null,
        applications: [],
      };
    }

    // Consultar las solicitudes autorizadas con proyección estricta (allowlist)
    const rawApplications = await prisma.crmCreditApplication.findMany({
      where: { id: { in: applicationIds } },
      select: {
        id: true,
        fileNumber: true,
        productCategory: true,
        requestedAmount: true,
        termMonths: true,
        createdAt: true,
        status: true,
        customerVisibleNotes: true,
        assignedAdvisor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        bankApplications: {
          select: {
            id: true,
            bankId: true,
            productType: true,
            stage: true,
            bankFilingNumber: true,
            updatedAt: true,
            publishedEvents: {
              where: { isRevoked: false },
              orderBy: { publishedAt: "desc" },
              take: 1,
              select: {
                canonicalStage: true,
                publicStageTitle: true,
                publicExplanation: true,
                actionRequiredNote: true,
                publishedAt: true,
              },
            },
            documentRequirements: {
              select: {
                id: true,
                isMandatory: true,
                evidenceLinks: {
                  select: { id: true },
                },
                reviews: {
                  select: { status: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const applications: CustomerDashboardApplicationSummary[] = rawApplications.map((app) => {
      const actionAlerts: string[] = [];

      const bankCases = app.bankApplications.map((b) => {
        const latestEvent = b.publishedEvents[0];
        const publicInfo = getPublicStageInfo(b.stage);

        const title = latestEvent ? latestEvent.publicStageTitle : publicInfo.publicTitle;
        const explanation = latestEvent ? latestEvent.publicExplanation : publicInfo.publicDescription;
        const actionNote = latestEvent ? latestEvent.actionRequiredNote : null;

        if (actionNote) {
          actionAlerts.push(`[${b.bankId.toUpperCase()}] ${actionNote}`);
        }

        // Revisar si hay documentos con rechazo o pendientes
        const hasRejections = b.documentRequirements.some((r) =>
          r.reviews.some((rev) => rev.status === "REJECTED")
        );
        if (hasRejections) {
          actionAlerts.push(`[${b.bankId.toUpperCase()}] Se requiere subsanar uno o más documentos observados.`);
        }

        return {
          id: b.id,
          bankId: b.bankId,
          productType: b.productType,
          publicStageTitle: title,
          publicExplanation: explanation,
          badgeVariant: publicInfo.badgeVariant,
          actionRequiredNote: actionNote,
          filingNumber: b.bankFilingNumber,
          lastUpdated: latestEvent ? latestEvent.publishedAt : b.updatedAt,
        };
      });

      // Cálculo de avance basado en hitos bancarios verificados (no división ingenua por 9)
      let highestMilestone = 1;
      for (const b of app.bankApplications) {
        const info = getPublicStageInfo(b.stage);
        if (info.milestoneIndex > highestMilestone) {
          highestMilestone = info.milestoneIndex;
        }
      }
      const overallProgressPercentage = Math.round((highestMilestone / PUBLIC_MILESTONES.length) * 100);

      // Determinar etapa consolidada amigable
      const primaryBankCase = bankCases[0];
      const overallPublicStage = primaryBankCase ? primaryBankCase.publicStageTitle : "En trámite";

      return {
        id: app.id,
        fileNumber: app.fileNumber,
        productCategory: app.productCategory,
        requestedAmount: app.requestedAmount,
        termMonths: app.termMonths,
        createdAt: app.createdAt,
        status: app.status,
        overallPublicStage,
        overallProgressPercentage,
        assignedAdvisor: app.assignedAdvisor
          ? {
              name: `${app.assignedAdvisor.firstName} ${app.assignedAdvisor.lastName}`,
              email: app.assignedAdvisor.email,
              phone: "WhatsApp Institucional Fintera (+57 300 912 8800)",
            }
          : null,
        bankCases,
        actionRequiredAlerts: actionAlerts,
      };
    });

    return {
      isLinked: context.isLinked,
      client: context.client
        ? {
            fullName: `${context.client.firstName} ${context.client.firstLastName}`,
            documentType: context.client.documentType,
            documentNumberMasked: `****${context.client.documentNumber.slice(-4)}`,
            email: context.client.email,
            phoneMasked: `(***) ***-${context.client.phone.slice(-4)}`,
          }
        : null,
      applications,
    };
  }

  /**
   * Obtiene el detalle autorizado de una solicitud con verificación BOLA
   */
  public static async getCustomerApplicationDetail(clerkUserId: string, applicationId: string) {
    const auth = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, applicationId, "VIEW");

    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        fileNumber: true,
        productCategory: true,
        requestedAmount: true,
        termMonths: true,
        createdAt: true,
        status: true,
        customerVisibleNotes: true,
        assignedAdvisor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        applicants: {
          select: {
            id: true,
            role: true,
            firstName: true,
            lastName: true,
            occupation: true,
          },
        },
        bankApplications: {
          select: {
            id: true,
            bankId: true,
            productType: true,
            stage: true,
            bankFilingNumber: true,
            filingDate: true,
            approvedAmount: true,
            approvedRateEA: true,
            approvedTermMonths: true,
            publishedEvents: {
              where: { isRevoked: false },
              orderBy: { publishedAt: "asc" },
              select: {
                id: true,
                canonicalStage: true,
                publicStageTitle: true,
                publicExplanation: true,
                actionRequiredNote: true,
                publishedAt: true,
              },
            },
          },
        },
      },
    });

    if (!app) {
      throw new CustomerSecurityError("Expediente no encontrado.", 404, "APPLICATION_NOT_FOUND");
    }

    // Filtrar solicitantes si es un co-deudor con permiso restringido
    let visibleApplicants = app.applicants;
    if (auth.grantRole === CustomerGrantRole.CO_APPLICANT && auth.applicantId) {
      visibleApplicants = app.applicants.filter((a) => a.id === auth.applicantId);
    }

    return {
      id: app.id,
      fileNumber: app.fileNumber,
      productCategory: app.productCategory,
      requestedAmount: app.requestedAmount,
      termMonths: app.termMonths,
      createdAt: app.createdAt,
      status: app.status,
      customerVisibleNotes: app.customerVisibleNotes,
      assignedAdvisor: app.assignedAdvisor
        ? {
            name: `${app.assignedAdvisor.firstName} ${app.assignedAdvisor.lastName}`,
            email: app.assignedAdvisor.email,
            phone: "+57 300 912 8800",
          }
        : null,
      applicants: visibleApplicants,
      bankApplications: app.bankApplications.map((b) => {
        const publicInfo = getPublicStageInfo(b.stage);
        return {
          id: b.id,
          bankId: b.bankId,
          productType: b.productType,
          currentStageTitle: publicInfo.publicTitle,
          currentStageDescription: publicInfo.publicDescription,
          badgeVariant: publicInfo.badgeVariant,
          bankFilingNumber: b.bankFilingNumber,
          filingDate: b.filingDate,
          approvedAmount: b.approvedAmount,
          approvedRateEA: b.approvedRateEA,
          approvedTermMonths: b.approvedTermMonths,
          timeline: b.publishedEvents.map((pe) => ({
            id: pe.id,
            stageTitle: pe.publicStageTitle,
            explanation: pe.publicExplanation,
            actionRequired: pe.actionRequiredNote,
            publishedAt: pe.publishedAt,
          })),
        };
      }),
    };
  }

  /**
   * Publica un hito bancario oficial al cliente de forma explícita y auditada
   */
  public static async publishBankEvent(params: {
    bankApplicationId: string;
    stage: BankStage;
    title?: string;
    explanation?: string;
    actionNote?: string;
    actorUserId: string;
  }): Promise<{ eventId: string }> {
    const { bankApplicationId, stage, title, explanation, actionNote, actorUserId } = params;

    const bankApp = await prisma.bankApplication.findUnique({
      where: { id: bankApplicationId },
      include: { application: true },
    });

    if (!bankApp) {
      throw new CustomerSecurityError("Subexpediente bancario no encontrado.", 404, "BANK_APPLICATION_NOT_FOUND");
    }

    const stageInfo = getPublicStageInfo(stage);
    const publicStageTitle = title || stageInfo.publicTitle;
    const publicExplanation = explanation || stageInfo.publicDescription;

    const event = await prisma.customerPublishedEvent.create({
      data: {
        bankApplicationId,
        canonicalStage: stage,
        publicStageTitle,
        publicExplanation,
        actionRequiredNote: actionNote || null,
        publishedByUserId: actorUserId,
      },
    });

    await prisma.accessAuditEvent.create({
      data: {
        userId: actorUserId,
        applicationId: bankApp.applicationId,
        action: "CUSTOMER_EVENT_PUBLISHED",
        resourceType: "CustomerPublishedEvent",
        resourceId: event.id,
        decision: "GRANTED",
        reason: `Publicado hito "${publicStageTitle}" para cliente en banco ${bankApp.bankId}.`,
        metadata: {
          bankApplicationId,
          stage,
          publicStageTitle,
        },
      },
    });

    return { eventId: event.id };
  }
}
