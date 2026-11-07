import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import { upsertFinteraContent } from "@/lib/blog";
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
  const briefs = await researchBriefGenerator.getBriefsWithDb(deskSlug);
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

    if (body?.action === "GENERATE_ALL_MONTHLY") {
      const editionPeriod = String(body.editionPeriod || "Noviembre 2026");
      const generated = await researchBriefGenerator.generateMonthlyDossiersForAllDesks(
        editionPeriod
      );
      const briefs = await researchBriefGenerator.getBriefsWithDb();
      return NextResponse.json({
        success: true,
        generatedCount: generated.length,
        generated,
        briefs,
      });
    }

    if (body?.action === "PROMOTE_TO_WHITEPAPER") {
      const briefId = String(body.briefId || "");
      const briefs = await researchBriefGenerator.getBriefsWithDb();
      const targetBrief = briefs.find((b) => b.id === briefId);
      if (!targetBrief) {
        return NextResponse.json(
          { error: "No se encontró el Dossier solicitado." },
          { status: 404 }
        );
      }

      const edition = targetBrief.editionPeriod || targetBrief.cutoffDate;
      const version = targetBrief.versionNumber || 1;
      const slug = `dossier-${targetBrief.deskSlug}-${edition
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-v${version}`;

      const coverMap: Record<string, string> = {
        VIVIENDA_B2C: "/images/insights/articles/sem1-jue-alternativas-vivienda.png",
        FACTORING_B2B: "/images/insights/articles/sem1-mar-liquidez-sin-esperar-facturas.png",
        AUTORIDAD_MERCADO: "/images/insights/articles/sem1-mie-que-mirar-ademas-tasa-interes.png",
        CONFIANZA_OPORTUNIDADES: "/images/insights/articles/sem1-vie-vivienda-o-flujo-caja.png",
      };

      const fullMarkdown = [
        `# ${targetBrief.title}`,
        "",
        `> **Síntesis Ejecutiva (${edition} · v${version})**: ${targetBrief.executiveSummary}`,
        "",
        ...targetBrief.sections.flatMap((sec) => [
          `## ${sec.title}`,
          "",
          sec.contentMarkdown,
          "",
        ]),
      ].join("\n");

      const allCitations = targetBrief.sections.flatMap((s) => s.citations || []);

      const whitepaper = await upsertFinteraContent({
        slug,
        title: targetBrief.title,
        subtitle: `Dossier Mensual · ${edition} · ${targetBrief.deskName}`,
        excerpt: targetBrief.executiveSummary,
        content: fullMarkdown,
        categoryName:
          targetBrief.pillar === "VIVIENDA_B2C"
            ? "Vivienda y Financiación Personal"
            : targetBrief.pillar === "FACTORING_B2B"
            ? "Liquidez Empresarial y Factoring"
            : targetBrief.pillar === "AUTORIDAD_MERCADO"
            ? "Autoridad y Análisis del Mercado"
            : "Confianza y Generación de Oportunidades",
        pillar: targetBrief.pillar,
        contentType: "WHITEPAPER",
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
        cutoffDate: targetBrief.cutoffDate,
        authorName:
          targetBrief.author ||
          "Comité Técnico de Inteligencia Financiera FINTERA",
        authorRole: "Mesa de Investigación y Criterio Financiero",
        readingTime: 16,
        coverImage:
          coverMap[targetBrief.pillar] ||
          "/images/insights/articles/sem1-mie-que-mirar-ademas-tasa-interes.png",
        featured: false,
        tags: [
          "Dossier Mensual",
          edition,
          targetBrief.deskName,
          "E-E-A-T",
        ],
        aiGenerated: true,
        aiModel: "Qwen-API/qwen3.7-plus-2026-05-26 + Curaduría E-E-A-T FINTERA",
        wordCount: fullMarkdown.split(/\s+/).length,
        typeMetadata: {
          editionPeriod: edition,
          versionNumber: version,
          deskSlug: targetBrief.deskSlug,
          citations: allCitations.slice(0, 6),
        },
      });

      return NextResponse.json({
        success: true,
        whitepaper,
      });
    }

    const parsed = CreateBriefInputSchema.parse(body);
    const brief = await researchBriefGenerator.generateBriefWithDb(parsed);
    const briefs = await researchBriefGenerator.getBriefsWithDb();
    return NextResponse.json({
      success: true,
      brief,
      briefs,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al generar informe de inteligencia";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


