import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { UserRole } from "@/lib/auth/types";
import { DocumentScanStatus } from "@/prisma/generated/client";
import { DocumentIngestionService } from "@/lib/documents/document-ingestion-service";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId, versionId } = await params;
    const authorization = await authorizeAdminApi("crm:document:read", applicationId);
    if (authorization.response) return authorization.response;
    const { userId: actorUserId, role: effectiveRole, teamIds } = authorization.context;

    // 1. Verificar expediente y ABAC
    const application = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    const isGlobalRole =
      effectiveRole === UserRole.SUPER_ADMIN ||
      effectiveRole === UserRole.COMMERCIAL_DIRECTOR ||
      effectiveRole === UserRole.AUDITOR;

    const isAssigned = application.assignedAdvisorId === actorUserId;
    const isTeamSupervisor =
      effectiveRole === UserRole.SUPERVISOR &&
      application.teamId &&
      teamIds.includes(application.teamId);

    if (!isGlobalRole && !isAssigned && !isTeamSupervisor) {
      await prisma.documentAccessAudit.create({
        data: {
          applicationId,
          documentVersionId: versionId,
          actorUserId,
          actorRole: effectiveRole.toString(),
          action: "DOWNLOAD_VIEW",
          isAuthorized: false,
          denialReason: "Acceso denegado: Asesor sin asignación sobre este expediente (ABAC check failed).",
        },
      });

      return NextResponse.json(
        { error: "Acceso denegado: No tiene permisos para acceder a los documentos de este expediente" },
        { status: 403 }
      );
    }

    // 2. Verificar que la versión pertenezca a este expediente
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { asset: true },
    });

    if (!version || version.asset.applicationId !== applicationId) {
      return NextResponse.json(
        { error: "Documento no encontrado o no pertenece a este expediente" },
        { status: 404 }
      );
    }

    // 3. Control de Cuarentena Obligatorio: NINGÚN archivo que no sea CLEAN puede ser descargado
    if (version.scanStatus !== DocumentScanStatus.CLEAN) {
      await prisma.documentAccessAudit.create({
        data: {
          applicationId,
          assetId: version.assetId,
          documentVersionId: version.id,
          actorUserId,
          actorRole: effectiveRole.toString(),
          action: "DOWNLOAD_VIEW",
          isAuthorized: false,
          denialReason: `Descarga bloqueada: Objeto en estado de riesgo o cuarentena (${version.scanStatus}).`,
        },
      });

      return NextResponse.json(
        {
          error: "Acceso bloqueado: El archivo se encuentra en cuarentena o infectado y no puede ser emitido para descarga.",
          scanStatus: version.scanStatus,
        },
        { status: 403 }
      );
    }

    // 4. Generar URL pre-firmada efímera (máx 5 minutos)
    const downloadAuth = await DocumentIngestionService.createSecureDownloadUrl({
      versionId,
      actorUserId,
      actorRole: effectiveRole,
      ttlSeconds: 300,
    });

    const url = new URL(req.url);
    if (url.searchParams.get("redirect") === "true") {
      return NextResponse.redirect(downloadAuth.downloadUrl);
    }

    return NextResponse.json({
      success: true,
      downloadUrl: downloadAuth.downloadUrl,
      expiresAt: downloadAuth.expiresAt,
      originalFileName: version.originalFileName,
      detectedMimeType: version.detectedMimeType,
      fileSizeBytes: version.fileSizeBytes,
      sha256: version.sha256,
    });
  } catch (error: any) {
    console.error("[CRM Document Download API] Error GET:", error);
    return NextResponse.json(
      { error: "Error al generar enlace de descarga", detail: error.message },
      { status: 500 }
    );
  }
}
