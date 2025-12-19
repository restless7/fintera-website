import { useEffect, useCallback, useRef } from "react";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { CreditRequestFormData } from "@/app/lib/validation/creditRequestSchema";

const STORAGE_KEY = "fintera_credit_form_draft";
const STORAGE_TIMESTAMP_KEY = "fintera_credit_form_timestamp";
const TTL_MINUTES = 10;

interface UseFormPersistenceOptions {
  watch: UseFormWatch<CreditRequestFormData>;
  setValue: UseFormSetValue<CreditRequestFormData>;
  onRestore?: () => void;
}

interface StoredFormData {
  data: Partial<CreditRequestFormData>;
  timestamp: number;
}

export function useFormPersistence({
  watch,
  setValue,
  onRestore,
}: UseFormPersistenceOptions) {
  const hasRestoredRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Check if stored data is still valid (within TTL)
  const isDataValid = useCallback((timestamp: number): boolean => {
    const now = Date.now();
    const elapsedMinutes = (now - timestamp) / (1000 * 60);
    return elapsedMinutes < TTL_MINUTES;
  }, []);

  // Save form data to localStorage
  const saveFormData = useCallback((data: Partial<CreditRequestFormData>) => {
    try {
      const storageData: StoredFormData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, []);

  // Load form data from localStorage
  const loadFormData = useCallback((): Partial<CreditRequestFormData> | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const { data, timestamp }: StoredFormData = JSON.parse(stored);

      if (!isDataValid(timestamp)) {
        // Data expired, clear it
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error loading form data:", error);
      return null;
    }
  }, [isDataValid]);

  // Clear stored form data
  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    } catch (error) {
      console.error("Error clearing form data:", error);
    }
  }, []);

  // Get time remaining before expiration
  const getTimeRemaining = useCallback((): number | null => {
    try {
      const timestampStr = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (!timestampStr) return null;

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const elapsedMinutes = (now - timestamp) / (1000 * 60);
      const remainingMinutes = TTL_MINUTES - elapsedMinutes;

      return remainingMinutes > 0 ? Math.ceil(remainingMinutes) : 0;
    } catch (error) {
      return null;
    }
  }, []);

  // Restore form data on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const savedData = loadFormData();
    if (savedData && Object.keys(savedData).length > 0) {
      // Restore each field
      Object.entries(savedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as keyof CreditRequestFormData, value as any, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });

      hasRestoredRef.current = true;
      onRestore?.();
    }
  }, [loadFormData, setValue, onRestore]);

  // Auto-save on form changes with debounce
  useEffect(() => {
    const subscription = watch((value) => {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save (500ms after last change)
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
    hasStoredData: hasRestoredRef.current,
    getTimeRemaining,
  };
}
