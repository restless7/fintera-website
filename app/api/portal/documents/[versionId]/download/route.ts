import { NextRequest, NextResponse } from "next/server";
import { resolvePortalClerkUserId } from "@/lib/auth/portal-auth-helper";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
import { CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const { versionId } = await params;
    if (!versionId) {
      return NextResponse.json({ error: "Identificador de versión requerido." }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const downloadAuth = await CustomerDocumentService.getCustomerDownloadUrl({
      clerkUserId,
      versionId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(downloadAuth);
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/documents/[versionId]/download] Error:", err);
    return NextResponse.json({ error: "Error generando enlace de descarga seguro." }, { status: 500 });
  }
}
