import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import { DashboardService } from "@/lib/crm/dashboard-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authorization = await authorizeAdminApi("crm:application:read");
    if (authorization.response) return authorization.response;
    const { role: effectiveRole, userId: effectiveUserId, teamIds } = authorization.context;

    // 3. Obtener métricas agregadas desde PostgreSQL
    const metrics = await DashboardService.getDashboardMetrics(
      effectiveRole as any,
      effectiveUserId || undefined,
      teamIds
    );

    return NextResponse.json({
      success: true,
      role: effectiveRole,
      metrics,
    });
  } catch (error: any) {
    console.error("[CRM Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Error al calcular métricas del CRM", detail: error.message },
      { status: 500 }
    );
  }
}
