import { NextRequest, NextResponse } from "next/server";
import { resolvePortalClerkUserId } from "@/lib/auth/portal-auth-helper";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
import { CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const body = await req.json();
    const { intentId } = body;

    if (!intentId) {
      return NextResponse.json({ error: "Identificador de intención (intentId) requerido." }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const confirmation = await CustomerDocumentService.confirmCustomerUpload({
      clerkUserId,
      intentId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: confirmation.success,
      versionId: confirmation.version?.id || null,
      scanStatus: confirmation.scanStatus,
      message: confirmation.message,
    });
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/documents/confirm-upload] Error:", err);
    return NextResponse.json({ error: "Error procesando confirmación documental." }, { status: 500 });
  }
}
