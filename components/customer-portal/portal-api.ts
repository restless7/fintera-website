"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortalApiError } from "@/lib/portal/portal-contracts";

export class PortalApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function portalRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { ...(options?.body ? { "Content-Type": "application/json" } : {}), ...options?.headers } });
  let result: unknown;
  try { result = await response.json(); } catch { throw new PortalApiFailure(response.status, "UNCONFIRMED_RESPONSE", "No pudimos confirmar la respuesta. Consulta el estado antes de repetir la operación."); }
  if (!response.ok) {
    const error = result as Partial<PortalApiError>;
    throw new PortalApiFailure(response.status, error.code || "REQUEST_FAILED", error.error || "No pudimos completar esta solicitud.");
  }
  return result as T;
}

export function portalErrorMessage(error: unknown): string {
  if (error instanceof PortalApiFailure) {
    if (error.status === 401) return "Inicia sesión para consultar la información autorizada de tu solicitud.";
    if (error.status === 403) return "Esta cuenta no tiene acceso a la información solicitada. Revisa la vinculación de tu expediente.";
    if (error.status === 409) return "La información cambió mientras la editabas. Actualiza el estado y revisa los cambios antes de guardar.";
    if (error.status >= 500) return "El servicio no está disponible en este momento. Tu información no se ha podido actualizar.";
    return error.message;
  }
  return "No pudimos conectar con el servicio. Revisa la conexión y consulta el estado antes de repetir la operación.";
}

export function usePortalRead<T>(url: string | null) {
  const [revision, setRevision] = useState(0);
  const requestKey = `${url || ""}:${revision}`;
  const [result, setResult] = useState<{ key: string; data: T | null; error: unknown } | null>(null);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    void portalRequest<T>(url, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ key: requestKey, data, error: null });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ key: requestKey, data: null, error });
    });
    return () => controller.abort();
  }, [url, requestKey]);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { data: result?.key === requestKey ? result.data : null, error: result?.key === requestKey ? result.error : null, loading: !!url && result?.key !== requestKey, reload };
}

export interface PortalBankSummary { id: string; bankId: string; productType: string; publicStageTitle: string; publicExplanation: string; badgeVariant: string; actionRequiredNote: string | null; filingNumber: string | null; lastUpdated: string; }
export interface PortalApplicationSummary { id: string; fileNumber: string; productCategory: string; requestedAmount: number | null; termMonths: number | null; createdAt: string; status: string; overallPublicStage: string; overallProgressPercentage: number; assignedAdvisor: { name: string; email: string; phone: string } | null; bankCases: PortalBankSummary[]; actionRequiredAlerts: string[]; }
export interface PortalDashboard { isStatusOnly?: boolean; isLinked: boolean; client: { fullName: string; documentType: string; documentNumberMasked: string; email: string; phoneMasked: string } | null; applications: PortalApplicationSummary[]; }
export const portalDocumentHref = (applicationId: string) => "/portal/documentos?applicationId=" + encodeURIComponent(applicationId);

const portalProductLabels: Record<string, string> = {
  VIVIENDA_VIS: "Vivienda VIS",
  VIVIENDA_NO_VIS: "Vivienda No VIS",
  HIPOTECARIO_VIS: "Crédito hipotecario VIS",
  HIPOTECARIO_NO_VIS: "Crédito hipotecario No VIS",
  LEASING: "Leasing habitacional",
  LEASING_HABITACIONAL: "Leasing habitacional",
  CONSUMO_ACABADOS: "Crédito para acabados",
};
export const portalProductLabel = (category: string) => portalProductLabels[category] || category || "Solicitud de crédito";
