import { NextRequest, NextResponse } from "next/server";
import {
  FinteraShareBreakdown,
  getFinteraContentByIdOrSlugWithDb,
  recordFinteraArticleTelemetry,
} from "@/lib/blog";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json(
      { error: "Se requiere el parámetro slug" },
      { status: 400 }
    );
  }

  const item = await getFinteraContentByIdOrSlugWithDb(slug);
  if (!item) {
    return NextResponse.json(
      { error: "Artículo no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    analytics: item.analytics,
    humanReview: item.humanReview,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, event, channel, readSeconds } = body as {
      slug?: string;
      event?: "VIEW" | "SHARE" | "HELPFUL_VOTE" | "CTA_CLICK" | "NEWSLETTER_SIGNUP";
      channel?: keyof FinteraShareBreakdown;
      readSeconds?: number;
    };

    if (!slug || !event) {
      return NextResponse.json(
        { error: "Se requieren slug y event" },
        { status: 400 }
      );
    }

    const updatedAnalytics = await recordFinteraArticleTelemetry({
      idOrSlug: slug,
      event,
      channel,
      readSeconds,
    });

    if (!updatedAnalytics) {
      return NextResponse.json(
        { error: "Artículo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analytics: updatedAnalytics,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error registrando telemetría del artículo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

