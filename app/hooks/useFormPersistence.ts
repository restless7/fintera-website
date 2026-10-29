import { useEffect, useCallback, useRef, useState, useSyncExternalStore } from "react";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { CreditRequestFormData } from "@/app/lib/validation/creditRequestSchema";

export const DRAFT_STORAGE_KEY = "fintera_credit_form_draft";
export const DRAFT_TIMESTAMP_KEY = "fintera_credit_form_timestamp";
export const SIMULATOR_STORAGE_KEY = "fintera_credit_request";

export const DRAFT_TTL_MINUTES = 10;
export const SIMULATOR_TTL_HOURS = 2;

interface UseFormPersistenceOptions {
  watch: UseFormWatch<CreditRequestFormData>;
  setValue: UseFormSetValue<CreditRequestFormData>;
  onRestore?: (source: "draft" | "simulator" | "reconciled") => void;
}

interface StoredFormData {
  data: Partial<CreditRequestFormData>;
  timestamp: number;
}

interface SimulatorFunnelData {
  data: {
    creditTypes?: string[];
    requestedAmount?: number;
    termMonths?: string | number;
    monthlyIncome?: number;
    residenceCity?: string;
    birthCountry?: string;
    residenceCountry?: string;
    simulatedBank?: string;
    simulatedRateEA?: string;
    simulatedMonthlyPayment?: number;
    existingObligations?: number;
    hasCoApplicant?: boolean;
    sourceDocument?: string;
    effectiveDate?: string;
  };
  timestamp: number;
  expiresAt: number;
}

function createRestorationStatus() {
  let restored = false;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => restored,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    markRestored: () => {
      if (restored) return;
      restored = true;
      listeners.forEach((listener) => listener());
    },
  };
}

/**
 * Hook de Persistencia y Reconciliación Determinística de Formularios Fintera
 * Fase 6.1 (Gate B)
 *
 * Reconcilia los datos provenientes del Simulador Multibanco Oficial (fintera_credit_request, TTL 2h)
 * con los borradores en progreso del formulario (fintera_credit_form_draft, TTL 10m).
 * Garantiza que datos manuales del usuario nunca sean sobreescritos y preserva la trazabilidad bancaria.
 */
