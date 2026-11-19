import { NextRequest, NextResponse } from "next/server";
import { OnboardingError } from "@/lib/onboarding/service";
import { resolvePortalClerkUserId } from "@/lib/auth/portal-auth-helper";
import { CustomerPortalService } from "@/lib/portal/customer-portal-service";
import { CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const dashboard = await CustomerPortalService.getCustomerDashboard(clerkUserId);

    return NextResponse.json(dashboard, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (err: any) {
    if (err instanceof OnboardingError) return NextResponse.json({ error: err.message, code: err.code }, {status: err.status});
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/dashboard] Error:", err);
    return NextResponse.json({ error: "Error consultando el dashboard del cliente." }, { status: 500 });
  }
}
