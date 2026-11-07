/**
 * FINTERA ENTERPRISE CRM — FASE 2: MAGIC TRACKING TOKEN (HMAC-SHA256 + HttpOnly Cookie)
 * Permite que un cliente que acaba de radicar su solicitud en /credit-request o /credits/apply
 * ingrese directamente a su Portal de Cliente (/portal y /portal/documentos) mediante un token
 * criptográfico firmado HMAC-SHA256 de alcance restringido (applicationId + clientId),
 * manteniendo defensa estricta contra BOLA / IDOR (OWASP API1:2023).
 */

import crypto from "crypto";
import type { NextRequest } from "next/server";

export const MAGIC_TRACK_COOKIE_NAME = "fintera_track_token";

export interface MagicTrackingTokenPayload {
  v: 1;
  applicationId: string;
  clientId: string;
  fileNumber: string;
  iat: number;
  exp: number;
}

function getSigningSecret(): string {
  return (
    process.env.CUSTOMER_LINK_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "fintera_magic_tracking_hmac_secret_2026_enterprise"
  );
}

export function signMagicTrackingToken(params: {
  applicationId: string;
  clientId: string;
  fileNumber: string;
  ttlSeconds?: number;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const ttl = params.ttlSeconds ?? 7 * 24 * 60 * 60; // 7 días por defecto
  const payload: MagicTrackingTokenPayload = {
    v: 1,
    applicationId: params.applicationId,
    clientId: params.clientId,
    fileNumber: params.fileNumber,
    iat: now,
    exp: now + ttl,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signatureB64 = crypto
    .createHmac("sha256", getSigningSecret())
    .update(`fintera_track_v1.${payloadB64}`)
    .digest("base64url");

  return `fintera_track_v1.${payloadB64}.${signatureB64}`;
}

export function verifyMagicTrackingToken(token?: string | null): MagicTrackingTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "fintera_track_v1") {
    return null;
  }

  const [, payloadB64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(`fintera_track_v1.${payloadB64}`)
    .digest("base64url");

  const bufA = Buffer.from(providedSig);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as MagicTrackingTokenPayload;

    if (
      decoded.v !== 1 ||
      !decoded.applicationId ||
      !decoded.clientId ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > decoded.exp) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function extractMagicTrackingTokenFromRequest(
  req: NextRequest
): MagicTrackingTokenPayload | null {
  const fromQuery = req.nextUrl?.searchParams?.get("trackToken");
  if (fromQuery) {
    const verified = verifyMagicTrackingToken(fromQuery);
    if (verified) return verified;
  }

  const fromHeader = req.headers.get("x-fintera-track-token");
  if (fromHeader) {
    const verified = verifyMagicTrackingToken(fromHeader);
    if (verified) return verified;
  }

  const fromCookie = req.cookies.get(MAGIC_TRACK_COOKIE_NAME)?.value;
  if (fromCookie) {
    const verified = verifyMagicTrackingToken(fromCookie);
    if (verified) return verified;
  }

  return null;
}

export function encodeMagicActorId(payload: MagicTrackingTokenPayload): string {
  return `magic_token:${payload.clientId}:${payload.applicationId}`;
}

export function parseMagicActorId(
  actorId: string
): { clientId: string; applicationId: string } | null {
  if (!actorId || !actorId.startsWith("magic_token:")) return null;
  const parts = actorId.split(":");
  if (parts.length !== 3 || !parts[1] || !parts[2]) return null;
  return {
    clientId: parts[1],
    applicationId: parts[2],
  };
}
