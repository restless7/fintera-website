"use client";

import { RefreshCw } from "lucide-react";
import {
  COMMERCIAL_API,
  type CommercialState,
} from "@/lib/commercial/contracts";
import { CaseOperationsForm } from "./CommercialWorkspace";
import {
  CommercialEmpty,
  CommercialFeedback,
  CommercialPendingCommands,
  CommercialForm,
  useCommercialState,
  type CommercialField,
} from "./CommercialUI";
import { colombiaDate, commercialDate, commercialMoney } from "./format";

const evidence: CommercialField = {
  name: "evidence",
  label: "Referencia del soporte verificable",
  required: true,
  hint: "Identifica la constancia real. Escribir una referencia no verifica automáticamente el documento.",
};
const contactLabels: Record<string, string> = {
  REACHED: "Contacto logrado",
  NO_ANSWER: "Sin respuesta",
  CALLBACK: "Devolución de llamada",
  DOCUMENTS_REQUESTED: "Documentos solicitados",
  NOT_INTERESTED: "Sin interés",
};

function BankClosing({
  state,
  applicationId,
  bank,
  onChanged,
}: {
  state: CommercialState;
  applicationId: string;
  bank: CommercialState["bankApplications"][number];
  onChanged: () => void;
}) {
  const handoffs = state.handoffs.filter(
    (row) => row.bankApplicationId === bank.id,
  );
  const conditions = state.closingConditions.filter(
    (row) => row.bankApplicationId === bank.id,
  );
  const disbursements = state.disbursements.filter(
    (row) => row.bankApplicationId === bank.id,
  );
  const current = disbursements.find((row) => row.isCurrent);
  const bankName =
    state.bankCatalog.find((row) => row.id === bank.bankId)?.name ||
    bank.bankId;
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/40 p-5 space-y-5">
      <div>
        <h3 className="font-semibold">{bankName}</h3>
        <p className="mt-1 text-xs text-slate-400">
          Los registros de cierre complementan el flujo bancario; no cambian por
          sí solos una decisión del banco.
        </p>
      </div>
      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Entrega acreditada al banco</h4>
        {handoffs.length ? (
          <ul className="space-y-3">
            {handoffs.map((row) => (
              <li key={row.id} className="text-sm">
                <strong>{row.reference}</strong>
                <p className="text-xs text-slate-400">
                  {commercialDate(row.deliveredAt)}
                </p>
                <p className="break-all text-xs text-slate-400">
                  Soporte: {row.evidenceReference}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <CommercialEmpty>Sin entrega acreditada registrada.</CommercialEmpty>
        )}
        {state.permissions.canManageBanks && (
          <CommercialForm
            formKey={"handoff:" + bank.id}
            title="Registrar entrega real al banco"
            initial={{ reference: "", at: "", evidence: "", reason: "" }}
            fields={[
              {
                name: "reference",
                label: "Referencia real de radicación o recepción",
                required: true,
              },
              {
                name: "at",
                label: "Fecha de entrega acreditada (Colombia)",
                type: "datetime-local",
                required: true,
              },
              evidence,
            ]}
            build={(v, base) => ({
              ...base,
              action: "recordHandoff",
              applicationId,
              bankApplicationId: bank.id,
              reference: v.reference,
              deliveredAt: colombiaDate(v.at)!,
              evidenceReference: v.evidence,
            })}
            onChanged={onChanged}
            confirmText="¿La entrega al banco ocurrió y está respaldada por esta constancia? Esto no equivale a aprobación ni desembolso."
          />
        )}
      </section>
      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Condiciones de cierre</h4>
        {conditions.length ? (
          conditions.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-slate-700 p-4 space-y-3"
            >
              <div>
                <strong className="text-sm">{row.title}</strong>
                <p className="mt-1 text-xs text-slate-400">
                  {row.status === "OPEN"
                    ? "Pendiente"
                    : row.status === "SATISFIED"
                      ? "Cumplida con soporte"
                      : "Dispensada con soporte"}{" "}
                  · Fecha: {commercialDate(row.dueAt)}
                </p>
                {row.evidenceReference && (
                  <p className="mt-1 break-all text-xs text-slate-400">
                    Soporte: {row.evidenceReference}
                  </p>
                )}
              </div>
              {state.permissions.canManageBanks && row.status === "OPEN" && (
                <CommercialForm
                  operationKey={"condition:" + row.id}
                  formKey={"condition:" + row.id + ":" + row.revision}
                  title="Registrar resolución de la condición"
                  initial={{ status: "", evidence: "", reason: "" }}
                  fields={[
                    {
                      name: "status",
                      label: "Resultado respaldado",
                      type: "select",
                      required: true,
                      options: [
                        { value: "", label: "Selecciona el resultado real" },
                        { value: "SATISFIED", label: "Cumplida" },
                        {
                          value: "WAIVED",
                          label: "Dispensada por quien corresponde",
                        },
                      ],
                    },
                    evidence,
                  ]}
                  build={(v, base) => ({
                    ...base,
                    action: "updateCondition",
                    applicationId,
                    conditionId: row.id,
                    expectedRevision: row.revision,
                    status: v.status as "SATISFIED",
                    evidenceReference: v.evidence,
                  })}
                  onChanged={onChanged}
                />
              )}
            </div>
          ))
        ) : (
          <CommercialEmpty>
            No hay condiciones de cierre registradas. Esto no certifica que el
            banco no exija ninguna.
          </CommercialEmpty>
        )}
        {state.permissions.canManageBanks && (
          <CommercialForm
            formKey={"condition:new:" + bank.id}
            title="Añadir condición de cierre"
            initial={{ title: "", due: "", reason: "" }}
            fields={[
              {
                name: "title",
                label: "Condición solicitada realmente",
                required: true,
              },
              {
                name: "due",
                label: "Fecha límite, si consta (Colombia)",
                type: "datetime-local",
              },
            ]}
            build={(v, base) => ({
              ...base,
              action: "addCondition",
              applicationId,
              bankApplicationId: bank.id,
              title: v.title,
              dueAt: colombiaDate(v.due),
            })}
            onChanged={onChanged}
          />
        )}
      </section>
      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Desembolso real acreditado</h4>
        {disbursements.length ? (
          <ul className="space-y-3">
            {disbursements.map((row) => (
              <li key={row.id} className="text-sm">
                <strong>
                  {commercialMoney(row.amountCOP)} ·{" "}
                  {row.isCurrent
                    ? "Registro vigente"
                    : "Registro sustituido; conservado en historia"}
                </strong>
                <p className="text-xs text-slate-400">
                  {commercialDate(row.occurredAt)} · {row.reference}
                </p>
                <p className="break-all text-xs text-slate-400">
                  Soporte: {row.evidenceReference}
                </p>
                {row.supersedesId && (
                  <p className="break-all text-xs text-slate-400">
                    Corrige el registro {row.supersedesId}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <CommercialEmpty>
            No se ha registrado un desembolso real. Una aprobación o simulación
            no se presenta como dinero desembolsado.
          </CommercialEmpty>
        )}
        {state.permissions.canRecordDisbursement && (
          <CommercialForm
            operationKey={"disbursement:" + bank.id}
            formKey={"disbursement:" + bank.id + ":" + (current?.id || "new")}
            title={
              current
                ? "Corregir registro de desembolso con trazabilidad"
                : "Registrar desembolso real"
            }
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
                label: "Importe realmente desembolsado (COP)",
                required: true,
                hint: "Decimal sin separadores de miles; conserva centavos. No uses el importe solicitado o aprobado como sustituto.",
              },
              {
                name: "at",
                label: "Fecha efectiva del desembolso (Colombia)",
                type: "datetime-local",
                required: true,
              },
              {
                name: "reference",
                label: "Referencia real del desembolso",
                required: true,
              },
              evidence,
            ]}
            build={(v, base) => ({
              ...base,
              action: "recordDisbursement",
              applicationId,
              bankApplicationId: bank.id,
              amountCOP: v.amount,
              occurredAt: colombiaDate(v.at)!,
              reference: v.reference,
              evidenceReference: v.evidence,
              supersedesId: current?.id || null,
            })}
            onChanged={onChanged}
            confirmText={
              current
                ? "¿Corregir este desembolso conservando el registro anterior? Revisa el soporte y sus efectos sobre ingresos ya reconocidos."
                : "¿El desembolso ocurrió realmente y está respaldado por esta constancia? No se registrará una promesa o una aprobación como desembolso."
            }
          />
        )}
      </section>
    </article>
  );
}

function CaseNotifications({
  state,
  applicationId,
  onChanged,
}: {
  state: CommercialState;
  applicationId: string;
  onChanged: () => void;
}) {
  const rows = state.notifications.filter(
    (row) => row.applicationId === applicationId,
  );
  return (
    <section className="space-y-4">
      <h3 className="font-semibold">Comunicaciones bajo revisión</h3>
      <p className="text-sm text-slate-400">
        La vista previa no contacta al cliente. La aprobación de un mensaje es
        explícita, conserva su destinatario y contenido exactos y no acredita
        entrega.
      </p>
      <p className="rounded-lg border border-slate-700 p-3 text-xs leading-relaxed text-slate-300">
        Preparar un mensaje requiere correo principal verificado en Clerk,
        contacto de procedencia validada, consentimiento comercial vigente y
        preferencia de contacto por correo electrónico. La autorización de
        tratamiento de datos del formulario de solicitud no sustituye ese
        consentimiento. Si falta alguno, el servidor impide la preparación; el
        equipo no puede activar el consentimiento por el cliente. Los envíos
        externos permanecen deshabilitados en esta entrega.
      </p>
      {state.permissions.canOperate && (
        <CommercialForm
          formKey={"notification:prepare:" + applicationId}
          title="Preparar vista previa de un mensaje"
          initial={{ subject: "", content: "", reason: "" }}
          fields={[
            { name: "subject", label: "Asunto propuesto", required: true },
            {
              name: "content",
              label: "Contenido exacto para revisión",
              type: "textarea",
              required: true,
            },
          ]}
          build={(v, base) => ({
            ...base,
            action: "prepareNotification",
            applicationId,
            subject: v.subject,
            content: v.content,
          })}
          onChanged={onChanged}
          submitLabel="Guardar vista previa"
          footnote="Esta acción conserva un borrador para revisión; no envía un correo ni contacta al cliente."
        />
      )}
      {rows.length ? (
        rows.map((row) => (
          <article
            key={row.id}
            className="rounded-lg border border-slate-700 p-4 space-y-3"
          >
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-400">
                  Destinatario resuelto por el servidor
                </dt>
                <dd className="break-all">{row.recipient}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Asunto</dt>
                <dd>{row.subject}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Contenido exacto</dt>
                <dd className="whitespace-pre-wrap">{row.content}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Estado registrado</dt>
                <dd>
                  {(
                    {
                      AWAITING_APPROVAL: "Vista previa pendiente de aprobación",
                      QUEUED: "En cola; entrega no confirmada",
                      PROVIDER_ACKNOWLEDGED:
                        "Aceptado por proveedor; entrega no confirmada",
                      DELIVERED: "Entrega confirmada por proveedor",
                      FAILED: "No entregado; requiere revisión",
                    } as Record<string, string>
                  )[row.status] || row.status}
                </dd>
              </div>
            </dl>
            <p className="break-all text-xs text-slate-400">
              Huella del contenido: {row.contentHash}
            </p>
            {row.providerId && (
              <p className="break-all text-xs text-slate-400">
                Recibo del proveedor: {row.providerId}
              </p>
            )}
            {state.permissions.canApproveNotifications &&
              row.status === "AWAITING_APPROVAL" && (
                <CommercialForm
                  operationKey={"notification:approve:" + row.id}
                  formKey={
                    "notification:approve:" + row.id + ":" + row.revision
                  }
                  title="Revisar y aprobar este mensaje exacto"
                  initial={{ reviewed: "", reason: "" }}
                  fields={[
                    {
                      name: "reviewed",
                      label:
                        "Revisé el destinatario, el asunto y el contenido exactos de esta vista previa",
                      type: "checkbox",
                      required: true,
                    },
                  ]}
                  build={(_v, base) => ({
                    ...base,
                    action: "approveNotification",
                    applicationId,
                    notificationId: row.id,
                    expectedRevision: row.revision,
                    contentHash: row.contentHash,
                  })}
                  onChanged={onChanged}
                  submitLabel="Aprobar este mensaje"
                  confirmText={
                    "¿Aprobar exactamente este mensaje para " +
                    row.recipient +
                    "? La aprobación puede dejarlo en cola; no certifica entrega ni autoriza otros mensajes."
                  }
                  footnote={
                    state.worker.notificationsEnabled
                      ? "La entrega depende del proveedor y de su recibo real. Una aprobación o cola no equivale a entrega."
                      : "El envío externo está deshabilitado. Esta aprobación deja un registro en cola, no envía el mensaje ni acredita entrega."
                  }
                />
              )}
          </article>
        ))
      ) : (
        <CommercialEmpty>
          No hay vistas previas ni mensajes registrados para este expediente.
        </CommercialEmpty>
      )}
    </section>
  );
}

export function CaseCommercialPanel({
  applicationId,
}: {
  applicationId: string;
}) {
  const resource = useCommercialState(
    COMMERCIAL_API + "?applicationId=" + encodeURIComponent(applicationId),
  );
  const state = resource.data;
  const application = state?.applications.find(
    (row) => row.id === applicationId,
  );
  return (
    <section
      className="admin-card space-y-5 p-5 sm:p-6"
      aria-labelledby="case-commercial-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="case-commercial-title" className="text-lg font-semibold">
            Seguimiento comercial y cierre
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Responsables, contactos efectuados y hechos bancarios acreditados de
            este expediente.
          </p>
        </div>
        <button
          type="button"
          className="admin-button"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Actualizar
        </button>
      </div>
      <CommercialPendingCommands />
      <CommercialFeedback
        loading={resource.loading}
        error={resource.error}
        onReload={resource.reload}
      />
      {state && application ? (
        <>
          <CaseOperationsForm
            state={state}
            application={application}
            onChanged={resource.reload}
          />
          <section className="space-y-3">
            <h3 className="font-semibold">Contactos efectuados</h3>
            {state.contacts.filter((row) => row.applicationId === applicationId)
              .length ? (
              <ul className="space-y-3">
                {state.contacts
                  .filter((row) => row.applicationId === applicationId)
                  .map((row) => (
                    <li
                      key={row.id}
                      className="rounded-lg border border-slate-700 p-4 text-sm"
                    >
                      <strong>
                        {contactLabels[row.outcome] || row.outcome}
                      </strong>
                      <p className="text-xs text-slate-400">
                        {commercialDate(row.occurredAt)} · Próxima acción:{" "}
                        {commercialDate(row.nextActionAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap">{row.note}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <CommercialEmpty>
                No hay contactos efectuados registrados.
              </CommercialEmpty>
            )}
          </section>
          {state.bankApplications.filter(
            (row) => row.applicationId === applicationId,
          ).length ? (
            state.bankApplications
              .filter((row) => row.applicationId === applicationId)
              .map((bank) => (
                <BankClosing
                  key={bank.id}
                  state={state}
                  applicationId={applicationId}
                  bank={bank}
                  onChanged={resource.reload}
                />
              ))
          ) : (
            <CommercialEmpty>
              Este expediente aún no tiene un caso bancario. Utiliza el flujo
              bancario existente para crearlo cuando corresponda; no se inventa
              una radicación.
            </CommercialEmpty>
          )}
          <CaseNotifications
            state={state}
            applicationId={applicationId}
            onChanged={resource.reload}
          />
        </>
      ) : state ? (
        <CommercialEmpty>
          Este expediente no está disponible en tu alcance. No se muestra otro
          expediente como sustituto.
        </CommercialEmpty>
      ) : null}
    </section>
  );
}
