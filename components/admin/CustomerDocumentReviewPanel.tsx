"use client";
import { useState } from "react";
import { useAdminDraft } from "./useAdminDraft";
import { useAdminPermissions } from "./AdminShell";
import { useUnsavedChanges } from "./useUnsavedChanges";
interface Requirement {
  id: string; revision: number; title: string; periodLabel: string | null; applicability: string;
  applicant: { firstName: string; lastName: string };
  evidence: Array<{ id: string; documentVersion: { id: string; originalFileName: string; scanStatus: string; asset: { currentVersionId: string | null } }; reviews: Array<{ status: string; publicReason: string }> }>;
}
export function CustomerDocumentReviewPanel({ applicationId, requirements, canLink, onRefresh }: { applicationId: string; requirements: Requirement[]; canLink: boolean; onRefresh: () => void }) {
  const permissions = useAdminPermissions();
  const canReview = permissions.includes("crm:document:review");
  const [draft, setDraft] = useAdminDraft(`customer-doc-review:${applicationId}`, { evidenceId: "", status: "", reason: "", linkEmail: "", linkReason: "" });
  const [pending, setPending] = useAdminDraft(`customer-doc-review-pending:${applicationId}`, false);
  const [message, setMessage] = useState("");
  useUnsavedChanges(!!(draft.reason || draft.linkEmail || draft.linkReason || pending));
  async function submit(body: object) {
    if (pending) return;
    setPending(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/crm/applications/${applicationId}/documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo confirmar. Actualice antes de repetir.");
      setDraft({ evidenceId: "", status: "", reason: "", linkEmail: "", linkReason: "" }); setMessage("Operación confirmada."); onRefresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Consulte el estado antes de repetir."); }
    finally { setPending(false); }
  }
  return <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-5" aria-labelledby="general-vivienda-documents">
    <div><h2 id="general-vivienda-documents" className="text-lg font-semibold text-white">Documentos generales de vivienda</h2><p className="text-sm text-slate-300">La verificación de seguridad no sustituye el dictamen humano. Estos soportes no declaran completo el expediente de un banco.</p></div>
    {!requirements.length && <p className="text-sm text-slate-300">El cliente debe confirmar su perfil documental para generar el checklist general.</p>}
    {requirements.map(requirement => <div key={requirement.id} className="border-t border-slate-700 pt-3 space-y-2">
      <h3 className="font-medium text-white">{requirement.title}{requirement.periodLabel ? ` · ${requirement.periodLabel}` : ""}</h3><p className="text-sm text-slate-300">{requirement.applicant.firstName} {requirement.applicant.lastName} · {requirement.applicability === "APPLIES" ? "Aplica" : requirement.applicability === "NOT_APPLICABLE" ? "No aplica" : "Información pendiente"}</p>
      {requirement.evidence.map(evidence => {
        const version = evidence.documentVersion; const current = version.asset.currentVersionId === version.id;
        return <div key={evidence.id} className="rounded-lg bg-slate-800 p-3 space-y-2 text-sm">
          <p className="break-all text-white">{version.originalFileName} · {current ? "Versión vigente" : "Historial"}</p><p className="text-slate-300">{evidence.reviews[0]?.status === "APPROVED" ? "Aprobado" : evidence.reviews[0]?.status === "REJECTED" ? "Requiere corrección" : "Pendiente de revisión"}</p>
          {evidence.reviews[0]?.publicReason && <p className="text-slate-300">Mensaje al cliente: {evidence.reviews[0].publicReason}</p>}
          {version.scanStatus === "CLEAN" && <a className="text-emerald-300 underline" href={`/api/admin/crm/applications/${applicationId}/documents/${version.id}/download`} target="_blank" rel="noreferrer">Abrir soporte seguro</a>}
          {canReview && current && version.scanStatus === "CLEAN" && <button disabled={pending} type="button" className="ml-3 underline text-white" onClick={() => setDraft({ ...draft, evidenceId: evidence.id, status: "", reason: "" })}>Registrar dictamen</button>}
          {draft.evidenceId === evidence.id && <form className="space-y-3" onSubmit={event => { event.preventDefault(); if (draft.status && draft.reason.trim()) void submit({ action: "REVIEW_CUSTOMER_DOCUMENT", customerRequirementId: requirement.id, documentVersionId: version.id, expectedRevision: requirement.revision, status: draft.status, publicReason: draft.reason }); }}>
            <label className="block">Dictamen<select required value={draft.status} disabled={pending} onChange={event => setDraft({ ...draft, status: event.target.value })} className="block w-full rounded bg-slate-950 p-2"><option value="">Seleccione el dictamen</option><option value="APPROVED">Aprobar</option><option value="REJECTED">Solicitar corrección</option></select></label>
            <label className="block">Mensaje visible para el cliente<textarea required maxLength={2000} value={draft.reason} disabled={pending} onChange={event => setDraft({ ...draft, reason: event.target.value })} className="block w-full rounded bg-slate-950 p-2" /></label>
            <button disabled={pending || !draft.status || !draft.reason.trim()} className="rounded bg-emerald-800 px-3 py-2 text-white">{pending ? "Confirmando…" : "Guardar dictamen"}</button>
            <button type="button" disabled={pending} className="ml-3 underline" onClick={() => { if (!draft.reason || window.confirm("¿Descartar el dictamen sin guardar?")) setDraft({ ...draft, evidenceId: "", reason: "", status: "" }); }}>Cancelar</button>
          </form>}
        </div>;
      })}
    </div>)}
    {canLink && <form className="border-t border-slate-700 pt-4 space-y-3" onSubmit={event => { event.preventDefault(); if (window.confirm("¿Ha verificado que esta cuenta corresponde al titular del expediente? La vinculación da acceso a sus solicitudes.")) void submit({ action: "LINK_CUSTOMER_IDENTITY", email: draft.linkEmail, reason: draft.linkReason, confirm: true }); }}>
      <h3 className="font-semibold text-white">Vinculación asistida del titular</h3><p className="text-sm text-slate-300">Sólo para una cuenta existente con correo principal verificado. Verifique la identidad del titular por el procedimiento interno antes de confirmar. No cambia una vinculación ya existente.</p>
      <label className="block text-sm">Correo principal verificado<input type="email" required value={draft.linkEmail} disabled={pending} onChange={event => setDraft({ ...draft, linkEmail: event.target.value })} className="block w-full rounded bg-slate-950 p-2" /></label>
      <label className="block text-sm">Motivo y comprobación de identidad<textarea required minLength={10} maxLength={2000} value={draft.linkReason} disabled={pending} onChange={event => setDraft({ ...draft, linkReason: event.target.value })} className="block w-full rounded bg-slate-950 p-2" /></label>
      <button disabled={pending} className="rounded bg-slate-700 px-3 py-2 text-white">Confirmar vinculación verificada</button>
    </form>}
    <p role="status" className="text-sm text-slate-200">{message}</p>
  </section>;
}
