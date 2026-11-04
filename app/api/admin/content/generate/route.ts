import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import { generateFinteraContentDraft } from "@/lib/services/ai-generation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const result = await generateFinteraContentDraft({
      topic: body?.topic,
      pillar: body?.pillar,
      contentType: body?.contentType,
      calendarPostId: body?.calendarPostId,
      signalId: body?.signalId,
      publishImmediately: Boolean(body?.publishImmediately),
    });

    return NextResponse.json({
      success: true,
      item: result.item,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al generar borrador con IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

