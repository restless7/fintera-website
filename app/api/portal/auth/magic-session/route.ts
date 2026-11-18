import { NextRequest, NextResponse } from "next/server";
import {
  MAGIC_TRACK_COOKIE_NAME,
  verifyMagicTrackingToken,
} from "@/lib/auth/magic-tracking-token";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin || req.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
    const body = await req.json();
    const { trackToken } = body || {};

    // Modo 1: Intercambio directo de trackToken firmado (Handoff desde /credit-request o /credits/apply)
    if (trackToken && typeof trackToken === "string") {
      const payload = verifyMagicTrackingToken(trackToken);
      if (!payload) {
        return NextResponse.json(
          { error: "Token de seguimiento inválido o expirado." },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        success: true,
        applicationId: payload.applicationId,
        fileNumber: payload.fileNumber,
      });

      res.cookies.set(MAGIC_TRACK_COOKIE_NAME, trackToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    return NextResponse.json(
      { error: "Inicie sesión y confirme su correo verificado para vincular el expediente.", code: "VERIFIED_IDENTITY_REQUIRED" },
      { status: 403 }
    );
  } catch {
    return NextResponse.json({ error: "No fue posible verificar el acceso." }, { status: 400 });
  }
}
