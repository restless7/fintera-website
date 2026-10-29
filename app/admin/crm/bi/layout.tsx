import { requireAdminPermission } from "@/lib/auth/admin-session";
export default async function BiLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission("crm:report:read");
  return children;
}
