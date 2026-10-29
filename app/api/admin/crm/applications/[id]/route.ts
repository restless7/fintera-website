import { NextRequest, NextResponse } from "next/server";
import { adminJson, authorizeAdminApi } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { UserRole } from "@/lib/auth/types";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const authorization = await authorizeAdminApi("crm:application:read", id);
    if (authorization.response) return authorization.response;
    const { role: effectiveRole, userId: effectiveUserId, teamIds } = authorization.context;
    const user = authorization.context;

    // Buscar expediente con todas sus relaciones operativas
    const application = await prisma.crmCreditApplication.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            consentRecords: { take: 5, orderBy: { grantedAt: "desc" } },
          },
        },
        applicants: { orderBy: { role: "asc" } },
        bankApplications: { orderBy: { createdAt: "asc" } },
        simulationSnapshot: true,
        assignedAdvisor: true,
        team: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { author: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // Verificación ABAC de Seguridad (Anti-IDOR / Anti-BOLA)
    const isGlobalRole =
      effectiveRole === UserRole.SUPER_ADMIN ||
      effectiveRole === UserRole.COMMERCIAL_DIRECTOR ||
      effectiveRole === UserRole.AUDITOR;

    const isAssigned = application.assignedAdvisorId === effectiveUserId;
    const isTeamSupervisor =
      effectiveRole === UserRole.SUPERVISOR &&
      application.teamId &&
      teamIds.includes(application.teamId);

    if (!isGlobalRole && !isAssigned && !isTeamSupervisor) {
      await prisma.accessAuditEvent.create({
        data: {
          userId: effectiveUserId,
          action: "IDOR_PREVENTION_BLOCKED",
          resourceType: "CrmCreditApplication",
          resourceId: id,
          applicationId: id,
          decision: "DENIED",
          reason: `Acceso denegado a expediente ${application.fileNumber}. El usuario no es el asesor asignado ni supervisor del equipo.`,
          metadata: { effectiveRole, effectiveUserId, assignedAdvisorId: application.assignedAdvisorId },
        },
      });

      return NextResponse.json(
        { error: "Acceso denegado: no tiene autorización sobre este expediente hipotecario" },
        { status: 403 }
      );
    }

    // Registrar evento de auditoría de lectura
    await prisma.accessAuditEvent.create({
      data: {
        userId: effectiveUserId,
        action: "VIEW_APPLICATION_WORKSPACE",
        resourceType: "CrmCreditApplication",
        resourceId: id,
        applicationId: id,
        decision: "GRANTED",
        reason: "Consulta autorizada de expediente hipotecario",
      },
    });

    return adminJson({
      success: true,
      application,
    });
  } catch (error: any) {
    console.error("[CRM Application Detail API] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar expediente", detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const authorization = await authorizeAdminApi("crm:application:update", id);
    if (authorization.response) return authorization.response;
    const body = await req.json();
    const { role: effectiveRole, userId: effectiveUserId, teamIds } = authorization.context;
    const user = authorization.context;

    const existing = await prisma.crmCreditApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    if (body.status !== undefined && body.status !== existing.status) {
      const transition = await authorizeAdminApi("crm:application:transition", id);
      if (transition.response) return transition.response;
    }
    if ((body.assignedAdvisorId !== undefined && body.assignedAdvisorId !== existing.assignedAdvisorId) || (body.teamId !== undefined && body.teamId !== existing.teamId)) {
      const assignment = await authorizeAdminApi("crm:lead:assign", id);
      if (assignment.response) return assignment.response;
    }

    // Validación de permisos para reasignación
    if (body.assignedAdvisorId !== undefined && body.assignedAdvisorId !== existing.assignedAdvisorId) {
      const canReassign =
        effectiveRole === UserRole.SUPER_ADMIN ||
        effectiveRole === UserRole.COMMERCIAL_DIRECTOR ||
        effectiveRole === UserRole.SUPERVISOR;

      if (!canReassign) {
        return NextResponse.json(
          { error: "Solo supervisores o directores comerciales pueden reasignar expedientes" },
          { status: 403 }
        );
      }
    }

    // Actualización atómica
    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.crmCreditApplication.update({
        where: { id },
        data: {
          status: body.status || undefined,
          assignedAdvisorId: body.assignedAdvisorId !== undefined ? body.assignedAdvisorId : undefined,
          teamId: body.teamId !== undefined ? body.teamId : undefined,
          nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : undefined,
          nextActionNote: body.nextActionNote !== undefined ? body.nextActionNote : undefined,
          internalNotes: body.internalNotes !== undefined ? body.internalNotes : undefined,
          customerVisibleNotes: body.customerVisibleNotes !== undefined ? body.customerVisibleNotes : undefined,
        },
      });

      // Si cambió el estado, registrar actividad
      if (body.status && body.status !== existing.status) {
        await tx.crmActivity.create({
          data: {
            applicationId: id,
            authorId: effectiveUserId,
            type: "STATUS_CHANGE",
            title: `Estado actualizado a ${body.status}`,
            description: body.statusChangeReason || `Transición de estado por operador ${user?.firstName || "Sistema"}.`,
            isInternalOnly: true,
          },
        });
      }

      // Si se reasignó asesor, registrar actividad
      if (body.assignedAdvisorId && body.assignedAdvisorId !== existing.assignedAdvisorId) {
        await tx.crmActivity.create({
          data: {
            applicationId: id,
            authorId: effectiveUserId,
            type: "TASK",
            title: "Expediente reasignado",
            description: `Asesor asignado actualizado por supervisión.`,
            isInternalOnly: true,
          },
        });
      }

      // Registro de auditoría
      await tx.accessAuditEvent.create({
        data: {
          userId: effectiveUserId,
          action: "UPDATE_APPLICATION",
          resourceType: "CrmCreditApplication",
          resourceId: id,
          applicationId: id,
          decision: "GRANTED",
          metadata: { changes: body, previousStatus: existing.status },
        },
      });

      return app;
    });

    return NextResponse.json({
      success: true,
      application: updated,
      message: "Expediente actualizado exitosamente",
    });
  } catch (error: any) {
    console.error("[CRM Application Patch API] Error:", error);
    return NextResponse.json(
      { error: "Error al actualizar expediente", detail: error.message },
      { status: 500 }
    );
  }
}
