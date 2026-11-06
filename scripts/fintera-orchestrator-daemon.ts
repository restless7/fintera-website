/**
 * scripts/fintera-orchestrator-daemon.ts
 *
 * Autonomous Homelab Orchestrator Daemon for FINTERA Soluciones Financieras.
 * Mirrors packages/apex-website/scripts/orchestrator-daemon.ts:
 * - Runs on the homelab directly against local Hermes (http://127.0.0.1:8642) + PostgreSQL DB
 * - Executes the 14-source financial signal sweep every 12 hours
 * - Executes the Mon–Thu LinkedIn & FINTERA Insights cadence automatically
 *
 * Usage on Homelab:
 *   npx tsx scripts/fintera-orchestrator-daemon.ts
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

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runCycle(label: string, command: string) {
  const start = Date.now();
  console.log(`\n======================================================`);
  console.log(`[FINTERA-ORCHESTRATOR] Iniciando ciclo: ${label}`);
  console.log(`[FINTERA-ORCHESTRATOR] Hora: ${new Date().toISOString()}`);
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    if (stdout) console.log(stdout.trim());
    if (stderr) console.warn(stderr.trim());
    console.log(
      `[FINTERA-ORCHESTRATOR] ✔ ${label} completado en ${Date.now() - start}ms`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FINTERA-ORCHESTRATOR] ✖ Error en ${label}: ${msg}`);
  }
}

async function main() {
  console.log("🚀 FINTERA Autonomous Homelab Orchestrator Daemon iniciado");
  console.log(
    "🔗 Conectado a Hermes Local (http://127.0.0.1:8642/v1/chat/completions) + Cascade NVIDIA NIM / Qwen API"
  );

  // Run an initial sweep on startup
  await runCycle(
    "TREND_SCRAPER_14_SOURCES",
    "npx tsx scripts/fintera-trend-scraper.ts"
  );

  // Poll every hour to execute scheduled 12h sweeps and Mon-Thu 8:00 AM COT generation
  let lastRunHour = -1;
  setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 1=Mon, 2=Tue, 3=Wed, 4=Thu

    if (hour === lastRunHour) return;
    lastRunHour = hour;

    // 1. Every 12 hours (00:00 and 12:00): Sweep the 14 authoritative sources
    if (hour === 0 || hour === 12) {
      await runCycle(
        "TREND_SCRAPER_14_SOURCES",
        "npx tsx scripts/fintera-trend-scraper.ts"
      );
    }

    // 2. Monday to Thursday at 08:00 AM: Generate the daily pillar content
    if (hour === 8 && day >= 1 && day <= 4) {
      const pillarByDay: Record<number, string> = {
        1: "CONFIANZA_OPORTUNIDADES", // Lunes
        2: "VIVIENDA_B2C", // Martes
        3: "FACTORING_B2B", // Miércoles
        4: "AUTORIDAD_MERCADO", // Jueves
      };
      const pillar = pillarByDay[day] || "VIVIENDA_B2C";
      await runCycle(
        `DAILY_CONTENT_${pillar}`,
        `npx tsx scripts/fintera-content-agent.ts --type=BLOG_POST --pillar=${pillar}`
      );
    }
  }, 60 * 1000);
}

main().catch((err) => {
  console.error("Error fatal en FINTERA Orchestrator Daemon:", err);
  process.exit(1);
});
