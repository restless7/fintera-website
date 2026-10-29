import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin-session";

import { getAdminLanding } from "@/lib/auth/admin-landing";

export default async function AdminPage() {
  const context = await requireAdminSession();
  redirect(getAdminLanding(context) || "/admin-access");
}
