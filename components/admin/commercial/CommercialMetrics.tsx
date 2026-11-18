"use client";

import Link from "next/link";
import {
  CommercialEmpty,
  CommercialFeedback,
  useCommercialState,
} from "./CommercialUI";
import { commercialDate, commercialMoney } from "./format";

const sourceLabels: Record<string, string> = {
  B2B_FACTORING_CALCULATOR: "Calculadora ilustrativa de factoring",
  PARTNER_REFERRAL_B2C: "Referido de aliado · personas",
  PARTNER_REFERRAL_B2B: "Referido de aliado · empresas",
  INSIGHTS_UTM_CONVERSION: "Contenido y campañas",
  B2C_SIMULATOR_FASTTRACK: "Simulador de vivienda",
};
const percentage = (value: number | null) =>
  value === null
    ? "—"
    : value.toLocaleString("es-CO", { maximumFractionDigits: 2 }) + " %";
export function CommercialMetrics() {
  const resource = useCommercialState();
  const state = resource.data;
  return (
    <section
      className="admin-card space-y-5 p-5"
      aria-labelledby="commercial-metrics-title"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 id="commercial-metrics-title" className="text-lg font-semibold">
            Originación y hechos comerciales
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Mediciones del alcance autorizado completo. Captaciones,
            expedientes, desembolsos e ingresos son hechos distintos.
          </p>
        </div>
        <Link href="/admin/crm/commercial" className="admin-button">
          Abrir gestión comercial
        </Link>
      </div>
      <CommercialFeedback
        loading={resource.loading}
        error={resource.error}
        onReload={resource.reload}
      />
      {state && (
        <>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Captaciones persistidas",
                value: String(state.metrics.lightLeads),
              },
              {
                label: "Expedientes canónicos",
                value: String(state.metrics.canonicalCases),
              },
              {
                label: "Desembolsos registrados vigentes",
                value: String(state.metrics.recordedDisbursements),
              },
              {
                label: "Importe realmente desembolsado",
                value: commercialMoney(state.metrics.actualDisbursedCOP),
              },
            ].map((metric) => (
              <div key={metric.label}>
                <dt className="text-xs text-slate-400">{metric.label}</dt>
                <dd className="mt-2 break-words text-lg font-semibold">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-400">
                Conversión a desembolso acreditado
              </dt>
              <dd className="mt-2 font-semibold">
                {percentage(state.metrics.conversionRate)}
              </dd>
              <dd className="text-xs text-slate-400">
                Denominador: {state.metrics.canonicalCases} expedientes.
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">
                Días observados hasta desembolso
              </dt>
              <dd className="mt-2 font-semibold">
                {state.metrics.avgDaysToDisbursement === null
                  ? "—"
                  : state.metrics.avgDaysToDisbursement.toLocaleString(
                      "es-CO",
                      { maximumFractionDigits: 1 },
                    )}
              </dd>
              <dd className="text-xs text-slate-400">
                {state.metrics.fundingTimeSampleCount} pares válidos; sin
                eventos no hay tiempo supuesto.
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">
                Cumplimiento SLA observado
              </dt>
              <dd className="mt-2 font-semibold">
                {percentage(state.metrics.slaComplianceRate)}
              </dd>
              <dd className="text-xs text-slate-400">
                {state.metrics.slaSampleCount} resoluciones con plazo
                registrado.
              </dd>
            </div>
          </dl>
          <section className="space-y-3">
            <h3 className="font-semibold">
              Origen declarado y vinculación revisada
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Atribución de múltiples contactos, no aditiva: el mismo expediente
              puede estar vinculado desde varios canales. No sumes estas filas
              como expedientes o ingresos únicos, ni interpretes el origen
              declarado como verificación independiente.
            </p>
            {state.metrics.bySource.length ? (
              <div
                className="relative overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label="Métricas por origen declarado; desplazamiento horizontal"
              >
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th scope="col" className="p-3">
                        Origen
                      </th>
                      <th scope="col" className="p-3">
                        Captaciones
                      </th>
                      <th scope="col" className="p-3">
                        Expedientes vinculados
                      </th>
                      <th scope="col" className="p-3">
                        Con desembolso
                      </th>
                      {state.permissions.canReadFinance && (
                        <th scope="col" className="p-3">
                          Recaudo vinculado
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {state.metrics.bySource.map((row) => (
                      <tr
                        key={row.source}
                        className="border-b border-slate-800"
                      >
                        <th scope="row" className="p-3 font-normal">
                          {sourceLabels[row.source] || row.source}
                        </th>
                        <td className="p-3">{row.lightLeads}</td>
                        <td className="p-3">{row.linkedCases}</td>
                        <td className="p-3">{row.fundedCases}</td>
                        {state.permissions.canReadFinance && (
                          <td className="p-3 whitespace-nowrap">
                            {commercialMoney(row.collectedIncomeCOP)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <CommercialEmpty>
                No hay captaciones con origen registradas en este alcance.
              </CommercialEmpty>
            )}
          </section>
          {state.permissions.canReadFinance && (
            <section className="space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <h3 className="font-semibold">
                  Ingresos por tipo de pagador a FINTERA
                </h3>
                <Link href="/admin/crm/finance" className="text-sm underline">
                  Revisar cartera y soportes
                </Link>
              </div>
              {state.metrics.byPayer.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {state.metrics.byPayer.map((row) => (
                    <div
                      key={row.counterpartyType}
                      className="rounded-xl border border-slate-700 p-4"
                    >
                      <h4 className="text-sm font-semibold">
                        {row.counterpartyType === "BANK"
                          ? "Bancos"
                          : row.counterpartyType === "ALLY"
                            ? "Aliados"
                            : row.counterpartyType}
                      </h4>
                      <p className="mt-2 text-sm">
                        Reconocido: {commercialMoney(row.recognizedIncomeCOP)}
                      </p>
                      <p className="mt-1 text-sm">
                        Recaudo neto: {commercialMoney(row.collectedIncomeCOP)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <CommercialEmpty>
                  Sin ingresos reconocidos por pagador. No se infiere una
                  comisión de una captación o simulación.
                </CommercialEmpty>
              )}
            </section>
          )}
          <section className="rounded-xl border border-slate-700 p-4">
            <h3 className="text-sm font-semibold">Automatización observable</h3>
            <p className="mt-2 text-sm text-slate-400">
              {state.worker.message}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Último heartbeat: {commercialDate(state.worker.lastHeartbeatAt)} ·
              Envíos externos:{" "}
              {state.worker.notificationsEnabled
                ? "habilitados sujetos a aprobación explícita"
                : "deshabilitados"}
            </p>
          </section>
        </>
      )}
    </section>
  );
}
