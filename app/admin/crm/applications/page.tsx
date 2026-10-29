import { requireAdminPermission } from "@/lib/auth/admin-session";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, STATUS_LABELS } from "@/components/admin/StatusBadge";
import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getAdminRequestTime } from "@/lib/crm/admin-request-time";
import { DashboardService } from "@/lib/crm/dashboard-service";
import { ApplicationStatus } from "@/prisma/generated/client";

export const metadata = {
  title: "Fintera CRM · Expedientes y Solicitudes Hipotecarias",
  description: "Bandeja de gestión de cartera, solicitudes y prospectos comerciales",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    scope?: string;
    page?: string;
  }>;
}

export default async function CrmApplicationsListPage({ searchParams }: PageProps) {
  const { search, status: statusFilter, scope = "all", page: pageParam = "1" } = await searchParams;

  const context = await requireAdminPermission("crm:application:read");
  const effectiveRole = context.role;
  const effectiveUserId = context.userId;
  const teamIds = context.teamIds;

  const parsedPage = Number(pageParam);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = 25;
  const skip = (page - 1) * limit;

  // Filtro ABAC
  let whereFilter = DashboardService.buildScopeFilter(effectiveRole, effectiveUserId, teamIds);

  if (scope === "my_cases" && effectiveUserId) {
    whereFilter = { ...whereFilter, assignedAdvisorId: effectiveUserId };
  } else if (scope === "follow_up") {
    whereFilter = {
      ...whereFilter,
      nextActionDate: { lte: new Date((await getAdminRequestTime()).getTime() + 24 * 60 * 60 * 1000) },
      status: { notIn: [ApplicationStatus.DISBURSED, ApplicationStatus.REJECTED, ApplicationStatus.CANCELLED_BY_CLIENT] },
    };
  }

  if (statusFilter && Object.values(ApplicationStatus).includes(statusFilter as ApplicationStatus)) {
    whereFilter = { AND: [whereFilter, { status: statusFilter as ApplicationStatus }] };
  }

  if (search) {
    whereFilter = {
      AND: [whereFilter, { OR: [
        { fileNumber: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { client: { firstLastName: { contains: search, mode: "insensitive" } } },
        { client: { documentNumber: { contains: search, mode: "insensitive" } } },
        { client: { email: { contains: search, mode: "insensitive" } } },
      ] }],
    };
  }

  const [total, applications] = await Promise.all([
    prisma.crmCreditApplication.count({ where: whereFilter }),
    prisma.crmCreditApplication.findMany({
      where: whereFilter,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        client: true,
        assignedAdvisor: true,
        team: true,
        bankApplications: { take: 2 },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const queueQuery = (changes: Record<string, string | number | undefined> = {}) => {
    const values: Record<string, string | number | undefined> = { search, status: statusFilter, scope, page, ...changes };
    const query = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
    return `/admin/crm/applications?${query.toString()}`;
  };
  const returnTo = queueQuery();

  return (
    <div className="admin-page">
      <div className="space-y-6">
        <PageHeader title="Solicitudes hipotecarias" eyebrow="Operación comercial" description="Prioriza tu cartera, retoma el seguimiento y abre cada expediente con su contexto completo." metadata={<span className="text-xs text-slate-400">{total} resultados en la vista actual</span>} />

        {/* Filtros Rápidos / Pestañas */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          <Link
            href={queueQuery({ scope: "all", page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scope === "all" ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Toda la cartera
          </Link>
          <Link
            href={queueQuery({ scope: "my_cases", page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scope === "my_cases" ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Mis Asignados
          </Link>
          <Link
            href={queueQuery({ scope: "follow_up", page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scope === "follow_up" ? "bg-rose-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Seguimiento Hoy / Vencido
          </Link>
        </div>

        {/* Buscador */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <form method="GET" action="/admin/crm/applications" className="flex flex-col sm:flex-row gap-3">
            <input type="hidden" name="scope" value={scope} />
            <label className="sr-only" htmlFor="application-search">Buscar solicitudes</label>
            <input
              id="application-search"
              type="search"
              name="search"
              defaultValue={search || ""}
              placeholder="Buscar por cédula, nombre, correo o radicado (FNT-2026-XXXX)..."
              className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <label className="sr-only" htmlFor="application-status">Estado de la solicitud</label>
            <select id="application-status" name="status" defaultValue={statusFilter || ""} className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 sm:max-w-[210px]">
              <option value="">Todos los estados</option>
              {Object.values(ApplicationStatus).map(status => <option key={status} value={status}>{STATUS_LABELS[status] || status.replace(/_/g, " ")}</option>)}
            </select>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Buscar
            </button>
            {search && (
              <Link
                href={queueQuery({ search: undefined, status: undefined, page: 1 })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
              >
                Limpiar
              </Link>
            )}
          </form>
        </div>

        {/* Tabla Principal */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table aria-label="Solicitudes hipotecarias" className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Radicado</th>
                  <th className="py-3 px-4">Titular</th>
                  <th className="py-3 px-4">Monto Solicitado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Bancos Radicados</th>
                  <th className="py-3 px-4">Asesor Asignado</th>
                  <th className="py-3 px-4">Próxima Acción</th>
                  <th className="py-3 px-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                      No se encontraron expedientes que coincidan con los criterios de búsqueda
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {app.fileNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {app.client.firstName} {app.client.firstLastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {app.client.documentType} {app.client.documentNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        ${app.requestedAmount.toLocaleString("es-CO")}
                        <div className="text-xs text-slate-500">{app.termMonths / 12} años</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {app.bankApplications.length === 0 ? (
                            <span className="text-xs text-slate-500 italic">Sin radicar</span>
                          ) : (
                            app.bankApplications.map((b) => (
                              <span
                                key={b.id}
                                className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {b.bankId.toUpperCase()}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {app.assignedAdvisor
                          ? `${app.assignedAdvisor.firstName} ${app.assignedAdvisor.lastName}`
                          : <span className="text-slate-500 italic">Por asignar</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {app.nextActionDate ? (
                          <span
                            className={
                              new Date(app.nextActionDate) < new Date()
                                ? "text-rose-400 font-semibold"
                                : "text-slate-400"
                            }
                          >
                            {new Date(app.nextActionDate).toLocaleDateString("es-CO")}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/crm/applications/${app.id}?returnTo=${encodeURIComponent(returnTo)}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
                        >
                          Gestionar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>Página {page} de {totalPages}</div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={queueQuery({ page: page - 1 })}
                    className="px-3 py-1.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-200"
                  >
                    Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={queueQuery({ page: page + 1 })}
                    className="px-3 py-1.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-200"
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
