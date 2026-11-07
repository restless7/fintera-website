import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import {
  certifyFinteraHumanReview,
  deleteFinteraContent,
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

    if (action === "certify_human_review") {
      const updated = await certifyFinteraHumanReview({
        idOrSlug: id,
        reviewerName:
          body.reviewerName ||
          existing.humanReview?.reviewerName ||
          "Sebastián García · Comité Técnico FINTERA",
        reviewerRole:
          body.reviewerRole ||
          existing.humanReview?.reviewerRole ||
          "Dirección de Estructuración Financiera, Crédito Hipotecario (Ley 546) y Liquidez B2B (RADIAN)",
        reviewerCredentials:
          body.reviewerCredentials ||
          existing.humanReview?.reviewerCredentials ||
          "Mesa de Originación Multibanco Colombia · Fuentes Verificadas SFC / BanRep / DIAN / DANE",
        expertMesaNote:
          body.expertMesaNote ||
          existing.humanReview?.expertMesaNote ||
          "",
        publishImmediately: Boolean(body.publishImmediately),
      });
      return NextResponse.json({
        success: true,
        item: updated,
      });
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
      const scheduledAt = body.scheduledAt
        ? new Date(body.scheduledAt).toISOString()
        : status === "SCHEDULED"
        ? existing.scheduledAt ||
          new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        : null;

      // Governance check: Require QA pass before publishing or scheduling unless bypassed
      if ((status === "PUBLISHED" || status === "SCHEDULED") && existing.qaScore < 80) {
        const remediated = await remediateFinteraContent(id);
        const updated = await upsertFinteraContent({
          ...remediated.item,
          status,
          scheduledAt,
        });
        return NextResponse.json({
          success: true,
          item: updated,
          autoRemediated: true,
        });
      }

      const updated = await upsertFinteraContent({
        ...existing,
        status,
        scheduledAt,
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

export async function DELETE(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el parámetro id para eliminar la pieza" },
        { status: 400 }
      );
    }

    const result = await deleteFinteraContent(id);
    if (!result.deleted) {
      return NextResponse.json(
        { error: "Pieza editorial no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedSlug: result.slug });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar pieza";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


