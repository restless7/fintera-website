"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  ONBOARDING_API,
  PROCESSING_CONSENT_VERSION,
  SERVICE_DECLARATION_VERSION,
  submitServiceRequestSchema,
  type CustomerServiceRequestDTO,
  type OnboardingStateDTO,
  type SubmitServiceRequestInput,
} from "@/lib/onboarding/contracts";
import { ONBOARDING_POLICIES } from "@/lib/onboarding/policies";
import {
  usePortalDraft,
  usePortalUnsavedChanges,
} from "@/components/customer-portal/PortalDraftStore";
import {
  OnboardingApiError,
  onboardingError,
  onboardingRequest,
  useOnboardingState,
} from "./onboarding-api";
import { RequestFields, type RequestDraft } from "./RequestFields";
import { OnboardingProgress } from "./OnboardingFrame";

type FormalDraft = {
  fields: RequestDraft;
  revision: number;
  declaration: boolean;
  consent: boolean;
  operation: { body: SubmitServiceRequestInput; pending: boolean } | null;
  error: string | null;
  stale: boolean;
  completed: boolean;
};

function FormalRequest({
  request,
  onSuccess,
  onRefresh,
  onActivate,
}: {
  request: CustomerServiceRequestDTO;
  onSuccess: (state: OnboardingStateDTO) => void;
  onRefresh: () => void;
  onActivate: (requestId: string) => void;
}) {
  const initial = (): FormalDraft => ({
    fields: request.details,
    revision: request.revision,
    declaration: false,
    consent: false,
    operation: null,
    error: null,
    stale: false,
    completed: false,
  });
  const [draft, setDraft] = usePortalDraft<FormalDraft>(
    `formal-request:${request.id}`,
    initial,
  );
  const locked = !!draft.operation;
  const changed =
    JSON.stringify(draft.fields) !== JSON.stringify(request.details);
  usePortalUnsavedChanges(
    !draft.completed &&
      (changed || draft.declaration || draft.consent || locked),
  );

  async function send(body: SubmitServiceRequestInput) {
    let accepted = false;
    setDraft((current) => {
      if (
        current.operation?.pending ||
        (current.operation &&
          current.operation.body.commandId !== body.commandId)
      )
        return current;
      accepted = true;
      return {
        ...current,
        error: null,
        stale: false,
        operation: { body, pending: true },
      };
    });
    if (!accepted) return;
    onActivate(body.requestId);
    try {
      const state = await onboardingRequest<OnboardingStateDTO>(
        `${ONBOARDING_API}/submit`,
        body,
      );
      const acknowledged = state.requests?.find(
        (item) => item.id === body.requestId,
      );
      if (!acknowledged?.submittedAt || acknowledged.status === "DRAFT")
        throw new Error("Unconfirmed submission");
      setDraft((current) => ({
        ...current,
        completed: true,
        declaration: false,
        consent: false,
        operation: null,
        error: null,
      }));
      onSuccess(state);
    } catch (error) {
      const unknown =
        !(error instanceof OnboardingApiError) || error.status >= 500;
      setDraft((current) => ({
        ...current,
        error: onboardingError(error),
        operation: unknown ? { body, pending: false } : null,
        stale: error instanceof OnboardingApiError && error.status === 409,
      }));
    }
  }
  if ((!request.canSubmit || draft.completed) && !draft.operation)
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-bold text-blue-800">{request.statusLabel}</p>
        <h2 className="mt-2 text-2xl font-bold">Tu solicitud de servicio</h2>
        <p className="mt-4 leading-relaxed text-slate-600">
          {request.publicMessage ||
            "Puedes consultar el estado desde tu portal. Este registro no implica aprobación ni radicación ante una entidad financiera."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/portal"
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Ir a Mi portal
          </Link>
          {request.receiptUrl && (
            <a
              href={request.receiptUrl}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-blue-800"
            >
              Descargar constancia
            </a>
          )}
        </div>
        {!request.applicationId && (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            La documentación de crédito se habilitará cuando FINTERA vincule un
            expediente autorizado a tu cuenta. No necesitas completar el
            formulario bancario extenso para enviar esta solicitud de servicio.
          </p>
        )}
      </section>
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (locked || draft.stale) return;
        const parsed = submitServiceRequestSchema.safeParse({
          requestId: request.id,
          expectedRevision: draft.revision,
          commandId: crypto.randomUUID(),
          details: draft.fields,
          requestDeclaration: draft.declaration,
          requestDeclarationVersion: SERVICE_DECLARATION_VERSION,
          processingConsent: draft.consent,
          processingConsentVersion: PROCESSING_CONSENT_VERSION,
        });
        if (!parsed.success) {
          setDraft((current) => ({
            ...current,
            error:
              "Revisa tus datos y las dos aceptaciones requeridas antes de enviar.",
          }));
          return;
        }
        void send(parsed.data);
      }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-xl font-bold">Revisa y confirma tus datos</h2>
      <p className="mb-6 mt-2 text-sm leading-relaxed text-slate-600">
        Este paso es una solicitud de orientación e intermediación a FINTERA. No
        es una solicitud bancaria completa.
      </p>
      <RequestFields
        value={draft.fields}
        onChange={(fields) =>
          setDraft((current) => ({ ...current, fields, error: null }))
        }
        disabled={locked || draft.stale}
      />
      <fieldset disabled={locked || draft.stale} className="mt-7 space-y-5">
        <legend className="mb-3 text-base font-bold text-slate-900">
          Tu solicitud y autorización
        </legend>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-700">
          <input
            required
            type="checkbox"
            checked={draft.declaration}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                declaration: event.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
          />
          <span>{ONBOARDING_POLICIES.declaration.text}</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-700">
          <input
            required
            type="checkbox"
            checked={draft.consent}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                consent: event.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
          />
          <span>{ONBOARDING_POLICIES.processing.text}</span>
        </label>
      </fieldset>
      <p className="mt-4 text-sm text-slate-600">
        <Link
          href={ONBOARDING_POLICIES.privacyUrl}
          target="_blank"
          className="font-semibold text-blue-800 underline"
        >
          Política de Privacidad
        </Link>{" "}
        ·{" "}
        <Link
          href={ONBOARDING_POLICIES.termsUrl}
          target="_blank"
          className="font-semibold text-blue-800 underline"
        >
          Términos del Servicio
        </Link>
        . Ninguna casilla autoriza mercadeo.
      </p>
      {draft.error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p>{draft.error}</p>
          {draft.stale && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 font-semibold underline"
            >
              Consultar los datos actuales
            </button>
          )}
        </div>
      )}
      {draft.stale && (
        <button
          type="button"
          onClick={() => setDraft(initial())}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-blue-800"
        >
          Descartar este borrador y revisar la versión actual
        </button>
      )}
      {draft.operation && !draft.operation.pending ? (
        <div className="mt-6">
          <p className="mb-3 text-sm text-slate-600">
            El resultado está pendiente de confirmación. Conservamos exactamente
            el envío original; no generes una segunda solicitud.
          </p>
          <button
            type="button"
            onClick={() => {
              if (draft.operation) void send(draft.operation.body);
            }}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Consultar y reintentar el mismo envío
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={
            locked || draft.stale || !draft.declaration || !draft.consent
          }
          className="mt-6 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {draft.operation?.pending
            ? "Confirmando tu solicitud…"
            : "Enviar solicitud de servicio"}
        </button>
      )}
      <p className="mt-4 text-xs text-slate-600">
        Al enviar podrás consultar tu solicitud y descargar su constancia desde
        Mi portal. Tu borrador de edición se conserva en esta pestaña mientras
        navegas.
      </p>
    </form>
  );
}

