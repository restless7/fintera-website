/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G02: Enrutador de Notificaciones Multicanal y Barrera de Privacidad
 */

import prisma from "@/lib/prisma";

export interface PublicCustomerNotificationInput {
  applicationId: string;
  bankId: string;
  stageTitle: string;
  publicDescription: string;
  actionRequired?: string | null;
}

export class NotificationRouter {
  /**
   * Despacha una notificación autorizada al cliente preservando la Barrera de Privacidad.
   * Solo incluye proyecciones públicas autorizadas, excluyendo tajantemente notas internas
   * de CRM, scoring de centrales de riesgo y contactos privados de analistas bancarios.
   */
  public static async dispatchCustomerStageNotification(
    input: PublicCustomerNotificationInput
  ): Promise<string> {
    const { applicationId, bankId, stageTitle, publicDescription, actionRequired } = input;

    // 1. Obtener datos del cliente mediante relación segura con el expediente
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: { client: true },
    });

    if (!app || !app.client) {
      throw new Error(`Expediente o cliente no encontrado para solicitud ${applicationId}`);
    }

    const client = app.client;
    const phoneMasked = client.phone ? `+57 *** *** ${client.phone.slice(-4)}` : "Destino no disponible";

    // 2. Construir cuerpo público redactado
    const actionNotice = actionRequired ? ` Acción requerida: ${actionRequired}.` : "";
    const content = `Fintera Informa: Tu solicitud para ${bankId} avanzó a: "${stageTitle}". ${publicDescription}.${actionNotice}`;

    // 3. Registrar en sumidero local auditado (Simulación local controlada)
    const log = await prisma.notificationDispatchLog.create({
      data: {
        recipientType: "CLIENT",
        recipientId: client.id,
        channel: "LOCAL_SINK_WHATSAPP",
        templateCode: "BANK_STAGE_UPDATE",
        title: `Actualización de Trámite Bancario: ${bankId}`,
        content,
        status: "CAPTURED_LOCAL",
        metadata: {
          applicationId,
          bankId,
          targetMasked: phoneMasked,
          dispatchedAt: new Date().toISOString(),
        },
      },
    });

    return log.id;
  }

  /**
   * Despacha una alerta operativa interna al asesor comercial asignado
   */
  public static async dispatchAdvisorAlert(
    advisorUserId: string,
    title: string,
    content: string,
    metadata?: any
  ): Promise<string> {
    const log = await prisma.notificationDispatchLog.create({
      data: {
        recipientType: "ADVISOR",
        recipientId: advisorUserId,
        channel: "INTERNAL_CRM_ALERT",
        templateCode: "ADVISOR_OPERATIONAL_ALERT",
        title,
        content,
        status: "CAPTURED_LOCAL",
        metadata: metadata || null,
      },
    });

    return log.id;
  }

  /**
   * Despacha notificación por nuevo mensaje del cliente hacia el asesor
   */
  public static async dispatchNewCustomerMessageAlert(
    applicationId: string,
    messageId: string,
    senderName: string
  ): Promise<string> {
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      select: { assignedAdvisorId: true },
    });

    const advisorId = app?.assignedAdvisorId || "SUPERVISOR_GENERAL";

    return await this.dispatchAdvisorAlert(
      advisorId,
      "Nuevo mensaje del cliente",
      `El cliente ${senderName} envió un mensaje en el expediente ${applicationId}.`,
      { applicationId, messageId, senderName }
    );
  }
}
