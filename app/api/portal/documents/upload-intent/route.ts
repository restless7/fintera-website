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
    const { applicationId, requirementId, fileName, mimeType, fileSize } = body;

    if (!applicationId || !requirementId || !fileName || !mimeType) {
      return NextResponse.json(
        { error: "Parámetros incompletos para crear intención de carga." },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await CustomerDocumentService.createCustomerUploadIntent({
      clerkUserId,
      applicationId,
      requirementId,
      fileName,
      mimeType,
      fileSize: Number(fileSize) || 1024,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      intentId: result.intentId,
      uploadUrl: result.uploadUrl,
      expiresAt: result.expiresAt,
    }, { status: 201 });
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/documents/upload-intent] Error:", err);
    return NextResponse.json({ error: "Error creando autorización de carga." }, { status: 500 });
  }
}
