import { NextRequest, NextResponse } from "next/server";
import { resolvePortalClerkUserId } from "@/lib/auth/portal-auth-helper";
import { CustomerMessagingService } from "@/lib/portal/customer-messaging-service";
import { CustomerSecurityError } from "@/lib/auth/customer-identity-service";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const messages = await CustomerMessagingService.getApplicationMessages({
      clerkUserId,
      applicationId,
    });

    return NextResponse.json({ messages });
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/applications/[id]/messages GET] Error:", err);
    return NextResponse.json({ error: "Error consultando los mensajes del caso." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clerkUserId = await resolvePortalClerkUserId(req);
    if (!clerkUserId) {
      return NextResponse.json({ error: "No autenticado en Clerk." }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const body = await req.json();
    const { content } = body;

    const message = await CustomerMessagingService.sendMessageFromCustomer({
      clerkUserId,
      applicationId,
      content,
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (err: any) {
    if (err instanceof CustomerSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    console.error("[API portal/applications/[id]/messages POST] Error:", err);
    return NextResponse.json({ error: "Error enviando el mensaje." }, { status: 500 });
  }
}
