import { requireAdminPermission } from "@/lib/auth/admin-session";
import React from "react";
import Link from "next/link";
import { DashboardService, DashboardMetrics } from "@/lib/crm/dashboard-service";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = {
  title: "Fintera CRM · Panel de Control Operativo",
  description: "Centro de comando para originación, asesoría y seguimiento multibanco",
};

export default async function CrmDashboardPage() {
  const context = await requireAdminPermission("crm:application:read");
  const effectiveRole = context.role;
  const effectiveUserId = context.userId;
  const teamIds = context.teamIds;

  const metrics: DashboardMetrics = await DashboardService.getDashboardMetrics(
    effectiveRole,
    effectiveUserId,
    teamIds
  );

  return (
    <div className="admin-page">
      <PageHeader title="Panel general" eyebrow="Operación comercial"
        description="Su cartera, los seguimientos pendientes y el estado de los expedientes en un solo lugar."
        actions={<>
          <Link href="/admin/crm/applications" className="admin-button admin-button-primary">Ver solicitudes ({metrics.totalApplications})</Link>
          <Link href="/simulador" target="_blank" rel="noopener noreferrer" className="admin-button">Abrir simulador ↗</Link>
        </>}
      />
      <div className="space-y-6">
        {/* Tarjetas Principales de KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="admin-card p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Solicitudes Activas
              </span>
              <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold">
                EN CURSO
              </span>
            </div>
            <div className="text-3xl font-semibold tabular-nums text-white mt-3">
              {metrics.activeApplications}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              De {metrics.totalApplications} expedientes en cartera
            </p>
          </div>

          <div className="admin-card p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nuevos Leads
              </span>
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-bold">
                POR PERFILAR
              </span>
            </div>
            <div className="text-3xl font-semibold tabular-nums text-amber-400 mt-3">
              {metrics.newLeads}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Captados desde simulador y landing
            </p>
          </div>

          <div className="admin-card p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                En Estudio de Bancos
              </span>
              <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold">
                RIESGO ACTIVO
              </span>
            </div>
            <div className="text-3xl font-semibold tabular-nums text-purple-400 mt-3">
              {metrics.inBankStudy}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Radicaciones ante entidades financieras
            </p>
          </div>

          <div className="admin-card p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Seguimiento Pendiente
              </span>
              <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold">
                ATENCIÓN HOY
              </span>
            </div>
            <div className="text-3xl font-semibold tabular-nums text-rose-400 mt-3">
              {metrics.followUpOverdueOrToday}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Casos con próxima acción vencida o hoy
            </p>
          </div>
        </div>

        {metrics.followUpOverdueOrToday > 0 && (
          <div className="admin-card flex flex-wrap items-center justify-between gap-4 border-amber-800/70">
            <div><h2 className="text-sm font-semibold text-amber-200">Seguimientos por atender</h2><p className="text-sm text-slate-300 mt-1">{metrics.followUpOverdueOrToday} expedientes tienen una próxima acción para hoy o vencida.</p></div>
            <Link href="/admin/crm/applications?scope=follow_up" className="admin-button">Abrir seguimiento →</Link>
          </div>
        )}
        {/* Sección de Distribución y Carga */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribución por Estado */}
          <div className="lg:col-span-2 admin-card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span>Embudo Operativo por Estado</span>
              <span className="text-xs font-normal text-slate-400">
                {metrics.statusDistribution.length} estados activos
              </span>
            </h2>

            {metrics.statusDistribution.length === 0 && <p className="text-sm text-slate-400 py-4">Aún no hay solicitudes en cartera. Los estados aparecerán al registrar expedientes.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metrics.statusDistribution.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <span className="text-sm text-slate-300 font-medium">
                    {item.label}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Carga de Asesores */}
          <div className="admin-card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Carga por Asesor
            </h2>

            {metrics.advisorWorkload.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-6 text-center">
                Sin asesores asignados actualmente
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.advisorWorkload.map((adv) => (
                  <div
                    key={adv.advisorId}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {adv.advisorName}
                      </div>
                      <div className="text-xs text-slate-400">{adv.email}</div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">
                      {adv.count} casos
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Expedientes Recientes */}
        <div className="admin-card p-5 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Expedientes Recientes
            </h2>
            <Link
              href="/admin/crm/applications"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Ver todos →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-3 px-4">Radicado</th>
                  <th scope="col" className="py-3 px-4">Cliente</th>
                  <th scope="col" className="py-3 px-4">Monto Solicitado</th>
                  <th scope="col" className="py-3 px-4">Banco</th>
                  <th scope="col" className="py-3 px-4">Estado</th>
                  <th scope="col" className="py-3 px-4">Asesor</th>
                  <th scope="col" className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {metrics.recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No hay expedientes registrados en el sistema
                    </td>
                  </tr>
                ) : (
                  metrics.recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {app.fileNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{app.clientName}</div>
                        <div className="text-xs text-slate-400">{app.documentNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200 tabular-nums whitespace-nowrap">
                        ${app.requestedAmount.toLocaleString("es-CO")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {app.primaryBank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {app.advisorName}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/crm/applications/${app.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                        >
                          Abrir Caso
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
