import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import prisma from "@/lib/prisma";
import { UserRole } from "@/lib/auth/types";

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserWebhookData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  public_metadata?: {
    role?: UserRole;
    documentType?: string;
    documentNumber?: string;
    teamId?: string;
  };
}

interface ClerkWebhookEvent {
  data: ClerkUserWebhookData;
  object: "event";
  type: "user.created" | "user.updated" | "user.deleted" | "session.revoked" | "session.ended" | string;
}

/**
 * ENDPOINT DE SINCRONIZACIÓN DE WEBHOOKS DE CLERK
 * 
 * Verifica la firma criptográfica mediante Svix en todos los entornos y sincroniza
 * de manera idempotente la tabla app_users en PostgreSQL con las altas,
 * actualizaciones de rol, bajas y revocaciones de sesión.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  let payload: ClerkWebhookEvent;

  // No event may mutate identity data without a configured verifier and valid signature.
  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET no configurado" }, { status: 500 });
  }
  {
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Cabeceras Svix faltantes para verificación de firma" },
        { status: 400 }
      );
    }

    const body = await req.text();
    const wh = new Webhook(webhookSecret);

    try {
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err: any) {
      console.error("Firma de webhook Clerk inválida:", err.message);
      return NextResponse.json(
        { error: "Firma de webhook rechazada", detail: err.message },
        { status: 401 }
      );
    }
  }

  const { type, data } = payload;
  const clerkUserId = data.id;

  try {
    switch (type) {
      case "user.created":
      case "user.updated": {
        const primaryEmail = data.email_addresses?.[0]?.email_address || `${clerkUserId}@fintera.internal`;
        const firstName = data.first_name || "Usuario";
        const lastName = data.last_name || "Fintera";
        const role = (data.public_metadata?.role as UserRole) || UserRole.COMMERCIAL_ADVISOR;

        // Upsert idempotente de AppUser
        const user = await prisma.appUser.upsert({
          where: { clerkUserId },
          update: {
            email: primaryEmail,
            firstName,
            lastName,
            role,
            isActive: true,
          },
          create: {
            clerkUserId,
            email: primaryEmail,
            firstName,
            lastName,
            role,
            isActive: true,
          },
        });

        // Si el usuario es un cliente y contiene documento, vincular con Client
        if (data.public_metadata?.documentType && data.public_metadata?.documentNumber) {
          await prisma.client.updateMany({
            where: {
              documentType: data.public_metadata.documentType,
              documentNumber: data.public_metadata.documentNumber,
            },
            data: {
              clerkUserId,
            },
          });
        }

        // Registrar auditoría
        await prisma.accessAuditEvent.create({
          data: {
            userId: user.id,
            clerkUserId,
            action: type === "user.created" ? "CLERK_USER_CREATED" : "CLERK_USER_UPDATED",
            resourceType: "AppUser",
            resourceId: user.id,
            decision: "GRANTED",
            reason: `Sincronización webhook Clerk: ${type}`,
            metadata: { role, email: primaryEmail },
          },
        });

        return NextResponse.json({
          success: true,
          eventType: type,
          userId: user.id,
          clerkUserId,
        });
      }

      case "user.deleted": {
        // Soft-delete / desactivación para preservar histórico
        const existing = await prisma.appUser.findUnique({
          where: { clerkUserId },
        });

        if (existing) {
          await prisma.appUser.update({
            where: { clerkUserId },
            data: { isActive: false },
          });

          await prisma.accessAuditEvent.create({
            data: {
              userId: existing.id,
              clerkUserId,
              action: "CLERK_USER_DEACTIVATED",
              resourceType: "AppUser",
              resourceId: existing.id,
              decision: "GRANTED",
              reason: "Usuario eliminado en Clerk -> Desactivado en Fintera CRM",
            },
          });
        }

        return NextResponse.json({
          success: true,
          eventType: "user.deleted",
          deactivatedClerkUserId: clerkUserId,
        });
      }

      case "session.revoked":
      case "session.ended": {
        await prisma.accessAuditEvent.create({
          data: {
            clerkUserId,
            action: "CLERK_SESSION_REVOKED",
            resourceType: "Session",
            decision: "GRANTED",
            reason: `Sesión revocada o finalizada en Clerk (${type})`,
            metadata: JSON.parse(JSON.stringify({ eventData: data })),
          },
        });

        return NextResponse.json({
          success: true,
          eventType: type,
          clerkUserId,
        });
      }

      default:
        return NextResponse.json({
          success: true,
          message: `Evento Clerk ${type} recibido y procesado (no-op)`,
        });
    }
  } catch (error: any) {
    console.error(`Error procesando webhook de Clerk [${type}]:`, error);
    return NextResponse.json(
      { error: "Fallo en procesamiento de webhook", detail: error.message },
      { status: 500 }
    );
  }
}
