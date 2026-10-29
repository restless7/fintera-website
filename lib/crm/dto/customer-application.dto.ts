/**
 * DTO DE PROYECCIÓN SEGURA PARA EL CLIENTE (CUSTOMER-SAFE APPLICATION DTO)
 * FASE 6.3: GATE D — REMEDIATION C & D07
 * 
 * Principio de Aislamiento Absoluto:
 * - NO contiene internalNotes
 * - NO contiene notas de riesgo privadas
 * - NO contiene datos de contacto de ejecutivos bancarios
 * - NO contiene márgenes financieros de intermediación
 * - Solo proyecta crm_activities donde isInternalOnly = false
 * - Utiliza lista blanca explícita de campos a nivel de repositorio y tipado
 */

import prisma from "@/lib/prisma";

export interface CustomerBankCaseDTO {
  bankId: string;
  bankName: string;
  customerVisibleStage: string;
  publicDescription: string;
  actionRequiredByClient: string | null;
  lastUpdated: string;
}

export interface CustomerPublicTimelineDTO {
  date: string;
  title: string;
  message: string;
}

export interface CustomerApplicationDTO {
  fileNumber: string;
  statusDisplayName: string;
  productCategory: string;
  requestedAmount: number;
  termMonths: number;
  bankAlternatives: CustomerBankCaseDTO[];
  timeline: CustomerPublicTimelineDTO[];
  createdAt: string;
  lastUpdate: string;
}

export class CustomerProjectionService {
  /**
   * Construye una proyección segura de expediente garantizando aislamiento de datos privados
   */
  static async getCustomerSafeProjection(params: {
    applicationId: string;
    clientClerkUserId?: string;
  }): Promise<CustomerApplicationDTO | null> {
    const { applicationId, clientClerkUserId } = params;

    // Consulta con lista blanca explícita (Allowlist)
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        fileNumber: true,
        status: true,
        productCategory: true,
        requestedAmount: true,
        termMonths: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            clerkUserId: true,
          },
        },
        bankApplications: {
          where: {
            customerVisible: true,
          },
          select: {
            bankId: true,
            customerVisibleStage: true,
            updatedAt: true,
          },
        },
        // EXCLUSIÓN ESTRICTA: Solo actividades públicas autorizadas
        activities: {
          where: {
            isInternalOnly: false,
          },
          select: {
            title: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!app) return null;

    // Verificación de pertenencia si se pasa el ID de Clerk del cliente
    if (clientClerkUserId && app.client.clerkUserId && app.client.clerkUserId !== clientClerkUserId) {
      return null;
    }

    const bankAlternatives: CustomerBankCaseDTO[] = app.bankApplications.map((b) => ({
      bankId: b.bankId,
      bankName: b.bankId.replace(/-/g, " ").toUpperCase(),
      customerVisibleStage: b.customerVisibleStage,
      publicDescription: `Trámite en curso ante ${b.bankId.toUpperCase()}`,
      actionRequiredByClient: null,
      lastUpdated: b.updatedAt.toISOString(),
    }));

    const timeline: CustomerPublicTimelineDTO[] = app.activities.map((a) => ({
      date: a.createdAt.toISOString(),
      title: a.title,
      message: a.description,
    }));

    return {
      fileNumber: app.fileNumber,
      statusDisplayName: app.status.replace(/_/g, " "),
      productCategory: app.productCategory,
      requestedAmount: app.requestedAmount,
      termMonths: app.termMonths,
      bankAlternatives,
      timeline,
      createdAt: app.createdAt.toISOString(),
      lastUpdate: app.updatedAt.toISOString(),
    };
  }
}
