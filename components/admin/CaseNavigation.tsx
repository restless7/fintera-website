"use client";
import { useEffect } from "react";
import { useSetCaseReference } from "./AdminShell";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function safeQueueReturn(value: string | null | undefined): string {
  if (!value) return "/admin/crm/applications";
  try {
    const url = new URL(value, "https://fintera.invalid");
    if (url.origin === "https://fintera.invalid" && url.pathname === "/admin/crm/applications") return url.pathname + url.search;
  } catch {}
  return "/admin/crm/applications";
}
export function CaseNavigation({ applicationId, fileNumber, documents = false }: { applicationId: string; fileNumber?: string; documents?: boolean }) {
  const setCaseReference = useSetCaseReference();
  useEffect(() => { setCaseReference(fileNumber || null); return () => setCaseReference(null); }, [fileNumber, setCaseReference]);
  const query = useSearchParams();
  const returnTo = safeQueueReturn(query.get("returnTo"));
  const suffix = `?returnTo=${encodeURIComponent(returnTo)}`;
  const base = `/admin/crm/applications/${encodeURIComponent(applicationId)}`;
  return <div className="admin-case-context">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs font-medium text-slate-300">{fileNumber || "Expediente"}</span>
      <Link href={returnTo} className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">← Volver a la bandeja</Link>
    </div>
    <nav aria-label="Secciones del expediente" className="admin-case-nav">
      <Link href={base + suffix} aria-current={!documents ? "page" : undefined}>Resumen</Link>
      <Link href={base + suffix + "#bancos"}>Procesos bancarios</Link>
      <Link href={base + "/documents" + suffix} aria-current={documents ? "page" : undefined}>Documentos</Link>
      <Link href={base + suffix + "#actividad"}>Actividad</Link>
    </nav>
  </div>;
}
