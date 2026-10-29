/**
 * FINTERA ENTERPRISE CRM — WORKER OPERATIVO LOCAL (G01)
 * Proceso standalone para despacho asíncrono y automatización en demo local
 */

import { OperationalWorker } from "../lib/automation/workers/operational-worker";

const workerId = process.env.WORKER_ID || `worker-local-demo-${process.pid}`;
const pollIntervalMs = parseInt(process.env.POLL_INTERVAL_MS || "5000", 10);
const worker = new OperationalWorker(workerId);

console.log(`===============================================================================`);
console.log(` [OperationalWorker] Inicializado con ID: ${workerId}`);
console.log(` Frecuencia de escaneo: cada ${pollIntervalMs / 1000}s · Modo DEMO LOCAL`);
console.log(`===============================================================================`);

let isRunning = true;

async function pollingLoop() {
  while (isRunning) {
    try {
      const result = await worker.runSinglePass(20);
      if (result.processedCount > 0 || result.failedCount > 0) {
        console.log(
          `[${new Date().toISOString()}] [Worker] Eventos: ${result.claimedCount} reclamados, ` +
          `${result.processedCount} procesados exitosamente, ${result.failedCount} fallidos.`
        );
      }
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] [Worker] Error en ciclo de sondeo:`, err?.message || err);
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

pollingLoop();

process.on("SIGINT", () => {
  console.log("\n[OperationalWorker] Deteniendo worker localmente...");
  isRunning = false;
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[OperationalWorker] Deteniendo worker localmente...");
  isRunning = false;
  process.exit(0);
});
