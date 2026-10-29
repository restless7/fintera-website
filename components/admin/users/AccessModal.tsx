"use client";

import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function AccessModal({ title, description, busy, onClose, children, wide = false }: {
  title: string; description: string; busy: boolean; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  const returnTarget = useRef<HTMLElement | null>(typeof document === "undefined" ? null : document.activeElement as HTMLElement);
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/85" />
      <Dialog.Content
        className={"admin-dialog dark fixed left-1/2 top-1/2 z-[90] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl sm:p-6 [&_:focus-visible]:outline [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-emerald-300 " + (wide ? "max-w-3xl" : "max-w-xl")}
        onCloseAutoFocus={event => { event.preventDefault(); returnTarget.current?.focus(); }}
        onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}
        onPointerDownOutside={event => { if (busy) event.preventDefault(); }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><Dialog.Title className="text-xl font-semibold text-white">{title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-relaxed text-slate-300">{description}</Dialog.Description></div>
          <button type="button" onClick={onClose} disabled={busy} className="admin-icon-button shrink-0 disabled:opacity-40" aria-label="Cerrar"><X size={18} /></button>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
