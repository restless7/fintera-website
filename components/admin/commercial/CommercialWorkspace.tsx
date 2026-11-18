"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  COMMERCIAL_API,
  type CommercialState,
  type LeadDTO,
} from "@/lib/commercial/contracts";
import {
  CommercialEmpty,
  CommercialFeedback,
  CommercialPendingCommands,
  CommercialForm,
  commercialFieldClass,
  useCommercialState,
  type CommercialField,
} from "./CommercialUI";
import {
  colombiaDate,
  commercialDate,
  commercialMoney,
  localDateInput,
} from "./format";

const leadLabels: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  LOST: "Sin continuidad",
};
const contactLabels: Record<string, string> = {
  REACHED: "Contacto logrado",
  NO_ANSWER: "Sin respuesta",
  CALLBACK: "Solicitó devolución de llamada",
  DOCUMENTS_REQUESTED: "Documentos solicitados",
  NOT_INTERESTED: "Sin interés",
};
export const contactFields: CommercialField[] = [
  {
    name: "outcome",
    label: "Resultado del contacto",
    type: "select",
    required: true,
    options: Object.entries(contactLabels).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    name: "occurredAt",
    label: "Fecha y hora del contacto (Colombia)",
    type: "datetime-local",
    required: true,
  },
  {
    name: "nextActionAt",
    label: "Próxima acción (Colombia)",
    type: "datetime-local",
  },
  {
    name: "note",
    label: "Nota del contacto realmente efectuado",
    type: "textarea",
    required: true,
  },
];
export function assignmentFields(state: CommercialState): CommercialField[] {
  return [
    {
      name: "advisor",
      label: "Asesor responsable",
      type: "select",
      disabled: !state.permissions.canAssign,
      options: [
        { value: "", label: "Sin asignar" },
        ...state.advisors.map((advisor) => ({
          value: advisor.id,
          label: advisor.name,
        })),
      ],
    },
    {
      name: "team",
      label: "Equipo",
      type: "select",
      disabled: !state.permissions.canAssign,
      options: [
        { value: "", label: "Sin equipo" },
        ...state.teams.map((team) => ({ value: team.id, label: team.name })),
      ],
    },
    {
      name: "nextActionAt",
      label: "Próxima acción (Colombia)",
      type: "datetime-local",
    },
  ];
}
export function CaseOperationsForm({
  state,
  application,
  onChanged,
}: {
  state: CommercialState;
  application: CommercialState["applications"][number];
  onChanged: () => void;
}) {
  if (!state.permissions.canOperate) return null;
  return (
    <div className="space-y-3">
      <CommercialForm
        operationKey={"case:" + application.id}
        formKey={"case:" + application.id + ":" + application.revision}
        title="Responsable y próxima acción"
        initial={{
          advisor: application.assignedAdvisorId || "",
          team: application.teamId || "",
          nextActionAt: localDateInput(application.nextActionDate),
          note: application.nextActionNote || "",
          reason: "",
        }}
        fields={[
          ...assignmentFields(state),
          {
            name: "note",
            label: "Qué debe hacerse a continuación",
            type: "textarea",
          },
        ]}
        build={(v, base) => ({
          ...base,
          action: "updateCase",
          applicationId: application.id,
          expectedRevision: application.revision,
          assignedAdvisorId: v.advisor || null,
          teamId: v.team || null,
          nextActionAt: colombiaDate(v.nextActionAt),
          nextActionNote: v.note || "",
        })}
        onChanged={onChanged}
      />
      <CommercialForm
        operationKey={"case-contact:" + application.id}
        formKey={"case-contact:" + application.id + ":" + application.revision}
        title="Registrar contacto efectuado"
        initial={{
          outcome: "REACHED",
          occurredAt: "",
          nextActionAt: "",
          note: "",
          reason: "",
        }}
        fields={contactFields}
        build={(v, base) => ({
          ...base,
          action: "recordContact",
          applicationId: application.id,
          expectedRevision: application.revision,
          outcome: v.outcome as "REACHED",
          note: v.note,
          occurredAt: colombiaDate(v.occurredAt)!,
          nextActionAt: colombiaDate(v.nextActionAt),
        })}
        onChanged={onChanged}
      />
    </div>
  );
}
function LeadCard({
  lead,
  state,
  onChanged,
}: {
  lead: LeadDTO;
  state: CommercialState;
  onChanged: () => void;
}) {
  const appOptions = [
    { value: "", label: "Elige un expediente existente" },
    ...state.applications.map((app) => ({
      value: app.id,
      label: app.fileNumber,
    })),
  ];
  const contacts = state.contacts.filter(
    (contact) => contact.leadId === lead.id,
  );
  return (
    <article className="admin-card space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">{lead.clientName}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {lead.productLabel} · {lead.city}
          </p>
        </div>
        <span className="rounded-full border border-slate-600 px-3 py-1 text-xs">
          {leadLabels[lead.status] || lead.status}
        </span>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-400">Contacto recibido</dt>
          <dd className="break-all">
            {lead.contactEmail}
            <br />
            {lead.contactPhone}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Importe solicitado</dt>
          <dd>{commercialMoney(lead.amountCOP)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Próxima acción</dt>
          <dd>{commercialDate(lead.nextActionAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Origen declarado</dt>
          <dd>
            {lead.attribution.source || "Sin identificar"}
            {lead.partnerName ? " · Aliado: " + lead.partnerName : ""}
            <span className="block text-xs text-slate-400">
              Atribución suministrada, sin verificación independiente.
            </span>
          </dd>
        </div>
      </dl>
      {lead.applicationId ? (
        <Link
          href={
            "/admin/crm/applications/" + encodeURIComponent(lead.applicationId)
          }
          className="admin-button"
        >
          Abrir expediente vinculado
        </Link>
      ) : (
        <p className="text-sm text-slate-400">
          Esta captación aún no es un expediente.{" "}
          <Link
            href="/credit-request"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Completar el intake real
          </Link>{" "}
          y después revisar su vinculación, sin copiar supuestos financieros.
        </p>
      )}
      {state.permissions.canOperate && (
        <>
          <CommercialForm
            operationKey={"lead:" + lead.id}
            formKey={"lead:" + lead.id + ":" + lead.revision}
            title="Gestionar prospecto"
            initial={{
              advisor: lead.assignedAdvisorId || "",
              team: lead.teamId || "",
              nextActionAt: localDateInput(lead.nextActionAt),
              status: lead.status,
              reason: "",
            }}
            fields={[
              ...assignmentFields(state),
              {
                name: "status",
                label: "Situación comercial",
                type: "select",
                required: true,
                options: Object.entries(leadLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              },
            ]}
            build={(v, base) => ({
              ...base,
              action: "updateLead",
              leadId: lead.id,
              expectedRevision: lead.revision,
              assignedAdvisorId: v.advisor || null,
              teamId: v.team || null,
              nextActionAt: colombiaDate(v.nextActionAt),
              status: v.status as "NEW",
            })}
            onChanged={onChanged}
          />
          <CommercialForm
            operationKey={"lead-contact:" + lead.id}
            formKey={"lead-contact:" + lead.id + ":" + lead.revision}
            title="Registrar contacto efectuado"
            initial={{
              outcome: "REACHED",
              occurredAt: "",
              nextActionAt: "",
              note: "",
              reason: "",
            }}
            fields={contactFields}
            build={(v, base) => ({
              ...base,
              action: "recordContact",
              leadId: lead.id,
              expectedRevision: lead.revision,
              outcome: v.outcome as "REACHED",
              note: v.note,
              occurredAt: colombiaDate(v.occurredAt)!,
              nextActionAt: colombiaDate(v.nextActionAt),
            })}
            onChanged={onChanged}
          />
          {!lead.applicationId && (
            <CommercialForm
              operationKey={"link-lead:" + lead.id}
              formKey={"link-lead:" + lead.id + ":" + lead.revision}
              title="Vincular con expediente real"
              initial={{ application: "", verified: "", reason: "" }}
              fields={[
                {
                  name: "application",
                  label: "Expediente autorizado",
                  type: "select",
                  required: true,
                  options: appOptions,
                },
                {
                  name: "verified",
                  label:
                    "He verificado que el contacto y la identidad corresponden a este expediente",
                  type: "checkbox",
                  required: true,
                },
              ]}
              build={(v, base) => ({
                ...base,
                action: "linkLead",
                leadId: lead.id,
                expectedRevision: lead.revision,
                applicationId: v.application,
                verifiedContact: true,
              })}
              onChanged={onChanged}
              confirmText="¿Confirmas la vinculación con el expediente elegido después de verificar el contacto? No se creará otro expediente."
            />
          )}
        </>
      )}
      {contacts.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">
            Contactos registrados ({contacts.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="border-t border-slate-700 pt-3 text-sm"
              >
                <strong>
                  {contactLabels[contact.outcome] || contact.outcome}
                </strong>
                <p className="text-xs text-slate-400">
                  {commercialDate(contact.occurredAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{contact.note}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
export function CommercialWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") || "leads";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") || "";
  const [query, setQuery] = useState(search);
  const resource = useCommercialState(
    COMMERCIAL_API + "?page=" + page + "&search=" + encodeURIComponent(search),
  );
  const state = resource.data;
  const navigate = (nextTab: string, nextPage = 1, nextSearch = search) =>
    router.push(
      "/admin/crm/commercial?tab=" +
        nextTab +
        "&page=" +
        nextPage +
        (nextSearch ? "&search=" + encodeURIComponent(nextSearch) : ""),
    );
  return (
    <div className="admin-page">
      <PageHeader
        title="Gestión comercial"
        eyebrow="Originación de vivienda"
        description="Captaciones recibidas, expedientes con responsable y revisión de solicitudes históricas."
        actions={
          <button
            type="button"
            className="admin-button"
            onClick={resource.reload}
            disabled={resource.loading}
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
      {state && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Captaciones en el alcance",
                value: state.metrics.lightLeads,
              },
              {
                label: "Expedientes canónicos",
                value: state.metrics.canonicalCases,
              },
              { label: "Casos bancarios", value: state.metrics.bankCases },
            ].map((metric) => (
              <div key={metric.label} className="admin-card p-4">
                <p className="text-xs text-slate-400">{metric.label}</p>
                <strong className="mt-2 block text-2xl">{metric.value}</strong>
              </div>
            ))}
          </div>
          {state.optionsTruncated && (
            <p className="text-sm text-amber-200">
              Se muestran hasta 200 expedientes autorizados en los selectores.
              Para consultar un expediente concreto, ábrelo desde Solicitudes;
              nunca vincules otro como sustituto.
            </p>
          )}
          <nav aria-label="Vistas comerciales" className="flex flex-wrap gap-2">
            {[
              { id: "leads", label: "Captaciones" },
              { id: "cases", label: "Expedientes" },
              ...(state.permissions.canReviewLegacy
                ? [{ id: "legacy", label: "Revisión histórica" }]
                : []),
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={tab === item.id ? "page" : undefined}
                className={
                  "admin-button " +
                  (tab === item.id ? "admin-button-primary" : "")
                }
                onClick={() => navigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {tab === "leads" ? (
            <>
              <form
                className="flex flex-wrap gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  navigate("leads", 1, query.trim());
                }}
              >
                <label className="min-w-0 flex-1 text-xs text-slate-400">
                  Buscar captación
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className={commercialFieldClass + " mt-2"}
                    placeholder="Nombre, correo o referencia"
                  />
                </label>
                <button type="submit" className="admin-button self-end">
                  Buscar
                </button>
              </form>
              <p className="text-xs text-slate-400">
                {state.totalLeads} captaciones coinciden. Los prospectos no
                equivalen a créditos aprobados.
              </p>
              {state.leads.length ? (
                state.leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    state={state}
                    onChanged={resource.reload}
                  />
                ))
              ) : (
                <CommercialEmpty>
                  No hay captaciones en esta consulta autorizada.
                </CommercialEmpty>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  className="admin-button"
                  onClick={() => navigate("leads", page - 1)}
                >
                  Anterior
                </button>
                <span className="text-sm">Página {state.page}</span>
                <button
                  type="button"
                  disabled={page * 25 >= state.totalLeads}
                  className="admin-button"
                  onClick={() => navigate("leads", page + 1)}
                >
                  Siguiente
                </button>
              </div>
            </>
          ) : tab === "cases" ? (
            <>
              {!state.applications.length ? (
                <CommercialEmpty>
                  No hay expedientes autorizados para esta cuenta. Una captación
                  o solicitud histórica no crea uno automáticamente.
                </CommercialEmpty>
              ) : (
                state.applications.map((app) => (
                  <article key={app.id} className="admin-card space-y-4 p-5">
                    <div className="flex flex-wrap justify-between gap-3">
                      <Link
                        href={
                          "/admin/crm/applications/" +
                          encodeURIComponent(app.id)
                        }
                        className="font-semibold underline"
                      >
                        {app.fileNumber}
                      </Link>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-slate-400">
                      {state.advisors.find(
                        (advisor) => advisor.id === app.assignedAdvisorId,
                      )?.name || "Sin asesor asignado"}{" "}
                      · Próxima acción: {commercialDate(app.nextActionDate)}
                    </p>
                    <CaseOperationsForm
                      state={state}
                      application={app}
                      onChanged={resource.reload}
                    />
                  </article>
                ))
              )}
            </>
          ) : tab === "legacy" && state.permissions.canReviewLegacy ? (
            <>
              <p className="text-sm text-slate-400">
                Las solicitudes históricas permanecen intactas. Revisarlas o
                vincularlas no importa datos financieros ni concede acceso al
                portal. Se muestran hasta 100 registros recientes.
              </p>
              {state.legacy.length ? (
                state.legacy.map((row) => (
                  <article key={row.id} className="admin-card space-y-4 p-5">
                    <h2 className="font-semibold">
                      Solicitud histórica · {row.id}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {commercialDate(row.createdAt)} · Solicitado:{" "}
                      {commercialMoney(row.requestedAmountCOP)}
                    </p>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-slate-400">
                          Contacto original
                        </dt>
                        <dd className="break-all">
                          {row.clientName}
                          <br />
                          {row.contactEmail}
                          <br />
                          {row.contactPhone}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-400">
                          Últimos cuatro del documento
                        </dt>
                        <dd>{row.documentLast4 || "Sin registrar"}</dd>
                      </div>
                    </dl>
                    <p className="text-sm">
                      Revisión:{" "}
                      {row.disposition === "LINKED"
                        ? "Vinculada"
                        : row.disposition === "DUPLICATE"
                          ? "Duplicada"
                          : row.disposition
                            ? "Revisada sin conversión"
                            : "Pendiente"}
                    </p>
                    <CommercialForm
                      operationKey={"legacy:" + row.id}
                      formKey={"legacy:" + row.id + ":" + row.revision}
                      title="Registrar revisión histórica"
                      initial={{
                        disposition:
                          row.disposition || "REVIEWED_NO_CONVERSION",
                        application: row.applicationId || "",
                        verified: "",
                        reason: "",
                      }}
                      fields={[
                        {
                          name: "disposition",
                          label: "Resultado de la revisión",
                          type: "select",
                          required: true,
                          options: [
                            {
                              value: "REVIEWED_NO_CONVERSION",
                              label: "Revisada sin conversión",
                            },
                            { value: "DUPLICATE", label: "Duplicada" },
                            {
                              value: "LINKED",
                              label: "Vincular con expediente existente",
                            },
                          ],
                        },
                        {
                          name: "application",
                          label: "Expediente existente, sólo para vincular",
                          type: "select",
                          options: [
                            { value: "", label: "Sin vinculación" },
                            ...state.applications.map((app) => ({
                              value: app.id,
                              label: app.fileNumber,
                            })),
                          ],
                        },
                        {
                          name: "verified",
                          label:
                            "Verifiqué la correspondencia del contacto cuando se requiere vinculación",
                          type: "checkbox",
                        },
                      ]}
                      build={(v, base) => ({
                        ...base,
                        action: "reviewLegacy",
                        legacyId: row.id,
                        expectedRevision: row.revision,
                        disposition: v.disposition as "LINKED",
                        applicationId:
                          v.disposition === "LINKED"
                            ? v.application || null
                            : null,
                        verifiedContact: v.verified === "yes",
                      })}
                      onChanged={resource.reload}
                      confirmText="¿Registrar esta revisión sin modificar la solicitud histórica original? Una vinculación requiere contacto verificado."
                    />
                  </article>
                ))
              ) : (
                <CommercialEmpty>
                  No hay solicitudes históricas disponibles.
                </CommercialEmpty>
              )}
            </>
          ) : (
            <CommercialEmpty>
              Esta vista no está disponible para tu cuenta.
            </CommercialEmpty>
          )}
          <section className="admin-card space-y-2 p-5">
            <h2 className="font-semibold">Estado operativo</h2>
            <p className="text-sm text-slate-400">{state.worker.message}</p>
            <p className="text-xs text-slate-400">
              Último heartbeat: {commercialDate(state.worker.lastHeartbeatAt)} ·
              Comunicaciones externas:{" "}
              {state.worker.notificationsEnabled
                ? "Habilitadas bajo aprobación expresa"
                : "Deshabilitadas"}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
