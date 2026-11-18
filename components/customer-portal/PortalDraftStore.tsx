"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type Dispatch, type ReactNode, type SetStateAction } from "react";

function createDraftStore(scopeKey: string) {
  const values = new Map<string, unknown>();
  const listeners = new Set<() => void>();
  return {
    scopeKey,
    get<T>(key: string, initial: T | (() => T)): T {
      if (!values.has(key)) values.set(key, typeof initial === "function" ? (initial as () => T)() : initial);
      return values.get(key) as T;
    },
    set<T>(key: string, initial: T | (() => T), action: SetStateAction<T>) {
      const current = this.get(key, initial);
      const next = typeof action === "function" ? (action as (value: T) => T)(current) : action;
      if (Object.is(current, next)) return;
      values.set(key, next);
      listeners.forEach(listener => listener());
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
const DraftContext = createContext<ReturnType<typeof createDraftStore> | null>(null);

/** Memory belongs to one authenticated customer context, never browser storage. */
export function PortalDraftProvider({ scopeKey, children }: { scopeKey: string; children: ReactNode }) {
  const store = useMemo(() => createDraftStore(scopeKey), [scopeKey]);
  return <DraftContext.Provider key={scopeKey} value={store}>{children}</DraftContext.Provider>;
}

export function usePortalDraft<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const store = useContext(DraftContext);
  if (!store) throw new Error("PortalDraftProvider is required for customer drafts.");
  const snapshot = useCallback(() => store.get<T>(key, initial), [store, key, initial]);
  const value = useSyncExternalStore(store.subscribe, snapshot, snapshot);
  const setValue = useCallback<Dispatch<SetStateAction<T>>>(action => store.set<T>(key, initial, action), [store, key, initial]);
  return [value, setValue];
}

export function usePortalUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
}
