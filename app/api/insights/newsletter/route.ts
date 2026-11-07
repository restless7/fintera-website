import { NextRequest, NextResponse } from "next/server";
import {
  getFinteraContentByIdOrSlug,
  recordFinteraArticleTelemetry,
} from "@/lib/blog";
import { FINTERA_CONTENT_PILLARS } from "@/lib/content-types";
import { ResendNotificationService } from "@/lib/notifications/resend-notification-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "SUBSCRIBE";

    if (action === "DISPATCH_DIGEST") {
      const { slug, customTitle, customExcerpt, customCutoff, recipientEmail } =
        body;
      const item = slug ? getFinteraContentByIdOrSlug(slug) : null;
      const recipients = recipientEmail
        ? [String(recipientEmail).trim()]
        : ["comite.editorial@finterasoluciones.co"];

      const title = item?.title || customTitle || "Dossier Mensual FINTERA Insights";
      const excerpt =
        item?.excerpt ||
        customExcerpt ||
        "Síntesis ejecutiva con fuentes primarias verificadas (SFC, BanRep, DANE, DIAN/RADIAN).";
      const cutoffDate = item?.cutoffDate || customCutoff || "Noviembre 2026";
      const pillarLabel = item
        ? FINTERA_CONTENT_PILLARS[item.pillar]?.label || "FINTERA Insights"
        : "Comité de Inteligencia Financiera FINTERA";
      const reviewerName =
        item?.humanReview?.reviewerName ||
        "Sebastián García · Comité Técnico FINTERA";
      const urlPath = item ? `/insights/${item.slug}` : "/insights";

      const digestResult =
        await ResendNotificationService.sendArticleOrDossierDigest({
          recipientEmails: recipients,
          title,
          subtitle: item?.subtitle,
          excerpt,
          cutoffDate,
          pillarLabel,
          reviewerName,
          urlPath,
        });

      return NextResponse.json({
        success: true,
        digestResult,
      });
    }

    // Default: SUBSCRIBE to FINTERA Newsletter via Resend
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const segment =
      body.segment === "B2C_VIVIENDA" || body.segment === "B2B_EMPRESAS"
        ? body.segment
        : "ALL_PILLARS";
    const sourceSlug = body.sourceSlug ? String(body.sourceSlug) : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }

    const item = sourceSlug ? getFinteraContentByIdOrSlug(sourceSlug) : undefined;
    if (sourceSlug) {
      await recordFinteraArticleTelemetry({
        idOrSlug: sourceSlug,
        event: "NEWSLETTER_SIGNUP",
      });
    }

    const dispatch =
      await ResendNotificationService.sendNewsletterSubscriptionConfirmation({
        email,
        fullName: fullName || undefined,
        segment,
        sourceArticleSlug: item?.slug,
        sourceArticleTitle: item?.title,
      });

    return NextResponse.json({
      success: true,
      dispatch,
      message: dispatch.dispatched
        ? "Suscripción confirmada. Te hemos enviado el correo de bienvenida vía Resend."
        : "Suscripción registrada en la base de audiencia FINTERA (correo encolado en Resend Outbox).",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error procesando suscripción al boletín FINTERA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

