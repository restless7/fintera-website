"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminDraft } from "@/components/admin/useAdminDraft";
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges";
import {
  adminServiceRequestMutationSchema,
  creditKindLabels,
  type AdminServiceRequestMutation,
  type AdminServiceRequestsDTO,
} from "@/lib/onboarding/contracts";
import {
  OnboardingApiError,
  onboardingError,
  onboardingRequest,
} from "@/components/customer-onboarding/onboarding-api";
import {
  commercialDate,
  commercialMoney,
  colombiaDate,
  localDateInput,
} from "./format";
import { commercialFieldClass } from "./CommercialUI";

const API = "/api/admin/service-requests";
type RequestRow = AdminServiceRequestsDTO["requests"][number];
type EditDraft = {
  status: string;
  advisor: string;
  team: string;
  nextAction: string;
  message: string;
  reason: string;
  application: string;
  revision: number;
  body: AdminServiceRequestMutation | null;
  pending: boolean;
  error: string | null;
  stale: boolean;
  success: boolean;
};

function RequestOperation({
  row,
  state,
  link,
  onChanged,
}: {
  row: RequestRow;
  state: AdminServiceRequestsDTO;
  link?: boolean;
  onChanged: () => void;
}) {
  const initial = (): EditDraft => ({
    status: row.status,
    advisor: row.assignedAdvisorId || "",
    team: row.teamId || "",
    nextAction: localDateInput(row.nextActionAt),
    message: row.publicMessage || "",
    reason: "",
    application: row.applicationId || "",
    revision: row.revision,
    body: null,
    pending: false,
    error: null,
    stale: false,
    success: false,
  });
  const [draft, setDraft] = useAdminDraft<EditDraft>(
    `service-request:${row.id}:${link ? "link" : "review"}`,
    initial,
  );
  useUnsavedChanges(!!draft.body || !!draft.reason);
  const options = state.applications.filter((application) =>
    application.requestIds.includes(row.id),
  );
  const change = (field: keyof EditDraft, value: string) =>
    setDraft((current) => ({
      ...current,
      [field]: value,
      error: null,
      success: false,
    }));
  async function send(body: AdminServiceRequestMutation) {
    let accepted = false;
    setDraft((current) => {
      if (current.pending) return current;
      accepted = true;
      return { ...current, body, pending: true, error: null, stale: false };
    });
    if (!accepted) return;
    try {
      const receipt = await onboardingRequest<{
        success: boolean;
        resourceId: string;
      }>(API, body);
      if (receipt.success !== true || receipt.resourceId !== body.requestId)
        throw new Error("Unconfirmed admin receipt");
      setDraft((current) => ({
        ...current,
        body: null,
        pending: false,
        error: null,
        success: true,
        reason: "",
      }));
      onChanged();
    } catch (error) {
      const unknown =
        !(error instanceof OnboardingApiError) || error.status >= 500;
      setDraft((current) => ({
        ...current,
        body: unknown ? body : null,
        pending: false,
        error: onboardingError(error),
        stale: error instanceof OnboardingApiError && error.status === 409,
      }));
    }
  }
  const disabled = !!draft.body || draft.stale;
  return (
    <details
      open={draft.body || draft.error || draft.success ? true : undefined}
      className="rounded-xl border border-slate-600 p-4"
    >
      <summary className="cursor-pointer text-sm font-semibold">
        {link
          ? "Vincular un expediente existente"
          : "Revisar solicitud y siguiente paso"}
      </summary>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled) return;
          const common = {
            commandId: crypto.randomUUID(),
            requestId: row.id,
            expectedRevision: draft.revision,
            reason: draft.reason,
          };
          const body = link
            ? {
                ...common,
                action: "LINK_APPLICATION",
                applicationId: draft.application,
              }
            : {
                ...common,
                action: "REVIEW",
                status: draft.status,
                nextActionAt: colombiaDate(draft.nextAction),
                publicMessage: draft.message,
                ...(state.permissions.canAssign
                  ? {
                      assignedAdvisorId: draft.advisor || null,
                      teamId: draft.team || null,
                    }
                  : {}),
              };
          const parsed = adminServiceRequestMutationSchema.safeParse(body);
          if (!parsed.success) {
            setDraft((current) => ({
              ...current,
              error: parsed.error.issues[0]?.message || "Revisa los datos.",
            }));
            return;
          }
          void send(parsed.data);
        }}
      >
        <fieldset
          disabled={disabled}
          className="grid min-w-0 gap-4 sm:grid-cols-2"
        >
          <legend className="sr-only">
            {link ? "Vinculación de expediente" : "Revisión de la solicitud"}
          </legend>
          {link ? (
            <label className="text-sm sm:col-span-2">
              Expediente autorizado y compatible
              <select
                required
                value={draft.application}
                onChange={(event) => change("application", event.target.value)}
                className={commercialFieldClass}
              >
                <option value="">Selecciona un expediente existente</option>
                {options.map((application) => (
                  <option key={application.id} value={application.id}>
                    {application.fileNumber}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-slate-400">
                Solo se ofrecen expedientes compatibles con el cliente ya
                vinculado a esta cuenta. Esta acción no crea un cliente ni un
                expediente.
              </span>
            </label>
          ) : (
            <>
              <label className="text-sm">
                Estado de gestión
                <select
                  required
                  className={commercialFieldClass}
                  value={draft.status}
                  onChange={(event) => change("status", event.target.value)}
                >
                  <option value="SUBMITTED">Solicitud recibida</option>
                  <option value="IN_REVIEW">En revisión por FINTERA</option>
                  <option value="CLOSED">Gestión cerrada</option>
                </select>
              </label>
              <label className="text-sm">
                Próxima acción (Colombia)
                <input
                  type="datetime-local"
                  value={draft.nextAction}
                  onChange={(event) => change("nextAction", event.target.value)}
                  className={commercialFieldClass}
                />
              </label>
              {state.permissions.canAssign && (
                <>
                  <label className="text-sm">
                    Asesor responsable
                    <select
                      value={draft.advisor}
                      onChange={(event) =>
                        change("advisor", event.target.value)
                      }
                      className={commercialFieldClass}
                    >
                      <option value="">Sin asignar</option>
                      {state.advisors.map((advisor) => (
                        <option key={advisor.id} value={advisor.id}>
                          {advisor.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    Equipo
                    <select
                      value={draft.team}
                      onChange={(event) => change("team", event.target.value)}
                      className={commercialFieldClass}
                    >
                      <option value="">Sin equipo</option>
                      {state.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <label className="text-sm sm:col-span-2">
                Mensaje visible para el cliente
                <textarea
                  maxLength={1000}
                  value={draft.message}
                  onChange={(event) => change("message", event.target.value)}
                  className={commercialFieldClass}
                />
              </label>
            </>
          )}
          <label className="text-sm sm:col-span-2">
            Motivo del registro
            <textarea
              required
              minLength={5}
              maxLength={1000}
              value={draft.reason}
              onChange={(event) => change("reason", event.target.value)}
              className={commercialFieldClass}
            />
          </label>
        </fieldset>
        {draft.error && (
          <div role="alert" className="space-y-2 text-sm">
            <p>{draft.error}</p>
            {draft.stale && (
              <>
                <button
                  type="button"
                  onClick={onChanged}
                  className="admin-button"
                >
                  Consultar versión actual
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(initial())}
                  className="admin-button"
                >
                  Descartar borrador y revisar datos actuales
                </button>
              </>
            )}
          </div>
        )}
        {draft.success && (
          <p role="status" className="text-sm">
            Registro confirmado por el servidor.
          </p>
        )}
        {draft.body && !draft.pending ? (
          <button
            type="button"
            className="admin-button"
            onClick={() => {
              if (draft.body) void send(draft.body);
            }}
          >
            Reconciliar el mismo registro pendiente
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || (link && !options.length)}
            className="admin-button admin-button-primary"
          >
            {draft.pending ? "Confirmando registro…" : "Guardar registro"}
          </button>
        )}
        <p className="text-xs text-slate-400">
          No envía mensajes externos ni representa una aprobación de crédito. Un
          resultado incierto conserva el mismo intento.
        </p>
      </form>
    </details>
  );
}

export function ServiceRequestQueue() {
  const [page, setPage] = useState(1);
  const [generation, setGeneration] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: AdminServiceRequestsDTO | null;
    error: string | null;
  } | null>(null);
  const key = `${page}:${generation}`;
  const reload = useCallback(() => setGeneration((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    void onboardingRequest<AdminServiceRequestsDTO>(
      `${API}?page=${page}`,
      undefined,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ key, data: null, error: onboardingError(error) });
      });
    return () => controller.abort();
  }, [page, key]);
  const state = result?.key === key ? result.data : null;
  return (
    <section className="space-y-5" aria-labelledby="service-queue-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="service-queue-title" className="text-xl font-semibold">
            Solicitudes de servicio financiero
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Registros cortos y solicitudes expresas de clientes. Son
            independientes de las captaciones anteriores y de los expedientes
            bancarios.
          </p>
        </div>
        <button type="button" onClick={reload} className="admin-button">
          Actualizar solicitudes
        </button>
      </div>
      {result?.key !== key ? (
        <p role="status">Consultando solicitudes autorizadas…</p>
      ) : result.error ? (
        <p role="alert" className="admin-card p-5">
          {result.error}
        </p>
      ) : (
        state && (
          <>
            {state.optionsTruncated && (
              <p className="text-sm">
                Los selectores tienen un límite de resultados. No uses otro
                expediente como sustituto; consulta el caso autorizado
                correspondiente.
              </p>
            )}
            {!state.requests.length && (
              <p className="admin-card p-6 text-sm text-slate-400">
                No hay solicitudes de servicio en este alcance.
              </p>
            )}
            {state.requests.map((row) => (
              <article key={row.id} className="admin-card space-y-5 p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{row.details.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {creditKindLabels[row.details.creditKind]} ·{" "}
                      {commercialMoney(row.details.amountCOP)}
                    </p>
                  </div>
                  <span className="admin-status admin-status-neutral">
                    {row.statusLabel}
                  </span>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-400">
                      Contacto registrado
                    </dt>
                    <dd className="break-all">
                      {row.details.email}
                      <br />
                      {row.details.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400">
                      Cuenta y solicitud
                    </dt>
                    <dd>
                      {row.claimed
                        ? "Cuenta vinculada"
                        : "Pendiente de cuenta verificada"}
                      <br />
                      {row.submittedAt
                        ? `Enviada: ${commercialDate(row.submittedAt)}`
                        : "Sin envío formal del cliente"}
                    </dd>
                  </div>
                </dl>
                {row.applicationId && (
                  <Link
                    href={`/admin/crm/applications/${encodeURIComponent(row.applicationId)}`}
                    className="admin-button"
                  >
                    Abrir expediente vinculado
                  </Link>
                )}
                {row.status === "DRAFT" ? (
                  <p className="text-sm text-slate-400">
                    La solicitud formal y sus autorizaciones deben ser
                    confirmadas por el cliente; el equipo no las acepta en su
                    nombre.
                  </p>
                ) : (
                  <>
                    {state.permissions.canReview && (
                      <RequestOperation
                        row={row}
                        state={state}
                        onChanged={reload}
                      />
                    )}
                    {state.permissions.canLinkApplication && (
                      <RequestOperation
                        row={row}
                        state={state}
                        link
                        onChanged={reload}
                      />
                    )}
                  </>
                )}
              </article>
            ))}
            <nav
              aria-label="Páginas de solicitudes de servicio"
              className="flex flex-wrap items-center gap-3"
            >
              <button
                type="button"
                disabled={page <= 1}
                className="admin-button"
                onClick={() => setPage((value) => value - 1)}
              >
                Anterior
              </button>
              <span className="text-sm">
                Página {state.page} · {state.total} solicitudes en el alcance
              </span>
              <button
                type="button"
                disabled={page * 25 >= state.total}
                className="admin-button"
                onClick={() => setPage((value) => value + 1)}
              >
                Siguiente
              </button>
            </nav>
          </>
        )
      )}
    </section>
  );
}
