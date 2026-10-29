"use client";
import { createContext, useCallback, useContext, useState, useMemo, useSyncExternalStore, type Dispatch, type ReactNode, type SetStateAction } from "react";

type DraftStore = { values: Map<string, unknown>; listeners: Map<string, Set<() => void>> };
const createStore = (): DraftStore => ({ values: new Map(), listeners: new Map() });
const DraftContext = createContext<DraftStore | null>(null);

/** Memory belongs to one mounted authenticated workspace, never browser storage. */
export function AdminDraftProvider({ children }: { children: ReactNode }) {
  const [drafts] = useState(createStore);
  return <DraftContext.Provider value={drafts}>{children}</DraftContext.Provider>;
}

export function useAdminDraft<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const shared = useContext(DraftContext);
  const [own] = useState(createStore);
  const store = shared || own;
  const fallback = useMemo<T>(() => typeof initial === "function" ? (initial as () => T)() : initial, [initial]);
  const getSnapshot = useCallback(() => store.values.has(key) ? store.values.get(key) as T : fallback, [store, key, fallback]);
  const subscribe = useCallback((listener: () => void) => {
    const listeners = store.listeners.get(key) || new Set<() => void>();
    listeners.add(listener);
    store.listeners.set(key, listeners);
    return () => { listeners.delete(listener); if (!listeners.size) store.listeners.delete(key); };
  }, [store, key]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);
  const update = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const previous = store.values.has(key) ? store.values.get(key) as T : fallback;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
    store.values.set(key, resolved);
    store.listeners.get(key)?.forEach(listener => listener());
  }, [store, key, fallback]);
  return [value, update];
}
