import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { ActivityType } from "@/prisma/generated/client";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;

    const authorization = await authorizeAdminApi("crm:application:update", applicationId);
    if (authorization.response) return authorization.response;
    const body = await req.json();
    const effectiveUserId = authorization.context.userId;

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "El título y la descripción de la actividad son obligatorios" },
        { status: 400 }
      );
    }

    const activityType: ActivityType = Object.values(ActivityType).includes(body.type)
      ? body.type
      : ActivityType.NOTE;

    const nextActionDate = body.nextActionDate ? new Date(body.nextActionDate) : null;

    // Crear actividad y actualizar fecha de próxima acción en la solicitud
    const result = await prisma.$transaction(async (tx) => {
      const activity = await tx.crmActivity.create({
        data: {
          applicationId,
          authorId: effectiveUserId,
          type: activityType,
          title: body.title.trim(),
          description: body.description.trim(),
          isInternalOnly: body.isInternalOnly !== false, // Por defecto siempre privado/interno
          nextActionDate,
          metadata: body.metadata || undefined,
        },
      });

      if (nextActionDate) {
        await tx.crmCreditApplication.update({
          where: { id: applicationId },
          data: {
            nextActionDate,
            nextActionNote: body.title,
          },
        });
      }

      return activity;
    });

    return NextResponse.json({
      success: true,
      activity: result,
      message: "Actividad registrada exitosamente en la bitácora interna",
    }, { status: 201 });
  } catch (error: any) {
    console.error("[CRM Activities API] Error:", error);
    return NextResponse.json(
      { error: "Error al registrar actividad", detail: error.message },
      { status: 500 }
    );
  }
}
