import { NextRequest, NextResponse } from "next/server";
import {
  createGrowthLead,
  getGrowthAnalyticsSummary,
  getGrowthLeadByTrackingCode,
  GrowthLeadChannel,
  PartnerCategory,
} from "@/lib/growth/growth-store";
import { FinteraContentPillarKey } from "@/lib/content-types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingCode = searchParams.get("trackingCode");

  if (trackingCode) {
    const lead = getGrowthLeadByTrackingCode(trackingCode);
    if (!lead) {
      return NextResponse.json(
        {
          found: false,
          error:
            "No se encontró una operación o referido con ese código de seguimiento.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json({
      found: true,
      lead,
    });
  }

  const summary = getGrowthAnalyticsSummary();
  return NextResponse.json({
    success: true,
    summary,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      channel = "B2B_FACTORING_CALCULATOR",
      pillar = "FACTORING_B2B",
      clientName,
      companyName,
      nitOrCedulaMasked,
      contactEmail,
      contactPhone,
      city = "Bogotá D.C.",
      amountCOP = 0,
      termDaysOrMonths = 60,
      productLabel = "Diagnóstico Financiero FINTERA",
      radianReady,
      radianEventsCompleted,
      estimatedNetBenefitCOP,
      partnerName,
      partnerCategory,
      partnerEmail,
      estimatedCommissionCOP,
      utmSource,
      utmMedium,
      utmCampaign,
      sourceArticleSlug,
      sourceArticleTitle,
      notes,
    } = body || {};

    if (!clientName || !contactEmail) {
      return NextResponse.json(
        {
          error:
            "Por favor ingresa el nombre del contacto/empresa y el correo electrónico corporativo.",
        },
        { status: 400 }
      );
    }

    const created = createGrowthLead({
      channel: channel as GrowthLeadChannel,
      pillar: pillar as FinteraContentPillarKey,
      clientName: String(clientName).trim(),
      companyName: companyName ? String(companyName).trim() : undefined,
      nitOrCedulaMasked: nitOrCedulaMasked
        ? String(nitOrCedulaMasked).trim()
        : "Reservado (Ley 1581)",
      contactEmail: String(contactEmail).trim(),
      contactPhone: contactPhone
        ? String(contactPhone).trim()
        : "Pendiente validación",
      city: String(city).trim(),
      amountCOP: Number(amountCOP) || 0,
      termDaysOrMonths: Number(termDaysOrMonths) || 60,
      productLabel: String(productLabel).trim(),
      radianReady: Boolean(radianReady),
      radianEventsCompleted:
        typeof radianEventsCompleted === "number"
          ? radianEventsCompleted
          : undefined,
      estimatedNetBenefitCOP:
        typeof estimatedNetBenefitCOP === "number"
          ? estimatedNetBenefitCOP
          : undefined,
      partnerName: partnerName ? String(partnerName).trim() : undefined,
      partnerCategory: partnerCategory as PartnerCategory | undefined,
      partnerEmail: partnerEmail ? String(partnerEmail).trim() : undefined,
      estimatedCommissionCOP:
        typeof estimatedCommissionCOP === "number"
          ? estimatedCommissionCOP
          : undefined,
      utmSource: utmSource || "directo",
      utmMedium: utmMedium || "web_interactiva",
      utmCampaign: utmCampaign || "growth_engine_2026",
      sourceArticleSlug,
      sourceArticleTitle,
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        lead: created,
        trackingCode: created.trackingCode,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error procesando el registro en el motor de crecimiento FINTERA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

