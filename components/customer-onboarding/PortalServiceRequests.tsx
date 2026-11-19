"use client";

import Link from "next/link";
import { creditKindLabels } from "@/lib/onboarding/contracts";
import { useOnboardingState } from "./onboarding-api";

/** Owned service requests are independent of a CRM client or bank application. */
export function PortalServiceRequests() {
  const { data, loading, error, reload } = useOnboardingState();
  if (loading)
    return (
      <p role="status" className="portal-notice">
        Consultando tus solicitudes de servicio…
      </p>
    );
  if (error)
    return (
      <div className="portal-notice">
        <p>No pudimos consultar las solicitudes de servicio en este momento.</p>
        <button
          type="button"
          onClick={reload}
          className="portal-button portal-button-secondary"
        >
          Volver a consultar
        </button>
      </div>
    );
  if (!data?.authenticated) return null;
  if (data.claimAvailable)
    return (
      <section className="portal-card">
        <h2>Continúa con tu registro inicial</h2>
        <p>
          Tu cuenta puede recuperar el registro de este navegador para revisar y
          confirmar una solicitud breve.
        </p>
        <Link
          className="portal-button portal-button-primary"
          href="/onboarding/solicitud"
        >
          Continuar mi solicitud
        </Link>
      </section>
    );
  if (!data.requests.length) return null;
  return (
    <section
      aria-labelledby="service-requests-title"
      className="portal-section"
    >
      <div className="portal-section-heading">
        <div>
          <p className="portal-eyebrow">SOLICITUDES A FINTERA</p>
          <h2 id="service-requests-title">
            Tu solicitud de servicio financiero
          </h2>
          <p>
            La revisión del servicio es independiente de la evaluación bancaria
            y de los documentos de un expediente.
          </p>
        </div>
      </div>
      <div className="portal-stack">
        {data.requests.map((request) => (
          <article key={request.id} className="portal-card">
            <div className="portal-card-top">
              <span className="portal-badge">{request.statusLabel}</span>
              <span className="portal-caption">
                {new Date(request.createdAt).toLocaleDateString("es-CO")}
              </span>
            </div>
            <h3>{creditKindLabels[request.details.creditKind]}</h3>
            <p>
              {request.publicMessage ||
                (request.canSubmit
                  ? "Revisa tus datos y confirma la solicitud de servicio para enviarla a FINTERA."
                  : "Tu solicitud fue recibida. Puedes consultar su estado desde este espacio.")}
            </p>
            {!request.applicationId && (
              <p className="portal-caption">
                Los documentos se habilitan cuando exista un expediente
                autorizado vinculado a tu cuenta. No hay una aprobación de
                crédito implícita.
              </p>
            )}
            <div className="portal-actions">
              <Link
                className="portal-button portal-button-primary"
                href={request.resumeUrl}
              >
                {request.canSubmit ? "Revisar y confirmar" : "Ver mi solicitud"}
              </Link>
              {request.receiptUrl && (
                <a
                  className="portal-button portal-button-secondary"
                  href={request.receiptUrl}
                >
                  Descargar constancia
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
