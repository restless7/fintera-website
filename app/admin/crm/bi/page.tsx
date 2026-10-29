"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Building2,
  Users,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BiOverviewData {
  funnel: {
    leadsCaptured: number;
    prequalified: number;
    docsSubmitted: number;
    bankSubmissions: number;
    conditionalApprovals: number;
    definitiveApprovals: number;
    disbursedCount: number;
    disbursedAmountCOP: number;
    overallConversionRate: number;
  };
  bankPerformance: Array<{
    bankId: string;
    totalCases: number;
    approvedCases: number;
    rejectedCases: number;
    approvalRate: number;
    avgTimeToApprovalDays: number;
    avgTimeToDisbursementDays: number;
    slaComplianceRate: number;
  }>;
  advisorWorkload: Array<{
    advisorUserId: string;
    advisorName: string;
    activeApplications: number;
    overdueTasks: number;
    messagesPending: number;
    conversionRate: number;
  }>;
  activeSlaAlertsCount: number;
  lastRefreshedAt: string;
}

async function readBiOverview(signal?: AbortSignal): Promise<BiOverviewData> {
  const response = await fetch("/api/admin/crm/bi/overview", { signal });
  if (!response.ok) throw new Error("No se pudo cargar la analítica comercial.");
  return response.json();
}

export default function BiDashboardPage() {
  const [data, setData] = useState<BiOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBiData = useCallback(async (signal?: AbortSignal) => {
    try {
      const json = await readBiOverview(signal);
      if (signal?.aborted) return;
      setData(json);
      setError(null);
    } catch (err: any) {
      if (!signal?.aborted) setError(err.message || "Error cargando métricas");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    readBiOverview(controller.signal)
      .then((json) => { if (!controller.signal.aborted) { setData(json); setError(null); } })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message || "Error cargando métricas"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const refreshBiData = () => {
    setLoading(true);
    setError(null);
    void loadBiData();
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="admin-page space-y-6">
      <PageHeader title="Analítica comercial" eyebrow="Inteligencia"
        description="Conversión de solicitudes, desempeño bancario y carga de su equipo."
        actions={<>
          <Button variant="outline" size="sm" onClick={refreshBiData} disabled={loading} className="admin-button">
            <RefreshCw aria-hidden="true" className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Actualizar
          </Button>
          <Link href="/admin/crm/applications" className="admin-button admin-button-primary">Ver solicitudes</Link>
        </>}
      />
      {loading && !data && <p role="status" className="admin-card p-5 text-sm text-slate-300">Cargando analítica comercial…</p>}
      {error && (
        <div role="alert" className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {data && <>
      {/* Tarjetas de Métricas Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="admin-card !p-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium text-slate-400">
              Desembolsos Confirmados
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              {data ? formatCOP(data.funnel.disbursedAmountCOP) : "..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {data?.funnel.disbursedCount || 0} créditos desembolsados formalmente
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card !p-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium text-slate-400">
              Tasa de Conversión Global
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              {data ? `${data.funnel.overallConversionRate}%` : "..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Desde captura de lead a desembolso</p>
          </CardContent>
        </Card>

        <Card className="admin-card !p-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium text-slate-400">
              Total Radicaciones Bancarias
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              {data?.funnel.bankSubmissions || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {data?.funnel.conditionalApprovals || 0} condicionados · {data?.funnel.definitiveApprovals || 0} definitivos
            </p>
          </CardContent>
        </Card>

        <Card className="admin-card !p-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-medium text-slate-400">
              Alertas de SLA Abiertas
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
              {data?.activeSlaAlertsCount ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">Expedientes con escalación activa</p>
          </CardContent>
        </Card>
      </div>

      {/* Embudo Comercial */}
      <Card className="admin-card !p-0">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">
            Conversión por solicitud
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Seguimiento de etapas de conversión sin distorsión por subcasos bancarios concurrentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "1. Leads Capturados", count: data?.funnel.leadsCaptured || 0, color: "bg-slate-950 border border-slate-800" },
              { label: "2. Precalificados", count: data?.funnel.prequalified || 0, color: "bg-slate-950 border border-slate-800" },
              { label: "3. Docs Completos", count: data?.funnel.docsSubmitted || 0, color: "bg-slate-950 border border-slate-800" },
              { label: "4. Radicados a Banco", count: data?.funnel.bankSubmissions || 0, color: "bg-slate-950 border border-slate-800" },
              { label: "5. Aprobaciones", count: data?.funnel.definitiveApprovals || 0, color: "bg-slate-950 border border-slate-800" },
              { label: "6. Desembolsos", count: data?.funnel.disbursedCount || 0, color: "bg-emerald-950/30 border border-emerald-800" },
            ].map((step, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${step.color} flex flex-col justify-between`}>
                <span className="text-xs font-medium text-slate-300 mb-1">{step.label}</span>
                <span className="text-xl font-semibold tabular-nums text-white">{step.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tablas de Rendimiento por Banco y Carga por Asesor */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        {/* Rendimiento por Entidad Bancaria */}
        <Card className="admin-card !p-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold tabular-nums text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Desempeño por banco
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Casos bancarios independientes: una solicitud puede tener varios subcasos. SLA corresponde a cada banco.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de desempeño por banco, desplazamiento horizontal">
            <table className="w-full min-w-[540px] text-left text-sm tabular-nums">
              <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-2.5 px-3">Banco</th>
                  <th scope="col" className="py-2.5 px-3">Casos</th>
                  <th scope="col" className="py-2.5 px-3">Aprobados</th>
                  <th scope="col" className="py-2.5 px-3">Rechazos</th>
                  <th scope="col" className="py-2.5 px-3">SLA Cumplido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.bankPerformance && data.bankPerformance.length > 0 ? (
                  data.bankPerformance.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-950 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">{b.bankId}</td>
                      <td className="py-2.5 px-3 text-slate-300">{b.totalCases}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">{b.approvedCases}</td>
                      <td className="py-2.5 px-3 text-rose-300">{b.rejectedCases}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950 text-emerald-300">
                          {b.slaComplianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      Sin datos históricos suficientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Carga Operativa por Asesor Comercial */}
        <Card className="admin-card !p-0">
          <CardHeader>
            <CardTitle className="text-base font-semibold tabular-nums text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Carga por asesor
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Distribución de cartera activa, tareas vencidas y mensajes pendientes de respuesta.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de carga por asesor, desplazamiento horizontal">
            <table className="w-full min-w-[540px] text-left text-sm tabular-nums">
              <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-2.5 px-3">Asesor</th>
                  <th scope="col" className="py-2.5 px-3">Expedientes</th>
                  <th scope="col" className="py-2.5 px-3">Tareas Vencidas</th>
                  <th scope="col" className="py-2.5 px-3">Mensajes Pend.</th>
                  <th scope="col" className="py-2.5 px-3">Conversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.advisorWorkload && data.advisorWorkload.length > 0 ? (
                  data.advisorWorkload.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-950 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">{a.advisorName}</td>
                      <td className="py-2.5 px-3 text-slate-300">{a.activeApplications}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            a.overdueTasks > 0 ? "bg-amber-950 text-amber-300" : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {a.overdueTasks}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            a.messagesPending > 0 ? "bg-blue-950 text-blue-300" : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {a.messagesPending}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">{a.conversionRate}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      Sin asesores asignados actualmente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      </>}
      {/* Fecha de la respuesta autorizada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Fintera · Datos de los servicios autorizados del CRM</span>
        </div>
        <div>
          Última actualización: {data ? new Date(data.lastRefreshedAt).toLocaleString("es-CO") : "..."}
        </div>
      </div>
    </div>
  );
}
