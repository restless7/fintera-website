import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/auth/admin-session";
import { FinanceWorkspace } from "@/components/admin/commercial/FinanceWorkspace";
export const metadata = { title: "Ingresos y cartera | Fintera" };
export default async function FinancePage() {
  const context = await requireAdminPermission("crm:commercial:finance:read");
  if (!["SUPER_ADMIN", "COMMERCIAL_DIRECTOR", "AUDITOR"].includes(context.role))
    notFound();
  return <FinanceWorkspace />;
}
