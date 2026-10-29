import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { UserAdministration } from "@/components/admin/users/UserAdministration";
export const metadata = { title: "Usuarios y accesos | Fintera" };
export default async function UsersPage() {
  const context = await requireAdminSession();
  if (!context.isSuperAdmin || context.role !== "SUPER_ADMIN") notFound();
  return <UserAdministration />;
}
