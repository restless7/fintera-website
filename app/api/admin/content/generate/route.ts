import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import { CalendarGenerationError } from "@/lib/services/ai-generation/calendar-claims";
import { generateFinteraContentDraft } from "@/lib/services/ai-generation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  let calendarRequest = false;
  try {
    const body = await req.json();
    calendarRequest = Boolean(body && Object.prototype.hasOwnProperty.call(body, "calendarPostId"));
    const result = await generateFinteraContentDraft({
      topic: body?.topic,
      pillar: body?.pillar,
      contentType: body?.contentType,
      calendarPostId: body?.calendarPostId,
      retryFailed: body?.retryFailed === true,
      signalId: body?.signalId,
      publishImmediately: Boolean(body?.publishImmediately),
    });

    return NextResponse.json({
      success: true,
      item: result.item,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      reused: result.reused === true,
    });
  } catch (error) {
    if (error instanceof CalendarGenerationError)
      return NextResponse.json({ error: error.code }, { status: error.status });
    if (calendarRequest) return NextResponse.json({ error: "CALENDAR_SERVICE_UNAVAILABLE" }, { status: 503 });
    const message =
      error instanceof Error
        ? error.message
        : "Error al generar borrador con IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
