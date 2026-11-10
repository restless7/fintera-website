import { requireAdminPermission } from "@/lib/auth/admin-session";
import { getAllFinteraContentWithDb } from "@/lib/blog";
import { ContentHubClient } from "./ContentHubClient";

export const dynamic = "force-dynamic";

export default async function FinteraAdminContentPage() {
  await requireAdminPermission("crm:application:read");
  const initialItems = await getAllFinteraContentWithDb();

  return <ContentHubClient initialItems={initialItems} />;
}

