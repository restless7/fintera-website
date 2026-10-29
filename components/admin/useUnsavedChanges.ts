"use client";
import { useEffect } from "react";

/** Protect existing in-progress forms during browser and in-app navigation. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const beforeNavigation = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || event.defaultPrevented) return;
      const target = new URL(link.href, window.location.href);
      if (target.pathname === location.pathname && target.search === location.search) return;
      if (!window.confirm("Hay cambios sin guardar. ¿Desea salir de esta vista?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeNavigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", beforeNavigation, true); };
  }, [dirty]);
}
