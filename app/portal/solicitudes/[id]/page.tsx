"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  Clock,
  ArrowLeft,
  Send,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Home,
  RefreshCw,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface BankTimelineItem {
  id: string;
  stageTitle: string;
  explanation: string;
  actionRequired: string | null;
  publishedAt: string;
}

interface BankCaseDetail {
  id: string;
  bankId: string;
  productType: string;
  currentStageTitle: string;
  currentStageDescription: string;
  badgeVariant: string;
  bankFilingNumber: string | null;
  filingDate: string | null;
  approvedAmount: number | null;
  approvedRateEA: number | null;
  approvedTermMonths: number | null;
  timeline: BankTimelineItem[];
}

interface ApplicationDetail {
  id: string;
  fileNumber: string;
  productCategory: string;
  requestedAmount: number;
  termMonths: number;
  createdAt: string;
  status: string;
  customerVisibleNotes: string | null;
  assignedAdvisor: {
    name: string;
    email: string;
    phone: string;
  } | null;
  applicants: Array<{
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    occupation: string;
  }>;
  bankApplications: BankCaseDetail[];
}

interface MessageItem {
  id: string;
  applicationId: string;
  senderType: "CUSTOMER" | "ADVISOR";
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

async function readApplicationDetail(applicationId: string, signal?: AbortSignal): Promise<ApplicationDetail> {
  const response = await fetch(`/api/portal/applications/${applicationId}`, { signal });
  if (!response.ok) throw new Error(response.status === 403 ? "Acceso no autorizado a este expediente." : "Error cargando solicitud.");
  return response.json();
}

async function readApplicationMessages(applicationId: string, signal?: AbortSignal): Promise<MessageItem[]> {
  const response = await fetch(`/api/portal/applications/${applicationId}/messages`, { signal });
  if (!response.ok) return [];
  const json = await response.json();
  return json.messages || [];
}

export default function CustomerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = resolvedParams.id;

  const [detail, setDetail] = useState<{ applicationId: string; app: ApplicationDetail | null; error: string | null } | null>(null);
  const loading = detail?.applicationId !== applicationId;
  const app = detail?.applicationId === applicationId ? detail.app : null;
  const error = detail?.applicationId === applicationId ? detail.error : null;

  // Responses and editable text are tied to the requested case, never a stale route.
  const [messageResult, setMessageResult] = useState<{ applicationId: string; messages: MessageItem[] } | null>(null);
  const messages = messageResult?.applicationId === applicationId ? messageResult.messages : [];
  const [messageDraft, setMessageDraft] = useState({ applicationId, content: "" });
  const newMessage = messageDraft.applicationId === applicationId ? messageDraft.content : "";
  const setNewMessage = (content: string) => setMessageDraft({ applicationId, content });
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const result = await readApplicationMessages(applicationId);
      setMessageResult({ applicationId, messages: result });
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    }
  }, [applicationId]);

  useEffect(() => {
    const controller = new AbortController();
    readApplicationDetail(applicationId, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setDetail({ applicationId, app: result, error: null }); })
      .catch((err: Error) => { if (!controller.signal.aborted) setDetail({ applicationId, app: null, error: err.message }); });
    readApplicationMessages(applicationId, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setMessageResult({ applicationId, messages: result }); })
      .catch((err: Error) => { if (!controller.signal.aborted) console.error("Error cargando mensajes:", err); });
    return () => controller.abort();
  }, [applicationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const res = await fetch(`/api/portal/applications/${applicationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) {
        throw new Error("No fue posible enviar el mensaje.");
      }

      setMessageDraft((current) => current.applicationId === applicationId ? { applicationId, content: "" } : current);
      await fetchMessages();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-slate-600 font-medium text-sm">Consultando expediente seguro...</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Acceso No Disponible</h2>
        <p className="text-sm text-slate-600">{error || "No se encontró la solicitud solicitada."}</p>
        <Link href="/portal">
          <Button variant="outline">Volver al Resumen</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Barra de Retorno y Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/portal">
            <Button variant="outline" size="sm" className="gap-1.5 text-slate-600">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </Button>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{app.fileNumber}</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                {app.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Radicado el {new Date(app.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <Link href={`/portal/documentos?applicationId=${app.id}`}>
          <Button className="bg-[#0F172A] hover:bg-slate-800 text-white gap-2 font-medium">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Gestionar Documentos del Caso</span>
          </Button>
        </Link>
      </div>

      {/* Grid de 2 Columnas: Detalle de Bancos y Línea de Tiempo + Canal de Mensajería */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda (2 spans): Trámites Bancarios y Línea de Tiempo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Seguimiento de Trámites Bancarios</span>
            </h2>

            {app.bankApplications.map((bankApp) => (
              <Card key={bankApp.id} className="border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 uppercase">
                        {bankApp.bankId.replace(/-/g, " ")}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Línea: {bankApp.productType} {bankApp.bankFilingNumber ? `· Radicado: ${bankApp.bankFilingNumber}` : ""}
                      </CardDescription>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      {bankApp.currentStageTitle}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold text-emerald-950 mb-0.5">Estado Oficial Publicado:</p>
                    <p>{bankApp.currentStageDescription}</p>
                  </div>

                  {/* Si el banco ya aprobó cupo */}
                  {bankApp.approvedAmount && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-slate-500 block">Monto Aprobado</span>
                        <strong className="text-slate-900 text-sm">${bankApp.approvedAmount.toLocaleString("es-CO")}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tasa Efectiva</span>
                        <strong className="text-slate-900 text-sm">{bankApp.approvedRateEA}% E.A.</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Plazo Otorgado</span>
                        <strong className="text-slate-900 text-sm">{bankApp.approvedTermMonths} Meses</strong>
                      </div>
                    </div>
                  )}

                  {/* Cronología de Hitos Publicados (Timeline) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Historial de Hitos Publicados</span>
                    </h4>

                    {bankApp.timeline.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No hay hitos previos publicados para esta entidad.</p>
                    ) : (
                      <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                        {bankApp.timeline.map((item) => (
                          <li key={item.id} className="ml-4">
                            <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1.5 -left-1.5 border border-white" />
                            <time className="text-[11px] font-medium text-slate-400 block mb-0.5">
                              {new Date(item.publishedAt).toLocaleDateString("es-CO", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                            <p className="text-xs font-bold text-slate-800">{item.stageTitle}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{item.explanation}</p>
                            {item.actionRequired && (
                              <p className="text-xs text-amber-700 font-medium mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                                Acción: {item.actionRequired}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Columna Derecha (1 span): Canal de Mensajería Cliente-Asesor */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="bg-[#0F172A] text-white p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <CardTitle className="text-sm font-bold">Canal con tu Asesor</CardTitle>
                  <CardDescription className="text-slate-300 text-xs">
                    {app.assignedAdvisor ? app.assignedAdvisor.name : "Asesor Comercial Fintera"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Lista de Mensajes con Scroll */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                  <p className="font-semibold text-slate-600">Sin mensajes todavía</p>
                  <p className="mt-1">Escríbele a tu asesor si tienes inquietudes sobre este expediente.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderType === "CUSTOMER";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                        <span className="font-medium text-slate-600">{m.senderName}</span>
                        <span>·</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input de Envío */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <Input
                type="text"
                placeholder="Escribe tu mensaje al asesor..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="h-10 text-xs"
              />
              <Button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 px-3 h-10"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
