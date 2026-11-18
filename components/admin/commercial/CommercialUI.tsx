"use client";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import {
  COMMERCIAL_API,
  commercialMutationSchema,
  type CommercialMutation,
  type CommercialResult,
  type CommercialState,
} from "@/lib/commercial/contracts";
import { useAdminDraft } from "@/components/admin/useAdminDraft";
import { useUnsavedChanges } from "@/components/admin/useUnsavedChanges";

export const commercialFieldClass =
  "min-h-11 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 disabled:opacity-60";
export type FormValues = Record<string, string>;
export type CommercialField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "datetime-local"
    | "textarea"
    | "select"
    | "checkbox";
  required?: boolean;
  options?: { value: string; label: string; disabled?: boolean }[];
  hint?: string;
  pattern?: string;
  disabled?: boolean;
  maxLength?: number;
};
type FormOperation = {
  pending: boolean;
  uncertain: boolean;
  stale: boolean;
  error: string | null;
  success: string | null;
  body: CommercialMutation | null;
  formKey: string | null;
  title: string;
  resetValues: FormValues | null;
};
const initialOperation: FormOperation = {
  pending: false,
  uncertain: false,
  stale: false,
  error: null,
  success: null,
  body: null,
  formKey: null,
  title: "",
  resetValues: null,
};

export function useCommercialState(url = COMMERCIAL_API) {
  const [generation, setGeneration] = useState(0);
  const key = url + ":" + generation;
  const [result, setResult] = useState<{
    key: string;
    data: CommercialState | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(url, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Inicia sesión con tu cuenta del equipo."
              : response.status === 403
                ? "Tu cuenta no tiene acceso a esta operación."
                : "No pudimos consultar la información. No se muestra una cartera vacía como sustituto de este error.",
          );
        return response.json() as Promise<CommercialState>;
      })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            data: null,
            error:
              error instanceof Error
                ? error.message
                : "El servicio no está disponible.",
          });
      });
    return () => controller.abort();
  }, [url, key]);
  const reload = useCallback(() => setGeneration((value) => value + 1), []);
  useEffect(() => {
    window.addEventListener("fintera-commercial-updated", reload);
    return () =>
      window.removeEventListener("fintera-commercial-updated", reload);
  }, [reload]);
  return {
    data: result?.key === key ? result.data : null,
    error: result?.key === key ? result.error : null,
    loading: result?.key !== key,
    reload,
  };
}
export function CommercialFeedback({
  loading,
  error,
  onReload,
}: {
  loading: boolean;
  error: string | null;
  onReload: () => void;
}) {
  if (loading)
    return (
      <p
        role="status"
        className="admin-card flex items-center gap-3 p-6 text-slate-300"
      >
        <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
        Consultando información autorizada…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="admin-card space-y-4 p-6">
        <p>{error}</p>
        <button type="button" className="admin-button" onClick={onReload}>
          <RefreshCw size={15} aria-hidden="true" />
          Volver a consultar
        </button>
      </div>
    );
  return null;
}
export function CommercialEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-600 p-6 text-sm text-slate-400">
      {children}
    </p>
  );
}

const emptyCommandIndex: Record<string, true> = {};
const emptyFormValues: FormValues = {};
type CommandContext = {
  formKey: string;
  title: string;
  resetValues: FormValues;
};

