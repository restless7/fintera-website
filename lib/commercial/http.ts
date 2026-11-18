import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { RbacService } from "@/lib/auth/rbac-service";
import { CommercialServiceError } from "./service";
export async function commercialActor() {
  const id = (await auth()).userId;
  if (!id) throw new CommercialServiceError("FORBIDDEN", "Inicie sesión.", 401);
  const actor = await RbacService.resolveAuthContext(id);
  if (!actor || actor.role === "CLIENT")
    throw new CommercialServiceError(
      "FORBIDDEN",
      "Acceso interno no disponible.",
      403,
    );
  return actor;
}
export async function boundedJson(req: NextRequest, max = 32768) {
  if (
    (req.headers.get("content-type") ?? "").split(";")[0] !== "application/json"
  )
    throw new CommercialServiceError("INVALID_INPUT", "Se requiere JSON.", 415);
  const reader = req.body?.getReader();
  if (!reader)
    throw new CommercialServiceError("INVALID_INPUT", "Solicitud vacía.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      length += r.value.byteLength;
      if (length > max) {
        await reader.cancel();
        throw new CommercialServiceError(
          "INVALID_INPUT",
          "Solicitud demasiado grande.",
          413,
        );
      }
      chunks.push(r.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new CommercialServiceError("INVALID_INPUT", "JSON inválido.");
  }
}
export function verifyCommercialOrigin(req: NextRequest) {
  let same = false;
  try {
    same =
      new URL(req.headers.get("origin") ?? "").origin ===
      new URL(req.url).origin;
  } catch {}
  if (
    !same ||
    ![null, "same-origin"].includes(req.headers.get("sec-fetch-site"))
  )
    throw new CommercialServiceError("FORBIDDEN", "Origen no permitido.", 403);
}
export function commercialError(error: unknown) {
  if (error instanceof CommercialServiceError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  const code = (error as { code?: string })?.code;
  if (code === "P2034")
    return NextResponse.json(
      {
        error: "El registro cambió. Actualice y revise antes de reintentar.",
        code: "STALE_REVISION",
      },
      { status: 409 },
    );
  if (code === "P2002")
    return NextResponse.json(
      {
        error:
          "Esta operación ya tiene un registro. Actualice para reconciliar el resultado.",
        code: "IDEMPOTENCY_CONFLICT",
      },
      { status: 409 },
    );
  return NextResponse.json(
    {
      error:
        "No se pudo confirmar la operación. Actualice antes de volver a enviar.",
      code: "UNAVAILABLE",
    },
    { status: 503 },
  );
}
export const noStore = { "Cache-Control": "private, no-store" };
