/** Outbound-only document processor. No HTTP server, inbound tunnel or automatic DB migration. */
import { DocumentProcessingWorker } from "../lib/documents/document-processing-worker";
import prisma from "../lib/prisma";
const workerId = process.env.DOCUMENT_WORKER_ID || `document-worker-${process.pid}`;
const interval = Math.max(2000, Number(process.env.DOCUMENT_WORKER_POLL_MS || 5000));
let running = true;
process.on("SIGTERM", () => { running = false; });
process.on("SIGINT", () => { running = false; });
async function main() {
  if (process.env.DOCUMENT_WORKER_ENABLED !== "true" || !process.env.DATABASE_URL || !(process.env.FINTERA_DOCUMENT_STORAGE_URL || process.env.SUPABASE_URL) || !(process.env.FINTERA_DOCUMENT_STORAGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) throw new Error("WORKER_CONFIGURATION_REQUIRED");
  const database = new URL(process.env.DATABASE_URL);
  if (database.searchParams.get("sslaccept") !== "strict" || database.searchParams.get("sslmode") !== "require") throw new Error("STRICT_DATABASE_TLS_REQUIRED");
  if (process.env.FNT_NEXT_DATABASE_URL && process.env.FNT_NEXT_DATABASE_URL !== process.env.DATABASE_URL) throw new Error("DATABASE_TARGET_AMBIGUOUS");
  if (!['127.0.0.1', 'localhost', '::1'].includes(process.env.CLAMAV_HOST || "127.0.0.1")) throw new Error("LOCAL_SCANNER_REQUIRED");
  let heartbeatTask: Promise<boolean> | null = null;
  let scannerReady = false;
  const refreshHeartbeat = () => {
    if (heartbeatTask) return;
    heartbeatTask = DocumentProcessingWorker.heartbeat(workerId).then(ready => { scannerReady = ready; return ready; }).catch(() => { scannerReady = false; return false; }).finally(() => { heartbeatTask = null; });
  };
  refreshHeartbeat(); await heartbeatTask;
  const heartbeat = setInterval(refreshHeartbeat, 10000);
  try {
    while (running) {
      try {
        if (scannerReady) {
          const claim = await DocumentProcessingWorker.claimNext();
          if (claim) await DocumentProcessingWorker.processClaim(claim.intentId, claim.token);
        }
      } catch { console.error("[DocumentWorker] CYCLE_FAILED; retained for reconciliation"); }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  } finally {
    clearInterval(heartbeat);
    await heartbeatTask;
    await prisma.documentWorkerHeartbeat.deleteMany({ where: { workerId } });
    await prisma.$disconnect();
  }
}
void main().catch(async () => { console.error("[DocumentWorker] STOP_CONFIGURATION_OR_RUNTIME"); await prisma.$disconnect(); process.exitCode = 1; });
