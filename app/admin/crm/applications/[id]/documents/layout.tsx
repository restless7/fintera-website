import { requireAdminApplication } from "@/lib/auth/admin-session";
export default async function DocumentsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminApplication(id, "crm:document:read");
  return children;
}
