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
import prisma from "@/lib/prisma";
import {
  extractMagicTrackingTokenFromRequest,
  encodeMagicActorId,
} from "./magic-tracking-token";

export async function resolvePortalClerkUserId(req: NextRequest): Promise<string | null> {
  const magicPayload = extractMagicTrackingTokenFromRequest(req);

  try {
    const session = await auth();
    if (session && session.userId) {
      // Si también trae un Magic Tracking Token válido y la cuenta Clerk aún no está vinculada,
      // usar el contexto verificado del Magic Token para no bloquear su experiencia post-radicación
      if (magicPayload) {
        const linked = await prisma.client.findFirst({
          where: { clerkUserId: session.userId },
          select: { id: true },
        });
        if (!linked) {
          return encodeMagicActorId(magicPayload);
        }
      }
      return session.userId;
    }
  } catch {
    // Sesión Clerk no disponible en este request; evaluar Magic Tracking Token firmado
  }

  if (magicPayload) {
    return encodeMagicActorId(magicPayload);
  }

  return null;
}
