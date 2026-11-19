"use client";

import Link from "next/link";
import {
  ONBOARDING_API,
  QUICK_PRIVACY_VERSION,
  quickCaptureSchema,
  type QuickCaptureInput,
  type QuickCaptureReceipt,
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
import {
  emptyRequest,
  RequestFields,
  type RequestDraft,
} from "./RequestFields";

type CaptureDraft = {
  fields: RequestDraft;
  consent: boolean;
  operation: {
    body: QuickCaptureInput;
    pending: boolean;
    uncertain: boolean;
  } | null;
  error: string | null;
  receipt: QuickCaptureReceipt | null;
};
const initial: CaptureDraft = {
  fields: emptyRequest,
  consent: false,
  operation: null,
  error: null,
  receipt: null,
};

export function QuickRequestForm() {
  const bootstrap = useOnboardingState();
  const [draft, setDraft] = usePortalDraft<CaptureDraft>(
    "quick-service-request",
    initial,
  );
  const locked =
    !!draft.operation && (draft.operation.pending || draft.operation.uncertain);
  usePortalUnsavedChanges(
    !draft.receipt && (Object.values(draft.fields).some(Boolean) || locked),
  );

  async function send(body: QuickCaptureInput) {
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
        operation: { body, pending: true, uncertain: true },
      };
    });
    if (!accepted) return;
    try {
      // Reconcile the browser proof before any explicit same-command retry.
      await onboardingRequest(`${ONBOARDING_API}/state`);
      const receipt = await onboardingRequest<QuickCaptureReceipt>(
        `${ONBOARDING_API}/start`,
        body,
      );
      if (
        receipt.success !== true ||
        receipt.status !== "RECEIVED" ||
        receipt.nextUrl !== "/onboarding/sign-up"
      )
        throw new Error("Unconfirmed receipt");
      setDraft((current) => ({
        ...current,
        receipt,
        operation: null,
        error: null,
      }));
    } catch (error) {
      const uncertain =
        !(error instanceof OnboardingApiError) || error.status >= 500;
      setDraft((current) => ({
        ...current,
        error: onboardingError(error),
        operation: uncertain ? { body, pending: false, uncertain: true } : null,
      }));
    }
  }

  if (draft.receipt)
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8"
        role="status"
      >
        <h2 className="text-2xl font-bold text-slate-900">
          Tu registro inicial fue recibido
        </h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          Continúa con una cuenta usando el mismo correo. Después revisarás tus
          datos y confirmarás tu solicitud de servicio. Aún no has solicitado
          una aprobación bancaria.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={draft.receipt.nextUrl}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
          >
            Crear cuenta y continuar
          </Link>
          <Link
            href="/onboarding/sign-in"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-blue-800"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Por seguridad, continúa desde este navegador. No incluimos tus datos
          en enlaces.
        </p>
      </div>
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (locked || bootstrap.loading || bootstrap.error) return;
        const parsed = quickCaptureSchema.safeParse({
          ...draft.fields,
          commandId: crypto.randomUUID(),
          privacyConsent: draft.consent,
          privacyVersion: QUICK_PRIVACY_VERSION,
        });
        if (!parsed.success) {
          setDraft((current) => ({
            ...current,
            error:
              parsed.error.issues[0]?.message ||
              "Revisa los campos requeridos.",
          }));
          return;
        }
        void send(parsed.data);
      }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <p className="mb-6 text-sm leading-relaxed text-slate-600">
        Completa estos datos para iniciar. No necesitas documentos ni contraseña
        en este paso. Todos los campos son obligatorios.
      </p>
      {bootstrap.loading && (
        <p role="status" className="mb-4 text-sm text-slate-600">
          Preparando el registro seguro…
        </p>
      )}
      {bootstrap.error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p>{bootstrap.error}</p>
          <button
            type="button"
            onClick={bootstrap.reload}
            className="mt-2 font-semibold underline"
          >
            Volver a preparar el registro
          </button>
        </div>
      )}
      <RequestFields
        value={draft.fields}
        onChange={(fields) =>
          setDraft((current) => ({ ...current, fields, error: null }))
        }
        disabled={locked}
      />
      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            required
            checked={draft.consent}
            disabled={locked}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                consent: event.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
          />
          <span>{ONBOARDING_POLICIES.quick.text}</span>
        </label>
        <Link
          href={ONBOARDING_POLICIES.privacyUrl}
          target="_blank"
          className="mt-3 inline-block font-semibold text-blue-800 underline"
        >
          Leer la Política de Privacidad
        </Link>
      </div>
      {draft.error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"
        >
          {draft.error}
        </p>
      )}
      {draft.operation?.uncertain && !draft.operation.pending ? (
        <button
          type="button"
          onClick={() => {
            if (draft.operation) void send(draft.operation.body);
          }}
          className="mt-6 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
        >
          Reintentar el mismo registro
        </button>
      ) : (
        <button
          type="submit"
          disabled={
            locked || bootstrap.loading || !!bootstrap.error || !draft.consent
          }
          className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
        >
          {draft.operation?.pending
            ? "Confirmando el registro…"
            : "Continuar con mi cuenta"}
        </button>
      )}
      <p className="mt-4 text-xs leading-relaxed text-slate-600">
        Tus datos se envían al continuar. Un registro recibido no es una
        aprobación ni una oferta de crédito. Puedes acceder a{" "}
        <Link href="/portal" className="font-semibold text-blue-800 underline">
          Mi portal
        </Link>{" "}
        si ya tienes una solicitud.
      </p>
    </form>
  );
}
