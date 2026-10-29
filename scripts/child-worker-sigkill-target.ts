/**
 * Target child worker for SIGKILL testing
 */
import { OutboxRepository } from "../lib/automation/outbox/outbox-repository";

const targetEventId = process.argv[2];

async function main() {
  if (!targetEventId) {
    process.stderr.write("No targetEventId provided\n");
    process.exit(1);
  }

  const leaseOwner = `worker-child-pid-${process.pid}`;
  // Claim batch with correct argument order: (workerId, batchSize, leaseDurationMs)
  const claimed = await OutboxRepository.claimBatch(leaseOwner, 20, 30000);
  const match = claimed.find((e) => e.id === targetEventId);

  if (match) {
    process.stdout.write(`CLAIMED_EVENT:${match.id}:${process.pid}\n`);
    // Keep process alive until killed by SIGKILL
    setInterval(() => {}, 1000);
  } else {
    process.stdout.write(`NOT_FOUND_CLAIMED:${claimed.length}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`ERROR:${err?.message || String(err)}\n`);
  process.exit(1);
});
