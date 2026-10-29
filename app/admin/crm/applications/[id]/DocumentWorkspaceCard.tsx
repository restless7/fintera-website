"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { safeQueueReturn } from "@/components/admin/CaseNavigation";

interface DocumentWorkspaceCardProps {
  applicationId: string;
  bankApplications: Array<{
    id: string;
    bankId: string;
    productType: string;
    stage: string;
  }>;
}

export default function DocumentWorkspaceCard({
  applicationId,
  bankApplications,
}: DocumentWorkspaceCardProps) {
  const query = useSearchParams();
  const returnTo = safeQueueReturn(query.get("returnTo"));
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/crm/applications/${applicationId}/documents`);
        if (!res.ok) throw new Error("No se pudo consultar el estado documental.");
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (err) {
        if (isMounted) setError("No se pudo consultar el estado documental. Abra Documentos para reintentar.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  const bankReadiness = data?.bankReadiness || {};
  const totalAssets = data?.assets?.length || 0;
  const totalRequirements = data?.requirements?.length || 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">
            Documentación del expediente
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ACCESO PROTEGIDO
          </span>
        </div>

        <Link
          href={`/admin/crm/applications/${applicationId}/documents?returnTo=${encodeURIComponent(returnTo)}`}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
        >
          <span>Abrir Gestor Documental</span>
          <span>→</span>
        </Link>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Gestión de archivos inmutables, escaneo antivirus completo, reutilización entre bancos y validación estricta de prerrequisitos antes de radicar.
      </p>

      {error && <p role="alert" className="mb-4 rounded-lg border border-amber-700 bg-amber-950/30 p-3 text-xs text-amber-200">{error}</p>}
      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Archivos Físicos
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {loading ? "…" : error ? "No disponible" : totalAssets}
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Requisitos Asignados
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {loading ? "…" : error ? "No disponible" : totalRequirements}
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Cifrado en Reposo
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-1">
            AES-256-GCM
          </div>
        </div>
      </div>

      {/* Estado de Radicación por Banco */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Disponibilidad Documental para Radicación Bancaria:
        </div>

        {bankApplications.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Sin subexpedientes bancarios radicados en este expediente.
          </p>
        ) : (
          bankApplications.map((bankApp) => {
            const readiness = bankReadiness[bankApp.id];
            const isReady = readiness?.isReady;

            return (
              <div
                key={bankApp.id}
                className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {bankApp.bankId.toUpperCase()}
                  </span>
                  <span className="text-slate-500">· {bankApp.productType}</span>
                </div>

                <div className="flex items-center gap-2">
                  {loading ? (
                    <span className="text-slate-500 text-[11px]">Verificando...</span>
                  ) : readiness ? (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isReady
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {isReady ? "LISTO PARA RADICAR" : "DOCUMENTACIÓN PENDIENTE"}
                    </span>
                  ) : (
                    <span className="text-amber-500/80 text-[10px] font-semibold">
                      Requisitos sin materializar
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
