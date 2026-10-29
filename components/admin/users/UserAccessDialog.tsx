"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { AccessApiError, AccessMembership, AccessPolicy, AccessState, AccessTeam, AccessUser, VerifiedAccessIdentity } from "@/lib/auth/access-contracts";
import type { UserRole } from "@/lib/auth/types";
import { AccessModal } from "./AccessModal";
import { accessErrorMessage, fieldClass, labelClass, membershipSignature, roleLabels } from "./access-ui";
import { useUnsavedChanges } from "../useUnsavedChanges";

export type UserEditorDraft = {
  mode: "create" | "edit"; original: AccessUser | null; email: string; identity: VerifiedAccessIdentity | null;
  role: UserRole | ""; isActive: boolean; memberships: AccessMembership[]; reason: string; reviewing: boolean;
};
export function userEditorDraft(user?: AccessUser): UserEditorDraft {
  return { mode: user ? "edit" : "create", original: user || null, email: user?.email || "", identity: null, role: user?.role || "", isActive: user?.isActive ?? true, memberships: user?.memberships.map(value => ({ ...value })) || [], reason: "", reviewing: false };
}
export function UserAccessDialog({ draft, setDraft, teams, policies, catalog, actorUserId, activeSuperAdminCount, busy, uncertain, error, onLookup, onCommit, onClose, onRefresh }: {
  draft: UserEditorDraft; setDraft: Dispatch<SetStateAction<UserEditorDraft | null>>; teams: AccessTeam[]; policies: AccessPolicy[];
  catalog: AccessState["permissionCatalog"]; actorUserId: string; activeSuperAdminCount: number; busy: boolean; uncertain: boolean; error: AccessApiError | null;
  onLookup: () => void; onCommit: () => void; onClose: () => void; onRefresh: () => void;
}) {
  const original = draft.original;
  const self = original?.id === actorUserId;
  const lastSuper = original?.role === "SUPER_ADMIN" && original.isActive && activeSuperAdminCount <= 1;
  const protectedAccess = !!self || !!lastSuper;
  const changed = !original || original.role !== draft.role || original.isActive !== draft.isActive || membershipSignature(original.memberships) !== membershipSignature(draft.memberships);
  const dirty = draft.mode === "create" ? !!(draft.email || draft.identity || draft.reason || draft.role) : changed || !!draft.reason;
  useUnsavedChanges(dirty || busy);
  const update = (patch: Partial<UserEditorDraft>) => setDraft(value => value ? { ...value, ...patch } : value);
  const policy = policies.find(value => value.role === draft.role);
  const canReview = changed && !!draft.role && draft.reason.trim().length >= 5 && (draft.mode === "edit" || !!draft.identity && !draft.identity.alreadyProvisioned) && !busy && !uncertain;
  const setMembership = (teamId: string, checked: boolean) => update({ memberships: checked ? [...draft.memberships, { teamId, isLead: false }] : draft.memberships.filter(value => value.teamId !== teamId) });
  const submit = () => { if (canReview) update({ reviewing: true }); };
  return <AccessModal title={draft.mode === "create" ? "Habilitar acceso" : "Administrar usuario"} description={draft.mode === "create" ? "Vincula una cuenta existente y verificada. El acceso interno requiere una asignación explícita." : "Revisa el rol, el estado y los equipos. El cambio se guardará junto con su motivo."} busy={busy} onClose={onClose} wide>
    {error && <div role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-100">{accessErrorMessage(error)}{(error.code === "STALE_REVISION" || uncertain) && <button type="button" onClick={onRefresh} disabled={busy} className="mt-3 block underline">Actualizar y revisar el estado</button>}</div>}
    {uncertain && !error && <p role="alert" className="mb-4 text-sm text-amber-200">No se pudo confirmar el resultado. Actualiza el estado antes de repetir la operación.</p>}
    {draft.reviewing ? <div className="space-y-5">
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-4">
        <h3 className="font-semibold text-white">Confirma el cambio de acceso</h3>
        <p className="mt-2 break-all text-sm text-slate-200">{draft.identity?.email || draft.email}</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-slate-400">Rol</dt><dd>{original ? roleLabels[original.role] + " → " : ""}{draft.role && roleLabels[draft.role]}</dd></div>
          <div><dt className="text-slate-400">Estado</dt><dd>{original ? (original.isActive ? "Activo" : "Inactivo") + " → " : ""}{draft.isActive ? "Activo" : "Inactivo"}</dd></div>
          <div><dt className="text-slate-400">Equipos</dt><dd>{draft.memberships.length ? draft.memberships.map(member => (teams.find(team => team.id === member.teamId)?.name || "Equipo") + (member.isLead ? " · Responsable" : "")).join(", ") : "Sin equipos internos"}</dd></div>
          <div><dt className="text-slate-400">Alcance</dt><dd className="leading-relaxed">{policy?.scopeDescription}</dd></div>
          <div><dt className="text-slate-400">Motivo</dt><dd className="whitespace-pre-wrap">{draft.reason}</dd></div>
        </dl>
      </div>
      {draft.role === "CLIENT" && <p className="text-sm leading-relaxed text-slate-300">Esta asignación no abre el panel interno ni vincula automáticamente expedientes del portal.</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className="admin-button" disabled={busy} onClick={() => update({ reviewing: false })}>Volver a editar</button><button type="button" className="admin-button admin-button-primary disabled:opacity-50" disabled={!canReview} onClick={onCommit}>{busy ? "Guardando…" : "Confirmar y guardar acceso"}</button></div>
    </div> : <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (draft.mode === "create" && !draft.identity) onLookup(); else submit(); }}>
      {draft.mode === "create" ? <div>
        <label htmlFor="access-email" className={labelClass}>Correo de la cuenta</label>
        <div className="flex flex-col gap-3 sm:flex-row"><input id="access-email" type="email" autoComplete="off" required value={draft.email} disabled={busy} onChange={event => update({ email: event.target.value, identity: null })} className={fieldClass} /><button type="button" onClick={onLookup} disabled={busy || !draft.email.trim()} className="admin-button shrink-0 disabled:opacity-50">{busy ? "Consultando…" : "Verificar cuenta"}</button></div>
        {error?.code === "IDENTITY_NOT_FOUND" && <SignupLink />}
        {draft.identity && <div role="status" className="mt-3 rounded-lg border border-slate-600 bg-slate-950 p-3 text-sm"><p className="font-semibold text-white">{[draft.identity.firstName, draft.identity.lastName].filter(Boolean).join(" ") || "Cuenta verificada"}</p><p className="mt-1 break-all text-slate-300">{draft.identity.email}</p><p className={"mt-2 " + (draft.identity.alreadyProvisioned ? "text-amber-200" : "text-emerald-200")}>{draft.identity.alreadyProvisioned ? "Esta cuenta ya está vinculada. Adminístrala desde la lista de usuarios." : "Identidad y correo principal verificados."}</p></div>}
      </div> : <div className="rounded-lg border border-slate-700 bg-slate-950 p-3"><p className="font-semibold text-white">{[original?.firstName, original?.lastName].filter(Boolean).join(" ") || original?.email}</p><p className="mt-1 break-all text-sm text-slate-300">{original?.email}</p></div>}
      {(draft.mode === "edit" || draft.identity && !draft.identity.alreadyProvisioned) && <>
        {protectedAccess && <p className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-100">{self ? "Tu rol y estado se protegen para que no pierdas el acceso desde tu propia sesión." : "Esta es la última cuenta activa con superadministración. Su rol y estado están protegidos."}</p>}
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="access-role" className={labelClass}>Rol</label><select id="access-role" required className={fieldClass} value={draft.role} disabled={busy || protectedAccess} onChange={event => update({ role: event.target.value as UserRole | "", ...(event.target.value === "CLIENT" ? { memberships: [] } : {}) })}><option value="">Selecciona un rol</option>{policies.map(value => <option key={value.role} value={value.role}>{value.label}</option>)}</select></div><label className="flex items-center gap-3 self-end rounded-lg border border-slate-700 p-3 text-sm"><input type="checkbox" checked={draft.isActive} disabled={busy || protectedAccess || draft.mode === "create"} onChange={event => update({ isActive: event.target.checked })} className="h-4 w-4 accent-emerald-600" />Acceso activo</label></div>
        {policy && <div className="rounded-lg bg-slate-950 p-3 text-sm leading-relaxed text-slate-300"><p>{policy.scopeDescription}</p>{policy.restriction && <p className="mt-2">{policy.restriction}</p>}<details className="mt-3"><summary className="cursor-pointer text-emerald-200">Ver los {policy.permissions.length} permisos del rol</summary><ul className="mt-3 list-disc space-y-1 pl-5">{catalog.filter(entry => policy.permissions.includes(entry.permission)).map(entry => <li key={entry.permission}>{entry.label}</li>)}</ul>{!policy.permissions.length && <p className="mt-2">Este rol no concede permisos internos.</p>}</details><p className="mt-2 text-xs text-slate-400">Las condiciones de cada operación siguen aplicando.</p></div>}
        <fieldset disabled={busy || draft.role === "CLIENT"}><legend className={labelClass}>Equipos y responsabilidad</legend>{draft.role === "CLIENT" ? <p className="text-sm text-slate-300">Las cuentas de cliente no pertenecen a equipos internos.</p> : teams.length ? <div className="grid gap-2 sm:grid-cols-2">{teams.map(team => { const member = draft.memberships.find(value => value.teamId === team.id); return <div key={team.id} className="rounded-lg border border-slate-700 p-3"><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={!!member} onChange={event => setMembership(team.id, event.target.checked)} className="h-4 w-4 accent-emerald-600" /><span>{team.name}</span></label>{member && <label className="mt-3 flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={member.isLead} onChange={event => update({ memberships: draft.memberships.map(value => value.teamId === team.id ? { ...value, isLead: event.target.checked } : value) })} className="h-4 w-4 accent-emerald-600" />Responsable del equipo</label>}</div>; })}</div> : <p className="text-sm text-slate-300">No hay equipos creados. El acceso puede habilitarse sin pertenencia a un equipo.</p>}<p className="mt-3 text-xs leading-relaxed text-slate-400">La responsabilidad identifica la función dentro del equipo; el alcance efectivo también depende del rol y de las asignaciones.</p></fieldset>
        <div><label htmlFor="access-reason" className={labelClass}>Motivo del cambio</label><textarea id="access-reason" value={draft.reason} onChange={event => update({ reason: event.target.value })} required minLength={5} maxLength={500} rows={3} disabled={busy} className={fieldClass} placeholder="Explica por qué se concede o modifica este acceso." /></div>
      </>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-700 pt-4"><button type="button" onClick={onClose} disabled={busy} className="admin-button">Cancelar</button>{(draft.mode === "edit" || draft.identity && !draft.identity.alreadyProvisioned) && <button type="submit" disabled={!canReview} className="admin-button admin-button-primary disabled:opacity-50">Revisar cambio</button>}</div>
    </form>}
  </AccessModal>;
}

function SignupLink() {
  const [message, setMessage] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(new URL("/sign-up", window.location.origin).href); setMessage("Enlace copiado."); } catch { setMessage("Copia la dirección desde el enlace de registro público."); }
  };
  return <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><a href="/sign-up" target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">Abrir registro público</a><button type="button" className="admin-button" onClick={copy}>Copiar enlace de registro</button><span role="status">{message}</span></div>;
}
