/** Observations from canonical events. No approved-amount proxy or illustrative time/SLA values. */
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import { DashboardService } from "@/lib/crm/dashboard-service";
import type { AuthContext } from "@/lib/auth/types";
export interface FunnelSummary {
  leadsCaptured: number;
  prequalified: number;
  docsSubmitted: number;
  bankSubmissions: number;
  submittedCases: number;
  conditionalApprovals: number;
  definitiveApprovals: number;
  definitivelyApprovedCases: number;
  disbursedCount: number;
  disbursedAmountCOP: string;
  overallConversionRate: number | null;
  canonicalCases: number;
  bankCases: number;
  fundedBankCases: number;
  observedFundingCount: number;
  timeSampleCount: number;
  avgTurnaroundDays: number | null;
}
export interface BankPerformanceItem {
  bankId: string;
  totalCases: number;
  approvedCases: number;
  rejectedCases: number;
  approvalRate: number | null;
  avgTimeToApprovalDays: number | null;
  avgTimeToDisbursementDays: number | null;
  slaComplianceRate: number | null;
  approvalTimeSampleCount: number;
  fundingTimeSampleCount: number;
  slaSampleCount: number;
}
export interface AdvisorWorkloadItem {
  advisorUserId: string;
  advisorName: string;
  activeApplications: number;
  overdueTasks: number;
  messagesPending: number;
  conversionRate: number | null;
  conversionDenominator: number;
}
export class BiAggregationService {
  /** Maintained entry points for the scheduler. Reads never certify historical materialized rows. */
  static async refreshDailyFunnelMetrics(
    _date: Date = new Date(),
  ): Promise<void> {
    await this.getExecutiveOverview();
  }
  static async refreshBankPerformanceMetrics(
    _monthPeriod?: string,
  ): Promise<void> {
    await this.getExecutiveOverview();
  }
  static async refreshAdvisorWorkloadMetrics(): Promise<void> {
    await this.getExecutiveOverview();
  }
  static async getExecutiveOverview(context?: AuthContext) {
    const scope = context
      ? DashboardService.buildScopeFilter(
          context.role,
          context.userId,
          context.teamIds,
        )
      : {};
    const apps = await prisma.crmCreditApplication.findMany({
      where: scope,
      select: {
        id: true,
        createdAt: true,
        status: true,
        assignedAdvisorId: true,
        assignedAdvisor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    const allowedIds = apps.map((a) => a.id);
    const alerts = await prisma.slaAutomationTask.count({
      where: { status: "OPEN", applicationId: { in: allowedIds } },
    });
    // Query explicit recorded funding; its immutable corrections supersede observations, never collections.
    const disbursements = await prisma.commercialDisbursement.findMany({
      where: { application: scope },
    });
    const replaced = new Set(disbursements.map((d) => d.supersedesId));
    const current = disbursements.filter((d) => !replaced.has(d.id));
    const banks = await prisma.bankApplication.findMany({
      where: { application: scope },
      include: {
        transitions: { orderBy: { transitionedAt: "asc" } },
        application: { select: { createdAt: true, assignedAdvisorId: true } },
      },
    });
    const reached = (stages: string[]) =>
      banks.filter((b) =>
        b.transitions.some((t) => stages.includes(t.toStage)),
      );
    const submitted = reached(["STAGE_04_BANK_SUBMITTED"]);
    const approved = reached(["STAGE_07_DEFINITIVE_APPROVAL"]);
    const interval = (
      start: Date | undefined,
      end: Date | undefined,
    ): number | null =>
      start && end && end >= start
        ? (end.getTime() - start.getTime()) / 86400000
        : null;
    const mean = (values: (number | null)[]) => {
      const v = values.filter((x): x is number => x !== null);
      return v.length ? v.reduce((s, n) => s + n, 0) / v.length : null;
    };
    const fundingIntervals = current.map((d) =>
      interval(
        apps.find((a) => a.id === d.applicationId)?.createdAt,
        d.occurredAt,
      ),
    );
    const fundedCases = new Set(current.map((d) => d.applicationId));
    const funnel: FunnelSummary = {
      leadsCaptured: apps.length,
      canonicalCases: apps.length,
      bankCases: banks.length,
      prequalified: apps.filter(
        (a) =>
          ![
            "LEAD_CAPTURED",
            "PROFILING",
            "REJECTED",
            "CANCELLED_BY_CLIENT",
          ].includes(a.status),
      ).length,
      docsSubmitted: apps.filter((a) =>
        [
          "FILE_COMPLETE",
          "SUBMITTED_TO_BANKS",
          "BANK_STUDY",
          "PARTIALLY_APPROVED",
          "LEGALLY_FORMALIZED",
          "DISBURSED",
        ].includes(a.status),
      ).length,
      bankSubmissions: submitted.length,
      submittedCases: new Set(submitted.map((b) => b.applicationId)).size,
      conditionalApprovals: reached(["STAGE_06_CONDITIONAL_APPROVAL"]).length,
      definitiveApprovals: approved.length,
      definitivelyApprovedCases: new Set(approved.map((b) => b.applicationId)).size,
      disbursedCount: fundedCases.size,
      fundedBankCases: new Set(current.map((d) => d.bankApplicationId)).size,
      observedFundingCount: current.length,
      disbursedAmountCOP: current
        .reduce((s, d) => s.add(d.amountCOP), new Prisma.Decimal(0))
        .toFixed(2),
      overallConversionRate: apps.length
        ? (fundedCases.size / apps.length) * 100
        : null,
      timeSampleCount: fundingIntervals.filter((n) => n !== null).length,
      avgTurnaroundDays: mean(fundingIntervals),
    };
    const bankPerformance: BankPerformanceItem[] = Array.from(
      new Set(banks.map((b) => b.bankId)),
    ).map((bankId) => {
      const group = banks.filter((b) => b.bankId === bankId),
        approvedGroup = group.filter((b) =>
          b.transitions.some(
            (t) => t.toStage === "STAGE_07_DEFINITIVE_APPROVAL",
          ),
        );
      const approvalTimes = approvedGroup.map((b) =>
        interval(
          b.transitions.find((t) => t.toStage === "STAGE_04_BANK_SUBMITTED")
            ?.transitionedAt,
          b.transitions.find(
            (t) => t.toStage === "STAGE_07_DEFINITIVE_APPROVAL",
          )?.transitionedAt,
        ),
      );
      const fundingTimes = current
        .filter((d) => group.some((b) => b.id === d.bankApplicationId))
        .map((d) =>
          interval(
            group
              .find((b) => b.id === d.bankApplicationId)
              ?.transitions.find((t) => t.toStage === "STAGE_04_BANK_SUBMITTED")
              ?.transitionedAt,
            d.occurredAt,
          ),
        );
      // Historical events have no deadline snapshots; only actual new snapshots enter the denominator.
      return {
        bankId,
        totalCases: group.length,
        approvedCases: approvedGroup.length,
        rejectedCases: group.filter((b) =>
          b.transitions.some((t) => t.toStage === "STAGE_BANK_REJECTED"),
        ).length,
        approvalRate: group.length
          ? (approvedGroup.length / group.length) * 100
          : null,
        avgTimeToApprovalDays: mean(approvalTimes),
        avgTimeToDisbursementDays: mean(fundingTimes),
        slaComplianceRate: (() => {
          const v = group
            .flatMap((b) => b.transitions)
            .filter(
              (t) => t.resolvedSlaDeadline && t.resolvedWithinSla !== null,
            );
          return v.length
            ? (v.filter((t) => t.resolvedWithinSla).length / v.length) * 100
            : null;
        })(),
        approvalTimeSampleCount: approvalTimes.filter((n) => n !== null).length,
        fundingTimeSampleCount: fundingTimes.filter((n) => n !== null).length,
        slaSampleCount: group
          .flatMap((b) => b.transitions)
          .filter((t) => t.resolvedSlaDeadline && t.resolvedWithinSla !== null)
          .length,
      };
    });
    const advisorIds = Array.from(
      new Set(
        apps.map((a) => a.assignedAdvisorId).filter((x): x is string => !!x),
      ),
    );
    const advisorWorkload: AdvisorWorkloadItem[] = await Promise.all(
      advisorIds.map(async (id) => {
        const own = apps.filter((a) => a.assignedAdvisorId === id),
          name = own[0]?.assignedAdvisor;
        const [overdueTasks, messagesPending] = await Promise.all([
          prisma.slaAutomationTask.count({
            where: {
              assignedUserId: id,
              status: "OPEN",
              applicationId: { in: allowedIds },
            },
          }),
          prisma.customerMessage.count({
            where: {
              application: { AND: [scope, { assignedAdvisorId: id }] },
              senderType: "CUSTOMER",
              isRead: false,
            },
          }),
        ]);
        return {
          advisorUserId: id,
          advisorName: name
            ? `${name.firstName} ${name.lastName}`
            : "Responsable",
          activeApplications: own.filter(
            (a) =>
              !["DISBURSED", "REJECTED", "CANCELLED_BY_CLIENT"].includes(
                a.status,
              ),
          ).length,
          overdueTasks,
          messagesPending,
          conversionRate: own.length
            ? (own.filter((a) => fundedCases.has(a.id)).length / own.length) *
              100
            : null,
          conversionDenominator: own.length,
        };
      }),
    );
    return {
      funnel,
      bankPerformance,
      advisorWorkload,
      activeSlaAlertsCount: alerts,
      lastRefreshedAt: new Date().toISOString(),
      measurementBasis: "CANONICAL_RECORDED_EVENTS",
      limitations: [
        "Los tiempos incluyen sólo pares de eventos válidos; los desconocidos son null.",
        "El cumplimiento SLA histórico carece de un snapshot del plazo efectivo por resolución.",
        "Desembolsado exige importe y fecha acreditados; monto aprobado no es dinero girado.",
      ],
    };
  }
}
