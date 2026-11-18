/**
 * FINTERA ENTERPRISE CRM — FASE 6.5 / 7.0: GATE F / G
 * Helper Canónico de Autenticación para Endpoints del Portal del Cliente
 *
 * SEGURIDAD ESTRICTA (OWASP API Security):
 * La resolución de identidad de cliente se realiza exclusivamente mediante:
 *  1) Sesión criptográficamente firmada de Clerk Server SDK (auth()), o
 *  2) Token de Seguimiento Mágico firmado con HMAC-SHA256 (fintera_track_token) emitido al radicar.
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  extractMagicTrackingTokenFromRequest,
  encodeMagicActorId,
} from "./magic-tracking-token";

export async function resolvePortalClerkUserId(req: NextRequest): Promise<string | null> {
  const magicPayload = extractMagicTrackingTokenFromRequest(req);

  try {
    const session = await auth();
    if (session && session.userId) {
      return session.userId;
    }
  } catch {
    return null; // SDK failure never downgrades identity to a bearer.
  }

  if (magicPayload) {
    return encodeMagicActorId(magicPayload);
  }

  return null;
}
