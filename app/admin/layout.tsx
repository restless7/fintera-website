import { AdminDraftProvider } from "@/components/admin/useAdminDraft";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminNavigation, ROLE_LABELS } from "@/components/admin/navigation";
import { requireAdminSession } from "@/lib/auth/admin-session";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireAdminSession();
  return <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 p-6" role="status">Cargando espacio de trabajo…</div>}>
    <AdminDraftProvider key={employee.userId}><AdminShell permissions={employee.permissions} navigation={getAdminNavigation(employee.role, employee.permissions)} employeeName={`${employee.firstName} ${employee.lastName}`.trim() || employee.email} roleLabel={ROLE_LABELS[employee.role]}>{children}</AdminShell></AdminDraftProvider>
  </Suspense>;
}
