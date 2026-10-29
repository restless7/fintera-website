import { NextRequest, NextResponse } from "next/server";
import { resolvePortalClerkUserId } from "@/lib/auth/portal-auth-helper";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
import { CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json({ error: "Parámetro applicationId requerido." }, { status: 400 });
    }

    const requirements = await CustomerDocumentService.getCustomerRequirements(clerkUserId, applicationId);

    return NextResponse.json({ requirements });
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/documents/requirements] Error:", err);
    return NextResponse.json({ error: "Error consultando requisitos documentales." }, { status: 500 });
  }
}
