import { requireAdminPermission } from "@/lib/auth/admin-session";
import { CommercialWorkspace } from "@/components/admin/commercial/CommercialWorkspace";
export const metadata = { title: "Gestión comercial | Fintera" };
export default async function CommercialPage() {
  await requireAdminPermission("crm:lead:read");
  return <CommercialWorkspace />;
}
