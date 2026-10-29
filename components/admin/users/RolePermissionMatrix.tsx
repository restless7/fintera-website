"use client";

import { useState } from "react";
import { Check, LockKeyhole, Minus } from "lucide-react";
import type { AccessPolicy, AccessState } from "@/lib/auth/access-contracts";
import type { Permission, UserRole } from "@/lib/auth/types";
import { useAdminDraft } from "../useAdminDraft";
import { useUnsavedChanges } from "../useUnsavedChanges";
import { AccessModal } from "./AccessModal";
import { fieldClass, labelClass, permissionGroup, type CommitAccessChange } from "./access-ui";

type PolicyDraft = { policy: AccessPolicy; permissions: Permission[]; reason: string; reviewing: boolean };
const emptyPolicyDraft: PolicyDraft | null = null;
export function RolePermissionMatrix({ policies, catalog, busy, blocked, onCommit, onRefresh, error }: {
  policies: AccessPolicy[]; catalog: AccessState["permissionCatalog"]; busy: boolean; blocked: boolean;
  onCommit: CommitAccessChange; onRefresh: () => Promise<boolean>; error: string | null;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [draft, setDraft] = useAdminDraft<PolicyDraft | null>("access:policy-editor", emptyPolicyDraft);
  const selected = policies.find(policy => policy.role === selectedRole) || policies[0];
  const changed = !!draft && JSON.stringify([...draft.permissions].sort()) !== JSON.stringify([...draft.policy.permissions].sort());
  const dirty = !!draft && (changed || !!draft.reason);
  useUnsavedChanges(dirty || busy);
  const close = () => { if (!busy && (!dirty || window.confirm("¿Descartar los cambios de esta política?"))) setDraft(null); };
  const edit = (policy: AccessPolicy) => setDraft({ policy, permissions: [...policy.permissions], reason: "", reviewing: false });
  const groups = Array.from(new Set(catalog.map(entry => permissionGroup(entry.permission))));
  const reload = async () => {
    if (busy || dirty && !window.confirm("Se descartará este formulario para revisar el estado guardado. ¿Continuar?")) return;
    if (await onRefresh()) setDraft(null);
  };
  const save = async () => {
    if (!draft || !changed || draft.reason.trim().length < 5 || busy || blocked) return;
    const saved = await onCommit({ action: "updateRolePermissions", role: draft.policy.role, expectedRevision: draft.policy.revision, permissions: draft.permissions, reason: draft.reason }, "La política del rol se actualizó.");
    if (saved) setDraft(null);
  };
  const roleHeader = (policy: AccessPolicy) => <div className="space-y-2"><span className="block font-semibold text-slate-100">{policy.label}</span>{policy.editable ? <button type="button" className="text-xs font-normal text-emerald-200 underline disabled:opacity-50" disabled={busy || blocked} onClick={() => edit(policy)}>Configurar permisos</button> : <span className="inline-flex items-center gap-1 text-[10px] font-normal normal-case tracking-normal text-slate-400"><LockKeyhole size={12} />Política protegida</span>}</div>;
  return <section className="space-y-5" aria-labelledby="role-matrix-title">
    <div><h2 id="role-matrix-title" className="text-lg font-semibold text-white">Roles y permisos efectivos</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">Revisa las facultades de cada rol. Las asignaciones, los equipos y las condiciones del proceso siguen limitando las operaciones.</p></div>
    <div className="grid gap-3 xl:grid-cols-2">{policies.map(policy => <div key={policy.role} className="rounded-lg border border-slate-700 bg-slate-900 p-4"><div className="flex flex-wrap items-start justify-between gap-3">{roleHeader(policy)}<span className="text-xs text-slate-400">{policy.permissions.length} permisos</span></div><p className="mt-3 text-xs leading-relaxed text-slate-300">{policy.scopeDescription}</p>{policy.restriction && <p className="mt-2 text-xs leading-relaxed text-amber-200">{policy.restriction}</p>}</div>)}</div>
    <div className="hidden rounded-xl border border-slate-700 bg-slate-900 lg:block">
      <div tabIndex={0} role="region" aria-label="Matriz de permisos por rol; desplázate horizontalmente para revisar todos los roles" className="relative overflow-x-auto rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300">
        <table className="min-w-[1100px] text-left text-xs"><caption className="sr-only">Permisos vigentes por rol; una marca indica que el rol concede el permiso.</caption><thead className="border-b border-slate-700 bg-slate-950"><tr><th scope="col" className="min-w-[210px] p-4">Permiso</th>{policies.map(policy => <th key={policy.role} scope="col" className="min-w-[130px] p-4 normal-case tracking-normal">{policy.label}</th>)}</tr></thead><tbody>{catalog.map(entry => <tr key={entry.permission} className="border-b border-slate-800 last:border-0"><th scope="row" className="p-4 font-normal text-slate-200">{entry.label}<span className="mt-1 block text-[10px] text-slate-400">{permissionGroup(entry.permission)}</span></th>{policies.map(policy => <td key={policy.role} className="p-4">{policy.permissions.includes(entry.permission) ? <><Check size={17} aria-hidden="true" className="text-emerald-300" /><span className="sr-only">Concedido</span></> : <><Minus size={16} aria-hidden="true" className="text-slate-500" /><span className="sr-only">No concedido</span></>}</td>)}</tr>)}</tbody></table>
      </div>
    </div>
    <div className="admin-card lg:hidden"><label htmlFor="access-policy-role" className={labelClass}>Consultar permisos de un rol</label><select id="access-policy-role" className={fieldClass} value={selected?.role || ""} onChange={event => setSelectedRole(event.target.value as UserRole)}>{policies.map(policy => <option key={policy.role} value={policy.role}>{policy.label}</option>)}</select>{selected && <ul className="mt-4 space-y-3">{catalog.map(entry => <li key={entry.permission} className="flex items-start gap-3 text-sm">{selected.permissions.includes(entry.permission) ? <Check size={17} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" /> : <Minus size={17} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />}<span>{entry.label}<span className="sr-only">{selected.permissions.includes(entry.permission) ? ": concedido" : ": no concedido"}</span></span></li>)}</ul>}</div>
    {draft && <AccessModal title={"Permisos · " + draft.policy.label} description="El cambio afecta a todas las cuentas que usan este rol. Revisa también el alcance y las restricciones del proceso." busy={busy} onClose={close} wide>
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-100">{error}<button type="button" disabled={busy} onClick={() => { void reload(); }} className="mt-3 block underline">Descartar y actualizar datos</button></p>}
      <p className="mb-4 text-sm leading-relaxed text-slate-300">{draft.policy.scopeDescription}</p>
      {draft.reviewing ? <div className="space-y-5"><h3 className="font-semibold text-white">Confirma el cambio del rol</h3><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-emerald-800 p-3"><p className="text-xs font-semibold text-emerald-200">Se conceden</p><ul className="mt-2 space-y-2 text-sm">{catalog.filter(entry => draft.permissions.includes(entry.permission) && !draft.policy.permissions.includes(entry.permission)).map(entry => <li key={entry.permission}>{entry.label}</li>)}</ul>{!draft.permissions.some(permission => !draft.policy.permissions.includes(permission)) && <p className="mt-2 text-sm text-slate-300">Ningún permiso nuevo.</p>}</div><div className="rounded-lg border border-amber-800 p-3"><p className="text-xs font-semibold text-amber-200">Se retiran</p><ul className="mt-2 space-y-2 text-sm">{catalog.filter(entry => !draft.permissions.includes(entry.permission) && draft.policy.permissions.includes(entry.permission)).map(entry => <li key={entry.permission}>{entry.label}</li>)}</ul>{!draft.policy.permissions.some(permission => !draft.permissions.includes(permission)) && <p className="mt-2 text-sm text-slate-300">No se retiran permisos.</p>}</div></div><p className="whitespace-pre-wrap text-sm text-slate-300">{draft.reason}</p><div className="flex flex-wrap justify-end gap-3"><button type="button" className="admin-button" disabled={busy} onClick={() => setDraft(value => value ? { ...value, reviewing: false } : value)}>Volver a editar</button><button type="button" className="admin-button admin-button-primary disabled:opacity-50" disabled={busy || blocked || !changed} onClick={save}>{busy ? "Guardando…" : "Confirmar política"}</button></div></div> : <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (changed && draft.reason.trim().length >= 5) setDraft(value => value ? { ...value, reviewing: true } : value); }}>
        {groups.map(group => <fieldset key={group} disabled={busy || blocked} className="rounded-lg border border-slate-700 p-4"><legend className="px-1 text-xs font-semibold text-slate-300">{group}</legend><div className="grid gap-3 sm:grid-cols-2">{catalog.filter(entry => permissionGroup(entry.permission) === group).map(entry => <label key={entry.permission} className="flex items-start gap-3 text-sm"><input type="checkbox" checked={draft.permissions.includes(entry.permission)} onChange={event => setDraft(value => value ? { ...value, permissions: event.target.checked ? [...value.permissions, entry.permission] : value.permissions.filter(permission => permission !== entry.permission) } : value)} className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600" />{entry.label}</label>)}</div></fieldset>)}
        <div><label htmlFor="policy-change-reason" className={labelClass}>Motivo de la política</label><textarea id="policy-change-reason" className={fieldClass} required minLength={5} maxLength={500} rows={3} value={draft.reason} disabled={busy || blocked} onChange={event => setDraft(value => value ? { ...value, reason: event.target.value } : value)} /></div>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" className="admin-button" disabled={busy} onClick={close}>Cancelar</button><button type="submit" className="admin-button admin-button-primary disabled:opacity-50" disabled={busy || blocked || !changed || draft.reason.trim().length < 5}>Revisar política</button></div>
      </form>}
    </AccessModal>}
  </section>;
}
