"use client";

import { useId } from "react";
import { Check, ChevronDown, LoaderCircle, PencilLine } from "lucide-react";
import type { CustomerDocumentWorkspaceDTO, PortalApplicantDTO, ProfileUpdateInput, ViviendaDocumentFacts } from "@/lib/portal/portal-contracts";
import { usePortalDraft, usePortalUnsavedChanges } from "./PortalDraftStore";
import { PortalApiFailure, portalErrorMessage, portalRequest } from "./portal-api";
import { PortalStatus } from "./PortalPrimitives";

type ProfileDraft = { facts: ViviendaDocumentFacts; expectedRevision: number } | null;
const noDraft: ProfileDraft = null;
const noError: string | null = null;
const facts = (profile: ViviendaDocumentFacts): ViviendaDocumentFacts => ({ occupation: profile.occupation, declaresIncomeTax: profile.declaresIncomeTax, propertyRentalIncome: profile.propertyRentalIncome, vehicleRentalIncome: profile.vehicleRentalIncome, chamberOfCommerceApplies: profile.chamberOfCommerceApplies, annualFinancialStatementsApply: profile.annualFinancialStatementsApply });

function ConditionalAnswer({ id, label, value, disabled, onChange }: { id: string; label: string; value: boolean | null; disabled: boolean; onChange: (value: boolean | null) => void }) {
  return <div><label htmlFor={id} className="portal-label">{label}</label><select id={id} className="portal-field" value={value === null ? "unknown" : value ? "yes" : "no"} disabled={disabled} onChange={event => onChange(event.target.value === "unknown" ? null : event.target.value === "yes")}><option value="unknown">Sin confirmar</option><option value="yes">Sí</option><option value="no">No</option></select></div>;
}

