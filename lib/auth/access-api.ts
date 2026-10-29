import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { assertAccessAdministrator } from "./access-administration";
import { AccessAdministrationError } from "./access-errors";

export async function requireAccessApiAdministrator() {
  let userId: string | null;
  try { userId = (await auth()).userId; }
  catch { throw new AccessAdministrationError("UNAUTHENTICATED", "Inicia sesión para continuar.", 401); }
  if (!userId) throw new AccessAdministrationError("UNAUTHENTICATED", "Inicia sesión para continuar.", 401);
  await assertAccessAdministrator(userId);
  return userId;
}
export function verifyAccessWriteRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  try { sameOrigin = !!origin && new URL(origin).origin === new URL(request.url).origin; } catch {}
  if (!sameOrigin || ![null, "same-origin"].includes(request.headers.get("sec-fetch-site"))) throw new AccessAdministrationError("FORBIDDEN", "Origen de solicitud no permitido.", 403);
  if ((request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") throw new AccessAdministrationError("INVALID_INPUT", "Se requiere una solicitud JSON.", 415);
}
export function accessApiError(error: unknown) {
  if (error instanceof AccessAdministrationError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  const code = (error as { code?: string })?.code;
  if (code === "P2002") return NextResponse.json({ error: "Ya existe un registro con esos datos. Actualiza y revisa.", code: "CONFLICT" }, { status: 409 });
  if (code === "P2034") return NextResponse.json({ error: "El acceso cambió durante la operación. Actualiza y revisa antes de guardar.", code: "STALE_REVISION" }, { status: 409 });
  return NextResponse.json({ error: "No fue posible completar la operación. Intenta más tarde.", code: "UNAVAILABLE" }, { status: 503 });
}
