import { requireAdminApplication } from "@/lib/auth/admin-session";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CaseNavigation } from "@/components/admin/CaseNavigation";
import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { BankWorkflowRegistry } from "@/lib/crm/bank-workflows/registry";
import BankWorkflowCard from "./BankWorkflowCard";
import DocumentWorkspaceCard from "./DocumentWorkspaceCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  await requireAdminApplication(id);
  const app = await prisma.crmCreditApplication.findUnique({
    where: { id },
    select: { fileNumber: true },
  });
  return {
    title: `Expediente ${app?.fileNumber || "Detalle"} · Fintera CRM`,
  };
}

export default async function CaseWorkspacePage({ params }: PageProps) {
  const { id } = await params;

  const context = await requireAdminApplication(id);

  const application = await prisma.crmCreditApplication.findUnique({
    where: { id },
    include: {
      client: {
        include: {
          consentRecords: { take: 5, orderBy: { grantedAt: "desc" } },
        },
      },
      applicants: { orderBy: { role: "asc" } },
      bankApplications: {
        orderBy: { createdAt: "asc" },
        include: {
          transitions: { orderBy: { transitionedAt: "desc" }, take: 10 },
        },
      },
      simulationSnapshot: true,
      assignedAdvisor: true,
      team: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { author: true },
      },
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div className="admin-page">
      <div className="space-y-6">
        <PageHeader title={application.fileNumber} eyebrow="Expediente hipotecario" description={`${application.client.firstName} ${application.client.firstLastName} · ${application.productCategory.replace(/_/g, " ")}`} metadata={<StatusBadge status={application.status} />} />
        <CaseNavigation applicationId={application.id} fileNumber={application.fileNumber} />

        {/* Resumen Principal del Caso (Cards) */}
        <div id="resumen" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase">Monto Solicitado</span>
            <div className="whitespace-nowrap text-xl 2xl:text-2xl font-semibold text-white mt-1">
              ${application.requestedAmount.toLocaleString("es-CO")}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Plazo: {application.termMonths} meses ({application.termMonths / 12} años)
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase">Titular Principal</span>
            <div className="text-lg font-bold text-white mt-1 truncate">
              {application.client.firstName} {application.client.firstLastName}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {application.client.documentType} {application.client.documentNumber} · {application.client.phone}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase">Asignación Comercial</span>
            <div className="text-base font-bold text-slate-200 mt-1">
              {application.assignedAdvisor
                ? `${application.assignedAdvisor.firstName} ${application.assignedAdvisor.lastName}`
                : "Sin Asesor Asignado"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Equipo: {application.team?.name || "Sin Equipo"}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase">Próxima Acción</span>
            <div className={`text-base font-bold mt-1 ${application.nextActionDate && application.nextActionDate < new Date() && !["DISBURSED", "REJECTED", "CANCELLED_BY_CLIENT"].includes(application.status) ? "text-rose-300" : "text-slate-100"}`}>
              {application.nextActionDate
                ? new Date(application.nextActionDate).toLocaleDateString("es-CO")
                : "Sin fecha fijada"}
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {application.nextActionNote || "Seguimiento general"}
            </p>
          </div>
        </div>

        {/* Sección de 2 Columnas: Datos del Caso y Bitácora */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Información Financiera, Titulares y Bancos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Snapshot Financiero Inmutable */}
            {application.simulationSnapshot && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                  <span>Simulación Financiera Vinculada</span>
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-semibold border border-emerald-500/20">
                    Snapshot Inmutable
                  </span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Banco Sugerido</span>
                    <div className="font-bold text-slate-100 uppercase">
                      {application.simulationSnapshot.simulatedBankId}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Tasa E.A.</span>
                    <div className="font-bold text-emerald-400">
                      {(application.simulationSnapshot.rateEA * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Cuota Total Estimada</span>
                    <div className="font-bold text-white">
                      ${Math.round(application.simulationSnapshot.initialMonthlyTotalPayment).toLocaleString("es-CO")}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">DTI Estimado</span>
                    <div className="font-bold text-blue-400">
                      {(application.simulationSnapshot.dtiRatio * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500 flex justify-between">
                  <span>Fuente: {application.simulationSnapshot.sourceDocument}</span>
                  <span>Versión: {application.simulationSnapshot.policyVersion}</span>
                </div>
              </div>
            )}

            {/* Sub-expedientes Bancarios (Gestión Multibanco) */}
            <div id="bancos" className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span>Sub-expedientes Bancarios Radicados</span>
                <span className="text-xs text-slate-400">
                  {application.bankApplications.length} alternativas bancarias
                </span>
              </h2>

              <div className="space-y-3">
                {application.bankApplications.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-4">
                    No se han radicado subexpedientes formales ante entidades bancarias.
                  </p>
                ) : (
                  application.bankApplications.map((bankApp) => (
                    <BankWorkflowCard
                      key={bankApp.id}
                      applicationId={application.id}
                      canManage={context.permissions.includes("crm:bank-case:manage")}
                      allowedTargetStages={BankWorkflowRegistry.getWorkflow(bankApp.bankId, bankApp.workflowVersion).transitionRules.filter(rule => rule.fromStage === bankApp.stage && rule.allowedRoles.includes(context.role) && !rule.isExceptionalOrCompensating).map(rule => rule.toStage)}
                      bankApp={bankApp as any}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Gestor Documental y Evidencias Multibanco (Gate E) */}
            <DocumentWorkspaceCard
              applicationId={application.id}
              bankApplications={application.bankApplications}
            />

            {/* Solicitantes, Cotitulares y Codeudores */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                Sujetos de Crédito (Titulares y Codeudores)
              </h2>

              <div className="space-y-3">
                {application.applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {applicant.firstName} {applicant.lastName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {{ PRIMARY_HOLDER: "Titular principal", CO_APPLICANT: "Cotitular", GUARANTOR: "Codeudor" }[applicant.role] || applicant.role.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {applicant.documentType} {applicant.documentNumber} · Ocupación: {applicant.occupation}
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-bold text-white">
                        Ingresos: ${applicant.monthlyIncome.toLocaleString("es-CO")}
                      </div>
                      <div className="text-slate-500">
                        Pasivos Vigentes: ${applicant.existingObligations.toLocaleString("es-CO")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Bitácora de Actividades (Internal Timeline) */}
          <div className="space-y-6">
            <div id="actividad" className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  Bitácora de Actividades
                </h2>
                <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  Privado / Interno
                </span>
              </div>

              {/* Lista de Actividades */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {application.activities.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-6 text-center">
                    Sin actividades registradas
                  </p>
                ) : (
                  application.activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                          {act.type}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(act.createdAt).toLocaleString("es-CO")}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-200 text-sm">
                        {act.title}
                      </div>
                      <p className="text-slate-400 whitespace-pre-line">
                        {act.description}
                      </p>
                      {act.author && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                          Por: {act.author.firstName} {act.author.lastName}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Controles de Seguridad y Reversión Selectiva */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">
                Trazabilidad del expediente
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Cualquier cambio de estado o cancelación selectiva es registrado inmutablemente en la bitácora de auditoría sin destrucción de datos.
              </p>
              <div className="text-xs font-mono text-slate-500">
                Referencia interna: {application.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
