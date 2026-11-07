/**
 * scripts/fintera-monthly-dossier.ts
 *
 * Autonomous Monthly Executive Dossier Synthesizer & Content/E-E-A-T Database Sync
 * for FINTERA Soluciones Financieras.
 * Usage: npx tsx scripts/fintera-monthly-dossier.ts [EditionPeriod]
 */

import fs from "fs";
import path from "path";

for (const envFile of [".env.local", ".env"]) {
  const fullPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    for (const line of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

import prisma from "../lib/prisma";
import { researchBriefGenerator } from "../lib/research/brief-generator";
import { getAllFinteraContent, upsertFinteraContent } from "../lib/blog";

function getCurrentSpanishMonthEdition(): string {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

async function main() {
  const requestedEdition =
    process.argv[2]?.trim() || getCurrentSpanishMonthEdition();

  console.log("==============================================================");
  console.log("FINTERA RESEARCH OS · SÍNTESIS MENSUAL DE DOSSIERS & E-E-A-T");
  console.log(`Edición objetivo: ${requestedEdition}`);
  console.log("==============================================================");

  // 1. Ensure existing curated Dossiers (Octubre 2026 & Noviembre 2026) and requested edition are persisted in Neon PostgreSQL
  const existingBriefs = await researchBriefGenerator.getBriefsWithDb();
  for (const brief of existingBriefs) {
    const existingRow = await prisma.pipelineRun.findFirst({
      where: {
        pipelineType: "MONTHLY_DOSSIER",
        metadata: {
          contains: `"id":"${brief.id}"`,
        },
      },
    });
    if (!existingRow) {
      await prisma.pipelineRun.create({
        data: {
          pipelineType: "MONTHLY_DOSSIER",
          status: "SUCCESS",
          completedAt: new Date(brief.generatedAt),
          signalsFound: brief.metrics.totalClaimsCited,
          signalsRelevant: brief.metrics.verifiedClaimsCount,
          draftsGenerated: brief.versionNumber || 1,
          metadata: JSON.stringify(brief),
        },
      });
    }
  }

  // If requested edition doesn't have 4 briefs yet, generate them now
  const briefsForRequested = existingBriefs.filter(
    (b) =>
      (b.editionPeriod || b.cutoffDate).toLowerCase() ===
      requestedEdition.toLowerCase()
  );
  if (briefsForRequested.length < 4) {
    const generated =
      await researchBriefGenerator.generateMonthlyDossiersForAllDesks(
        requestedEdition
      );
    console.log(
      `✔ Generados ${generated.length} nuevos Dossiers Mensuales para ${requestedEdition}`
    );
  } else {
    console.log(
      `✔ Los 4 Dossiers de las Mesas para ${requestedEdition} ya están sincronizados en Neon PostgreSQL (${existingBriefs.length} dossiers totales).`
    );
  }

  // 2. Sync all 12+ FINTERA Insights articles with their initial Analytics & Human E-E-A-T verification into fintera_blog_posts
  const allPosts = getAllFinteraContent();
  let syncedPosts = 0;
  for (const post of allPosts) {
    await upsertFinteraContent(post);
    syncedPosts += 1;
  }

  console.log(
    `✔ Sincronizados ${syncedPosts} artículos con Telemetría y Sello Humano E-E-A-T en Neon PostgreSQL.`
  );
}

main().catch((err) => {
  console.error("Error en FINTERA Monthly Dossier Worker:", err);
  process.exit(1);
});
