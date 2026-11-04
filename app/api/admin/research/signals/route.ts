import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import {
  FINTERA_AUTHORITATIVE_SOURCES,
  researchSignalEngine,
  researchThemeEngine,
} from "@/lib/research";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  const signals = researchSignalEngine.getSignals();
  const themes = researchThemeEngine.getActiveThemes();
  const sources = FINTERA_AUTHORITATIVE_SOURCES;

  return NextResponse.json({
    success: true,
    signals,
    themes,
    sources,
  });
}

export async function POST() {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const sweepResult = await researchSignalEngine.runSignalDiscoverySweep();
    const signals = researchSignalEngine.getSignals();
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

