"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import type {
  AgreementDTO,
  CommercialState,
  ReceivableDTO,
} from "@/lib/commercial/contracts";
import {
  CommercialEmpty,
  CommercialFeedback,
  CommercialPendingCommands,
  CommercialForm,
  useCommercialState,
  type CommercialField,
} from "./CommercialUI";
import {
  colombiaDate,
  commercialDate,
  commercialMoney,
  localDateInput,
} from "./format";

const amountHint =
  "COP decimal sin separadores de miles. Se conservan los centavos registrados.";
const evidenceField: CommercialField = {
  name: "evidence",
  label: "Referencia del soporte existente",
  required: true,
  hint: "Identifica un documento o constancia verificable. Esta anotación no verifica automáticamente su contenido.",
};
function AgreementForm({
  state,
  agreement,
  onChanged,
}: {
  state: CommercialState;
  agreement?: AgreementDTO;
  onChanged: () => void;
}) {
  const banks = state.bankCatalog.map((bank) => ({
    value: bank.id,
    label: bank.name,
  }));
  const fields: CommercialField[] = [
    {
      name: "party",
      label: "Quién paga a FINTERA",
      type: "select",
      required: true,
      options: [
        { value: "BANK", label: "Banco" },
        { value: "ALLY", label: "Aliado" },
      ],
    },
    { name: "name", label: "Nombre del pagador", required: true },
    {
      name: "bank",
      label: "Banco, si paga un banco",
      type: "select",
      options: [{ value: "", label: "Elige el banco del convenio" }, ...banks],
    },
    {
      name: "email",
      label: "Correo del aliado pagador, si corresponde",
      type: "email",
    },
    {
      name: "kind",
      label: "Base del convenio",
      type: "select",
      required: true,
      options: [
        { value: "RATE", label: "Porcentaje sobre desembolso real" },
        { value: "FIXED", label: "Importe fijo pactado" },
      ],
    },
    {
      name: "rate",
      label: "Porcentaje pactado, sólo si aplica",
      hint: "Ej. 1.25. Sin tarifa predeterminada.",
    },
    {
      name: "fixed",
      label: "Importe fijo pactado, sólo si aplica",
      hint: amountHint,
    },
    {
      name: "trigger",
      label: "Hecho que habilita el ingreso",
      type: "select",
      required: true,
      options: [
        { value: "DISBURSEMENT", label: "Desembolso real acreditado" },
        { value: "BANK_FILING", label: "Radicación acreditada (importe fijo)" },
      ],
    },
    {
      name: "from",
      label: "Vigente desde (Colombia)",
      type: "datetime-local",
      required: true,
    },
    {
      name: "until",
      label: "Vigente hasta, si corresponde (Colombia)",
      type: "datetime-local",
    },
    evidenceField,
  ];
  return (
    <CommercialForm
      operationKey={"agreement:" + (agreement?.agreementKey || "new")}
      formKey={
        "agreement:" +
        (agreement?.agreementKey || "new") +
        ":" +
        (agreement?.version || 0)
      }
      title={
        agreement
          ? "Registrar nueva versión del convenio"
          : "Registrar convenio de ingreso real"
      }
      initial={{
        party: agreement?.counterpartyType || "BANK",
        name: agreement?.counterpartyName || "",
        bank: agreement?.bankId || "",
        email: agreement?.partnerEmail || "",
        kind: agreement?.kind || "RATE",
        rate: agreement?.ratePercent || "",
        fixed: agreement?.fixedAmountCOP || "",
        trigger: agreement?.trigger || "DISBURSEMENT",
        from: localDateInput(agreement?.validFrom),
        until: localDateInput(agreement?.validUntil),
        evidence: agreement?.evidenceReference || "",
        reason: "",
      }}
      fields={(values) =>
        fields.map((field) =>
          field.name === "trigger"
            ? {
                ...field,
                options: field.options?.map((option) => ({
                  ...option,
                  disabled:
                    option.value === "BANK_FILING" && values.kind === "RATE",
                })),
                hint: "Un porcentaje sólo puede basarse en un desembolso real. Una radicación admite únicamente un importe fijo pactado.",
              }
            : field,
        )
      }
      validate={(values) =>
        values.kind === "RATE" && values.trigger !== "DISBURSEMENT"
          ? "Elige Desembolso real para un convenio porcentual. La radicación sólo admite importe fijo; no cambiamos sus términos automáticamente."
          : null
      }
      build={(v, base) => ({
        ...base,
        action: "saveAgreement",
        ...(agreement ? { agreementKey: agreement.agreementKey } : {}),
        expectedVersion: agreement?.version || 0,
        counterpartyType: v.party as "BANK",
        counterpartyName: v.name,
        bankId: v.party === "BANK" ? v.bank || null : null,
        partnerEmail: v.party === "ALLY" ? v.email || null : null,
        kind: v.kind as "RATE",
        ratePercent: v.kind === "RATE" ? v.rate || null : null,
        fixedAmountCOP: v.kind === "FIXED" ? v.fixed || null : null,
        trigger: v.trigger as "DISBURSEMENT",
        validFrom: colombiaDate(v.from)!,
        validUntil: colombiaDate(v.until),
        evidenceReference: v.evidence,
      })}
      onChanged={onChanged}
      confirmText="¿Confirmas estos términos a partir de un convenio real? El pagador es el banco o aliado y FINTERA es quien recibe el ingreso. No se crea un derecho de cobro todavía."
      submitLabel={agreement ? "Guardar nueva versión" : "Guardar convenio"}
    />
  );
}
function ReceivableCard({
  row,
  state,
  onChanged,
}: {
  row: ReceivableDTO;
  state: CommercialState;
  onChanged: () => void;
}) {
  return (
    <article className="admin-card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={
              "/admin/crm/applications/" + encodeURIComponent(row.applicationId)
            }
            className="font-semibold underline"
          >
            {row.fileNumber}
          </Link>
          <p className="mt-1 text-sm text-slate-400">
            Pagador: {row.counterpartyName}
          </p>
        </div>
        <span className="text-xs text-slate-400">
          Vence: {commercialDate(row.dueAt)}
        </span>
      </div>
      <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Ingreso reconocido", value: row.amountCOP },
          { label: "Recaudo neto registrado", value: row.collectedCOP },
          { label: "Ajustes", value: row.adjustmentCOP },
          { label: "Saldo por cobrar", value: row.outstandingCOP },
          { label: "Costos netos registrados", value: row.costCOP },
          { label: "Contribución sobre recaudo", value: row.contributionCOP },
        ].map((metric) => (
          <div key={metric.label}>
            <dt className="text-xs text-slate-400">{metric.label}</dt>
            <dd className="mt-1 break-words font-semibold">
              {commercialMoney(metric.value)}
            </dd>
          </div>
        ))}
      </dl>
      {row.costCOP === null && (
        <p className="text-xs text-amber-200">
          Sin costos registrados, la contribución permanece desconocida. No se
          presupone costo cero.
        </p>
      )}
      {state.permissions.canWriteFinance && (
        <CommercialForm
          operationKey={"finance-entry:" + row.id}
          formKey={"finance-entry:" + row.id + ":" + row.revision}
          title="Registrar recaudo, ajuste o costo"
          initial={{
            kind: "COLLECTION",
            amount: "",
            at: "",
            reference: "",
            evidence: "",
            reason: "",
          }}
          fields={[
            {
              name: "kind",
              label: "Tipo de movimiento",
              type: "select",
              required: true,
              options: [
                { value: "COLLECTION", label: "Recaudo registrado" },
                { value: "ADJUSTMENT", label: "Ajuste del derecho de cobro" },
                { value: "COST", label: "Costo registrado" },
              ],
            },
            {
              name: "amount",
              label: "Importe COP del movimiento",
              required: true,
              hint:
                amountHint +
                " Recaudos positivos; costos no negativos con soporte explícito, incluido cero. Un ajuste puede tener signo. Los reversos se registran por separado contra el movimiento original.",
            },
            {
              name: "at",
              label: "Fecha y hora del soporte (Colombia)",
              type: "datetime-local",
              required: true,
            },
            {
              name: "reference",
              label: "Referencia real del pago o movimiento",
              required: true,
            },
            evidenceField,
          ]}
          build={(v, base) => ({
            ...base,
            action: "recordFinanceEntry",
            applicationId: row.applicationId,
            receivableId: row.id,
            expectedRevision: row.revision,
            kind: v.kind as "COLLECTION",
            amountCOP: v.amount,
            occurredAt: colombiaDate(v.at)!,
            reference: v.reference,
            evidenceReference: v.evidence,
          })}
          onChanged={onChanged}
          confirmText="¿Registrar este movimiento contra el saldo indicado con el soporte y motivo revisados? No se ejecuta una transferencia de dinero."
        />
      )}
      {row.entries.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">
            Movimientos registrados ({row.entries.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {row.entries.map((entry) => (
              <li
                key={entry.id}
                className="space-y-1 border-t border-slate-700 pt-3 text-sm"
              >
                <strong>
                  {
                    {
                      COLLECTION: "Recaudo",
                      ADJUSTMENT: "Ajuste",
                      COST: "Costo",
                      COLLECTION_REVERSAL: "Reverso de recaudo",
                      COST_REVERSAL: "Reverso de costo",
                    }[entry.kind]
                  }{" "}
                  · {commercialMoney(entry.amountCOP)}
                </strong>
                <p className="text-xs text-slate-400">
                  {commercialDate(entry.occurredAt)} · {entry.reference}
                </p>
                <p className="whitespace-pre-wrap">{entry.reason}</p>
                {entry.reversesId && (
                  <p className="break-all text-xs text-amber-200">
                    Reversa el registro {entry.reversesId}; no acredita una
                    devolución bancaria.
                  </p>
                )}
                <p className="break-all text-xs text-slate-400">
                  Soporte: {entry.evidenceReference}
                </p>
                {state.permissions.canWriteFinance &&
                  (entry.kind === "COLLECTION" || entry.kind === "COST") &&
                  /^[0-9]+(?:\.[0-9]+)?$/.test(entry.remainingReversibleCOP) &&
                  /[1-9]/.test(entry.remainingReversibleCOP) && (
                    <CommercialForm
                      operationKey={"reverse:" + entry.id}
                      formKey={"reverse:" + entry.id + ":" + row.revision}
                      title="Reversar registro"
                      initial={{
                        amount: "",
                        at: "",
                        reference: "",
                        evidence: "",
                        reason: "",
                      }}
                      fields={[
                        {
                          name: "amount",
                          label: "Importe positivo a reversar (COP)",
                          required: true,
                          hint:
                            "Disponible para reversar: " +
                            commercialMoney(entry.remainingReversibleCOP) +
                            ". Puede ser parcial.",
                        },
                        {
                          name: "at",
                          label: "Fecha del reverso registrado (Colombia)",
                          type: "datetime-local",
                          required: true,
                        },
                        {
                          name: "reference",
                          label: "Referencia del reverso",
                          required: true,
                        },
                        evidenceField,
                      ]}
                      build={(v, base) => ({
                        ...base,
                        action: "reverseFinanceEntry",
                        applicationId: row.applicationId,
                        receivableId: row.id,
                        expectedRevision: row.revision,
                        originalEntryId: entry.id,
                        amountCOP: v.amount,
                        occurredAt: colombiaDate(v.at)!,
                        reference: v.reference,
                        evidenceReference: v.evidence,
                      })}
                      onChanged={onChanged}
                      confirmText="¿Registrar este reverso contra el movimiento original? Se conserva la historia y no se ejecuta una devolución ni transferencia bancaria."
                      submitLabel="Confirmar reverso de registro"
                    />
                  )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
export function FinanceWorkspace() {
  const resource = useCommercialState();
  const state = resource.data;
  const latest = new Map<string, number>();
  state?.agreements.forEach((agreement) =>
    latest.set(
      agreement.agreementKey,
      Math.max(latest.get(agreement.agreementKey) || 0, agreement.version),
    ),
  );
  const banks =
    state?.bankApplications.map((bank) => ({
      value: bank.id,
      label:
        (state.applications.find((app) => app.id === bank.applicationId)
          ?.fileNumber || "Expediente") +
        " · " +
        bank.bankId,
    })) || [];
  return (
    <div className="admin-page">
      <PageHeader
        title="Ingresos y cartera"
        eyebrow="Control financiero"
        description="Convenios reales, derechos de cobro, recaudos y costos de FINTERA. Acceso restringido."
        actions={
          <button
            type="button"
            className="admin-button"
            disabled={resource.loading}
            onClick={resource.reload}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Actualizar
          </button>
        }
      />
      <CommercialPendingCommands />
      <CommercialFeedback
        loading={resource.loading}
        error={resource.error}
        onReload={resource.reload}
      />
      {state && !state.permissions.canReadFinance ? (
        <CommercialEmpty>
          Tu cuenta no tiene autorización para consultar información financiera.
        </CommercialEmpty>
      ) : (
        state && (
          <div className="space-y-6">
            <p className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
              Banco o aliado son pagadores de ingresos a FINTERA. Estos
              registros no ordenan pagos a terceros ni suponen una comisión
              acordada por defecto.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="admin-card p-5">
                <p className="text-xs text-slate-400">
                  Ingresos reconocidos en el alcance
                </p>
                <strong className="mt-2 block break-words text-xl">
                  {commercialMoney(state.metrics.recognizedIncomeCOP)}
                </strong>
              </div>
              <div className="admin-card p-5">
                <p className="text-xs text-slate-400">
                  Recaudos registrados en el alcance
                </p>
                <strong className="mt-2 block break-words text-xl">
                  {commercialMoney(state.metrics.collectedIncomeCOP)}
                </strong>
              </div>
            </div>
            <section
              className="space-y-4"
              aria-labelledby="commercial-agreements"
            >
              <h2 id="commercial-agreements" className="text-lg font-semibold">
                Convenios de ingreso
              </h2>
              {state.permissions.canWriteFinance && (
                <AgreementForm state={state} onChanged={resource.reload} />
              )}
              {state.agreements.length ? (
                state.agreements.map((agreement) => (
                  <article
                    key={agreement.id}
                    className="admin-card space-y-4 p-5"
                  >
                    <h3 className="font-semibold">
                      {agreement.counterpartyName} · Versión {agreement.version}
                    </h3>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-slate-400">Pagador</dt>
                        <dd>
                          {agreement.counterpartyType === "BANK"
                            ? "Banco"
                            : "Aliado"}{" "}
                          · {agreement.bankId || agreement.partnerEmail}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">
                          Término pactado
                        </dt>
                        <dd>
                          {agreement.kind === "RATE"
                            ? agreement.ratePercent + " % sobre desembolso real"
                            : commercialMoney(agreement.fixedAmountCOP)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">
                          Hecho habilitante
                        </dt>
                        <dd>
                          {agreement.trigger === "DISBURSEMENT"
                            ? "Desembolso acreditado"
                            : "Radicación acreditada"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">Vigencia</dt>
                        <dd>
                          {commercialDate(agreement.validFrom)} —{" "}
                          {agreement.validUntil
                            ? commercialDate(agreement.validUntil)
                            : "Sin fin registrado"}
                        </dd>
                      </div>
                    </dl>
                    <p className="break-all text-xs text-slate-400">
                      Soporte: {agreement.evidenceReference}
                    </p>
                    {state.permissions.canWriteFinance &&
                      latest.get(agreement.agreementKey) ===
                        agreement.version && (
                        <AgreementForm
                          state={state}
                          agreement={agreement}
                          onChanged={resource.reload}
                        />
                      )}
                  </article>
                ))
              ) : (
                <CommercialEmpty>
                  No hay convenios reales registrados. No se ha supuesto una
                  tasa ni un ingreso.
                </CommercialEmpty>
              )}
            </section>
            {state.optionsTruncated && (
              <p className="text-sm text-amber-200">
                El selector muestra hasta 200 expedientes autorizados. Si falta
                el expediente, ábrelo desde la bandeja y consulta su información
                comercial específica; no elijas otro como sustituto.
              </p>
            )}
            <section
              className="space-y-4"
              aria-labelledby="commercial-receivables"
            >
              <h2 id="commercial-receivables" className="text-lg font-semibold">
                Cuentas por cobrar
              </h2>
              {state.permissions.canWriteFinance && (
                <CommercialForm
                  formKey="receivable:new"
                  title="Reconocer ingreso desde un hecho acreditado"
                  initial={{
                    bank: "",
                    agreement: "",
                    due: "",
                    evidence: "",
                    reason: "",
                  }}
                  fields={[
                    {
                      name: "bank",
                      label: "Expediente y banco",
                      type: "select",
                      required: true,
                      options: [
                        {
                          value: "",
                          label: "Selecciona un caso bancario real",
                        },
                        ...banks,
                      ],
                    },
                    {
                      name: "agreement",
                      label: "Convenio y versión aplicables",
                      type: "select",
                      required: true,
                      options: [
                        { value: "", label: "Selecciona el convenio real" },
                        ...state.agreements.map((agreement) => ({
                          value: agreement.id,
                          label:
                            agreement.counterpartyName +
                            " · v" +
                            agreement.version +
                            " · " +
                            (agreement.trigger === "DISBURSEMENT"
                              ? "Desembolso"
                              : "Radicación"),
                        })),
                      ],
                    },
                    {
                      name: "due",
                      label: "Fecha de vencimiento, si consta (Colombia)",
                      type: "datetime-local",
                    },
                    evidenceField,
                  ]}
                  build={(v, base) => ({
                    ...base,
                    action: "createReceivable",
                    applicationId:
                      state.bankApplications.find((bank) => bank.id === v.bank)
                        ?.applicationId || "",
                    bankApplicationId: v.bank,
                    agreementId: v.agreement,
                    dueAt: colombiaDate(v.due),
                    evidenceReference: v.evidence,
                  })}
                  onChanged={resource.reload}
                  confirmText="¿Reconocer el ingreso con este convenio y el hecho bancario acreditado? El importe lo calcula el servidor con el hecho real; no usa una estimación del simulador."
                />
              )}
              {state.receivables.length ? (
                state.receivables.map((row) => (
                  <ReceivableCard
                    key={row.id}
                    row={row}
                    state={state}
                    onChanged={resource.reload}
                  />
                ))
              ) : (
                <CommercialEmpty>
                  No hay derechos de cobro registrados. Convenios, aprobaciones
                  y simulaciones no se cuentan como recaudo.
                </CommercialEmpty>
              )}
            </section>
          </div>
        )
      )}
    </div>
  );
}
