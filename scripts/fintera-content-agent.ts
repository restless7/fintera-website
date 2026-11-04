/**
 * scripts/fintera-content-agent.ts
 *
 * Autonomous CLI Content & LinkedIn Positioning Generator for FINTERA Soluciones Financieras.
 * Usage: npx tsx scripts/fintera-content-agent.ts
 */

import { generateFinteraContentDraft } from "../lib/services/ai-generation";

async function main() {
  console.log("==============================================================");
  console.log("FINTERA CONTENT OS · GENERADOR EDITORIAL CON QA GATE (8 DIM)");
  console.log("==============================================================");

  const result = await generateFinteraContentDraft({
    pillar: "VIVIENDA_B2C",
    contentType: "BLOG_POST",
  });

  console.log(`✔ Pieza generada: ${result.item.title}`);
  console.log(`✔ Slug: /insights/${result.item.slug}`);
  console.log(`✔ Motor utilizado: ${result.providerUsed} (${result.modelUsed})`);
  console.log(
    `✔ Puntaje QA Gate FINTERA: ${result.item.qaScore}/100 (${result.item.qaStatus})`
  );
}

main().catch((err) => {
  console.error("Error en FINTERA Content Agent:", err);
  process.exit(1);
});

