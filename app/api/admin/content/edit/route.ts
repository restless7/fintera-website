import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import { rewriteFinteraContentWithAi } from "@/lib/services/ai-generation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const { id, instructions, newTitle, cutoffDate } = body || {};

    if (!id || !instructions?.trim()) {
      return NextResponse.json(
        {
          error:
            "Se requiere el identificador de la pieza (id) y las instrucciones de reescritura con IA.",
        },
        { status: 400 }
      );
    }

    const result = await rewriteFinteraContentWithAi({
      idOrSlug: id,
      instructions: instructions.trim(),
      newTitle,
      cutoffDate,
    });

    return NextResponse.json({
      success: true,
      item: result.item,
      providerUsed: result.providerUsed,
      modelUsed: result.modelUsed,
      previousQaScore: result.previousQaScore,
      newQaScore: result.newQaScore,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al reescribir pieza con el motor IA de FINTERA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

