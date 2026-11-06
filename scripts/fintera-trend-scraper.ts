/**
 * scripts/fintera-trend-scraper.ts
 *
 * Autonomous CLI Trend & Official Financial Signal Scraper for FINTERA Soluciones Financieras.
 * Usage: npx tsx scripts/fintera-trend-scraper.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

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

