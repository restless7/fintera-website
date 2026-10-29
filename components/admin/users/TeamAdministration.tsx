"use client";

import type { AccessTeam } from "@/lib/auth/access-contracts";
import { useAdminDraft } from "../useAdminDraft";
import { useUnsavedChanges } from "../useUnsavedChanges";
import { AccessModal } from "./AccessModal";
import { fieldClass, labelClass, type CommitAccessChange } from "./access-ui";

type TeamDraft = { original: AccessTeam | null; name: string; description: string; reason: string };
const emptyTeamDraft: TeamDraft | null = null;
export function TeamAdministration({ teams, busy, blocked, onCommit, onRefresh, error }: {
  teams: AccessTeam[]; busy: boolean; blocked: boolean; onCommit: CommitAccessChange; onRefresh: () => Promise<boolean>; error: string | null;
}) {
  const [draft, setDraft] = useAdminDraft<TeamDraft | null>("access:team-editor", emptyTeamDraft);
  const changed = !!draft && (!draft.original || draft.name !== draft.original.name || draft.description !== (draft.original.description || ""));
  const dirty = !!draft && (changed && !!(draft.name || draft.description) || !!draft.reason);
  useUnsavedChanges(dirty || busy);
  const close = () => { if (!busy && (!dirty || window.confirm("¿Descartar los cambios del equipo?"))) setDraft(null); };
  const reload = async () => {
    if (busy || dirty && !window.confirm("Se descartará este formulario para revisar el estado guardado. ¿Continuar?")) return;
    if (await onRefresh()) setDraft(null);
  };
  const save = async () => {
    if (!draft || busy || blocked || !changed || draft.name.trim().length < 2 || draft.reason.trim().length < 5) return;
    const values = { name: draft.name, description: draft.description, reason: draft.reason };
    const saved = await onCommit(draft.original ? { action: "updateTeam", teamId: draft.original.id, expectedRevision: draft.original.revision, ...values } : { action: "createTeam", ...values }, draft.original ? "El equipo se actualizó." : "El equipo se creó.");
    if (saved) setDraft(null);
  };
  return <section aria-labelledby="team-admin-title" className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 id="team-admin-title" className="text-lg font-semibold text-white">Equipos internos</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">Organiza los equipos. La pertenencia y la responsabilidad se administran desde cada usuario.</p></div><button type="button" disabled={busy || blocked} className="admin-button admin-button-primary disabled:opacity-50" onClick={() => setDraft({ original: null, name: "", description: "", reason: "" })}>Crear equipo</button></div>
    {teams.length ? <div className="grid gap-4 xl:grid-cols-2">{teams.map(team => <article className="admin-card" key={team.id}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="font-semibold text-white">{team.name}</h3><p className="mt-2 text-xs text-slate-400">{team.memberCount} {team.memberCount === 1 ? "miembro" : "miembros"}</p></div><button type="button" className="admin-button shrink-0 disabled:opacity-50" disabled={busy || blocked} onClick={() => setDraft({ original: team, name: team.name, description: team.description || "", reason: "" })}>Editar<span className="sr-only"> {team.name}</span></button></div><p className="mt-4 text-sm leading-relaxed text-slate-300">{team.description || "Sin descripción."}</p></article>)}</div> : <div className="admin-card text-center"><h3 className="font-semibold text-white">Todavía no hay equipos</h3><p className="mt-2 text-sm text-slate-300">Crea el primer equipo para organizar la pertenencia de los usuarios.</p></div>}
    {draft && <AccessModal title={draft.original ? "Editar equipo" : "Crear equipo"} description="Este cambio registra la organización del equipo. No reasigna expedientes ni modifica roles." busy={busy} onClose={close}>
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-100">{error}<button type="button" disabled={busy} onClick={() => { void reload(); }} className="mt-3 block underline">Descartar y actualizar datos</button></p>}
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); void save(); }}>
        <div><label htmlFor="team-name" className={labelClass}>Nombre</label><input id="team-name" required minLength={2} maxLength={100} className={fieldClass} value={draft.name} disabled={busy || blocked} onChange={event => setDraft(value => value ? { ...value, name: event.target.value } : value)} /></div>
        <div><label htmlFor="team-description" className={labelClass}>Descripción</label><textarea id="team-description" maxLength={500} rows={3} className={fieldClass} value={draft.description} disabled={busy || blocked} onChange={event => setDraft(value => value ? { ...value, description: event.target.value } : value)} /></div>
        <div><label htmlFor="team-change-reason" className={labelClass}>Motivo del cambio</label><textarea id="team-change-reason" required minLength={5} maxLength={500} rows={3} className={fieldClass} value={draft.reason} disabled={busy || blocked} onChange={event => setDraft(value => value ? { ...value, reason: event.target.value } : value)} /></div>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={close} className="admin-button" disabled={busy}>Cancelar</button><button type="submit" className="admin-button admin-button-primary disabled:opacity-50" disabled={busy || blocked || !changed || draft.name.trim().length < 2 || draft.reason.trim().length < 5}>{busy ? "Guardando…" : draft.original ? "Guardar equipo" : "Crear equipo"}</button></div>
      </form>
    </AccessModal>}
  </section>;
}
