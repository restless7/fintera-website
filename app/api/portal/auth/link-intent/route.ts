import { NextRequest, NextResponse } from "next/server";
import { resolvePortalClerkUserId } from "@/lib/auth/portal-auth-helper";
import { CustomerIdentityService, CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const body = await req.json();
    const { documentType, documentNumber, channel } = body;

    if (!documentType || !documentNumber) {
      return NextResponse.json(
        { error: "Tipo y número de documento son obligatorios." },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await CustomerIdentityService.initiateAccountLink({
      clerkUserId,
      documentType,
      documentNumber: String(documentNumber).trim(),
      channel,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      challengeId: result.challengeId,
      maskedDestination: result.maskedDestination,
      verificationChannel: result.verificationChannel,
      expiresAt: result.expiresAt,
      testOtpPreview: result.testOtpPreview,
    });
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/auth/link-intent] Error:", err);
    return NextResponse.json({ error: "Error procesando solicitud de vinculación." }, { status: 500 });
  }
}
