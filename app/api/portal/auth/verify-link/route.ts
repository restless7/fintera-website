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
    const { challengeId, otpCode } = body;

    if (!challengeId || !otpCode) {
      return NextResponse.json(
        { error: "Identificador de desafío y código de verificación son requeridos." },
        { status: 400 }
      );
    }

    const result = await CustomerIdentityService.verifyAccountLink({
      clerkUserId,
      challengeId,
      otpCode: String(otpCode).trim(),
    });

    return NextResponse.json({
      success: true,
      clientId: result.clientId,
      message: "Expediente cliente vinculado exitosamente.",
    });
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/auth/verify-link] Error:", err);
    return NextResponse.json({ error: "Error validando código de vinculación." }, { status: 500 });
  }
}
