"use client";

import {
  CREDIT_KINDS,
  CUSTOMER_ACTIVITIES,
  creditKindLabels,
  type ServiceRequestDetails,
} from "@/lib/onboarding/contracts";

export const activityLabels = {
  ASALARIADO: "Empleado/a",
  INDEPENDIENTE: "Independiente",
  PENSIONADO: "Pensionado/a",
  OTRO: "Otra actividad",
};
export type RequestDraft = { [K in keyof ServiceRequestDetails]: string };
export const emptyRequest: RequestDraft = {
  creditKind: "",
  amountCOP: "",
  name: "",
  activity: "",
  phone: "",
  email: "",
};
const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-offset-2 focus:border-blue-700 focus:outline-blue-700 disabled:bg-slate-100";

export function RequestFields({
  value,
  onChange,
  disabled = false,
}: {
  value: RequestDraft;
  onChange: (value: RequestDraft) => void;
  disabled?: boolean;
}) {
  const change = (field: keyof RequestDraft, next: string) =>
    onChange({ ...value, [field]: next });
  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-5 sm:grid-cols-2">
      <legend className="sr-only">Datos de tu solicitud</legend>
      <label className="text-sm font-semibold text-slate-800">
        ¿Qué crédito te interesa?
        <select
          required
          value={value.creditKind}
          onChange={(event) => change("creditKind", event.target.value)}
          className={inputClass}
        >
          <option value="">Selecciona una opción</option>
          {CREDIT_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {creditKindLabels[kind]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-800">
        Monto solicitado en pesos colombianos
        <input
          required
          inputMode="decimal"
          pattern="[1-9][0-9]{0,13}(\.[0-9]{1,2})?"
          maxLength={17}
          value={value.amountCOP}
          onChange={(event) => change("amountCOP", event.target.value)}
          aria-describedby="request-amount-help"
          placeholder="Ej. 50000000"
          className={inputClass}
        />
        <span
          id="request-amount-help"
          className="mt-1 block text-xs font-normal text-slate-600"
        >
          Sin puntos de miles ni símbolo $. Es el monto de tu interés, sujeto a
          evaluación.
        </span>
      </label>
      <label className="text-sm font-semibold text-slate-800">
        Nombre completo
        <input
          required
          autoComplete="name"
          minLength={3}
          maxLength={150}
          value={value.name}
          onChange={(event) => change("name", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="text-sm font-semibold text-slate-800">
        Actividad económica
        <select
          required
          value={value.activity}
          onChange={(event) => change("activity", event.target.value)}
          className={inputClass}
        >
          <option value="">Selecciona tu actividad</option>
          {CUSTOMER_ACTIVITIES.map((activity) => (
            <option key={activity} value={activity}>
              {activityLabels[activity]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-800">
        Número de celular
        <input
          required
          type="tel"
          autoComplete="tel"
          minLength={7}
          maxLength={24}
          value={value.phone}
          onChange={(event) => change("phone", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="text-sm font-semibold text-slate-800">
        Correo electrónico
        <input
          required
          type="email"
          autoComplete="email"
          maxLength={254}
          value={value.email}
          onChange={(event) => change("email", event.target.value)}
          aria-describedby="request-email-help"
          className={inputClass}
        />
        <span
          id="request-email-help"
          className="mt-1 block text-xs font-normal text-slate-600"
        >
          Usa este mismo correo para crear y verificar tu cuenta.
        </span>
      </label>
    </fieldset>
  );
}
