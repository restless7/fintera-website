import { NextRequest, NextResponse } from "next/server";
import { resolvePortalClerkUserId } from "@/lib/auth/portal-auth-helper";
import { CustomerPortalService } from "@/lib/portal/customer-portal-service";
import { CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const { id: applicationId } = await params;
    if (!applicationId) {
      return NextResponse.json({ error: "Identificador de solicitud requerido." }, { status: 400 });
    }

    const application = await CustomerPortalService.getCustomerApplicationDetail(clerkUserId, applicationId);

    return NextResponse.json(application);
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/applications/[id]] Error:", err);
    return NextResponse.json({ error: "Error consultando el detalle de la solicitud." }, { status: 500 });
  }
}
