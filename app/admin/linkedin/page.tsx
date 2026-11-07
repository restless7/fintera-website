import { requireAdminPermission } from "@/lib/auth/admin-session";
import { getAllFinteraContent } from "@/lib/blog";
import { researchSignalEngine } from "@/lib/research";
import { LinkedinPlanClient } from "./LinkedinPlanClient";

export const dynamic = "force-dynamic";

export default async function FinteraAdminLinkedinStrategyPage() {
  await requireAdminPermission("crm:application:read");
  const existingItems = getAllFinteraContent();
  const liveSignals = await researchSignalEngine.getSignalsWithDb();

  return (
    <LinkedinPlanClient
      existingItems={existingItems}
      liveSignals={liveSignals}
    />
  );
}

