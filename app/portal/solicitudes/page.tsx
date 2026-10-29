"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Clock,
  ArrowRight,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface BankCaseSummary {
  id: string;
  bankId: string;
  productType: string;
  publicStageTitle: string;
  publicExplanation: string;
  badgeVariant: string;
  actionRequiredNote: string | null;
  filingNumber: string | null;
  lastUpdated: string;
}

interface ApplicationItem {
  id: string;
  fileNumber: string;
  productCategory: string;
  requestedAmount: number;
  termMonths: number;
  createdAt: string;
  status: string;
  overallPublicStage: string;
  overallProgressPercentage: number;
  assignedAdvisor: {
    name: string;
    email: string;
    phone: string;
  } | null;
  bankCases: BankCaseSummary[];
  actionRequiredAlerts: string[];
}

export default function SolicitudesPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/portal/dashboard");
        if (!res.ok) {
          throw new Error("No se pudo cargar la lista de solicitudes");
        }
        const json = await res.json();
        setApplications(json.applications || []);
      } catch (err: any) {
        setError(err.message || "Error consultando solicitudes.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.overallPublicStage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.bankCases.some((b) => b.bankId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "ACTION_REQUIRED") return app.actionRequiredAlerts.length > 0;
    if (selectedFilter === "STUDY") return app.overallPublicStage.includes("Estudio");
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Mis Solicitudes Hipotecarias
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consulte el estado verificado, avance en bancos y requerimientos de cada uno de sus trámites.
        </p>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por radicado, banco o estado..."
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("ALL")}
            className={selectedFilter === "ALL" ? "bg-slate-900 text-white" : ""}
          >
            Todas ({applications.length})
          </Button>
          <Button
            variant={selectedFilter === "ACTION_REQUIRED" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("ACTION_REQUIRED")}
            className={selectedFilter === "ACTION_REQUIRED" ? "bg-amber-600 text-white" : ""}
          >
            Acción Requerida
          </Button>
        </div>
      </div>

      {/* Estado de Carga / Error */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Clock className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
          <p className="text-sm">Cargando sus solicitudes autorizadas...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No se encontraron solicitudes</h3>
          <p className="text-sm text-slate-500 mt-1">
            {applications.length === 0
              ? "Aún no tiene radicados hipotecarios vinculados a su cuenta."
              : "Ninguna solicitud coincide con el criterio de búsqueda."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <Card key={app.id} className="border-slate-200 hover:border-slate-300 transition-all shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {app.fileNumber}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                        {app.productCategory}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 mt-1">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      }).format(app.requestedAmount)}{" "}
                      a {app.termMonths} meses
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/portal/solicitudes/${app.id}`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                        Ver Expediente y Línea de Tiempo
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Alertas */}
                {app.actionRequiredAlerts.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Atención requerida:</p>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        {app.actionRequiredAlerts.map((alt, i) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Subcasos bancarios */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Estudio Simultáneo por Banco
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {app.bankCases.map((bc) => (
                      <div
                        key={bc.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800 text-sm">{bc.bankId}</span>
                          <span className="text-[10px] font-mono text-slate-500">{bc.productType}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 mb-1">{bc.publicStageTitle}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{bc.publicExplanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie con asesor */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Radicado el {new Date(app.createdAt).toLocaleDateString("es-CO")}</span>
                  </div>
                  {app.assignedAdvisor && (
                    <div className="flex items-center gap-1.5">
                      <span>Asesor:</span>
                      <span className="font-semibold text-slate-800">{app.assignedAdvisor.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
