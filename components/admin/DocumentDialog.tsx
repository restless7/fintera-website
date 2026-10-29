"use client";

import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

/** Existing document forms share focus, Escape, scroll locking and return behavior. */
export function DocumentDialog({ title, onClose, busy = false, wide = false, children }: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const returnTarget = useRef<HTMLElement | null>(typeof document === "undefined" ? null : document.activeElement as HTMLElement);
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Dialog.Content aria-describedby={undefined}
          onCloseAutoFocus={(event) => { event.preventDefault(); returnTarget.current?.focus(); }}
          onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
          onPointerDownOutside={(event) => { if (busy) event.preventDefault(); }}
          className={`admin-dialog dark space-y-4 [&_:focus-visible]:outline [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-emerald-300 [&_:focus-visible]:outline-offset-4 [&_button]:min-h-[40px] fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh_-_2rem)] w-[calc(100vw_-_2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl sm:p-6 ${wide ? "max-w-2xl" : "max-w-lg"}`}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
