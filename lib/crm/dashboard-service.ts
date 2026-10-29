import prisma from "../prisma";
import { UserRole, ApplicationStatus, Prisma } from "../../prisma/generated/client";

export interface DashboardMetrics {
  totalApplications: number;
  activeApplications: number;
  newLeads: number;
  inBankStudy: number;
  approvedOrDisbursed: number;
  followUpOverdueOrToday: number;
  statusDistribution: Array<{
    status: ApplicationStatus;
    count: number;
    label: string;
  }>;
  advisorWorkload: Array<{
    advisorId: string;
    advisorName: string;
    email: string;
    count: number;
  }>;
  recentApplications: Array<{
    id: string;
    fileNumber: string;
    clientName: string;
    documentNumber: string;
    requestedAmount: number;
    status: ApplicationStatus;
    primaryBank: string;
    advisorName: string;
    nextActionDate: Date | null;
    updatedAt: Date;
  }>;
}

export class DashboardService {
  /**
   * Construye el filtro Where basado en RBAC/ABAC para garantizar aislamiento de datos
   */
  static buildScopeFilter(role: UserRole, userId?: string, teamIds?: string[]): Prisma.CrmCreditApplicationWhereInput {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.COMMERCIAL_DIRECTOR || role === UserRole.AUDITOR) {
      return {};
    }

    if (role === UserRole.SUPERVISOR) {
      if (teamIds && teamIds.length > 0) {
        return {
          OR: [
            { teamId: { in: teamIds } },
            { assignedAdvisorId: userId },
          ],
        };
      }
      return { assignedAdvisorId: userId };
    }

    if (role === UserRole.COMMERCIAL_ADVISOR || role === UserRole.DOCUMENT_ANALYST || role === UserRole.OPERATIONS_OFFICER) {
      return { assignedAdvisorId: userId };
    }

