import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  MAGIC_TRACK_COOKIE_NAME,
  signMagicTrackingToken,
  verifyMagicTrackingToken,
} from "@/lib/auth/magic-tracking-token";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trackToken, documentType, documentNumber, fileNumberOrEmail } = body || {};

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

    // Modo 2: Consulta verificada por Documento + Radicado (FNT-YYYY-XXXXX) o Correo Registrado
    if (documentNumber && fileNumberOrEmail) {
      const docType = String(documentType || "CC").trim().toUpperCase();
      const docNum = String(documentNumber).trim();
      const verifier = String(fileNumberOrEmail).trim();

      const client = await prisma.client.findUnique({
        where: {
          documentType_documentNumber: {
            documentType: docType,
            documentNumber: docNum,
          },
        },
        include: {
          applications: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!client || client.applications.length === 0) {
        return NextResponse.json(
          {
            error:
              "No encontramos un expediente activo que coincida con los datos suministrados. Verifique su documento y número de radicado o correo.",
          },
          { status: 404 }
        );
      }

      const matchedApp = client.applications.find(
        (app) =>
          app.fileNumber.toUpperCase() === verifier.toUpperCase() ||
          client.email.toLowerCase() === verifier.toLowerCase()
      );

      if (!matchedApp) {
        return NextResponse.json(
          {
            error:
              "Los datos de verificación (Radicado o Correo) no coinciden con el titular del documento.",
          },
          { status: 403 }
        );
      }

      const issuedToken = signMagicTrackingToken({
        applicationId: matchedApp.id,
        clientId: client.id,
        fileNumber: matchedApp.fileNumber,
      });

      const res = NextResponse.json({
        success: true,
        applicationId: matchedApp.id,
        fileNumber: matchedApp.fileNumber,
        trackToken: issuedToken,
      });

      res.cookies.set(MAGIC_TRACK_COOKIE_NAME, issuedToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    return NextResponse.json(
      { error: "Parámetros de autenticación de seguimiento incompletos." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API portal/auth/magic-session] Error:", err);
    return NextResponse.json(
      { error: "Error procesando la sesión de seguimiento." },
      { status: 500 }
    );
  }
}
