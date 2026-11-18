/** Separate outbound-only commercial scheduler. Delivery requires explicit per-message approval and runtime gate. */
import { CommercialWorker } from "../lib/commercial/worker";
import prisma from "../lib/prisma";
const id = process.env.COMMERCIAL_WORKER_ID;
if (!id) throw new Error("COMMERCIAL_WORKER_ID_REQUIRED");
const worker = new CommercialWorker(id);
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    stopping = true;
  });
async function main() {
  if (process.env.COMMERCIAL_WORKER_VALIDATE_ONLY === "true") {
    console.log("COMMERCIAL_RUNTIME_LOAD_OK");
    await prisma.$disconnect();
    return;
  }
  try {
    while (!stopping) {
      const result = await worker.tick();
      console.log(JSON.stringify({ workerId: id, ...result }));
      if (!stopping) await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error("COMMERCIAL_WORKER_STOP");
  process.exitCode = 1;
});
