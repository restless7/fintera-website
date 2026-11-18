"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

export function GrowthReceiptTracker() {
  const id = useId();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const lookup = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim() || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setConfirmed(false);
    setError(null);
    try {
      const response = await fetch(
        "/api/growth/leads?trackingCode=" + encodeURIComponent(code.trim()),
        { cache: "no-store" },
      );
      const result: { status?: string } = await response.json();
      if (!response.ok)
        throw new Error(
          response.status >= 500
            ? "La consulta no está disponible en este momento. Vuelve a intentarlo más tarde."
            : "No pudimos confirmar este comprobante. Revisa el código completo.",
        );
      if (result.status !== "RECEIVED")
        throw new Error(
          "La respuesta no confirmó la recepción de este comprobante.",
        );
      setConfirmed(true);
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No pudimos consultar el comprobante.",
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-[#0A2342]">
      <h3 className="text-lg font-bold">Consultar recepción</h3>
      <p className="text-sm text-slate-600">
        Este comprobante sólo confirma que recibimos la solicitud. Los datos
        personales y el avance del expediente no se muestran públicamente.
      </p>
      <form
        onSubmit={(event) => {
          void lookup(event);
        }}
        className="space-y-3"
      >
        <label htmlFor={id} className="block text-sm font-semibold">
          Comprobante privado completo
        </label>
        <input
          id={id}
          required
          value={code}
          disabled={pending}
          onChange={(event) => {
            setCode(event.target.value);
            setConfirmed(false);
            setError(null);
          }}
          autoComplete="off"
          maxLength={160}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0A2342] px-4 py-3 text-sm font-semibold text-white"
        >
          {pending && (
            <LoaderCircle
              size={16}
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {pending ? "Consultando…" : "Consultar recepción"}
        </button>
      </form>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          {error}
        </p>
      )}
      {confirmed && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          Recepción registrada. Esto no acredita aprobación, radicación bancaria
          ni desembolso.
        </p>
      )}
      <p className="text-sm">
        <Link href="/portal" className="font-semibold underline">
          Ingresar al portal de vivienda
        </Link>{" "}
        para consultar un expediente vinculado a tu cuenta.
      </p>
    </div>
  );
}
