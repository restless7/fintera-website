import { NextRequest, NextResponse } from "next/server";
import { adminJson, authorizeAdminApi } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { BankStage } from "@/prisma/generated/client";
import { signMagicTrackingToken } from "@/lib/auth/magic-tracking-token";
import { CustomerMessagingService } from "@/lib/portal/customer-messaging-service";
import { CustomerPortalService } from "@/lib/portal/customer-portal-service";
import { ResendNotificationService } from "@/lib/notifications/resend-notification-service";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.finterasoluciones.co").replace(/\/+$/, "");
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;
    const authorization = await authorizeAdminApi("crm:application:read", applicationId);
    if (authorization.response) return authorization.response;
    const { userId: actorUserId } = authorization.context;

    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: {
        client: true,
        bankApplications: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            bankId: true,
            productType: true,
            stage: true,
          },
        },
      },
    });

    if (!app) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    const token = signMagicTrackingToken({
      applicationId: app.id,
      clientId: app.clientId,
      fileNumber: app.fileNumber,
    });

    const baseUrl = getBaseUrl();
    const portalMagicUrl = `${baseUrl}/portal?trackToken=${encodeURIComponent(token)}`;
    const documentsMagicUrl = `${baseUrl}/portal/documentos?trackToken=${encodeURIComponent(token)}&applicationId=${encodeURIComponent(app.id)}`;

    // Consultar mensajes del canal cliente-asesor
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

    // Consultar últimas notificaciones Resend / Outbox de este expediente
    const outboxNotifications = await prisma.domainOutboxEvent.findMany({
      where: {
        aggregateId: applicationId,
        aggregateType: "ResendEmailNotification",
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        eventType: true,
        status: true,
        createdAt: true,
        processedAt: true,
        errorMessage: true,
      },
    });

    return adminJson({
      success: true,
      actorUserId,
      fileNumber: app.fileNumber,
      clientPhone: app.client.phone,
      clientEmail: app.client.email,
      portalMagicUrl,
      documentsMagicUrl,
      bankApplications: app.bankApplications,
      messages,
      outboxNotifications,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[API portal-bridge GET] Error:", error);
    return NextResponse.json(
      { error: "Error consultando puente del portal cliente", detail: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;
    const authorization = await authorizeAdminApi("crm:application:read", applicationId);
    if (authorization.response) return authorization.response;
    const { userId: actorUserId } = authorization.context;

    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: { client: true },
    });

    if (!app) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    const body = (await req.json()) as {
      action?: string;
      content?: string;
      bankApplicationId?: string;
      stage?: BankStage;
      title?: string;
      explanation?: string;
      actionNote?: string;
    };

    if (body.action === "SEND_ADVISOR_MESSAGE") {
      if (!body.content || !body.content.trim()) {
        return NextResponse.json(
          { error: "El contenido del mensaje es obligatorio" },
          { status: 400 }
        );
      }

      const msg = await CustomerMessagingService.sendMessageFromAdvisor({
        advisorUserId: actorUserId,
        applicationId,
        content: body.content.trim(),
      });

      return adminJson({
        success: true,
        message: msg,
      });
    }

    if (body.action === "PUBLISH_BANK_MILESTONE") {
      if (!body.bankApplicationId || !body.stage) {
        return NextResponse.json(
          { error: "bankApplicationId y stage son obligatorios" },
          { status: 400 }
        );
      }

      const published = await CustomerPortalService.publishBankEvent({
        bankApplicationId: body.bankApplicationId,
        stage: body.stage,
        title: body.title || undefined,
        explanation: body.explanation || undefined,
        actionNote: body.actionNote || undefined,
        actorUserId,
      });

      return adminJson({
        success: true,
        eventId: published.eventId,
      });
    }

    if (body.action === "RESEND_WELCOME_LINK") {
      const dispatch = await ResendNotificationService.sendApplicationWelcomeNotification({
        applicationId: app.id,
        clientId: app.clientId,
        fileNumber: app.fileNumber,
        clientName: `${app.client.firstName} ${app.client.firstLastName}`.trim(),
        clientEmail: app.client.email,
        requestedAmount: app.requestedAmount,
        productCategory: app.productCategory,
      });

      return adminJson({
        success: true,
        dispatch,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("[API portal-bridge POST] Error:", error);
    return NextResponse.json(
      { error: "Error ejecutando acción en el puente del portal", detail: message },
      { status: 500 }
    );
  }
}
