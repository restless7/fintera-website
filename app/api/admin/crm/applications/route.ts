import { NextRequest, NextResponse } from "next/server";
import { adminJson, authorizeAdminApi } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { DashboardService } from "@/lib/crm/dashboard-service";
import { ApplicationService } from "@/lib/crm/application-service";
import { ApplicationStatus, Prisma } from "@/prisma/generated/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authorization = await authorizeAdminApi("crm:application:read");
    if (authorization.response) return authorization.response;
    const { role: effectiveRole, userId: effectiveUserId, teamIds } = authorization.context;

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const search = url.searchParams.get("search")?.trim();
    const statusParam = url.searchParams.get("status") as ApplicationStatus | null;
    const bankParam = url.searchParams.get("bankId")?.trim();
    const advisorParam = url.searchParams.get("advisorId")?.trim();
    const scopeParam = url.searchParams.get("scope"); // "my_cases", "team_cases", "all"

    // Base ABAC filter
    let whereFilter: Prisma.CrmCreditApplicationWhereInput = DashboardService.buildScopeFilter(
      effectiveRole as any,
      effectiveUserId || undefined,
      teamIds
    );

    // Si el usuario pide explícitamente "mis casos"
    if (scopeParam === "my_cases" && effectiveUserId) {
      whereFilter = {
        ...whereFilter,
        assignedAdvisorId: effectiveUserId,
      };
    }

    // Filtros adicionales
    if (statusParam && Object.values(ApplicationStatus).includes(statusParam)) {
      whereFilter = { ...whereFilter, status: statusParam };
    }

    if (advisorParam) {
      whereFilter = { AND: [whereFilter, { assignedAdvisorId: advisorParam }] };
    }

    if (bankParam) {
      whereFilter = {
        ...whereFilter,
        bankApplications: {
          some: { bankId: bankParam },
        },
      };
    }

    if (search) {
      whereFilter = {
        AND: [whereFilter, { OR: [
          { fileNumber: { contains: search, mode: "insensitive" } },
          { client: { firstName: { contains: search, mode: "insensitive" } } },
          { client: { firstLastName: { contains: search, mode: "insensitive" } } },
          { client: { documentNumber: { contains: search, mode: "insensitive" } } },
          { client: { email: { contains: search, mode: "insensitive" } } },
        ] }],
      };
    }

    const [total, applications] = await Promise.all([
      prisma.crmCreditApplication.count({ where: whereFilter }),
      prisma.crmCreditApplication.findMany({
        where: whereFilter,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          client: true,
          assignedAdvisor: true,
          team: true,
          bankApplications: {
            take: 3,
            orderBy: { createdAt: "asc" },
          },
          simulationSnapshot: {
            select: {
              simulatedBankId: true,
              rateEA: true,
              initialMonthlyTotalPayment: true,
            },
          },
        },
      }),
    ]);

    return adminJson({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      applications,
    });
  } catch (error: any) {
    console.error("[CRM Applications List API] Error:", error);
    return NextResponse.json(
      { error: "Error al consultar expedientes", detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorization = await authorizeAdminApi("crm:application:create");
    if (authorization.response) return authorization.response;
    const body = await req.json();

    // Ingesta manual desde el CRM por un asesor comercial
    const intakeResult = await ApplicationService.intakeCreditRequest({
      documentType: body.documentType || "CC",
      documentNumber: body.documentNumber,
      firstName: body.firstName,
      secondName: body.secondName,
      firstLastName: body.firstLastName,
      secondLastName: body.secondLastName,
      email: body.email,
      phone: body.phone,
      residenceCity: body.residenceCity || "Bogotá D.C.",
      monthlyIncome: Number(body.monthlyIncome) || 5000000,
      monthlyExpenses: Number(body.monthlyExpenses) || 2000000,
      existingFinancialObligations: Number(body.existingObligations) || 0,
      occupation: body.occupation || "asalariado",
      companyName: body.companyName,
      requestedAmount: Number(body.requestedAmount) || 200000000,
      termMonths: Number(body.termMonths) || 240,
      productCategory: body.productCategory || "VIVIENDA_NO_VIS",
      simulatedBankId: body.simulatedBankId || "bancolombia",
      simulatedProductType: body.simulatedProductType || "hipotecario-novis",
      simulatedRateEA: Number(body.simulatedRateEA) || 0.118,
      simulatedMonthlyPayment: Number(body.simulatedMonthlyPayment),
      coApplicants: body.coApplicants,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "CRM Internal Portal",
      consentHabeasData: true,
    });

    return NextResponse.json({
      success: true,
      applicationId: intakeResult.applicationId,
      fileNumber: intakeResult.fileNumber,
      message: intakeResult.message,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[CRM Application Create API] Error:", error);
    return NextResponse.json(
      { error: "Error al crear expediente en CRM", detail: error.message },
      { status: 500 }
    );
  }
}
