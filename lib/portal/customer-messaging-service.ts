/**
 * FINTERA ENTERPRISE CRM — FASE 6.5: GATE F
 * CustomerMessagingService: Canal Bidireccional de Comunicación Cliente-Asesor
 * Desacoplado de actividades internas (CrmActivity) con trazabilidad forense y Outbox
 */

import prisma from "@/lib/prisma";
import { MessageSenderType } from "@/prisma/generated/client";
import { CustomerIdentityService, CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export interface CustomerMessageDTO {
  id: string;
  applicationId: string;
  senderType: "CUSTOMER" | "ADVISOR";
  senderName: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export class CustomerMessagingService {
  /**
   * Envía un mensaje desde el cliente hacia su asesor asignado
   */
  public static async sendMessageFromCustomer(params: {
    clerkUserId: string;
    applicationId: string;
    content: string;
  }): Promise<CustomerMessageDTO> {
    const { clerkUserId, applicationId, content } = params;

    if (!content || content.trim().length === 0) {
      throw new CustomerSecurityError("El contenido del mensaje no puede estar vacío.", 400, "EMPTY_MESSAGE");
    }

    // 1. Validar autorización de mensajería sobre el caso
    const auth = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, applicationId, "MESSAGE");

    // 2. Obtener el nombre del cliente
    const client = await prisma.client.findUnique({
      where: { id: auth.clientId },
    });
    const senderName = client ? `${client.firstName} ${client.firstLastName}` : "Cliente Fintera";

    // 3. Crear mensaje persistente en customer_messages (NUNCA en crm_activities)
    const message = await prisma.customerMessage.create({
      data: {
        applicationId,
        senderType: MessageSenderType.CUSTOMER,
        senderClerkUserId: clerkUserId,
        senderName,
        content: content.trim(),
        isInternalOnly: false,
      },
    });

    // 4. Encolar evento en Outbox Transaccional para notificación asíncrona (Gate G boundary)
    await prisma.outboxEvent.create({
      data: {
        eventType: "CUSTOMER_MESSAGE_RECEIVED",
        aggregateId: applicationId,
        payload: {
          messageId: message.id,
          applicationId,
          senderName,
          contentSummary: content.slice(0, 100),
          createdAt: message.createdAt.toISOString(),
        },
      },
    });

    // Dual-publish hacia el bus canónico domain_outbox_events
    await prisma.domainOutboxEvent.create({
      data: {
        eventType: "CUSTOMER_MESSAGE_RECEIVED",
        aggregateType: "CustomerMessage",
        aggregateId: applicationId,
        payload: {
          messageId: message.id,
          applicationId,
          senderName,
          contentSummary: content.slice(0, 100),
          createdAt: message.createdAt.toISOString(),
        },
        status: "PENDING",
      },
    });

    return {
      id: message.id,
      applicationId: message.applicationId,
      senderType: "CUSTOMER",
      senderName: message.senderName,
      content: message.content,
      createdAt: message.createdAt,
      isRead: message.isRead,
    };
  }

  /**
   * Envía una respuesta oficial desde el asesor hacia el cliente
   */
  public static async sendMessageFromAdvisor(params: {
    advisorUserId: string;
    applicationId: string;
    content: string;
  }): Promise<CustomerMessageDTO> {
    const { advisorUserId, applicationId, content } = params;

    if (!content || content.trim().length === 0) {
      throw new CustomerSecurityError("El contenido del mensaje no puede estar vacío.", 400, "EMPTY_MESSAGE");
    }

    const advisor = await prisma.appUser.findUnique({
      where: { id: advisorUserId },
    });

    if (!advisor || !advisor.isActive) {
      throw new CustomerSecurityError("Asesor comercial no autorizado o inactivo.", 403, "ADVISOR_UNAUTHORIZED");
    }

    const senderName = `${advisor.firstName} ${advisor.lastName} (Asesor Fintera)`;

    const message = await prisma.customerMessage.create({
      data: {
        applicationId,
        senderType: MessageSenderType.ADVISOR,
        senderUserId: advisorUserId,
        senderName,
        content: content.trim(),
        isInternalOnly: false,
      },
    });

    await prisma.outboxEvent.create({
      data: {
        eventType: "ADVISOR_MESSAGE_SENT",
        aggregateId: applicationId,
        payload: {
          messageId: message.id,
          applicationId,
          advisorName: senderName,
          contentSummary: content.slice(0, 100),
          createdAt: message.createdAt.toISOString(),
        },
      },
    });

    // Dual-publish hacia el bus canónico domain_outbox_events
    await prisma.domainOutboxEvent.create({
      data: {
        eventType: "ADVISOR_MESSAGE_SENT",
        aggregateType: "CustomerMessage",
        aggregateId: applicationId,
        payload: {
          messageId: message.id,
          applicationId,
          advisorName: senderName,
          contentSummary: content.slice(0, 100),
          createdAt: message.createdAt.toISOString(),
        },
        status: "PENDING",
      },
    });

    return {
      id: message.id,
      applicationId: message.applicationId,
      senderType: "ADVISOR",
      senderName: message.senderName,
      content: message.content,
      createdAt: message.createdAt,
      isRead: message.isRead,
    };
  }

  /**
   * Consulta el historial de mensajes de un caso protegiendo contra filtración de notas privadas
   */
  public static async getApplicationMessages(params: {
    clerkUserId?: string;
    advisorUserId?: string;
    applicationId: string;
  }): Promise<CustomerMessageDTO[]> {
    const { clerkUserId, advisorUserId, applicationId } = params;

    // Verificar permisos según el tipo de actor
    if (clerkUserId) {
      await CustomerIdentityService.verifyApplicationAccess(clerkUserId, applicationId, "VIEW");
    } else if (advisorUserId) {
      const advisor = await prisma.appUser.findUnique({ where: { id: advisorUserId } });
      if (!advisor || !advisor.isActive) {
        throw new CustomerSecurityError("Asesor comercial no autorizado.", 403, "ADVISOR_UNAUTHORIZED");
      }
    } else {
      throw new CustomerSecurityError("Actor no identificado.", 401, "UNAUTHENTICATED");
    }

    // Consultar exclusivamente customer_messages (las crm_activities internas se excluyen por diseño)
    const messages = await prisma.customerMessage.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        applicationId: true,
        senderType: true,
        senderName: true,
        content: true,
        createdAt: true,
        isRead: true,
      },
    });

    return messages.map((m) => ({
      id: m.id,
      applicationId: m.applicationId,
      senderType: m.senderType === MessageSenderType.CUSTOMER ? "CUSTOMER" : "ADVISOR",
      senderName: m.senderName,
      content: m.content,
      createdAt: m.createdAt,
      isRead: m.isRead,
    }));
  }
}