export function useFormPersistence({
  watch,
  setValue,
  onRestore,
}: UseFormPersistenceOptions) {
  // Restoration is external form/storage synchronization. Expose its observable
  // snapshot rather than reading a mutable ref while rendering the consumer.
  const [restoration] = useState(createRestorationStatus);
  const hasStoredData = useSyncExternalStore(restoration.subscribe, restoration.getSnapshot, () => false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Validador de vigencia para el borrador del formulario
  const isDraftValid = useCallback((timestamp: number): boolean => {
    const now = Date.now();
    const elapsedMinutes = (now - timestamp) / (1000 * 60);
    return elapsedMinutes < DRAFT_TTL_MINUTES;
  }, []);

  // Validador de vigencia para el payload del simulador (TTL estricto de 2 horas)
  const isSimulatorValid = useCallback((payload: SimulatorFunnelData): boolean => {
    const now = Date.now();
    if (!payload.expiresAt || !payload.timestamp) return false;
    if (now > payload.expiresAt) return false;
    const elapsedHours = (now - payload.timestamp) / (1000 * 60 * 60);
    return elapsedHours < SIMULATOR_TTL_HOURS;
  }, []);

  // Guardar borrador en localStorage
  const saveFormData = useCallback((data: Partial<CreditRequestFormData>) => {
    try {
      const storageData: StoredFormData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(storageData));
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("[useFormPersistence] Error al guardar borrador:", error);
    }
  }, []);

  // Reconciliación determinística de ambas fuentes de datos
  const loadAndReconcileData = useCallback((): {
    data: Partial<CreditRequestFormData>;
    source: "draft" | "simulator" | "reconciled";
  } | null => {
    try {
      let simulatorData: Partial<CreditRequestFormData> | null = null;
      let draftData: Partial<CreditRequestFormData> | null = null;

      // 1. Intentar cargar datos del simulador
      const rawSimulator = localStorage.getItem(SIMULATOR_STORAGE_KEY);
      if (rawSimulator) {
        try {
          const parsedSimulator: SimulatorFunnelData = JSON.parse(rawSimulator);
          if (isSimulatorValid(parsedSimulator)) {
            const sim = parsedSimulator.data;
            simulatorData = {
              creditTypes: Array.isArray(sim.creditTypes) ? sim.creditTypes : [],
              requestedAmount: sim.requestedAmount ? Number(sim.requestedAmount) : undefined,
              termMonths: sim.termMonths ? Number(sim.termMonths) : undefined,
              monthlyIncome: sim.monthlyIncome ? Number(sim.monthlyIncome) : undefined,
              totalLiabilities: sim.existingObligations !== undefined ? Number(sim.existingObligations) : undefined,
              residenceCity: sim.residenceCity || "Bogotá",
              birthCountry: sim.birthCountry || "Colombia",
              residenceCountry: sim.residenceCountry || "Colombia",
            };
          } else {
            // Expirado: Limpiar para evitar payloads obsoletos
            localStorage.removeItem(SIMULATOR_STORAGE_KEY);
          }
        } catch (e) {
          console.error("[useFormPersistence] Error parseando datos de simulador:", e);
          localStorage.removeItem(SIMULATOR_STORAGE_KEY);
        }
      }

      // 2. Intentar cargar borrador manual previo
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        try {
          const parsedDraft: StoredFormData = JSON.parse(rawDraft);
          if (isDraftValid(parsedDraft.timestamp)) {
            draftData = parsedDraft.data;
          } else {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
          }
        } catch (e) {
          console.error("[useFormPersistence] Error parseando borrador de formulario:", e);
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }

      // 3. Estrategia de Combinación:
      // Si ambos existen: El borrador manual tiene precedencia campo a campo,
      // pero hereda del simulador los parámetros financieros que no hayan sido editados.
      if (simulatorData && draftData) {
        const merged: Partial<CreditRequestFormData> = {
          ...simulatorData,
          ...draftData,
          // Asegurar que si el usuario no tocó creditTypes, se mantengan los del simulador
          creditTypes:
            draftData.creditTypes && draftData.creditTypes.length > 0
              ? draftData.creditTypes
              : simulatorData.creditTypes || [],
        };
        return { data: merged, source: "reconciled" };
      }

      if (draftData) {
        return { data: draftData, source: "draft" };
      }

      if (simulatorData) {
        return { data: simulatorData, source: "simulator" };
      }

      return null;
    } catch (error) {
      console.error("[useFormPersistence] Error general de reconciliación:", error);
      return null;
    }
  }, [isDraftValid, isSimulatorValid]);

  // Limpiar todas las fuentes de almacenamiento tras envío exitoso
  const clearFormData = useCallback(() => {
    // A successful submission must not be followed by a queued draft write.
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
      localStorage.removeItem(SIMULATOR_STORAGE_KEY);
    } catch (error) {
      console.error("[useFormPersistence] Error al limpiar almacenamiento:", error);
    }
  }, []);

  // Tiempo restante antes de expiración
  const getTimeRemaining = useCallback((): number | null => {
    try {
      // Si existe borrador de formulario
      const timestampStr = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const elapsedMinutes = (Date.now() - timestamp) / (1000 * 60);
        const remainingMinutes = DRAFT_TTL_MINUTES - elapsedMinutes;
        return remainingMinutes > 0 ? Math.ceil(remainingMinutes) : 0;
      }

      // Si solo existe simulación
      const rawSim = localStorage.getItem(SIMULATOR_STORAGE_KEY);
      if (rawSim) {
        const sim: SimulatorFunnelData = JSON.parse(rawSim);
        const remainingMs = sim.expiresAt - Date.now();
        return remainingMs > 0 ? Math.ceil(remainingMs / (1000 * 60)) : 0;
      }

      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Restaurar y poblar formulario al montar
  useEffect(() => {
    if (restoration.getSnapshot()) return;

    const result = loadAndReconcileData();
    if (result && Object.keys(result.data).length > 0) {
      Object.entries(result.data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as keyof CreditRequestFormData, value as any, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });

      restoration.markRestored();
      onRestore?.(result.source);
    }
  }, [loadAndReconcileData, setValue, onRestore, restoration]);

  // Auto-guardado de modificaciones con debounce de 500ms
  useEffect(() => {
    const subscription = watch((value) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveFormData(value as Partial<CreditRequestFormData>);
      }, 500);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [watch, saveFormData]);

  return {
    clearFormData,
    hasStoredData,
    getTimeRemaining,
  };
}
