/**
 * FINTERA ENTERPRISE CRM — ETAPA 6 (MÓDULO 3): MOTOR DE NOTIFICACIONES TRANSACCIONALES CON RESEND
 * Despacha correos institucionales de alta entregabilidad vía Resend REST API (https://api.resend.com/emails)
 * e integra trazabilidad en domain_outbox_events.
 *
 * Si RESEND_API_KEY aún no está configurada en el entorno, encola el sobre completo en
 * domain_outbox_events con estado PENDING (AWAITING_RESEND_API_KEY) sin interrumpir la transacción.
 */

import prisma from "@/lib/prisma";
import { signMagicTrackingToken } from "@/lib/auth/magic-tracking-token";

export interface ResendEmailDispatchResult {
  dispatched: boolean;
  queuedInOutbox: boolean;
  provider: "resend";
  resendId?: string;
  outboxEventId?: string;
  reason?: string;
}

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.finterasoluciones.co"
  ).replace(/\/+$/, "");
}

function buildInstitutionalEmailHtml(params: {
  eyebrow: string;
  title: string;
  greeting: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  fileNumber: string;
}): string {
  const {
    eyebrow,
    title,
    greeting,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    secondaryCtaLabel,
    secondaryCtaUrl,
    fileNumber,
  } = params;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 10px 25px rgba(15,23,42,0.06);">
          <!-- Header Institucional -->
          <tr>
            <td style="background-color:#0B1F3A;padding:28px 32px;color:#FFFFFF;">
              <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#10B981;margin-bottom:6px;">
                ${eyebrow}
              </div>
              <div style="font-size:22px;font-weight:800;letter-spacing:-0.3px;color:#FFFFFF;">
                FINTERA <span style="font-weight:400;font-size:14px;color:#94A3B8;">| Banca de Inversión &amp; Originación</span>
              </div>
              <div style="margin-top:10px;display:inline-block;padding:4px 10px;border-radius:6px;background-color:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);color:#34D399;font-family:monospace;font-size:12px;font-weight:700;">
                Radicado Oficial: ${fileNumber}
              </div>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 14px 0;font-size:20px;font-weight:700;color:#0F172A;">
                ${title}
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#334155;font-weight:600;">
                ${greeting}
              </p>
              <div style="font-size:14px;line-height:1.65;color:#475569;margin-bottom:24px;">
                ${bodyHtml}
              </div>

              <!-- CTA Primario -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:#059669;">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">
                      ${ctaLabel} &rarr;
                    </a>
                  </td>
                  ${
                    secondaryCtaLabel && secondaryCtaUrl
                      ? `<td style="width:12px;"></td>
                  <td align="center" style="border-radius:10px;background-color:#0F172A;">
                    <a href="${secondaryCtaUrl}" target="_blank" style="display:inline-block;padding:14px 20px;font-size:13px;font-weight:600;color:#F8FAFC;text-decoration:none;border-radius:10px;">
                      ${secondaryCtaLabel}
                    </a>
                  </td>`
                      : ""
                  }
                </tr>
              </table>

              <div style="margin-top:24px;padding:14px 16px;background-color:#F8FAFC;border-radius:10px;border:1px solid #E2E8F0;font-size:12px;color:#64748B;line-height:1.5;">
                🔒 <strong>Seguridad Documental Cifrada (Ley 1581 Habeas Data):</strong> Su enlace personal incluye un token criptográfico firmado con HMAC-SHA256 para acceder directamente a su expediente y Bóveda Documental sin exponer su información.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0F172A;padding:20px 32px;color:#94A3B8;font-size:11px;line-height:1.5;">
              <div>© ${new Date().getFullYear()} FINTERA Soluciones Financieras S.A.S. · Colombia</div>
              <div style="margin-top:4px;">Línea de Atención Directa WhatsApp: +57 324 444 4430 · www.finterasoluciones.co</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export class ResendNotificationService {
  /**
   * Despacha un correo mediante Resend API y registra el resultado en domain_outbox_events
   */
  public static async dispatchEmail(params: {
    to: string;
    subject: string;
    html: string;
    eventType: string;
    aggregateId: string;
    metadata?: Record<string, unknown>;
  }): Promise<ResendEmailDispatchResult> {
    const apiKey = (process.env.RESEND_API_KEY || "").trim();
    const fromEmail =
      (process.env.RESEND_FROM_EMAIL || "").trim() ||
      "FINTERA Soluciones Financieras <notificaciones@finterasoluciones.co>";

    // Si aún no se ha configurado RESEND_API_KEY en el entorno, encolar limpiamente en el Outbox
    if (!apiKey) {
      try {
        const outbox = await prisma.domainOutboxEvent.create({
          data: {
            aggregateType: "ResendEmailNotification",
            aggregateId: params.aggregateId,
            eventType: params.eventType,
            status: "PENDING",
            payload: {
              provider: "resend",
              statusReason: "AWAITING_RESEND_API_KEY",
              to: params.to,
              from: fromEmail,
              subject: params.subject,
              html: params.html,
              metadata: params.metadata || {},
              queuedAt: new Date().toISOString(),
            } as any,
          },
        });

        return {
          dispatched: false,
          queuedInOutbox: true,
          provider: "resend",
          outboxEventId: outbox.id,
          reason: "RESEND_API_KEY pendiente de configurar; notificación encolada en domain_outbox_events.",
        };
      } catch (err: any) {
        console.warn("[ResendNotificationService] No se pudo registrar en outbox local:", err.message);
        return {
          dispatched: false,
          queuedInOutbox: false,
          provider: "resend",
          reason: "RESEND_API_KEY pendiente de configurar.",
        };
      }
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };

      if (!res.ok) {
        const outboxErr = await prisma.domainOutboxEvent.create({
          data: {
            aggregateType: "ResendEmailNotification",
            aggregateId: params.aggregateId,
            eventType: params.eventType,
            status: "FAILED",
            published: false,
            errorMessage: `Resend HTTP ${res.status}: ${data.message || res.statusText}`,
            payload: {
              provider: "resend",
              to: params.to,
              subject: params.subject,
              metadata: params.metadata || {},
            } as any,
          },
        });

        return {
          dispatched: false,
          queuedInOutbox: true,
          provider: "resend",
          outboxEventId: outboxErr.id,
          reason: `Resend API HTTP ${res.status}: ${data.message || res.statusText}`,
        };
      }

      const outboxOk = await prisma.domainOutboxEvent.create({
        data: {
          aggregateType: "ResendEmailNotification",
          aggregateId: params.aggregateId,
          eventType: params.eventType,
          status: "PUBLISHED",
          published: true,
          processedAt: new Date(),
          payload: {
            provider: "resend",
            resendId: data.id,
            to: params.to,
            subject: params.subject,
            metadata: params.metadata || {},
          } as any,
        },
      });

      return {
        dispatched: true,
        queuedInOutbox: true,
        provider: "resend",
        resendId: data.id,
        outboxEventId: outboxOk.id,
      };
    } catch (err: any) {
      console.error("[ResendNotificationService] Error despachando email:", err);
      return {
        dispatched: false,
        queuedInOutbox: false,
        provider: "resend",
        reason: err.message,
      };
    }
  }

  /**
   * 1. Notificación de Bienvenida y Magic Link al Radicar Solicitud
   */
  public static async sendApplicationWelcomeNotification(params: {
    applicationId: string;
    clientId: string;
    fileNumber: string;
    clientName: string;
    clientEmail: string;
    requestedAmount: number;
    productCategory: string;
  }): Promise<ResendEmailDispatchResult> {
    const baseUrl = getAppBaseUrl();
    const token = signMagicTrackingToken({
      applicationId: params.applicationId,
      clientId: params.clientId,
      fileNumber: params.fileNumber,
    });

    const portalUrl = `${baseUrl}/portal?trackToken=${encodeURIComponent(token)}`;
    const docsUrl = `${baseUrl}/portal/documentos?trackToken=${encodeURIComponent(token)}&applicationId=${encodeURIComponent(params.applicationId)}`;

    const html = buildInstitutionalEmailHtml({
      eyebrow: "Confirmación de Radicación Digital",
      title: `Tu expediente ${params.fileNumber} ha sido activado`,
      greeting: `Hola ${params.clientName},`,
      bodyHtml: `
        <p>Hemos recibido tu solicitud de financiación para la línea <strong>${params.productCategory.replace(/_/g, " ")}</strong> por un monto de <strong>$${params.requestedAmount.toLocaleString("es-CO")} COP</strong>.</p>
        <p>Tu Bóveda Documental en Supabase ya está habilitada para que puedas cargar los soportes de tu solicitud y seguir en tiempo real los 6 hitos de aprobación bancaria.</p>
      `,
      ctaLabel: "Cargar Soportes en Bóveda Documental",
      ctaUrl: docsUrl,
      secondaryCtaLabel: "Ver Estado en Tiempo Real",
      secondaryCtaUrl: portalUrl,
      fileNumber: params.fileNumber,
    });

    return this.dispatchEmail({
      to: params.clientEmail,
      subject: `[FINTERA ${params.fileNumber}] Expediente Activo y Acceso a Bóveda Documental`,
      html,
      eventType: "RESEND_WELCOME_MAGIC_LINK",
      aggregateId: params.applicationId,
      metadata: {
        fileNumber: params.fileNumber,
        clientId: params.clientId,
      },
    });
  }

  /**
   * 2. Notificación de Dictamen Documental (Subsanación Requerida o Aprobación)
   */
  public static async sendDocumentReviewNotification(params: {
    applicationId: string;
    requirementTitle: string;
    bankId: string;
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string | null;
    customerVisibleNotes?: string | null;
  }): Promise<ResendEmailDispatchResult | null> {
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: params.applicationId },
      include: { client: true },
    });
    if (!app || !app.client?.email) return null;

    const baseUrl = getAppBaseUrl();
    const token = signMagicTrackingToken({
      applicationId: app.id,
      clientId: app.clientId,
      fileNumber: app.fileNumber,
    });
    const docsUrl = `${baseUrl}/portal/documentos?trackToken=${encodeURIComponent(token)}&applicationId=${encodeURIComponent(app.id)}`;

    const isRejected = params.status === "REJECTED";
    const html = buildInstitutionalEmailHtml({
      eyebrow: isRejected
        ? "Acción Requerida · Subsanación Documental"
        : "Certificación Documental FINTERA",
      title: isRejected
        ? `Se requiere subsanar el soporte: ${params.requirementTitle}`
        : `Documento aprobado conforme: ${params.requirementTitle}`,
      greeting: `Hola ${app.client.firstName} ${app.client.firstLastName},`,
      bodyHtml: isRejected
        ? `
          <p>Nuestra Mesa de Crédito ha revisado el documento <strong>${params.requirementTitle}</strong> para el trámite ante <strong>${params.bankId.toUpperCase()}</strong> y requiere una actualización para poder radicar sin devoluciones:</p>
          <div style="padding:12px 16px;background-color:#FFF1F2;border-left:4px solid #E11D48;border-radius:6px;margin:14px 0;color:#881337;">
            <strong>Motivo reportado:</strong> ${params.rejectionReason || "El documento requiere actualización o mayor legibilidad."}<br/>
            ${params.customerVisibleNotes ? `<span style="font-size:13px;"><strong>Instrucción:</strong> ${params.customerVisibleNotes}</span>` : ""}
          </div>
          <p>Haz clic en el botón inferior para subir una nueva versión corregida directamente a tu Bóveda Cifrada.</p>
        `
        : `
          <p>Te confirmamos que el soporte <strong>${params.requirementTitle}</strong> correspondiente a tu trámite con <strong>${params.bankId.toUpperCase()}</strong> ha sido auditado y <strong>aprobado conforme</strong> por nuestra mesa técnica.</p>
        `,
      ctaLabel: isRejected ? "Subir Versión Corregida Ahora" : "Ver Mi Carpeta Documental",
      ctaUrl: docsUrl,
      fileNumber: app.fileNumber,
    });

    return this.dispatchEmail({
      to: app.client.email,
      subject: isRejected
        ? `⚠️ [FINTERA ${app.fileNumber}] Acción requerida: Subsanar ${params.requirementTitle}`
        : `✅ [FINTERA ${app.fileNumber}] Documento aprobado: ${params.requirementTitle}`,
      html,
      eventType: isRejected ? "RESEND_DOCUMENT_SUBSANATION_REQUIRED" : "RESEND_DOCUMENT_APPROVED",
      aggregateId: app.id,
      metadata: {
        fileNumber: app.fileNumber,
        bankId: params.bankId,
        requirementTitle: params.requirementTitle,
        status: params.status,
      },
    });
  }

  /**
   * 3. Notificación de Nuevo Hito Bancario Publicado en la Línea de Tiempo
   */
  public static async sendMilestoneUpdateNotification(params: {
    applicationId: string;
    bankId: string;
    stageTitle: string;
    explanation: string;
    actionNote?: string | null;
  }): Promise<ResendEmailDispatchResult | null> {
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: params.applicationId },
      include: { client: true },
    });
    if (!app || !app.client?.email) return null;

    const baseUrl = getAppBaseUrl();
    const token = signMagicTrackingToken({
      applicationId: app.id,
      clientId: app.clientId,
      fileNumber: app.fileNumber,
    });
    const detailUrl = `${baseUrl}/portal/solicitudes/${app.id}?trackToken=${encodeURIComponent(token)}`;

    const html = buildInstitutionalEmailHtml({
      eyebrow: `Actualización de Estado Bancario · ${params.bankId.toUpperCase()}`,
      title: `Nuevo Hito Alcanzado: ${params.stageTitle}`,
      greeting: `Hola ${app.client.firstName} ${app.client.firstLastName},`,
      bodyHtml: `
        <p>Tu expediente <strong>${app.fileNumber}</strong> en <strong>${params.bankId.toUpperCase()}</strong> ha avanzado a la etapa <strong>${params.stageTitle}</strong>:</p>
        <div style="padding:12px 16px;background-color:#ECFDF5;border-left:4px solid #10B981;border-radius:6px;margin:14px 0;color:#065F46;">
          ${params.explanation}
          ${params.actionNote ? `<div style="margin-top:8px;font-weight:700;color:#92400E;">⚡ Acción sugerida: ${params.actionNote}</div>` : ""}
        </div>
      `,
      ctaLabel: "Ver Línea de Tiempo Actualizada",
      ctaUrl: detailUrl,
      fileNumber: app.fileNumber,
    });

    return this.dispatchEmail({
      to: app.client.email,
      subject: `📈 [FINTERA ${app.fileNumber}] Avance en ${params.bankId.toUpperCase()}: ${params.stageTitle}`,
      html,
      eventType: "RESEND_MILESTONE_PUBLISHED",
      aggregateId: app.id,
      metadata: {
        fileNumber: app.fileNumber,
        bankId: params.bankId,
        stageTitle: params.stageTitle,
      },
    });
  }

  /**
   * 4. Notificación de Nuevo Mensaje Directo del Asesor FINTERA
   */
  public static async sendAdvisorMessageNotification(params: {
    applicationId: string;
    advisorName: string;
    messageContent: string;
  }): Promise<ResendEmailDispatchResult | null> {
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: params.applicationId },
      include: { client: true },
    });
    if (!app || !app.client?.email) return null;

    const baseUrl = getAppBaseUrl();
    const token = signMagicTrackingToken({
      applicationId: app.id,
      clientId: app.clientId,
      fileNumber: app.fileNumber,
    });
    const detailUrl = `${baseUrl}/portal/solicitudes/${app.id}?trackToken=${encodeURIComponent(token)}`;

    const html = buildInstitutionalEmailHtml({
      eyebrow: "Mensaje Directo de tu Asesor Financiero",
      title: `${params.advisorName} te ha enviado un mensaje`,
      greeting: `Hola ${app.client.firstName},`,
      bodyHtml: `
        <p>Tienes un nuevo mensaje en el canal seguro de tu expediente <strong>${app.fileNumber}</strong>:</p>
        <blockquote style="margin:14px 0;padding:14px 18px;background-color:#F8FAFC;border-left:4px solid #0B1F3A;border-radius:6px;color:#1E293B;font-style:italic;">
          &ldquo;${params.messageContent}&rdquo;
        </blockquote>
        <p>Puedes responder directamente desde tu Portal del Cliente.</p>
      `,
      ctaLabel: "Responder en el Portal del Cliente",
      ctaUrl: detailUrl,
      fileNumber: app.fileNumber,
    });

    return this.dispatchEmail({
      to: app.client.email,
      subject: `💬 [FINTERA ${app.fileNumber}] Nuevo mensaje de tu asesor financiero`,
      html,
      eventType: "RESEND_ADVISOR_MESSAGE_SENT",
      aggregateId: app.id,
      metadata: {
        fileNumber: app.fileNumber,
        advisorName: params.advisorName,
      },
    });
  }
}
