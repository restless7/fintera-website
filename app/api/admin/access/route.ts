import { NextRequest, NextResponse } from "next/server";
import { accessMutationSchema, ACCESS_ROLES } from "@/lib/auth/access-contracts";
import { getAccessAdministration, mutateAccessAdministration } from "@/lib/auth/access-administration";
import { accessApiError, requireAccessApiAdministrator, verifyAccessWriteRequest } from "@/lib/auth/access-api";
import { AccessAdministrationError } from "@/lib/auth/access-errors";
import type { UserRole } from "@/lib/auth/types";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAccessApiAdministrator();
    const query = request.nextUrl.searchParams;
    const search = (query.get("search") || "").trim();
    const role = query.get("role") || "all";
    const status = query.get("status") || "all";
    const page = Number(query.get("page") || "1");
    if (search.length > 120 || !["all", ...ACCESS_ROLES].includes(role as UserRole) || !["all", "active", "inactive"].includes(status) || !Number.isSafeInteger(page) || page < 1 || page > 100000) throw new AccessAdministrationError("INVALID_INPUT", "Filtros inválidos.");
    return NextResponse.json(await getAccessAdministration(actor, { search, role, status, page }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return accessApiError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const actor = await requireAccessApiAdministrator();
    verifyAccessWriteRequest(request);
    // Stream-bound cap, including requests without an honest Content-Length.
    const reader = request.body?.getReader();
    if (!reader) throw new AccessAdministrationError("INVALID_INPUT", "Solicitud vacía.");
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) { const item = await reader.read(); if (item.done) break; length += item.value.byteLength; if (length > 32768) { await reader.cancel(); throw new AccessAdministrationError("INVALID_INPUT", "Solicitud demasiado grande.", 413); } chunks.push(item.value); }
    } finally { reader.releaseLock(); }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new AccessAdministrationError("INVALID_INPUT", "JSON inválido."); }
    const parsed = accessMutationSchema.safeParse(body);
    if (!parsed.success) throw new AccessAdministrationError("INVALID_INPUT", parsed.error.issues[0]?.message || "Datos inválidos.");
    return NextResponse.json(await mutateAccessAdministration(actor, parsed.data), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return accessApiError(error); }
}
