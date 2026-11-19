import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Retired prototype: never fabricate personal or financial data from missing fields. */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      code: "LEGACY_FLOW_RETIRED",
      message: "Este formulario fue reemplazado. Inicie el registro breve para continuar con su cuenta y solicitud de servicios financieros.",
      nextUrl: "/solicitar",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