export function DocumentProfileForm({ workspace, applicant, onUpdated }: { workspace: CustomerDocumentWorkspaceDTO; applicant: PortalApplicantDTO; onUpdated: (value: CustomerDocumentWorkspaceDTO) => void }) {
  const id = useId();
  const key = `portal:${workspace.sessionScopeKey}:${workspace.applicationId}:${applicant.id}:profile`;
  const [draft, setDraft] = usePortalDraft<ProfileDraft>(key + ":draft", noDraft);
  const [pending, setPending] = usePortalDraft(key + ":pending", false);
  const [error, setError] = usePortalDraft<string | null>(key + ":error", noError);
  const [needsRefresh, setNeedsRefresh] = usePortalDraft(key + ":needs-refresh", false);
  const [success, setSuccess] = usePortalDraft(key + ":success", false);
  const value = draft?.facts || facts(applicant.profile);
  const dirty = !!draft && JSON.stringify(draft.facts) !== JSON.stringify(facts(applicant.profile));
  const initialPreparation = applicant.profile.savedAt === null;
  const disabled = pending || needsRefresh || !applicant.canEditProfile || !workspace.permissions.canEditProfile;
  usePortalUnsavedChanges(dirty || pending);
  const update = (patch: Partial<ViviendaDocumentFacts>) => { setSuccess(false); setDraft(current => ({ expectedRevision: current?.expectedRevision ?? applicant.profile.revision, facts: { ...(current?.facts || facts(applicant.profile)), ...patch } })); };
  const refresh = async () => {
    if (pending || dirty && !window.confirm("Se descartarán estas respuestas para consultar la información guardada. ¿Continuar?")) return;
    setPending(true);
    try { const fresh = await portalRequest<CustomerDocumentWorkspaceDTO>("/api/portal/documents/requirements?applicationId=" + encodeURIComponent(workspace.applicationId)); setDraft(null); setNeedsRefresh(false); setError(null); onUpdated(fresh); }
    catch (error: unknown) { setError(portalErrorMessage(error)); }
    finally { setPending(false); }
  };
  const save = async () => {
    if (disabled || !dirty && !initialPreparation) return;
    setPending(true); setError(null); setSuccess(false);
    try {
      const input: ProfileUpdateInput = { ...value, applicationId: workspace.applicationId, applicantId: applicant.id, expectedRevision: draft?.expectedRevision ?? applicant.profile.revision };
      const fresh = await portalRequest<CustomerDocumentWorkspaceDTO>("/api/portal/documents/profile", { method: "POST", body: JSON.stringify(input) });
      setDraft(null); setSuccess(true); onUpdated(fresh);
    } catch (error: unknown) {
      setError(portalErrorMessage(error));
      if (!(error instanceof PortalApiFailure) || error.status === 409 || error.status >= 500 || error.code === "UNCONFIRMED_RESPONSE") setNeedsRefresh(true);
    } finally { setPending(false); }
  };
  const unresolved = value.occupation === "UNKNOWN" || value.occupation === "ASALARIADO" && value.declaresIncomeTax === null || value.occupation === "INDEPENDIENTE" && [value.propertyRentalIncome, value.vehicleRentalIncome, value.chamberOfCommerceApplies, value.annualFinancialStatementsApply].some(answer => answer === null);
  return <details className="portal-card portal-profile-card" open={applicant.profile.occupation === "UNKNOWN" || !!draft || !!error ? true : undefined}><summary><span className="flex min-w-0 items-center gap-3"><PencilLine size={19} aria-hidden="true" /><span><strong>Tu actividad y los documentos que aplican</strong><span className="block mt-1 text-xs text-slate-600">Respuestas de {applicant.name}</span></span></span><span className="flex items-center gap-3"><PortalStatus tone={unresolved ? "warning" : "success"}>{unresolved ? "Por confirmar" : "Respuestas registradas"}</PortalStatus><ChevronDown size={17} aria-hidden="true" /></span></summary><form className="mt-6 space-y-5" onSubmit={event => { event.preventDefault(); void save(); }}><p className="portal-card-description">Estas respuestas preparan tu lista general de vivienda. Si no conoces una condición, déjala sin confirmar y consúltala con tu asesor.</p><div className="portal-form-grid"><div><label htmlFor={id + "occupation"} className="portal-label">Actividad económica</label><select id={id + "occupation"} className="portal-field" value={value.occupation} disabled={disabled} onChange={event => update({ occupation: event.target.value as ViviendaDocumentFacts["occupation"] })}><option value="UNKNOWN">Sin confirmar</option><option value="ASALARIADO">Empleado / asalariado</option><option value="INDEPENDIENTE">Independiente</option></select></div>{value.occupation === "ASALARIADO" && <ConditionalAnswer id={id + "tax"} label="¿Declaras renta?" value={value.declaresIncomeTax} disabled={disabled} onChange={answer => update({ declaresIncomeTax: answer })} />}{value.occupation === "INDEPENDIENTE" && <><ConditionalAnswer id={id + "property"} label="¿Recibes ingresos por arrendamiento de inmuebles?" value={value.propertyRentalIncome} disabled={disabled} onChange={answer => update({ propertyRentalIncome: answer })} /><ConditionalAnswer id={id + "vehicle"} label="¿Recibes ingresos por alquiler de vehículos?" value={value.vehicleRentalIncome} disabled={disabled} onChange={answer => update({ vehicleRentalIncome: answer })} /><ConditionalAnswer id={id + "chamber"} label="¿Te aplica presentar Cámara de Comercio?" value={value.chamberOfCommerceApplies} disabled={disabled} onChange={answer => update({ chamberOfCommerceApplies: answer })} /><ConditionalAnswer id={id + "annual"} label="¿Te aplica presentar estados financieros anuales?" value={value.annualFinancialStatementsApply} disabled={disabled} onChange={answer => update({ annualFinancialStatementsApply: answer })} /></>}</div>{error && <div role="alert" className="portal-notice portal-notice-danger">{error}{needsRefresh && <button type="button" className="portal-text-link mt-3 block" disabled={pending} onClick={() => { void refresh(); }}>Consultar respuestas guardadas</button>}</div>}{success && <p role="status" className="portal-notice portal-notice-success"><Check size={16} aria-hidden="true" />Tus respuestas se guardaron. La lista refleja la información registrada.</p>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4"><p className="text-xs text-slate-600">Guardar estas respuestas actualiza tu lista de documentos.</p>{applicant.canEditProfile && workspace.permissions.canEditProfile && <button type="submit" className="portal-button" disabled={disabled || !dirty && !initialPreparation}>{pending && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}{pending ? "Guardando…" : initialPreparation ? "Preparar mi lista" : "Guardar respuestas"}</button>}</div></form></details>;
}
