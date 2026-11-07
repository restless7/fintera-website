import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import {
  FINTERA_AUTHORITATIVE_SOURCES,
  researchSignalEngine,
  researchThemeEngine,
  ResearchSignal,
} from "@/lib/research";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  const signals = await researchSignalEngine.getSignalsWithDb();
  const themes = researchThemeEngine.getActiveThemes();
  const sources = FINTERA_AUTHORITATIVE_SOURCES;

  return NextResponse.json({
    success: true,
    signals,
    themes,
    sources,
  });
}

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    let sourceId: string | undefined;
    try {
      const body = await req.json();
      if (body?.sourceId && typeof body.sourceId === "string") {
        sourceId = body.sourceId;
      }
    } catch {
      // Optional JSON body
    }

    const sweepResult = await researchSignalEngine.runSignalDiscoverySweep(sourceId);
    const signals = await researchSignalEngine.getSignalsWithDb();
    return NextResponse.json({
      success: true,
      sweepResult,
      signals,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al ejecutar barrido de fuentes financieras";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const signalId = String(body?.signalId || "");
    const status = String(body?.status || "DECOMPOSED") as ResearchSignal["processingStatus"];
    if (!signalId) {
      return NextResponse.json({ error: "signalId requerido" }, { status: 400 });
    }
    const updated = await researchSignalEngine.updateSignalStatus(signalId, status);
    const signals = await researchSignalEngine.getSignalsWithDb();
    return NextResponse.json({
      success: true,
      signal: updated,
      signals,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar estado de la señal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


