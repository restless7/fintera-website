/**
 * scripts/fintera-content-agent.ts
 *
 * Autonomous CLI Content & LinkedIn Positioning Generator for FINTERA Soluciones Financieras.
 * Uses the exact same Homelab + Cloud model cascade as apex-website/scripts/hermes-content-agent.ts:
 *   1. Homelab Hermes Agent (http://127.0.0.1:8642/v1/chat/completions · model: 'hermes-agent')
 *   2. NVIDIA NIM API (https://integrate.api.nvidia.com/v1/chat/completions · model: 'nvidia/nemotron-3.5-super-vl-120b-a12b')
 *   3. Qwen API (https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1/chat/completions · model: 'qwen3.7-plus-2026-05-26')
 *   4. Deterministic Institutional Fallback
 *
 * Usage:
 *   npx tsx scripts/fintera-content-agent.ts
 *   npx tsx scripts/fintera-content-agent.ts --type=WHITEPAPER --pillar=FACTORING_B2B
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

import {
  ContentTypeKey,
  FinteraContentPillarKey,
} from "../lib/content-types";
import { generateFinteraContentDraft } from "../lib/services/ai-generation";

async function main() {
  const args = process.argv.slice(2);
  const typeArg = (args
    .find((a) => a.startsWith("--type="))
    ?.split("=")[1] || "BLOG_POST") as ContentTypeKey;
  const pillarArg = (args
    .find((a) => a.startsWith("--pillar="))
    ?.split("=")[1] || "VIVIENDA_B2C") as FinteraContentPillarKey;
  const topicArg = args.find((a) => a.startsWith("--topic="))?.split("=")[1];

  console.log("==============================================================");
  console.log("FINTERA CONTENT OS · HOMELAB HERMES / NVIDIA NIM / QWEN CASCADE");
  console.log("==============================================================");
  console.log(`📋 Formato: ${typeArg} | Pilar: ${pillarArg}`);

  const result = await generateFinteraContentDraft({
    pillar: pillarArg,
    contentType: typeArg,
    topic: topicArg,
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
