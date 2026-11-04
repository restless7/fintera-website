import { requireAdminPermission } from "@/lib/auth/admin-session";
import { getAllFinteraContent } from "@/lib/blog";
import { LinkedinPlanClient } from "./LinkedinPlanClient";

export const dynamic = "force-dynamic";

export default async function FinteraAdminLinkedinStrategyPage() {
  await requireAdminPermission("crm:application:read");
  const existingItems = getAllFinteraContent();

  return <LinkedinPlanClient existingItems={existingItems} />;
}

