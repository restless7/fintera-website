import { auth } from "@clerk/nextjs/server";
import { RbacService } from "@/lib/auth/rbac-service";
import { NextRequest, NextResponse } from "next/server";
import { BiAggregationService } from "@/lib/automation/bi/bi-aggregation-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const context = await RbacService.resolveAuthContext(userId);
    if (!context || context.role === "CLIENT" || !context.permissions.includes("crm:report:read")) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }
    const data = await BiAggregationService.getExecutiveOverview();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[API admin/crm/bi/overview] Error:", err);
    return NextResponse.json(
      { error: "Error consultando métricas de inteligencia comercial." },
      { status: 500 }
    );
  }
}
