import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import {
  getAllFinteraContent,
  getFinteraContentByIdOrSlug,
  remediateFinteraContent,
  upsertFinteraContent,
} from "@/lib/blog";
import { ContentQaGate } from "@/lib/qa/qa-gate";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const item = getFinteraContentByIdOrSlug(id);
    if (!item) {
      return NextResponse.json(
        { error: "Pieza editorial no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, item });
  }

  const items = getAllFinteraContent();
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    if (!body?.title || !body?.content) {
      return NextResponse.json(
        { error: "El título y el contenido son obligatorios" },
        { status: 400 }
      );
    }

    const item = await upsertFinteraContent(body);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al guardar contenido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const { id, action, status } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el identificador de la pieza (id)" },
        { status: 400 }
      );
    }

    const existing = getFinteraContentByIdOrSlug(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Pieza editorial no encontrada" },
        { status: 404 }
      );
    }

    if (action === "remediate") {
      const result = await remediateFinteraContent(id);
      return NextResponse.json({
        success: true,
        item: result.item,
        previousScore: result.previousScore,
        newScore: result.newScore,
        appliedFixes: result.appliedFixes,
      });
    }

    if (action === "evaluate_qa") {
      const qa = ContentQaGate.evaluate({
        postId: existing.id,
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt,
        content: existing.content,
        metaTitle: existing.seoTitle,
        metaDescription: existing.seoDescription,
        tags: existing.tags,
        contentType: existing.contentType,
        pillar: existing.pillar,
        cutoffDate: existing.cutoffDate,
      });

      const updated = await upsertFinteraContent({
        ...existing,
        qaStatus: qa.decision === "PASSED" ? "PASSED" : "FAILED",
      });
      return NextResponse.json({ success: true, item: updated, qa });
    }

    if (status) {
      // Governance check: Require QA pass before publishing unless bypassed
      if (status === "PUBLISHED" && existing.qaScore < 80) {
        const remediated = await remediateFinteraContent(id);
        const published = await upsertFinteraContent({
          ...remediated.item,
          status: "PUBLISHED",
        });
        return NextResponse.json({
          success: true,
          item: published,
          autoRemediated: true,
        });
      }

      const updated = await upsertFinteraContent({
        ...existing,
        status,
      });
      return NextResponse.json({ success: true, item: updated });
    }

    return NextResponse.json(
      { error: "Acción no reconocida" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar pieza";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

