"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, LoaderCircle } from "lucide-react";
import {
  growthCaptureSchema,
  type GrowthCaptureInput,
  type GrowthReceipt,
} from "@/lib/commercial/contracts";

type Props = {
  channel: GrowthCaptureInput["channel"];
  pillar: GrowthCaptureInput["pillar"];
  productLabel: string;
  partner?: boolean;
  amountCOP?: string;
  source?: string;
  onLockChange?: (locked: boolean) => void;
};
type Fields = {
  clientName: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  amountCOP: string;
  partnerName: string;
  partnerEmail: string;
  partnerCategory: NonNullable<GrowthCaptureInput["partnerCategory"]>;
  consent: boolean;
};
const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-[#0A2342] disabled:bg-slate-100";

export function GrowthCaptureForm({
  channel,
  pillar,
  productLabel,
  partner = false,
  amountCOP = "",
  source,
  onLockChange,
}: Props) {
  const [fields, setFields] = useState<Fields>({
    clientName: "",
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    city: "",
    amountCOP,
    partnerName: "",
    partnerEmail: "",
    partnerCategory: "INMOBILIARIA",
    consent: false,
  });
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<GrowthReceipt | null>(null);
  const [copied, setCopied] = useState(false);
  const command = useRef<GrowthCaptureInput | null>(null);
  const pendingRef = useRef(false);
  const dirty =
    !receipt &&
    !!(
      fields.clientName ||
      fields.contactEmail ||
      fields.contactPhone ||
      fields.partnerName
    );
  useEffect(() => {
    if (!dirty && !pending) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, pending]);
  const update = (key: keyof Fields, value: string | boolean) => {
    setError(null);
    setFields((current) => ({ ...current, [key]: value }));
  };
  const send = async (body: GrowthCaptureInput) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    onLockChange?.(true);
    try {
      const response = await fetch("/api/growth/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      let data: Partial<GrowthReceipt> & { error?: string };
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "No pudimos confirmar la respuesta. Consulta este mismo envío antes de iniciar otro.",
        );
      }
      if (!response.ok) {
        if (response.status < 500 && response.status !== 409) {
          command.current = null;
          setUncertain(false);
          throw new Error(
            response.status === 429
              ? "Hay varios envíos recientes. Espera antes de volver a intentarlo."
              : data.error || "Revisa los datos antes de enviar.",
          );
        }
        throw new Error(
          "El resultado no está confirmado. Reintenta este mismo envío para consultar su recepción, sin crear otro.",
        );
      }
      if (
        data.success !== true ||
        data.status !== "RECEIVED" ||
        typeof data.trackingCode !== "string" ||
        !data.trackingCode ||
        typeof data.message !== "string"
      )
        throw new Error(
          "La respuesta no confirmó la recepción. Reintenta este mismo envío.",
        );
      setReceipt(data as GrowthReceipt);
      setUncertain(false);
      command.current = null;
    } catch (failure: unknown) {
      setUncertain(!!command.current);
      setError(
        failure instanceof Error
          ? failure.message
          : "No pudimos confirmar la recepción de este envío.",
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
      onLockChange?.(!!command.current);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pendingRef.current || uncertain) return;
    const query = new URL(window.location.href).searchParams;
    const parsed = growthCaptureSchema.safeParse({
      idempotencyKey: crypto.randomUUID(),
      channel,
      pillar,
      clientName: fields.clientName,
      companyName: fields.companyName || undefined,
      contactEmail: fields.contactEmail,
      contactPhone: fields.contactPhone,
      city: fields.city,
      amountCOP: fields.amountCOP || undefined,
      productLabel,
      ...(partner
        ? {
            partnerName: fields.partnerName,
            partnerEmail: fields.partnerEmail || undefined,
            partnerCategory: fields.partnerCategory,
          }
        : {}),
      utmSource: query.get("utm_source")?.slice(0, 100) || source || undefined,
      utmMedium: query.get("utm_medium")?.slice(0, 100) || undefined,
      utmCampaign: query.get("utm_campaign")?.slice(0, 150) || undefined,
      sourceArticleSlug:
        query.get("sourceArticleSlug")?.slice(0, 200) || undefined,
      consent: fields.consent,
      consentVersion: "2026.V1",
      website: "",
    });
    if (!parsed.success) {
      setError(
        "Revisa los campos obligatorios, el importe sin separadores y la autorización de tratamiento de datos.",
      );
      return;
    }
    command.current = parsed.data;
    void send(parsed.data);
  };
  if (receipt)
    return (
      <div
        role="status"
        className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-[#0A2342]"
      >
        <CheckCircle2 className="text-emerald-700" aria-hidden="true" />
        <h3 className="text-xl font-bold">Solicitud recibida</h3>
        <p>{receipt.message}</p>
        <p className="text-sm">
          Este comprobante confirma la recepción; no es aprobación financiera,
          radicación bancaria ni comisión devengada.
        </p>
        <label htmlFor="growth-receipt" className="block text-sm font-semibold">
          Comprobante privado de recepción
        </label>
        <input
          id="growth-receipt"
          readOnly
          value={receipt.trackingCode}
          className={fieldClass}
        />
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2 font-semibold"
          onClick={() => {
            void navigator.clipboard
              .writeText(receipt.trackingCode)
              .then(() => setCopied(true))
              .catch(() =>
                setError("Selecciona el comprobante y cópialo manualmente."),
              );
          }}
        >
          <Copy size={16} aria-hidden="true" />
          {copied ? "Comprobante copiado" : "Copiar comprobante"}
        </button>
        {error && <p role="alert">{error}</p>}
        <p className="text-xs">
          Consérvalo de forma privada. El seguimiento público sólo confirma
          recepción y no muestra datos de la persona.
        </p>
        {pillar === "VIVIENDA_B2C" && (
          <p>
            <Link href="/portal" className="font-semibold underline">
              Ingresar al portal de vivienda
            </Link>{" "}
            · La vinculación de un expediente se confirma por separado.
          </p>
        )}
      </div>
    );
  const locked = pending || uncertain;
  return (
    <form onSubmit={submit} className="space-y-5 text-[#0A2342]">
      <p className="text-sm text-slate-600">
        {partner
          ? "Registra un referido con información real y autorización para compartir sus datos."
          : "Registra tus datos para solicitar orientación. Los supuestos de la calculadora no verifican eventos RADIAN ni crean una obligación financiera."}
      </p>
      <fieldset
        disabled={locked}
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {partner && (
          <>
            <label className="space-y-2 text-sm font-semibold">
              Nombre del aliado
              <input
                required
                value={fields.partnerName}
                onChange={(event) => update("partnerName", event.target.value)}
                autoComplete="organization"
                maxLength={150}
                className={fieldClass}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Correo del aliado
              <input
                required
                type="email"
                value={fields.partnerEmail}
                onChange={(event) => update("partnerEmail", event.target.value)}
                maxLength={254}
                className={fieldClass}
              />
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Tipo de aliado
              <select
                value={fields.partnerCategory}
                onChange={(event) =>
                  update("partnerCategory", event.target.value)
                }
                className={fieldClass}
              >
                <option value="INMOBILIARIA">Inmobiliaria</option>
                <option value="CONSTRUCTORA">Constructora</option>
                <option value="CONTADOR_PUBLICO">Contador público</option>
                <option value="CONSULTOR_FINANCIERO">
                  Consultor financiero
                </option>
                <option value="BROKER_INDEPENDIENTE">
                  Broker independiente
                </option>
              </select>
            </label>
          </>
        )}
        <label className="space-y-2 text-sm font-semibold">
          Nombre del contacto
          <input
            required
            value={fields.clientName}
            onChange={(event) => update("clientName", event.target.value)}
            autoComplete="name"
            minLength={3}
            maxLength={150}
            className={fieldClass}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Empresa, si corresponde
          <input
            value={fields.companyName}
            onChange={(event) => update("companyName", event.target.value)}
            autoComplete="organization"
            maxLength={150}
            className={fieldClass}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Correo del contacto
          <input
            required
            type="email"
            value={fields.contactEmail}
            onChange={(event) => update("contactEmail", event.target.value)}
            autoComplete="email"
            maxLength={254}
            className={fieldClass}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Teléfono del contacto
          <input
            required
            type="tel"
            value={fields.contactPhone}
            onChange={(event) => update("contactPhone", event.target.value)}
            autoComplete="tel"
            pattern="[+0-9 ()-]{7,24}"
            className={fieldClass}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Ciudad
          <input
            required
            value={fields.city}
            onChange={(event) => update("city", event.target.value)}
            autoComplete="address-level2"
            minLength={2}
            maxLength={100}
            className={fieldClass}
          />
        </label>
        <label className="space-y-2 text-sm font-semibold">
          Importe solicitado en COP, si lo conoces
          <input
            inputMode="decimal"
            value={fields.amountCOP}
            onChange={(event) => update("amountCOP", event.target.value)}
            pattern="(0|[1-9][0-9]{0,13})([.][0-9]{1,2})?"
            placeholder="Ej. 150000000.00"
            className={fieldClass}
          />
          <span className="block text-xs font-normal text-slate-600">
            Sin separadores de miles. No es un monto aprobado.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm font-normal sm:col-span-2">
          <input
            required
            type="checkbox"
            checked={fields.consent}
            onChange={(event) => update("consent", event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
          />
          <span>
            Autorizo el tratamiento de los datos suministrados para gestionar
            esta solicitud y he revisado la{" "}
            <Link
              href="/legal/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              política de privacidad
            </Link>
            .
          </span>
        </label>
      </fieldset>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm"
        >
          {error}
        </p>
      )}
      {uncertain ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (command.current) void send(command.current);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0A2342] px-5 py-3 font-semibold text-white"
        >
          {pending && (
            <LoaderCircle
              size={16}
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {pending ? "Consultando recepción…" : "Reintentar este mismo envío"}
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0A2342] px-5 py-3 font-semibold text-white"
        >
          {pending && (
            <LoaderCircle
              size={16}
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {pending ? "Confirmando recepción…" : "Enviar solicitud"}
        </button>
      )}
      <p className="text-xs text-slate-600">
        Los datos de este formulario se mantienen en memoria mientras lo
        completas. No se guardan en localStorage o sessionStorage.
      </p>
    </form>
  );
}
