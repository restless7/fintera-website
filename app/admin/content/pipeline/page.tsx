import { requireAdminPermission } from "@/lib/auth/admin-session";
import { getAllFinteraContentWithDb } from "@/lib/blog";
import {
  FINTERA_AUTHORITATIVE_SOURCES,
  researchSignalEngine,
} from "@/lib/research";
import { PipelineClient } from "./PipelineClient";

export const dynamic = "force-dynamic";

export default async function FinteraAdminPipelinePage() {
  await requireAdminPermission("crm:application:read");

  const items = await getAllFinteraContentWithDb();
  const signals = await researchSignalEngine.getSignalsWithDb();
  const sources = FINTERA_AUTHORITATIVE_SOURCES;

  return (
    <PipelineClient
      initialItems={items}
      initialSignals={signals}
      sourcesCount={sources.length}
    />
  );
}

