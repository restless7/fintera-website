/**
 * FINTERA ENTERPRISE CRM — FASE 6.5: GATE F
 * CustomerDocumentService: Gestión Documental Segura del Cliente
 * Reutiliza los motores certificados de Gate E/E-R: ClamAV Fail-Closed, Cifrado AES-256-GCM y Versionado Inmutable.
 */

import prisma from "@/lib/prisma";
import { CustomerIdentityService, CustomerSecurityError } from "@/lib/auth/customer-identity-service";
import { storageAdapter } from "@/lib/documents/storage/s3-storage-adapter";
import { DocumentIngestionService } from "@/lib/documents/document-ingestion-service";
import { CustomerDocumentDtoMapper, CustomerDocumentSummaryDTO } from "@/lib/crm/dto/customer-document.dto";
import { DocumentScanStatus, DocumentCategory, CustomerGrantRole } from "@/prisma/generated/client";

export class CustomerDocumentService {
  /**
   * Obtiene la lista de requisitos documentales proyectados para el cliente
   */
  public static async getCustomerRequirements(
    clerkUserId: string,
    applicationId: string
  ): Promise<CustomerDocumentSummaryDTO[]> {
    const auth = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, applicationId, "VIEW");

    // Consultar requisitos materializados
    const requirements = await prisma.bankDocumentRequirement.findMany({
      where: {
        bankApplication: { applicationId },
      },
      include: {
        bankApplication: {
          select: { bankId: true },
        },
        requirementDefinition: {
          select: {
            requirementCode: true,
            title: true,
            description: true,
            category: true,
            isMandatory: true,
            validityDays: true,
          },
        },
        reviews: {
          orderBy: { reviewVersion: "desc" },
          take: 1,
          select: {
            status: true,
            rejectionReasonDescription: true,
            customerVisibleNotes: true,
            reviewedAt: true,
            validUntil: true,
            documentVersion: {
              select: {
                uploadedAt: true,
              },
            },
          },
        },
      },
    });

    // Si es un co-deudor, filtrar estrictamente los requisitos asignados a su persona
    let filteredReqs = requirements;
    if (auth.grantRole === CustomerGrantRole.CO_APPLICANT && auth.applicantId) {
      filteredReqs = requirements.filter(
        (r) => r.applicantId === auth.applicantId || r.requirementDefinition.category === "IDENTIFICATION"
      );
    }

    return filteredReqs.map((req) => CustomerDocumentDtoMapper.toCustomerDto(req as any));
  }

  /**
   * Crea una intención de subida pre-firmada directa a S3 Cuarentena (10 minutos)
   */
  public static async createCustomerUploadIntent(params: {
    clerkUserId: string;
    applicationId: string;
    requirementId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ intentId: string; uploadUrl: string; expiresAt: Date; storageKey: string }> {
    const { clerkUserId, applicationId, requirementId, fileName, mimeType, fileSize } = params;

    const auth = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, applicationId, "UPLOAD");

    // Validar que el requisito pertenece a esta solicitud
    const req = await prisma.bankDocumentRequirement.findUnique({
      where: { id: requirementId },
      include: { bankApplication: true, requirementDefinition: true },
    });

    if (!req || req.bankApplication.applicationId !== applicationId) {
      throw new CustomerSecurityError("El requisito documental no pertenece a este expediente.", 404, "REQUIREMENT_NOT_FOUND");
    }

    // Si es co-deudor, asegurar que no suba documentos del titular
    if (auth.grantRole === CustomerGrantRole.CO_APPLICANT && auth.applicantId && req.applicantId) {
      if (req.applicantId !== auth.applicantId) {
        throw new CustomerSecurityError(
          "Un cotitular no puede cargar evidencias para otro solicitante.",
          403,
          "CO_APPLICANT_SCOPE_VIOLATION"
        );
      }
    }

    // Delegar en DocumentIngestionService
    const result = await DocumentIngestionService.createUploadIntent({
      applicationId,
      category: (req.requirementDefinition.category as DocumentCategory) || DocumentCategory.IDENTIFICATION,
      title: req.requirementDefinition.title,
      declaredFileName: fileName,
      declaredMimeType: mimeType,
      maxAllowedBytes: fileSize,
      applicantId: req.applicantId || undefined,
      requirementId: req.id,
      actorUserId: clerkUserId,
      actorRole: "CLIENT" as any,
    });

    return {
      intentId: result.intentId,
      uploadUrl: result.uploadUrl,
      expiresAt: result.expiresAt,
      storageKey: result.storageKey,
    };
  }

  /**
   * Confirma la carga binaria, ejecuta escaneo ClamAV (TCP 3310), cifra AES-256-GCM y versiona
   */
  public static async confirmCustomerUpload(params: {
    clerkUserId: string;
    intentId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { clerkUserId, intentId } = params;

    const intent = await prisma.documentUploadIntent.findUnique({
      where: { id: intentId },
      include: { application: true },
    });

    if (!intent) {
      throw new CustomerSecurityError("Intención de carga no encontrada.", 404, "INTENT_NOT_FOUND");
    }

    // Verificar autorización sobre la solicitud asociada
    await CustomerIdentityService.verifyApplicationAccess(clerkUserId, intent.applicationId, "UPLOAD");

    // Ejecutar pipeline completo certificado en Gate E/E-R
    const confirmation = await DocumentIngestionService.confirmAndProcessUpload({
      intentId,
      actorUserId: clerkUserId,
      actorRole: "CLIENT" as any,
    });

    return confirmation;
  }

  /**
   * Emite una URL de descarga segura GET (5 minutos) asegurando que el archivo no esté en cuarentena o infectado
   */
  public static async getCustomerDownloadUrl(params: {
    clerkUserId: string;
    versionId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ downloadUrl: string; expiresAt: Date; fileName: string }> {
    const { clerkUserId, versionId, ipAddress, userAgent } = params;

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        asset: {
          include: { application: true },
        },
      },
    });

    if (!version || !version.asset) {
      throw new CustomerSecurityError("Documento no encontrado.", 404, "DOCUMENT_NOT_FOUND");
    }

    // Verificar permisos sobre el expediente
    await CustomerIdentityService.verifyApplicationAccess(clerkUserId, version.asset.applicationId, "VIEW");

    // REGLA DE ORO DE SEGURIDAD DOCUMENTAL:
    // Bajo ninguna circunstancia se permite descargar un documento infectado, en cuarentena o con fallo de escaneo
    if (version.scanStatus !== DocumentScanStatus.CLEAN) {
      throw new CustomerSecurityError(
        "Acceso denegado: El documento se encuentra en cuarentena de seguridad o pendiente de certificación antimalware.",
        403,
        "PROHIBITED_DOWNLOAD_QUARANTINED"
      );
    }

    // Generar URL pre-firmada GET de corta duración (300 segundos = 5 minutos)
    const downloadAuth = await storageAdapter.createDownloadAuthorization({
      storageKey: version.storageKey,
      safeFileName: version.originalFileName,
      ttlSeconds: 300,
      isQuarantine: false,
    });

    // Registrar auditoría forense inmutable
    await prisma.documentAccessAudit.create({
      data: {
        documentVersionId: version.id,
        assetId: version.assetId,
        applicationId: version.asset.applicationId,
        actorUserId: clerkUserId,
        actorRole: "CLIENT",
        action: "DOWNLOAD_VIEW",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        isAuthorized: true,
      },
    });

    return {
      downloadUrl: downloadAuth.downloadUrl,
      expiresAt: downloadAuth.expiresAt,
      fileName: version.originalFileName,
    };
  }
}
