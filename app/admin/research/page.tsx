import { requireAdminPermission } from "@/lib/auth/admin-session";
import {
  FINTERA_AUTHORITATIVE_SOURCES,
  researchBriefGenerator,
  researchDeskRegistry,
  researchSignalEngine,
} from "@/lib/research";
import { ResearchHubClient } from "./ResearchHubClient";

export const dynamic = "force-dynamic";

export default async function FinteraAdminResearchPage() {
  await requireAdminPermission("crm:application:read");

  const sources = FINTERA_AUTHORITATIVE_SOURCES;
  const desks = researchDeskRegistry.getDesks();
  const initialSignals = researchSignalEngine.getSignals();
  const initialBriefs = researchBriefGenerator.getBriefs();

  return (
    <ResearchHubClient
      sources={sources}
      desks={desks}
      initialSignals={initialSignals}
      initialBriefs={initialBriefs}
    />
  );
}