function useCommercialCommand(operationKey: string) {
  const [operation, setOperation] = useAdminDraft<FormOperation>(
    "commercial:" + operationKey + ":operation",
    initialOperation,
  );
  const [, setIndex] = useAdminDraft<Record<string, true>>(
    "commercial:command-index",
    emptyCommandIndex,
  );
  const post = async (
    body: CommercialMutation,
    context: CommandContext,
    onConfirmed: () => void,
  ) => {
    let claimed = false;
    setOperation((current) => {
      if (current.pending) return current;
      claimed = true;
      return { ...initialOperation, ...context, pending: true, body };
    });
    if (!claimed) return;
    setIndex((current) => ({ ...current, [operationKey]: true }));
    const removeFromIndex = () =>
      setIndex((current) => {
        const next = { ...current };
        delete next[operationKey];
        return next;
      });
    try {
      const response = await fetch(COMMERCIAL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const result: Partial<CommercialResult> & {
        error?: string;
        code?: string;
      } = await response.json();
      if (!response.ok) {
        const uncertain = response.status >= 500;
        setOperation({
          ...initialOperation,
          ...context,
          uncertain,
          stale: result.code === "STALE_REVISION",
          error: uncertain
            ? "El resultado no está confirmado. Reintenta únicamente el mismo registro original."
            : result.error || "La operación no se pudo completar.",
          body: uncertain ? body : null,
        });
        if (!uncertain) removeFromIndex();
        return;
      }
      if (result.success !== true || !result.resourceId)
        throw new Error("Unconfirmed response");
      setOperation({
        ...initialOperation,
        success: result.replayed
          ? "El mismo registro ya estaba confirmado; no se creó otro."
          : "Registro guardado y confirmado por el servidor.",
      });
      onConfirmed();
      removeFromIndex();
      window.dispatchEvent(new Event("fintera-commercial-updated"));
    } catch {
      setOperation({
        ...initialOperation,
        ...context,
        uncertain: true,
        error:
          "No pudimos confirmar la respuesta. Reintenta únicamente este mismo intento, con los datos originales.",
        body,
      });
    }
  };
  return { operation, setOperation, post };
}

function PendingCommercialCommand({ operationKey }: { operationKey: string }) {
  const { operation, post } = useCommercialCommand(operationKey);
  useUnsavedChanges(operation.pending || operation.uncertain);
  const [, setValues] = useAdminDraft<FormValues>(
    "commercial:" + (operation.formKey || operationKey) + ":fields",
    operation.resetValues || emptyFormValues,
  );
  if (!operation.pending && !operation.uncertain) return null;
  return (
    <article className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-4 space-y-3 text-sm">
      <h3 className="font-semibold">
        {operation.title || "Registro comercial"}
      </h3>
      <p>
        {operation.pending
          ? "El intento original sigue pendiente. No crees otro registro mientras llega su respuesta."
          : "La respuesta del intento original no está confirmada. Cambiar de página o recibir una revisión nueva no descarta este intento."}
      </p>
      {operation.body && (
        <p className="break-all text-xs text-slate-400">
          Identificador del intento: {operation.body.commandId}
        </p>
      )}
      {operation.uncertain &&
        operation.body &&
        operation.formKey &&
        operation.resetValues && (
          <button
            type="button"
            className="admin-button"
            onClick={() => {
              if (operation.body && operation.formKey && operation.resetValues)
                void post(
                  operation.body,
                  {
                    formKey: operation.formKey,
                    title: operation.title,
                    resetValues: operation.resetValues,
                  },
                  () => setValues(operation.resetValues!),
                );
            }}
          >
            Reconciliar el mismo registro pendiente
          </button>
        )}
    </article>
  );
}

/** Keeps unresolved commands visible even after a committed action hides its original form. */
export function CommercialPendingCommands() {
  const [index] = useAdminDraft<Record<string, true>>(
    "commercial:command-index",
    emptyCommandIndex,
  );
  if (!Object.keys(index).length) return null;
  return (
    <section
      aria-label="Intentos comerciales sin respuesta confirmada"
      className="space-y-3"
    >
      {Object.keys(index).map((key) => (
        <PendingCommercialCommand key={key} operationKey={key} />
      ))}
    </section>
  );
}

export function CommercialForm({
  formKey,
  operationKey = formKey,
  title,
  fields,
  initial,
  build,
  onChanged,
  submitLabel = "Guardar registro",
  confirmText,
  validate,
  footnote = "Este registro no envía comunicaciones externas ni prueba un pago por sí solo. Revisa los soportes antes de confirmar.",
  children,
}: {
  formKey: string;
  operationKey?: string;
  title: string;
  fields: CommercialField[] | ((values: FormValues) => CommercialField[]);
  validate?: (values: FormValues) => string | null;
  footnote?: string;
  initial: FormValues;
  build: (
    values: FormValues,
    base: { commandId: string; reason: string },
  ) => CommercialMutation;
  onChanged: () => void;
  submitLabel?: string;
  confirmText?: string;
  children?: ReactNode;
}) {
  const id = useId();
  const {
    operation,
    setOperation,
    post: runCommand,
  } = useCommercialCommand(operationKey);
  const unresolved = operation.pending || operation.uncertain;
  const activeFormKey =
    unresolved && operation.formKey ? operation.formKey : formKey;
  const activeInitial =
    unresolved && operation.resetValues ? operation.resetValues : initial;
  const [values, setValues] = useAdminDraft<FormValues>(
    "commercial:" + activeFormKey + ":fields",
    activeInitial,
  );
  const dirty = Object.keys(values).some(
    (key) => (values[key] || "") !== (activeInitial[key] || ""),
  );
  useUnsavedChanges(dirty || unresolved);
  const locked = unresolved;
  const validation = validate?.(values) || null;
  const visibleFields = typeof fields === "function" ? fields(values) : fields;
  const post = (body: CommercialMutation) =>
    runCommand(
      body,
      {
        formKey: activeFormKey,
        title: operation.title || title,
        resetValues: activeInitial,
      },
      () => {
        setValues(activeInitial);
        onChanged();
      },
    );
  return (
    <details
      open={
        unresolved ||
        operation.stale ||
        !!operation.error ||
        !!operation.success ||
        undefined
      }
      className="rounded-xl border border-slate-700 bg-slate-900/50 p-4"
    >
      <summary className="cursor-pointer text-sm font-semibold">
        {title}
      </summary>
      <form
        className="mt-5 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (locked || operation.stale || validation) return;
          try {
            const parsed = commercialMutationSchema.safeParse(
              build(values, {
                commandId: crypto.randomUUID(),
                reason: values.reason || "",
              }),
            );
            if (!parsed.success) {
              setOperation({
                ...initialOperation,
                error:
                  "Revisa los campos, las fechas de Colombia, los importes decimales y el motivo de al menos dos caracteres.",
              });
              return;
            }
            if (confirmText && !window.confirm(confirmText)) return;
            void post(parsed.data);
          } catch {
            setOperation({
              ...initialOperation,
              error: "Revisa los valores y las fechas antes de confirmar.",
            });
          }
        }}
      >
        {children}
        <fieldset
          disabled={locked || operation.stale}
          className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {visibleFields.map((field) => (
            <label
              key={field.name}
              htmlFor={id + field.name}
              className={
                "min-w-0 space-y-2 text-xs font-medium text-slate-300 " +
                (field.type === "textarea" || field.type === "checkbox"
                  ? "sm:col-span-2"
                  : "")
              }
            >
              {field.type === "checkbox" ? (
                <span className="flex items-start gap-3">
                  <input
                    id={id + field.name}
                    type="checkbox"
                    required={field.required}
                    checked={values[field.name] === "yes"}
                    disabled={field.disabled}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.name]: event.target.checked ? "yes" : "",
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-emerald-600"
                  />
                  {field.label}
                </span>
              ) : (
                <>
                  <span>{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      id={id + field.name}
                      required={field.required}
                      value={values[field.name] || ""}
                      disabled={field.disabled}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className={commercialFieldClass}
                    >
                      {field.options?.map((option) => (
                        <option
                          value={option.value}
                          key={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      id={id + field.name}
                      required={field.required}
                      value={values[field.name] || ""}
                      maxLength={field.maxLength || 500}
                      rows={3}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className={commercialFieldClass}
                    />
                  ) : (
                    <input
                      id={id + field.name}
                      type={field.type || "text"}
                      required={field.required}
                      value={values[field.name] || ""}
                      disabled={field.disabled}
                      pattern={field.pattern}
                      maxLength={
                        field.type === "datetime-local" ? undefined : 500
                      }
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      className={commercialFieldClass}
                    />
                  )}
                </>
              )}
              {field.hint && (
                <span className="block text-xs font-normal text-slate-400">
                  {field.hint}
                </span>
              )}
            </label>
          ))}
          <label
            htmlFor={id + "reason"}
            className="space-y-2 text-xs font-medium text-slate-300 sm:col-span-2"
          >
            <span>Motivo del registro</span>
            <textarea
              id={id + "reason"}
              required
              minLength={2}
              maxLength={500}
              rows={2}
              value={values.reason || ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              className={commercialFieldClass}
            />
          </label>
        </fieldset>
        {validation && (
          <p role="status" className="text-sm text-amber-200">
            {validation}
          </p>
        )}
        {operation.error && (
          <div
            role="alert"
            className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-3 text-sm text-amber-100"
          >
            <p>{operation.error}</p>
            {operation.stale && (
              <button
                type="button"
                className="admin-button mt-3"
                onClick={() => {
                  setOperation(initialOperation);
                  onChanged();
                }}
              >
                Consultar cambios y revisar formulario
              </button>
            )}
          </div>
        )}
        {operation.success && (
          <p role="status" className="text-sm text-emerald-300">
            {operation.success}
          </p>
        )}
        {operation.uncertain && operation.body ? (
          <button
            type="button"
            className="admin-button"
            disabled={operation.pending}
            onClick={() => {
              if (operation.body) void post(operation.body);
            }}
          >
            Reintentar el mismo registro
          </button>
        ) : (
          <button
            type="submit"
            className="admin-button admin-button-primary"
            disabled={operation.pending || operation.stale || !!validation}
          >
            {operation.pending && (
              <LoaderCircle
                size={15}
                className="animate-spin"
                aria-hidden="true"
              />
            )}
            {operation.pending ? "Confirmando…" : submitLabel}
          </button>
        )}
        <p className="text-xs text-slate-400">{footnote}</p>
      </form>
    </details>
  );
}
