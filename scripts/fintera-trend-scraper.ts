/**
 * scripts/fintera-trend-scraper.ts
 *
 * Autonomous CLI Trend & Official Financial Signal Scraper for FINTERA Soluciones Financieras.
 * Usage: npx tsx scripts/fintera-trend-scraper.ts
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

import { researchSignalEngine } from "../lib/research/signal-engine";

async function main() {
  console.log("==============================================================");
  console.log("FINTERA RESEARCH OS · MONITOR DE FUENTES FINANCIERAS COLOMBIA");
  console.log("==============================================================");
  const result = await researchSignalEngine.runSignalDiscoverySweep();
  console.log(`✔ Fuentes autorizadas monitoreadas: ${result.sourcesChecked}`);
  console.log(`✔ Nuevas señales descubiertas: ${result.discoveredCount}`);
  console.log(`✔ Total señales activas en cola: ${result.totalActiveSignals}`);
  console.log(
    `✔ Sincronización PostgreSQL: ${
      result.syncedToDatabase ? "Activa" : "Cache local (.cache)"
    }`
  );
}

main().catch((err) => {
  console.error("Error en FINTERA Trend Scraper:", err);
  process.exit(1);
});

