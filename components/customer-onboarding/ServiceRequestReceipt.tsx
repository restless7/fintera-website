"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import {
  ONBOARDING_API,
  creditKindLabels,
  type ServiceConsentReceiptDTO,
  type ServiceRequestReceiptDTO,
} from "@/lib/onboarding/contracts";
import {
  commercialDate,
  commercialMoney,
} from "@/components/admin/commercial/format";
import { activityLabels } from "./RequestFields";
import {
  OnboardingApiError,
  onboardingError,
  onboardingRequest,
} from "./onboarding-api";

function AcceptedText({
  title,
  receipt,
}: {
  title: string;
  receipt: ServiceConsentReceiptDTO;
}) {
  return (
    <section className="receipt-section mt-7 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {receipt.text}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        Aceptación expresa registrada el {commercialDate(receipt.acceptedAt)} ·
        Versión {receipt.version}
      </p>
    </section>
  );
}

export function ServiceRequestReceipt({ requestId }: { requestId: string }) {
  const [attempt, setAttempt] = useState(0);
  const key = `${requestId}:${attempt}`;
  const [result, setResult] = useState<{
    key: string;
    data: ServiceRequestReceiptDTO | null;
    error: unknown;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void onboardingRequest<ServiceRequestReceiptDTO>(
      `${ONBOARDING_API}/requests/${encodeURIComponent(requestId)}/receipt`,
      undefined,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error });
      });
    return () => controller.abort();
  }, [key, requestId]);
  if (result?.key !== key)
    return (
      <p role="status" className="rounded-xl bg-white p-6">
        Consultando tu constancia…
      </p>
    );
  if (result.error)
    return (
      <section
        role="alert"
        className="rounded-xl border border-amber-300 bg-white p-6"
      >
        <h1 className="text-xl font-bold">
          No pudimos mostrar esta constancia
        </h1>
        <p className="mt-3 text-slate-700">{onboardingError(result.error)}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {result.error instanceof OnboardingApiError &&
          result.error.status === 401 ? (
            <Link
              href="/onboarding/sign-in"
              className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white"
            >
              Ingresar a mi cuenta
            </Link>
          ) : (
            <>
              <UserButton />
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-blue-800"
              >
                Volver a consultar
              </button>
            </>
          )}
          <Link
            href="/portal"
            className="font-semibold text-blue-800 underline"
          >
            Mi portal
          </Link>
        </div>
      </section>
    );
  const receipt = result.data;
  if (!receipt) return null;
  const details = receipt.submittedRequest;
  return (
    <>
      <div className="receipt-toolbar mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/portal" className="font-semibold text-blue-800 underline">
          Volver a Mi portal
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
        >
          Imprimir o guardar como PDF
        </button>
      </div>
      <article className="service-receipt rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="border-b border-slate-200 pb-6">
          <Image
            src="/images/fintera-wordmark.png"
            alt="FINTERA"
            width={169}
            height={33}
            className="mb-6 h-auto w-40"
            unoptimized
          />
          <p className="text-xs font-bold uppercase tracking-widest text-blue-800">
            Solicitud de servicio financiero
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Constancia de tu solicitud
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Presentada a FINTERA el {commercialDate(receipt.submittedAt)}
          </p>
          <p className="mt-2 break-all text-xs text-slate-600">
            Referencia: {receipt.requestId}
          </p>
        </header>
        <section className="receipt-section mt-6">
          <h2 className="text-lg font-bold text-slate-900">
            Datos confirmados al enviar
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Nombre completo", details.name],
              ["Servicio de interés", creditKindLabels[details.creditKind]],
              ["Monto solicitado (COP)", commercialMoney(details.amountCOP)],
              ["Actividad económica", activityLabels[details.activity]],
              ["Celular", details.phone],
              ["Correo electrónico", details.email],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold text-slate-600">{label}</dt>
                <dd className="mt-1 break-words text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <AcceptedText
          title="Solicitud expresa del servicio"
          receipt={receipt.formalReceipts.declaration}
        />
        <AcceptedText
          title="Autorización de tratamiento de datos de la solicitud"
          receipt={receipt.formalReceipts.processing}
        />
        <AcceptedText
          title="Autorización del registro inicial"
          receipt={receipt.quickConsent}
        />
        <footer className="mt-7 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-600">
          <p>{receipt.notice}</p>
          <p className="mt-2">
            Esta constancia corresponde a la información y las aceptaciones
            registradas al enviar la solicitud. La evaluación y aprobación del
            crédito corresponden a la entidad financiera.
          </p>
          <p className="mt-3">
            <a href={receipt.formalReceipts.privacyUrl} className="underline">
              Política de Privacidad
            </a>{" "}
            ·{" "}
            <a href={receipt.formalReceipts.termsUrl} className="underline">
              Términos del Servicio
            </a>
          </p>
        </footer>
      </article>
    </>
  );
}
