"use client";

import { useAdminDraft } from "@/components/admin/useAdminDraft";
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges";
import React, { useState } from "react";
import { CANONICAL_PUBLIC_STAGE_MAP } from "@/lib/portal/bank-stage-mapping";
import { useRouter } from "next/navigation";

interface BankCaseProps {
  applicationId: string;
  canManage?: boolean;
  allowedTargetStages?: string[];
  bankApp: {
    id: string;
    bankId: string;
    productType: string;
    stage: string;
    version: number;
    workflowVersion: string;
    customerVisibleStage: string;
    bankFilingNumber: string | null;
    bankOfficialName: string | null;
    bankOfficialContact: string | null;
    approvedAmount: number | null;
    approvedRateEA: number | null;
    approvedTermMonths: number | null;
    slaDeadline: string | null;
    slaStatus: string;
    rejectionReason: string | null;
    notes: string | null;
    transitions?: Array<{
      id: string;
      fromStage: string;
      toStage: string;
      workflowVersion: string;
      reason: string;
      evidenceType: string | null;
      evidenceReference: string | null;
      transitionedAt: string;
    }>;
  };
}

export default function BankWorkflowCard({ applicationId, bankApp, canManage = false, allowedTargetStages = [] }: BankCaseProps) {
  const stageLabel = (stage: string) => CANONICAL_PUBLIC_STAGE_MAP[stage as keyof typeof CANONICAL_PUBLIC_STAGE_MAP]?.publicTitle || stage.replace(/_/g, " ");
  const router = useRouter();
  const draftKey = `bank:${applicationId}:${bankApp.id}:`;
  const [isTransitioning, setIsTransitioning] = useAdminDraft(draftKey + "isTransitioning", false);
  const [selectedTargetStage, setSelectedTargetStage] = useAdminDraft<string | null>(draftKey + "selectedTargetStage", null);
  const [reason, setReason] = useAdminDraft(draftKey + "reason", "");
  const [evidenceReference, setEvidenceReference] = useAdminDraft(draftKey + "evidenceReference", "");
  const [bankFilingNumber, setBankFilingNumber] = useAdminDraft(draftKey + "bankFilingNumber", bankApp.bankFilingNumber || "");
  const [approvedAmount, setApprovedAmount] = useAdminDraft<string>(draftKey + "approvedAmount", bankApp.approvedAmount ? String(bankApp.approvedAmount) : "");
  const [approvedRateEA, setApprovedRateEA] = useAdminDraft<string>(draftKey + "approvedRateEA", bankApp.approvedRateEA ? String(bankApp.approvedRateEA) : "");
  const [rejectionReason, setRejectionReason] = useAdminDraft(draftKey + "rejectionReason", "");
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useAdminDraft(draftKey + "loading", false);

  useUnsavedChanges(isTransitioning && (!!reason || !!evidenceReference || !!rejectionReason || loading || bankFilingNumber !== (bankApp.bankFilingNumber || "") || approvedAmount !== (bankApp.approvedAmount ? String(bankApp.approvedAmount) : "") || approvedRateEA !== (bankApp.approvedRateEA ? String(bankApp.approvedRateEA) : "")));

  // Server supplies role-permitted targets from the canonical workflow registry.
  // Prerequisites and mutation authorization remain enforced independently by the API.
  const nextStages = allowedTargetStages;

  const getSlaBadge = (status: string) => {
    switch (status) {
      case "BREACHED":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">SLA VENCIDO</span>;
      case "AT_RISK":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">SLA EN RIESGO</span>;
      case "PAUSED":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">SLA PAUSADO</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">SLA A TIEMPO</span>;
    }
  };

  const discardDraft = () => { if (loading) return; setIsTransitioning(false); setSelectedTargetStage(null); setReason(""); setEvidenceReference(""); setRejectionReason(""); setBankFilingNumber(bankApp.bankFilingNumber || ""); setApprovedAmount(bankApp.approvedAmount ? String(bankApp.approvedAmount) : ""); setApprovedRateEA(bankApp.approvedRateEA ? String(bankApp.approvedRateEA) : ""); };

  const handleOpenTransition = (target: string) => {
    setSelectedTargetStage(target);
    setErrorMessage(null);
    setReason("");
    setEvidenceReference("");
    setIsTransitioning(true);
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !selectedTargetStage || !nextStages.includes(selectedTargetStage)) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/bank-cases`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankApplicationId: bankApp.id,
          stage: selectedTargetStage,
          expectedVersion: bankApp.version,
          reason,
          evidenceReference,
          evidenceType: evidenceReference ? "RADICADO_O_SOPORTE" : undefined,
          bankFilingNumber: bankFilingNumber || undefined,
          approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
          approvedRateEA: approvedRateEA ? Number(approvedRateEA) : undefined,
          rejectionReason: rejectionReason || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Error al ejecutar transición");
      }

      setIsTransitioning(false);
      setSelectedTargetStage(null);
      setReason("");
      setEvidenceReference("");
      setRejectionReason("");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
      <div className="flex min-w-0 flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3">
        <div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-extrabold text-lg text-white uppercase tracking-wider">
              {bankApp.bankId.replace(/-/g, " ")}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
              {bankApp.productType}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800/40">
              WF {bankApp.workflowVersion} · v{bankApp.version}
            </span>
          </div>

          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Radicado: <strong className="text-slate-200 font-mono">{bankApp.bankFilingNumber || "Pendiente"}</strong>
            </span>
            {bankApp.approvedAmount && (
              <span>
                Aprobado: <strong className="text-emerald-400 font-mono">${Math.round(bankApp.approvedAmount).toLocaleString("es-CO")}</strong>
              </span>
            )}
            {bankApp.approvedRateEA && (
              <span>
                Tasa E.A.: <strong className="text-emerald-400">{(bankApp.approvedRateEA * 100).toFixed(2)}%</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col 2xl:items-end gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {getSlaBadge(bankApp.slaStatus)}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {stageLabel(bankApp.stage)}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Visible al cliente: <span className="text-slate-300 font-medium">{bankApp.customerVisibleStage}</span>
          </span>
          {bankApp.slaDeadline && (
            <span className="text-[11px] text-slate-500 font-mono">
              Límite SLA: {new Date(bankApp.slaDeadline).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
        </div>
      </div>

      {/* Botones de Próximas Acciones Permitidas */}
      {canManage && nextStages.length > 0 && (
        <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Transiciones Permitidas:</span>
          {nextStages.map((target) => (
            <button
              key={target}
              disabled={loading}
              onClick={() => handleOpenTransition(target)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
            >
              Avanzar a {stageLabel(target)}
            </button>
          ))}

        </div>
      )}

          {bankApp.transitions && bankApp.transitions.length > 0 && (
            <button
              aria-expanded={showHistory}
              onClick={() => setShowHistory(!showHistory)}
              className="text-left text-xs text-emerald-400 hover:underline"
            >
              {showHistory ? "Ocultar Auditoría" : `Ver Historial (${bankApp.transitions.length})`}
            </button>
          )}

      {/* Historial de Transiciones */}
      {showHistory && bankApp.transitions && (
        <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-slate-300 mb-1">Trazabilidad de Transiciones (Auditoría Inmutable):</div>
          {bankApp.transitions.map((t) => (
            <div key={t.id} className="pb-2 border-b border-slate-800/80 last:border-0 last:pb-0">
              <div className="flex justify-between text-slate-400">
                <span className="font-semibold text-slate-200">{stageLabel(t.fromStage)} → {stageLabel(t.toStage)}</span>
                <span className="font-mono">{new Date(t.transitionedAt).toLocaleString("es-CO")}</span>
              </div>
              <p className="text-slate-400 mt-0.5">Motivo: {t.reason}</p>
              {t.evidenceReference && (
                <p className="text-slate-500">Soporte: {t.evidenceReference}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal / Formulario de Transición */}
      {isTransitioning && selectedTargetStage && (
        <form onSubmit={handleExecuteTransition} className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
          <p className="text-xs text-slate-400">Borrador local: se conserva al volver a este expediente durante esta sesión.</p>
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-white">
              Transicionar a: <span className="text-emerald-400">{stageLabel(selectedTargetStage)}</span>
            </h4>
            <button
              type="button"
              disabled={loading}
              onClick={discardDraft}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Cancelar
            </button>
          </div>

          {errorMessage && (
            <div role="alert" className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor={`${bankApp.id}-field-1`} className="block text-xs text-slate-300 mb-1">Motivo / Justificación Operativa (Obligatorio)</label>
            <input id={`${bankApp.id}-field-1`}
              type="text"
              required
              minLength={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describa el motivo de la transición o dictamen del banco..."
              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          {/* Campos contextuales según etapa */}
          {selectedTargetStage === "STAGE_04_BANK_SUBMITTED" && (
            <div>
              <label htmlFor={`${bankApp.id}-field-2`} className="block text-xs text-slate-300 mb-1">Número de Radicado Oficial del Banco (Obligatorio)</label>
            <input id={`${bankApp.id}-field-2`}
                type="text"
                required
                value={bankFilingNumber}
                onChange={(e) => setBankFilingNumber(e.target.value)}
                placeholder="Ej. BCOL-RAD-98214"
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          )}

          {selectedTargetStage === "STAGE_07_DEFINITIVE_APPROVAL" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`${bankApp.id}-field-3`} className="block text-xs text-slate-300 mb-1">Monto Aprobado COP</label>
            <input id={`${bankApp.id}-field-3`}
                  type="number"
                  required
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  placeholder="300000000"
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label htmlFor={`${bankApp.id}-field-4`} className="block text-xs text-slate-300 mb-1">Tasa Aprobada E.A. (ej: 0.1170)</label>
            <input id={`${bankApp.id}-field-4`}
                  type="number"
                  step="0.0001"
                  required
                  value={approvedRateEA}
                  onChange={(e) => setApprovedRateEA(e.target.value)}
                  placeholder="0.1170"
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
          )}

          {selectedTargetStage === "STAGE_BANK_REJECTED" && (
            <div>
              <label htmlFor={`${bankApp.id}-field-5`} className="block text-xs text-slate-300 mb-1">Causal de Rechazo del Banco (Obligatorio)</label>
            <input id={`${bankApp.id}-field-5`}
                type="text"
                required
                minLength={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej. Capacidad de endeudamiento superada / Huella de consulta"
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          )}

          <div>
            <label htmlFor={`${bankApp.id}-field-6`} className="block text-xs text-slate-300 mb-1">Referencia o Constancia de Soporte (Opcional/Recomendado)</label>
            <input id={`${bankApp.id}-field-6`}
              type="text"
              value={evidenceReference}
              onChange={(e) => setEvidenceReference(e.target.value)}
              placeholder="Carta del banco, ticket de radicación, etc."
              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={discardDraft}
              className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
            >
              {loading ? "Transicionando..." : "Confirmar Transición"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
