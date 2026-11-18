"use client";

import { useRef, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function PortalDialog({ title, description, busy, onClose, children, returnFocusId }: { returnFocusId?: string; title: string; description: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const returnTarget = useRef<HTMLElement | null>(typeof document === "undefined" ? null : document.activeElement as HTMLElement);
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="portal-dialog-overlay" />
    <Dialog.Content className="portal-dialog" onCloseAutoFocus={event => { event.preventDefault(); const semanticTarget = returnFocusId ? document.getElementById(returnFocusId) : null; const original = returnTarget.current; const target = semanticTarget || (original?.isConnected && original !== document.body ? original : null) || document.getElementById("portal-main"); target?.focus(); }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}>
      <div className="portal-dialog-header"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><button type="button" aria-label="Cerrar" disabled={busy} className="portal-dialog-close" onClick={onClose}><X size={20} aria-hidden="true" /></button></div>{children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
