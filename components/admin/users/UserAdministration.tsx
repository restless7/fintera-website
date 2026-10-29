"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Search, ShieldCheck, UserPlus } from "lucide-react";
import { ACCESS_ENDPOINT, type AccessApiError, type AccessMutation, type AccessMutationResult, type AccessState } from "@/lib/auth/access-contracts";
import { PageHeader } from "../PageHeader";
import { useAdminDraft } from "../useAdminDraft";
import { UserAccessDialog, userEditorDraft, type UserEditorDraft } from "./UserAccessDialog";
import { RolePermissionMatrix } from "./RolePermissionMatrix";
import { TeamAdministration } from "./TeamAdministration";
import { UserAuditLog } from "./UserAuditLog";
import { accessErrorMessage, fieldClass, labelClass, membershipSignature, roleLabels } from "./access-ui";

const tabs = [
  { id: "users", label: "Usuarios" }, { id: "roles", label: "Roles y permisos" },
  { id: "teams", label: "Equipos" }, { id: "audit", label: "Auditoría" },
] as const;
type Snapshot = { key: string; data: AccessState | null; error: AccessApiError | null };
type Notice = { kind: "success" | "warning"; message: string } | null;
const noUserDraft: UserEditorDraft | null = null;
const noError: AccessApiError | null = null;
const noNotice: Notice = null;
class AccessRequestError extends Error {
  constructor(public detail: AccessApiError) { super(detail.error); }
}
async function readState(query: string, signal?: AbortSignal): Promise<AccessState> {
  const response = await fetch(ACCESS_ENDPOINT + "?" + query, { cache: "no-store", signal });
  const value = await response.json();
  if (!response.ok) throw new AccessRequestError(value as AccessApiError);
  return value as AccessState;
}
async function postChange(mutation: AccessMutation): Promise<AccessMutationResult> {
  const response = await fetch(ACCESS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mutation) });
  const value = await response.json();
  if (!response.ok) throw new AccessRequestError(value as AccessApiError);
  if (value.success !== true) throw new Error("Unconfirmed response");
  return value as AccessMutationResult;
}
function requestError(error: unknown): AccessApiError {
  return error instanceof AccessRequestError ? error.detail : { code: "UNAVAILABLE", error: "No se pudo confirmar el resultado. Actualiza el estado antes de repetir el cambio." };
}