export function ServiceRequestWorkspace({
  requestedId,
}: {
  requestedId?: string;
}) {
  const read = useOnboardingState(requestedId);
  const [resolved, setResolved] = useState<OnboardingStateDTO | null>(null);
  const [selectedId, setSelectedId] = usePortalDraft<string | null>(
    `onboarding-selected-request:${requestedId || "default"}`,
    null,
  );
  const [claimPending, setClaimPending] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const data = resolved || read.data;
  const refresh = () => {
    setResolved(null);
    read.reload();
  };
  async function claim() {
    if (claimPending) return;
    setClaimPending(true);
    setClaimError(null);
    try {
      setResolved(
        await onboardingRequest<OnboardingStateDTO>(
          `${ONBOARDING_API}/claim`,
          {},
        ),
      );
    } catch (error) {
      setClaimError(onboardingError(error));
    } finally {
      setClaimPending(false);
    }
  }
  if (read.loading && !data)
    return (
      <p role="status" className="rounded-xl bg-white p-6">
        Consultando tu registro…
      </p>
    );
  if (read.error && !data)
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-300 bg-white p-6"
      >
        <p>{read.error}</p>
        <button
          onClick={refresh}
          className="mt-4 font-semibold text-blue-800 underline"
        >
          Volver a consultar
        </button>
      </div>
    );
  if (!data) return null;
  if (data.state === "SIGN_IN_REQUIRED")
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">
          Ingresa para recuperar tu registro
        </h2>
        <p className="mt-3 text-slate-600">
          Usa el mismo correo del registro inicial y continúa en este navegador.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/onboarding/sign-in"
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/onboarding/sign-up"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-blue-800"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    );
  if (data.state === "VERIFIED_EMAIL_REQUIRED")
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Verifica tu correo principal</h2>
        <p className="mt-3 text-slate-600">
          Abre el control de tu cuenta y verifica el mismo correo que utilizaste
          en el registro inicial.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <UserButton />
          <button
            onClick={refresh}
            className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-blue-800"
          >
            Ya verifiqué mi correo
          </button>
        </div>
      </section>
    );
  if (!requestedId && (data.state === "CLAIM_AVAILABLE" || data.claimAvailable))
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">
          Continúa con el registro de este navegador
        </h2>
        <p className="mt-3 text-slate-600">{data.message}</p>
        <p className="mt-3 text-sm text-slate-600">
          Al continuar, asociarás este registro a tu cuenta verificada y podrás
          revisar los datos antes de enviar la solicitud formal.
        </p>
        {claimError && (
          <p role="alert" className="mt-4 text-amber-950">
            {claimError}
          </p>
        )}
        <button
          type="button"
          disabled={claimPending}
          onClick={() => void claim()}
          className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {claimPending
            ? "Vinculando tu registro…"
            : "Continuar con mi registro"}
        </button>
      </section>
    );
  if (data.state === "EMAIL_MISMATCH")
    return (
      <section className="rounded-2xl border border-amber-300 bg-white p-6">
        <h2 className="text-xl font-bold">
          El correo de tu cuenta no coincide
        </h2>
        <p className="mt-3 text-slate-600">{data.message}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <UserButton />
          <Link
            href="/onboarding/sign-in"
            className="font-semibold text-blue-800 underline"
          >
            Ingresar con la cuenta correcta
          </Link>
          <Link
            href="/contacto"
            className="font-semibold text-blue-800 underline"
          >
            Solicitar ayuda
          </Link>
        </div>
      </section>
    );
  if (!data.requests.length)
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">
          Tu cuenta está lista. Cuéntanos qué necesitas.
        </h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          Puedes iniciar un registro corto y confirmar tu solicitud de servicio.
          No necesitas completar el formulario bancario extenso en este paso.
        </p>
        <Link
          href="/solicitar"
          className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
        >
          Iniciar una solicitud breve
        </Link>
        <Link
          href="/portal"
          className="ml-4 inline-block font-semibold text-blue-800 underline"
        >
          Mi portal
        </Link>
      </section>
    );
  const requested = selectedId || requestedId;
  const request = requested
    ? data.requests.find((item) => item.id === requested)
    : data.requests.find((item) => item.canSubmit) || data.requests[0];
  return (
    <>
      <OnboardingProgress step={3} />
      {data.requests.length > 1 && (
        <label className="mb-5 block text-sm font-semibold text-slate-800">
          Selecciona tu solicitud
          <select
            value={request?.id || ""}
            onChange={(event) => setSelectedId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
          >
            <option value="" disabled>
              Selecciona una solicitud
            </option>
            {data.requests.map((item) => (
              <option key={item.id} value={item.id}>
                {item.details.name} · {item.statusLabel} ·{" "}
                {new Date(item.createdAt).toLocaleDateString("es-CO")}
              </option>
            ))}
          </select>
        </label>
      )}
      {request ? (
        <FormalRequest
          key={request.id}
          request={request}
          onSuccess={setResolved}
          onRefresh={refresh}
          onActivate={setSelectedId}
        />
      ) : (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-white p-6"
        >
          <p>
            Esta solicitud no está disponible para tu cuenta. Selecciona una
            solicitud propia desde tu portal.
          </p>
          <Link
            href="/portal"
            className="mt-4 inline-block font-semibold text-blue-800 underline"
          >
            Volver a Mi portal
          </Link>
        </div>
      )}
    </>
  );
}
