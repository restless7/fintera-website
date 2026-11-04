import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import {
  CreateBriefInputSchema,
  researchBriefGenerator,
  researchDeskRegistry,
} from "@/lib/research";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  const { searchParams } = new URL(req.url);
  const deskSlug = searchParams.get("deskSlug") || undefined;
  const briefs = researchBriefGenerator.getBriefs(deskSlug);
  const desks = researchDeskRegistry.getDesks();

  return NextResponse.json({
    success: true,
    briefs,
    desks,
  });
}

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const parsed = CreateBriefInputSchema.parse(body);
    const brief = researchBriefGenerator.generateBrief(parsed);
    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al generar informe de inteligencia";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

