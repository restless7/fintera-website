import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { CustomerSecurityError } from "@/lib/auth/customer-identity-service";
import { ZodError } from "zod";
export async function requirePortalIdentity(req: NextRequest, mutation = false): Promise<string> {
  if (mutation) {
    const origin = req.headers.get("origin");
    if (!origin || origin !== req.nextUrl.origin || req.headers.get("sec-fetch-site") === "cross-site") throw new CustomerSecurityError("Origen no autorizado.", 403, "INVALID_ORIGIN");
  }
  const { userId } = await auth();
  if (!userId) throw new CustomerSecurityError("Inicie sesión para acceder a sus documentos.", 401, "SIGN_IN_REQUIRED");
  return userId;
}
export async function readPortalJson(req: NextRequest): Promise<unknown> {
  if (Number(req.headers.get("content-length") || 0) > 32768) throw new CustomerSecurityError("Solicitud demasiado grande.", 413, "PAYLOAD_TOO_LARGE");
  const reader = req.body?.getReader();
  if (!reader) throw new CustomerSecurityError("Solicitud incompleta.", 400, "INVALID_INPUT");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 32768) { await reader.cancel(); throw new CustomerSecurityError("Solicitud demasiado grande.", 413, "PAYLOAD_TOO_LARGE"); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new CustomerSecurityError("Solicitud inválida.", 400, "INVALID_INPUT"); }
}
export function portalApiError(error: unknown) {
  if (error instanceof CustomerSecurityError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  if (error instanceof ZodError) return NextResponse.json({ error: "Revise los datos enviados.", code: "INVALID_INPUT" }, { status: 400 });
  if ((error as { code?: string })?.code === "P2034") return NextResponse.json({ error: "La información cambió. Actualice antes de continuar.", code: "CONFLICT" }, { status: 409 });
  return NextResponse.json({ error: "No fue posible completar la operación. Consulte el estado antes de repetirla.", code: "UNAVAILABLE" }, { status: 503 });
}
