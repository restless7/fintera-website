import { requireAdminPermission } from "@/lib/auth/admin-session";
import { getAllFinteraContent } from "@/lib/blog";
import { ContentHubClient } from "./ContentHubClient";

export const dynamic = "force-dynamic";

export default async function FinteraAdminContentPage() {
  await requireAdminPermission("crm:application:read");
  const initialItems = getAllFinteraContent();

  return <ContentHubClient initialItems={initialItems} />;
}

