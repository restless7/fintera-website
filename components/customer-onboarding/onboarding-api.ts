"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ONBOARDING_API,
  type OnboardingStateDTO,
} from "@/lib/onboarding/contracts";

export class OnboardingApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function onboardingRequest<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    signal,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new OnboardingApiError(
      response.status,
      result?.code || "REQUEST_FAILED",
      typeof result?.error === "string"
        ? result.error
        : "No pudimos confirmar esta operación.",
    );
  if (!result || typeof result !== "object")
    throw new Error("Unconfirmed response");
  return result as T;
}
export function onboardingError(error: unknown): string {
  if (error instanceof OnboardingApiError) {
    if (error.status === 429)
      return "Has realizado varios intentos. Espera un momento y vuelve a intentarlo.";
    if (error.status === 503 || error.status >= 500)
      return "El servicio no está disponible en este momento. Conservamos este intento en esta pestaña; no lo hemos declarado recibido.";
    return error.message;
  }
  return "No pudimos confirmar la respuesta. Reintenta el mismo envío para consultar su resultado, sin crear otro registro.";
}
export function useOnboardingState(requestId?: string) {
  const [state, setState] = useState<{
    data: OnboardingStateDTO | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => {
    setState((value) => ({ ...value, loading: true, error: null }));
    setAttempt((value) => value + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void onboardingRequest<OnboardingStateDTO>(
      `${ONBOARDING_API}/state${requestId ? `?requestId=${encodeURIComponent(requestId)}` : ""}`,
      undefined,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            data: null,
            loading: false,
            error: onboardingError(error),
          });
      });
    return () => controller.abort();
  }, [attempt, requestId]);
  return { ...state, reload };
}
