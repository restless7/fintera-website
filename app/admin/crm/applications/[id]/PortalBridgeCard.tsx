"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CANONICAL_PUBLIC_STAGE_MAP } from "@/lib/portal/bank-stage-mapping";

interface BankAppSummary {
  id: string;
  bankId: string;
  productType: string;
  stage: string;
}

interface ChatMessage {
  id: string;
  applicationId: string;
  senderType: "CUSTOMER" | "ADVISOR";
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface OutboxNotificationItem {
  id: string;
  eventType: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
  errorMessage: string | null;
}

interface BridgeState {
  fileNumber: string;
  clientPhone: string;
  clientEmail: string;
  portalMagicUrl: string;
  documentsMagicUrl: string;
  bankApplications: BankAppSummary[];
  messages: ChatMessage[];
  outboxNotifications: OutboxNotificationItem[];
}

export default function PortalBridgeCard({ applicationId }: { applicationId: string }) {
  const [bridge, setBridge] = useState<BridgeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Publicación de Hitos al Portal
  const [selectedBankAppId, setSelectedBankAppId] = useState("");
  const [selectedStage, setSelectedStage] = useState("STAGE_02_INTERNAL_QA");
  const [actionNote, setActionNote] = useState("");
  const [publishingEvent, setPublishingEvent] = useState(false);
  const [sendingResendLink, setSendingResendLink] = useState(false);

  const fetchBridge = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/portal-bridge`);
      if (!res.ok) return;
      const json = (await res.json()) as BridgeState;
      setBridge(json);
      if (json.bankApplications?.length > 0) {
        setSelectedBankAppId((prev) => prev || json.bankApplications[0].id);
        setSelectedStage((prev) => prev || json.bankApplications[0].stage);
      }
    } catch (err) {
      console.error("Error cargando PortalBridgeCard:", err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/crm/applications/${applicationId}/portal-bridge`)
      .then((res) => (res.ok ? (res.json() as Promise<BridgeState>) : null))
      .then((json) => {
        if (!active || !json) return;
        setBridge(json);
        if (json.bankApplications?.length > 0) {
          setSelectedBankAppId((prev) => prev || json.bankApplications[0].id);
          setSelectedStage((prev) => prev || json.bankApplications[0].stage);
        }
      })
      .catch((err) => {
        console.error("Error cargando PortalBridgeCard:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applicationId]);

  const handleCopy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel(null), 2500);
    } catch {
      setStatusFeedback("No se pudo copiar al portapapeles.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sendingMsg) return;
    try {
      setSendingMsg(true);
      setStatusFeedback(null);
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/portal-bridge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_ADVISOR_MESSAGE",
          content: replyText.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Fallo al enviar mensaje al cliente");
      }
      setReplyText("");
      setStatusFeedback("Mensaje enviado al Portal del Cliente y notificado vía Resend.");
      await fetchBridge();
    } catch (err: unknown) {
      setStatusFeedback(err instanceof Error ? err.message : "Error enviando mensaje");
    } finally {
      setSendingMsg(false);
    }
  };

  const handlePublishMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankAppId || !selectedStage || publishingEvent) return;
    try {
      setPublishingEvent(true);
      setStatusFeedback(null);
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/portal-bridge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUBLISH_BANK_MILESTONE",
          bankApplicationId: selectedBankAppId,
          stage: selectedStage,
          actionNote: actionNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Fallo al publicar hito en el portal");
      }
      setActionNote("");
      setStatusFeedback("Hito oficial publicado en la línea de tiempo del cliente y notificado por correo.");
      await fetchBridge();
    } catch (err: unknown) {
      setStatusFeedback(err instanceof Error ? err.message : "Error publicando hito");
    } finally {
      setPublishingEvent(false);
    }
  };

  const handleResendWelcomeEmail = async () => {
    if (sendingResendLink) return;
    try {
      setSendingResendLink(true);
      setStatusFeedback(null);
      const res = await fetch(`/api/admin/crm/applications/${applicationId}/portal-bridge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESEND_WELCOME_LINK" }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error despachando correo Resend");
      }
      const msg = json.dispatch?.dispatched
        ? "Correo con Magic Link enviado exitosamente vía Resend."
        : "Notificación encolada en Outbox (pendiente activar RESEND_API_KEY en producción).";
      setStatusFeedback(msg);
      await fetchBridge();
    } catch (err: unknown) {
      setStatusFeedback(err instanceof Error ? err.message : "Error despachando correo");
    } finally {
      setSendingResendLink(false);
    }
  };

  if (loading && !bridge) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 text-xs text-slate-400">
        Sincronizando consola del Portal del Cliente y motor Resend...
      </div>
    );
  }

  if (!bridge) return null;

  const cleanPhone = (bridge.clientPhone || "").replace(/\D/g, "");
  const whatsappPhone = cleanPhone.startsWith("57") ? cleanPhone : `57${cleanPhone}`;
  const whatsappShareUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Hola, te escribimos de FINTERA. Tu expediente ${bridge.fileNumber} está activo. Ingresa aquí para ver tu estado en tiempo real y subir tus documentos a la bóveda cifrada: ${bridge.documentsMagicUrl}`
  )}`;

  const stageEntries = Object.entries(CANONICAL_PUBLIC_STAGE_MAP);

  return (
    <div className="admin-card p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white">
            Consola Portal Cliente &amp; Notificaciones Resend
          </h2>
          <p className="text-xs text-slate-400">
            Enlace mágico HMAC-SHA256, publicación de hitos en 1 clic y chat en vivo con el titular.
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
          Canal 256-bit Activo
        </span>
      </div>

      {statusFeedback && (
        <div
          role="status"
          className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium"
        >
          {statusFeedback}
        </div>
      )}

      {/* 1. Enlaces Mágicos y Envío por WhatsApp / Resend */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
        <div className="text-xs font-bold text-slate-200">
          Acceso Directo del Cliente (Magic Tracking Link)
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCopy(bridge.documentsMagicUrl, "docs")}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition keep-white-text"
          >
            {copiedLabel === "docs" ? "✓ Link Bóveda Copiado" : "Copiar Link Bóveda Documental"}
          </button>
          <button
            type="button"
            onClick={() => handleCopy(bridge.portalMagicUrl, "portal")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            {copiedLabel === "portal" ? "✓ Link Portal Copiado" : "Copiar Link Seguimiento"}
          </button>
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition keep-white-text"
          >
            Enviar por WhatsApp
          </a>
          <button
            type="button"
            disabled={sendingResendLink}
            onClick={handleResendWelcomeEmail}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50 keep-white-text"
          >
            {sendingResendLink ? "Enviando..." : "Enviar Magic Link por Correo (Resend)"}
          </button>
        </div>
      </div>

      {/* 2. Publicar Hito Oficial a la Línea de Tiempo del Cliente */}
      {bridge.bankApplications.length > 0 && (
        <form
          onSubmit={handlePublishMilestone}
          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
        >
          <div className="text-xs font-bold text-slate-200">
            Publicar Hito Oficial en Portal del Cliente + Notificación Resend
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor={`bridge-bank-${applicationId}`}
                className="block text-[11px] text-slate-400 mb-1"
              >
                Entidad Bancaria
              </label>
              <select
                id={`bridge-bank-${applicationId}`}
                value={selectedBankAppId}
                onChange={(e) => setSelectedBankAppId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
              >
                {bridge.bankApplications.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankId.toUpperCase()} — {b.productType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor={`bridge-stage-${applicationId}`}
                className="block text-[11px] text-slate-400 mb-1"
              >
                Hito Público a Notificar
              </label>
              <select
                id={`bridge-stage-${applicationId}`}
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
              >
                {stageEntries.map(([stageKey, info]) => (
                  <option key={stageKey} value={stageKey}>
                    {info.publicTitle} (Hito {info.milestoneIndex || "-"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor={`bridge-note-${applicationId}`}
              className="block text-[11px] text-slate-400 mb-1"
            >
              Nota o Acción Requerida Visible al Cliente (Opcional)
            </label>
            <input
              id={`bridge-note-${applicationId}`}
              type="text"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="Ej. Pendiente confirmar disponibilidad para visita del perito avaluador..."
              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={publishingEvent}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition disabled:opacity-50 keep-white-text"
            >
              {publishingEvent ? "Publicando..." : "Publicar Hito y Notificar por Resend"}
            </button>
          </div>
        </form>
      )}

      {/* 3. Canal Bidireccional de Mensajes Cliente ↔ Asesor */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            Mensajes con el Cliente ({bridge.messages.length})
          </span>
          <span className="text-[10px] text-slate-400">Sincronizado con /portal/solicitudes</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {bridge.messages.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No hay mensajes en el canal con el cliente todavía.
            </p>
          ) : (
            bridge.messages.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-lg text-xs ${
                  m.senderType === "ADVISOR"
                    ? "bg-sky-500/15 border border-sky-500/30 text-slate-100 ml-4"
                    : "bg-slate-900 border border-slate-800 text-slate-200 mr-4"
                }`}
              >
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="font-bold text-slate-300">{m.senderName}</span>
                  <span>{new Date(m.createdAt).toLocaleString("es-CO")}</span>
                </div>
                <p>{m.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
          <label htmlFor={`advisor-reply-${applicationId}`} className="sr-only">
            Escribir mensaje al cliente
          </label>
          <input
            id={`advisor-reply-${applicationId}`}
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribir mensaje oficial al cliente..."
            className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white"
          />
          <button
            type="submit"
            disabled={sendingMsg || !replyText.trim()}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold disabled:opacity-50 keep-white-text"
          >
            {sendingMsg ? "..." : "Enviar"}
          </button>
        </form>
      </div>

      {/* 4. Trazabilidad de Correos Transaccionales Resend (Outbox) */}
      {bridge.outboxNotifications.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300">
            Historial de Notificaciones por Correo (Resend Outbox)
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {bridge.outboxNotifications.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-[11px] bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800"
              >
                <span className="font-mono text-slate-300 truncate max-w-[200px]">
                  {item.eventType.replace("RESEND_", "")}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === "PUBLISHED"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : item.status === "PENDING"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {item.status === "PUBLISHED"
                    ? "ENVIADO RESEND"
                    : item.status === "PENDING"
                    ? "ENCOLADO OUTBOX"
                    : "ERROR"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