    // Por defecto (e.g. CLIENT o no autenticado): denegado / vacío
    return { id: "00000000-0000-0000-0000-000000000000" };
  }

  /**
   * Obtiene agregaciones reales de PostgreSQL para el panel operativo
   */
  static async getDashboardMetrics(role: UserRole, userId?: string, teamIds?: string[]): Promise<DashboardMetrics> {
    const scopeWhere = this.buildScopeFilter(role, userId, teamIds);

    const now = new Date();

    // 1. Conteo total y activos
    const [
      totalApplications,
      activeApplications,
      newLeads,
      inBankStudy,
      approvedOrDisbursed,
      followUpOverdueOrToday,
      rawStatusGroups,
      recentApps,
    ] = await Promise.all([
      // Total visible
      prisma.crmCreditApplication.count({ where: scopeWhere }),

      // Activos (excluyendo cerrados/desembolsados/rechazados/cancelados)
      prisma.crmCreditApplication.count({
        where: {
          ...scopeWhere,
          status: {
            notIn: [
              ApplicationStatus.DISBURSED,
              ApplicationStatus.REJECTED,
              ApplicationStatus.CANCELLED_BY_CLIENT,
            ],
          },
        },
      }),

      // Nuevos Leads
      prisma.crmCreditApplication.count({
        where: {
          ...scopeWhere,
          status: {
            in: [ApplicationStatus.LEAD_CAPTURED, ApplicationStatus.PROFILING],
          },
        },
      }),

      // En Estudio Bancario
      prisma.crmCreditApplication.count({
        where: {
          ...scopeWhere,
          status: {
            in: [
              ApplicationStatus.SUBMITTED_TO_BANKS,
              ApplicationStatus.BANK_STUDY,
              ApplicationStatus.PARTIALLY_APPROVED,
            ],
          },
        },
      }),

      // Aprobados / Desembolsados
      prisma.crmCreditApplication.count({
        where: {
          ...scopeWhere,
          status: {
            in: [ApplicationStatus.LEGALLY_FORMALIZED, ApplicationStatus.DISBURSED],
          },
        },
      }),

      // Casos que requieren seguimiento (vencidos o para hoy)
      prisma.crmCreditApplication.count({
        where: {
          ...scopeWhere,
          nextActionDate: {
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Hoy o vencido
          },
          status: {
            notIn: [
              ApplicationStatus.DISBURSED,
              ApplicationStatus.REJECTED,
              ApplicationStatus.CANCELLED_BY_CLIENT,
            ],
          },
        },
      }),

      // Distribución por estado
      prisma.crmCreditApplication.groupBy({
        by: ["status"],
        where: scopeWhere,
        _count: { status: true },
      }),

      // Expedientes recientes
      prisma.crmCreditApplication.findMany({
        where: scopeWhere,
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          client: true,
          assignedAdvisor: true,
          bankApplications: {
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
      }),
    ]);

    // Mapeo amigable de estados
    const statusLabels: Record<ApplicationStatus, string> = {
      LEAD_CAPTURED: "Lead Capturado",
      PROFILING: "En Perfilamiento",
      FINANCIALLY_PREQUALIFIED: "Precalificado",
      DOCUMENTATION_IN_PROGRESS: "Integración Documental",
      FILE_COMPLETE: "Expediente Completo",
      SUBMITTED_TO_BANKS: "Radicado en Bancos",
      BANK_STUDY: "En Estudio de Riesgo",
      PARTIALLY_APPROVED: "Aprobado Parcial",
      LEGALLY_FORMALIZED: "Formalizado / Legalización",
      DISBURSED: "Desembolsado",
      REJECTED: "Rechazado",
      CANCELLED_BY_CLIENT: "Cancelado por Cliente",
    };

    const statusDistribution = rawStatusGroups.map((g) => ({
      status: g.status,
      count: g._count.status,
      label: statusLabels[g.status] || g.status,
    }));

    // Carga de trabajo por asesor (para supervisores y directores)
    let advisorWorkload: Array<{ advisorId: string; advisorName: string; email: string; count: number }> = [];

    if (role === UserRole.SUPER_ADMIN || role === UserRole.COMMERCIAL_DIRECTOR || role === UserRole.SUPERVISOR) {
      const workloadRaw = await prisma.crmCreditApplication.groupBy({
        by: ["assignedAdvisorId"],
        where: {
          ...scopeWhere,
          assignedAdvisorId: { not: null },
        },
        _count: { id: true },
      });

      const advisorIds = workloadRaw.map((w) => w.assignedAdvisorId!).filter(Boolean);
      const advisors = await prisma.appUser.findMany({
        where: { id: { in: advisorIds } },
      });

      const advisorMap = new Map(advisors.map((a) => [a.id, a]));

      advisorWorkload = workloadRaw.map((w) => {
        const adv = advisorMap.get(w.assignedAdvisorId!);
        return {
          advisorId: w.assignedAdvisorId!,
          advisorName: adv ? `${adv.firstName} ${adv.lastName}` : "Sin Asignar",
          email: adv?.email || "",
          count: w._count.id,
        };
      });
    }

    const recentApplications = recentApps.map((a) => ({
      id: a.id,
      fileNumber: a.fileNumber,
      clientName: `${a.client.firstName} ${a.client.firstLastName}`,
      documentNumber: a.client.documentNumber,
      requestedAmount: a.requestedAmount,
      status: a.status,
      primaryBank: a.bankApplications[0]?.bankId?.toUpperCase() || "SIN RADICAR",
      advisorName: a.assignedAdvisor ? `${a.assignedAdvisor.firstName} ${a.assignedAdvisor.lastName}` : "Por Asignar",
      nextActionDate: a.nextActionDate,
      updatedAt: a.updatedAt,
    }));

    return {
      totalApplications,
      activeApplications,
      newLeads,
      inBankStudy,
      approvedOrDisbursed,
      followUpOverdueOrToday,
      statusDistribution,
      advisorWorkload,
      recentApplications,
    };
  }
}
