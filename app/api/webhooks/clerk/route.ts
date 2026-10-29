import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import prisma from "@/lib/prisma";
import { synchronizeVerifiedClerkUser, type VerifiedClerkUserEvent } from "@/lib/auth/access-webhook";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return NextResponse.json({ error: "Cabeceras de verificación faltantes" }, { status: 400 });
  let event: { type: string; data: VerifiedClerkUserEvent };
  try { event = new Webhook(secret).verify(await req.text(), { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": signature }) as typeof event; }
  catch { return NextResponse.json({ error: "Firma de webhook rechazada" }, { status: 401 }); }
  if (!event || typeof event.type !== "string" || !event.data || typeof event.data.id !== "string" || !event.data.id || event.data.id.length > 128) return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  try {
    if (["user.created", "user.updated", "user.deleted"].includes(event.type)) return NextResponse.json(await synchronizeVerifiedClerkUser(event.type, event.data));
    if (["session.revoked", "session.ended"].includes(event.type)) {
      await prisma.accessAuditEvent.create({ data: { action: "CLERK_SESSION_REVOKED", resourceType: "Session", resourceId: event.data.id, decision: "GRANTED", reason: "Evento de sesión verificado en Clerk", metadata: { eventType: event.type } } });
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "No fue posible sincronizar el evento" }, { status: 503 }); }
}