export function UserAdministration() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = tabs.find(value => value.id === params.get("tab"))?.id || "users";
  const search = params.get("search") || "";
  const role = params.get("role") || "all";
  const status = params.get("status") || "all";
  const rawPage = Number(params.get("page") || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const requestQuery = new URLSearchParams({ search, role, status, page: String(page) }).toString();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [refreshVersion, setRefreshVersion] = useAdminDraft("access:refresh-version", 0);
  const [busy, setBusy] = useAdminDraft("access:mutation-pending", false);
  const [uncertain, setUncertain] = useAdminDraft("access:mutation-uncertain", false);
  const [error, setError] = useAdminDraft<AccessApiError | null>("access:mutation-error", noError);
  const [notice, setNotice] = useAdminDraft<Notice>("access:notice", noNotice);
  const [draft, setDraft] = useAdminDraft<UserEditorDraft | null>("access:user-editor", noUserDraft);
  const [refreshing, setRefreshing] = useState(false);
  const data = snapshot?.key === requestQuery ? snapshot.data : null;
  const loading = !snapshot || snapshot.key !== requestQuery;
  const loadError = snapshot?.key === requestQuery ? snapshot.error : null;

  useEffect(() => {
    const controller = new AbortController();
    void readState(requestQuery, controller.signal).then(value => {
      if (!controller.signal.aborted) setSnapshot({ key: requestQuery, data: value, error: null });
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setSnapshot({ key: requestQuery, data: null, error: requestError(failure) });
    });
    return () => controller.abort();
  }, [requestQuery, refreshVersion]);

  const href = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => { if (!value || value === "all" || key === "page" && value === "1") next.delete(key); else next.set(key, value); });
    return pathname + (next.size ? "?" + next.toString() : "");
  };
  const commit = async (mutation: AccessMutation, success: string) => {
    if (busy || uncertain || error?.code === "STALE_REVISION") return false;
    setBusy(true); setError(null); setNotice(null);
    let acknowledged = false;
    try {
      await postChange(mutation);
      acknowledged = true;
      const fresh = await readState(requestQuery);
      setSnapshot({ key: requestQuery, data: fresh, error: null });
      setRefreshVersion(value => value + 1);
      setNotice({ kind: "success", message: success });
      return true;
    } catch (failure: unknown) {
      if (acknowledged) {
        setUncertain(true);
        setNotice({ kind: "warning", message: "El cambio fue confirmado, pero no pudimos actualizar la vista. Recarga el estado antes de hacer otro cambio." });
        return true;
      }
      setError(requestError(failure));
      if (!(failure instanceof AccessRequestError) || failure.detail.code === "UNAVAILABLE") {
        setUncertain(true);
        setNotice({ kind: "warning", message: "No se pudo confirmar el resultado. Actualiza el estado antes de repetir la operación." });
      }
      return false;
    } finally { setBusy(false); }
  };
  const refresh = async () => {
    if (busy) return false;
    if (draft && !window.confirm("Se descartará este formulario para revisar el estado guardado. ¿Continuar?")) return false;
    setRefreshing(true);
    try {
      const fresh = await readState(requestQuery);
      setSnapshot({ key: requestQuery, data: fresh, error: null });
      setRefreshVersion(value => value + 1);
      setUncertain(false); setError(null); setDraft(null); setNotice(null);
      return true;
    } catch (failure: unknown) { setError(requestError(failure)); return false; }
    finally { setRefreshing(false); }
  };
  const closeUser = () => {
    if (!draft || busy) return;
    const original = draft.original;
    const changed = original ? original.role !== draft.role || original.isActive !== draft.isActive || membershipSignature(original.memberships) !== membershipSignature(draft.memberships) || !!draft.reason : !!(draft.email || draft.identity || draft.role || draft.reason);
    if (!changed || window.confirm("¿Descartar los cambios de este usuario?")) { setDraft(null); setError(null); }
  };
  const lookup = async () => {
    if (!draft || busy) return;
    setBusy(true); setError(null);
    try {
      const result = await postChange({ action: "lookupIdentity", email: draft.email });
      if (!result.identity) throw new Error("Missing verified identity");
      setDraft(value => value ? { ...value, identity: result.identity!, reviewing: false } : value);
    } catch (failure: unknown) { setError(requestError(failure)); }
    finally { setBusy(false); }
  };
  const saveUser = async () => {
    if (!draft || !draft.role) return;
    let mutation: AccessMutation;
    if (draft.mode === "create") {
      if (!draft.identity || draft.identity.alreadyProvisioned) return;
      mutation = { action: "provisionUser", email: draft.identity.email, clerkUserId: draft.identity.clerkUserId, role: draft.role, memberships: draft.memberships, reason: draft.reason };
    } else {
      if (!draft.original) return;
      mutation = { action: "updateUser", userId: draft.original.id, expectedRevision: draft.original.accessRevision, role: draft.role, isActive: draft.isActive, memberships: draft.memberships, reason: draft.reason };
    }
    if (await commit(mutation, draft.mode === "create" ? "El acceso se habilitó para la cuenta verificada." : "El acceso del usuario se actualizó.")) setDraft(null);
  };
  const mutationError = error ? accessErrorMessage(error) : null;
  const blocked = uncertain || error?.code === "STALE_REVISION";

  return <div className="admin-page space-y-6">
    <PageHeader eyebrow="Administración" title="Usuarios y acceso" description="Administra las cuentas vinculadas, sus roles y la organización de los equipos." actions={<><button type="button" className="admin-button disabled:opacity-50" disabled={busy || refreshing} onClick={refresh}><RefreshCw size={15} aria-hidden="true" />{refreshing ? "Actualizando…" : "Actualizar"}</button><button type="button" disabled={!data || busy || blocked} onClick={() => { setError(null); setDraft(userEditorDraft()); }} className="admin-button admin-button-primary disabled:opacity-50"><UserPlus size={16} aria-hidden="true" />Habilitar acceso</button></>} />
    <nav aria-label="Secciones de administración de acceso" className="flex flex-wrap gap-2 border-b border-slate-700 pb-3">{tabs.map(value => <Link href={href({ tab: value.id })} key={value.id} aria-current={tab === value.id ? "page" : undefined} className={"rounded-lg px-4 py-2.5 text-sm font-medium " + (tab === value.id ? "bg-emerald-950 text-emerald-200 ring-1 ring-emerald-800" : "text-slate-300 hover:bg-slate-800 hover:text-white")}>{value.label}</Link>)}</nav>
    {notice && <div role="status" className={"rounded-lg border p-4 text-sm " + (notice.kind === "success" ? "border-emerald-800 bg-emerald-950/30 text-emerald-100" : "border-amber-800 bg-amber-950/30 text-amber-100")}>{notice.message}{uncertain && <button type="button" onClick={refresh} disabled={busy || refreshing} className="ml-3 underline">Revisar estado actual</button>}</div>}
    {error && !draft && <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-sm text-rose-100">{mutationError}{error.code === "STALE_REVISION" && <button type="button" onClick={refresh} className="ml-3 underline">Actualizar datos</button>}</div>}
    {loading ? <div className="admin-card flex items-center gap-3 text-sm text-slate-300" role="status"><RefreshCw size={18} className="animate-spin" aria-hidden="true" />Cargando administración de acceso…</div> : loadError ? <div className="admin-card" role="alert"><h2 className="font-semibold text-white">No pudimos cargar la administración</h2><p className="mt-3 text-sm text-slate-300">{accessErrorMessage(loadError)}</p><button type="button" className="admin-button mt-4" disabled={refreshing} onClick={refresh}>Volver a cargar</button></div> : data && <>
      {tab === "users" && <section aria-labelledby="access-users-title" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="access-users-title" className="text-lg font-semibold text-white">Usuarios vinculados</h2><p className="text-sm text-slate-300">{data.total} {data.total === 1 ? "resultado" : "resultados"}</p></div>
        <form key={requestQuery} className="admin-card grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(140px,.6fr)_minmax(130px,.5fr)_auto]" onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); router.push(href({ search: String(values.get("search") || "").trim(), role: String(values.get("role") || "all"), status: String(values.get("status") || "all"), page: "1" })); }}>
          <div><label htmlFor="user-search" className={labelClass}>Buscar usuario</label><input id="user-search" name="search" defaultValue={search} placeholder="Nombre o correo" className={fieldClass} /></div>
          <div><label htmlFor="user-role-filter" className={labelClass}>Rol</label><select id="user-role-filter" name="role" defaultValue={role} className={fieldClass}><option value="all">Todos los roles</option>{data.policies.map(policy => <option key={policy.role} value={policy.role}>{policy.label}</option>)}</select></div>
          <div><label htmlFor="user-status-filter" className={labelClass}>Estado</label><select id="user-status-filter" name="status" defaultValue={status} className={fieldClass}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></div>
          <button type="submit" className="admin-button self-end"><Search size={15} aria-hidden="true" />Filtrar</button>
        </form>
        {data.users.length ? <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900"><ul className="divide-y divide-slate-700">{data.users.map(user => <li key={user.id} className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center"><div className="min-w-0"><p className="font-semibold text-white">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}{user.id === data.actorUserId && <span className="ml-2 inline-block rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300">Tu cuenta</span>}</p><p className="mt-2 break-all text-sm text-slate-300">{user.email}</p></div><div><p className="text-sm text-slate-100">{data.policies.find(policy => policy.role === user.role)?.label || roleLabels[user.role]}</p><span className={"admin-status mt-2 " + (user.isActive ? "admin-status-success" : "admin-status-warning")}>{user.isActive ? "Activo" : "Inactivo"}</span></div><div className="text-xs leading-relaxed text-slate-300">{user.memberships.length ? user.memberships.map(member => <p key={member.teamId}>{data.teams.find(team => team.id === member.teamId)?.name || "Equipo"}{member.isLead ? " · Responsable" : ""}</p>) : "Sin equipos internos"}</div><button type="button" disabled={busy || blocked} onClick={() => { setError(null); setDraft(userEditorDraft(user)); }} className="admin-button justify-self-start disabled:opacity-50">Administrar<span className="sr-only"> {user.email}</span></button></li>)}</ul></div> : <div className="admin-card text-center"><ShieldCheck size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" /><h3 className="font-semibold text-white">{search || role !== "all" || status !== "all" ? "No hay usuarios que coincidan" : "No hay usuarios vinculados"}</h3><p className="mt-2 text-sm text-slate-300">Ajusta los filtros o habilita una cuenta existente y verificada.</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300"><p>Página {data.page}{data.total ? " de " + Math.ceil(data.total / data.pageSize) : ""}</p><div className="flex gap-2">{data.page > 1 && <Link className="admin-button" href={href({ page: String(data.page - 1) })}>Anterior</Link>}{data.page * data.pageSize < data.total && <Link className="admin-button" href={href({ page: String(data.page + 1) })}>Siguiente</Link>}</div></div>
      </section>}
      {tab === "roles" && <RolePermissionMatrix policies={data.policies} catalog={data.permissionCatalog} busy={busy} blocked={blocked} onCommit={commit} onRefresh={refresh} error={mutationError} />}
      {tab === "teams" && <TeamAdministration teams={data.teams} busy={busy} blocked={blocked} onCommit={commit} onRefresh={refresh} error={mutationError} />}
      {tab === "audit" && <UserAuditLog entries={data.audit} />}
      {draft && <UserAccessDialog draft={draft} setDraft={setDraft} teams={data.teams} policies={data.policies} catalog={data.permissionCatalog} actorUserId={data.actorUserId} activeSuperAdminCount={data.activeSuperAdminCount} busy={busy} uncertain={blocked} error={error} onLookup={() => { void lookup(); }} onCommit={() => { void saveUser(); }} onClose={closeUser} onRefresh={() => { void refresh(); }} />}
    </>}
  </div>;
}
