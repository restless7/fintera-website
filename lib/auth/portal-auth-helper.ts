/**
 * FINTERA ENTERPRISE CRM — FASE 6.5 / 7.0: GATE F / G
 * Helper Canónico de Autenticación para Endpoints del Portal del Cliente
 * 
 * SEGURIDAD ESTRICTA (OWASP API Security):
 * La resolución de identidad de cliente se realiza EXCLUSIVAMENTE mediante
 * la sesión criptográficamente firmada de Clerk Server SDK (auth()).
 * 
 * Se prohíbe tajantemente cualquier cabecera o bypass de suplantación en rutas HTTP.
 */

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function resolvePortalClerkUserId(req: NextRequest): Promise<string | null> {
  try {
    const session = await auth();
    if (session && session.userId) {
      return session.userId;
    }
  } catch (err) {
    // Sesión no autenticada o credencial ausente
  }

  return null;
}

