"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PortalApplicationCard } from "./PortalApplicationCard";
import { PortalLinkAccount } from "./PortalLinkAccount";
import { PortalEmpty, PortalError, PortalLoading, PortalPageHeader } from "./PortalPrimitives";
import { PortalApiFailure, portalProductLabel, portalErrorMessage, usePortalRead, type PortalDashboard } from "./portal-api";

export function PortalApplications() {
  const { data, error, loading, reload } = usePortalRead<PortalDashboard>("/api/portal/dashboard");
  const [search, setSearch] = useState("");
  const [onlyAction, setOnlyAction] = useState(false);
  const applications = data?.applications || [];
  const needle = search.trim().toLocaleLowerCase("es");
  const visible = applications.filter(application => (!onlyAction || application.actionRequiredAlerts.length > 0) && (!needle || [application.fileNumber, application.productCategory, portalProductLabel(application.productCategory), application.overallPublicStage, ...application.bankCases.map(bank => bank.bankId)].some(value => value.toLocaleLowerCase("es").includes(needle))));
  return <><PortalPageHeader eyebrow="MIS SOLICITUDES" title="Cada solicitud, en un solo lugar" description="Consulta las novedades publicadas y accede a los documentos de cada expediente." actions={<Link href="/solicitar" className="portal-button"><Plus size={16} aria-hidden="true" />Nueva solicitud</Link>} />{loading ? <PortalLoading label="Cargando tus solicitudes…" /> : error ? error instanceof PortalApiFailure && error.status === 401 ? <PortalLinkAccount onLinked={reload} /> : <PortalError message={portalErrorMessage(error)} onRetry={reload} /> : !data?.isLinked && !applications.length ? <PortalLinkAccount onLinked={reload} /> : <div className="portal-stack"><div className="portal-application-filters"><div className="relative min-w-0 flex-1"><label htmlFor="portal-application-search" className="sr-only">Buscar por referencia, producto, estado o banco</label><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="portal-application-search" value={search} onChange={event => setSearch(event.target.value)} className="portal-field portal-field-search" placeholder="Buscar solicitud, estado o banco" /></div><div className="portal-filter-tabs"><button type="button" aria-pressed={!onlyAction} className={!onlyAction ? "is-current" : ""} onClick={() => setOnlyAction(false)}>Todas ({applications.length})</button><button type="button" aria-pressed={onlyAction} className={onlyAction ? "is-current" : ""} onClick={() => setOnlyAction(true)}>Requieren atención</button></div></div>{visible.length ? <div className="portal-section-stack">{visible.map(application => <PortalApplicationCard key={application.id} application={application} statusOnly={!!data?.isStatusOnly} />)}</div> : <PortalEmpty title={applications.length ? "No encontramos coincidencias" : "Aún no hay solicitudes vinculadas"} description={applications.length ? "Prueba otra referencia o consulta todas tus solicitudes." : "Puedes iniciar una solicitud o pedir ayuda para vincular una que ya registraste."} action={applications.length ? <button type="button" className="portal-button portal-button-secondary" onClick={() => { setSearch(""); setOnlyAction(false); }}>Limpiar filtros</button> : <Link href="/contacto" className="portal-button portal-button-secondary">Ayuda para vincular</Link>} />}</div>}</>;
}
