import { DocumentProcessingWorker } from "./document-processing-worker";
import { RbacService } from "@/lib/auth/rbac-service";
/**
 * FASE 6.4: GATE E — DOCUMENT INGESTION SERVICE
 * Servicio de ingesta segura, control de intenciones de carga, inspección antivirus,
 * cuarentena y generación de versiones documentales inmutables
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { UserRole } from "@/lib/auth/types";
import {
  DocumentCategory,
  DocumentScanStatus,
  UploadIntentStatus,
} from "@/prisma/generated/client";
import { storageAdapter } from "./storage/s3-storage-adapter";




export interface CreateUploadIntentInput {
  applicationId: string;
  category: DocumentCategory;
  title: string;
  declaredFileName: string;
  declaredMimeType: string;
  maxAllowedBytes?: number;
  applicantId?: string;
  assetId?: string;
  requirementId?: string;
  actorUserId: string;
  actorRole: UserRole;
}

export interface ConfirmUploadInput {
  intentId: string;
  actorUserId: string;
  actorRole: UserRole;
}

export class DocumentIngestionService {
  private static readonly MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
  private static readonly ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/xml",
    "text/xml",
  ];

  /**
   * 1. Crea una intención de carga con URL pre-firmada PUT hacia la zona de cuarentena
   */
  public static async createUploadIntent(input: CreateUploadIntentInput) {
    const {
      applicationId,
      category,
      title,
      declaredFileName,
      declaredMimeType,
      maxAllowedBytes = this.MAX_FILE_SIZE_BYTES,
      applicantId,
      assetId,
      requirementId,
      actorUserId,
      actorRole,
    } = input;

    if (!Number.isSafeInteger(maxAllowedBytes) || maxAllowedBytes < 1 || maxAllowedBytes > this.MAX_FILE_SIZE_BYTES) throw new Error("El archivo excede el límite de 15 MiB.");
    // Validación preliminar de tipo declarado
    if (!this.ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
      throw new Error(`Tipo MIME '${declaredMimeType}' no permitido. Solo se aceptan PDF, JPEG y PNG.`);
    }

    // Verificar existencia del expediente comercial
    const crmApp = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
    });
    if (!crmApp) {
      throw new Error(`Expediente comercial no encontrado: ${applicationId}`);
    }

    const requirement = requirementId ? await prisma.bankDocumentRequirement.findUnique({ where: { id: requirementId }, include: { bankApplication: true } }) : null;
    if (requirementId && (!requirement || requirement.bankApplication.applicationId !== applicationId)) throw new Error("Requisito fuera de alcance");
    const existingAsset = assetId ? await prisma.documentAsset.findUnique({ where: { id: assetId } }) : null;
    if (assetId && (!existingAsset || existingAsset.applicationId !== applicationId)) throw new Error("Activo fuera de alcance");
    const effectiveApplicant = applicantId || requirement?.applicantId || existingAsset?.applicantId || null;
    if (effectiveApplicant && !await prisma.applicant.findFirst({ where: { id: effectiveApplicant, applicationId }, select: { id: true } })) throw new Error("Solicitante fuera de alcance");
    if (requirement && requirement.applicantId !== effectiveApplicant) throw new Error("Solicitante no corresponde al requisito");
    if (existingAsset && existingAsset.applicantId !== effectiveApplicant) throw new Error("Solicitante no corresponde al activo");
    if (existingAsset && requirement && existingAsset.currentVersionId && !await prisma.documentRequirementEvidence.findUnique({ where: { requirementId_documentVersionId: { requirementId: requirement.id, documentVersionId: existingAsset.currentVersionId } } })) throw new Error("Versión no corresponde al requisito");
    if (requirement && requirement.applicabilityStatus !== "APPLICABLE") throw new Error("Requisito no aplicable");
    const definition = requirement ? await prisma.documentRequirementDefinition.findUniqueOrThrow({ where: { id: requirement.requirementDefinitionId } }) : null;
    if (definition && (!definition.allowedMimeTypes.includes(declaredMimeType) || maxAllowedBytes > definition.maxSizeBytes)) throw new Error("Archivo no cumple política del requisito");
    // Generar clave única impredecible en zona de cuarentena
    const randomToken = crypto.randomBytes(12).toString("hex");
    const quarantineStorageKey = `quarantine/apps/${applicationId}/intent_${randomToken}.bin`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Reserve under the same authorization and quota lock before minting any provider capability.
    const intent = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`document-upload:${actorUserId}`}))`;
      if (requirementId) {
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`document-requirement:BANK_ADDITIONAL:${requirementId}`}))`;
        if (await tx.documentUploadIntent.count({ where: { requirementId, status: "AWAITING_UPLOAD", processingErrorCode: null, OR: [{ queuedAt: null, expiresAt: { gt: new Date() } }, { queuedAt: { gt: new Date(Date.now() - 86400000) } }] } })) throw new Error("Ya existe una carga pendiente para este requisito");
      }
      if (requirementId) {
        await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`document-requirement:BANK_ADDITIONAL:${requirementId}`}))`;
        if (await tx.documentUploadIntent.count({ where: { requirementId, status: "AWAITING_UPLOAD", processingErrorCode: null, OR: [{ queuedAt: null, expiresAt: { gt: new Date() } }, { queuedAt: { gt: new Date(Date.now() - 86400000) } }] } })) throw new Error("Ya hay una carga pendiente para este requisito");
      }
      const actor = await tx.appUser.findUnique({ where: { id: actorUserId } });
      if (!actor?.isActive || actor.role === "CLIENT") throw new Error("Actor no autorizado");
      await DocumentProcessingWorker.authorizeIntent({ applicationId, applicantId: effectiveApplicant, createdByUserId: actorUserId, queuedActorRole: actor.role }, tx);
      if (await tx.documentUploadIntent.count({ where: { createdByUserId: actorUserId, createdAt: { gt: new Date(Date.now() - 3600000) } } }) >= 30) throw new Error("Demasiadas cargas recientes");
      const created = await tx.documentUploadIntent.create({ data: {
        applicationId, assetId: assetId || null, requirementId: requirementId || null, applicantId: effectiveApplicant,
        expectedRevision: requirement?.revision, replaceVersionId: existingAsset?.currentVersionId,
        declaredCategory: definition?.category || category, declaredTitle: definition?.title || title, queuedActorRole: actor.role,
        generatedStorageKey: quarantineStorageKey, declaredFileName, declaredMimeType, maxAllowedBytes, expiresAt,
        status: UploadIntentStatus.AWAITING_UPLOAD, createdByUserId: actorUserId,
      } });
      await tx.documentAccessAudit.create({ data: { applicationId, assetId: assetId || null, actorUserId, actorRole: actor.role, action: "PRESIGN_UPLOAD", isAuthorized: true } });
      return created;
    }, { isolationLevel: "ReadCommitted" });
    let uploadAuth;
    try { uploadAuth = await storageAdapter.createUploadAuthorization({ storageKey: quarantineStorageKey, isQuarantine: true, declaredMimeType, maxAllowedBytes, ttlSeconds: 600 }); }
    catch (error) { await prisma.documentUploadIntent.updateMany({ where: { id: intent.id, queuedAt: null, status: "AWAITING_UPLOAD" }, data: { status: "CANCELLED", processingErrorCode: "UPLOAD_AUTHORIZATION_FAILED" } }); throw error; }

    return {
      intentId: intent.id,
      uploadUrl: uploadAuth.uploadUrl,
      storageKey: quarantineStorageKey,
      expiresAt,
      providerExpiresAt: uploadAuth.providerExpiresAt || uploadAuth.expiresAt,
      uploadMethod: uploadAuth.uploadMethod || "PUT",
      uploadHeaders: uploadAuth.uploadHeaders || { "Content-Type": declaredMimeType },
      maxAllowedBytes,
    };
  }

  /**
   * 2. Confirma la recepción del archivo, ejecuta inspección de magic-bytes,
   * escaneo antivirus completo, cálculo de SHA-256 y promoción a almacenamiento limpio
   */
  public static async confirmAndProcessUpload(input: ConfirmUploadInput) {
    const { intentId } = input;
    const intent = await prisma.documentUploadIntent.findUnique({ where: { id: intentId } });
    if (!intent || intent.createdByUserId !== input.actorUserId) throw new Error("Intención no encontrada");
    const actor = await prisma.appUser.findUnique({ where: { id: input.actorUserId }, select: { clerkUserId: true } });
    const decision = actor ? await RbacService.authorize({ clerkUserId: actor.clerkUserId, permission: "crm:document:upload", scope: { applicationId: intent.applicationId }, logAudit: false }) : null;
    if (!decision?.authorized || decision.authContext?.role === "CLIENT") throw new Error("Acceso denegado");
    if (intent.status !== "AWAITING_UPLOAD" && intent.status !== "CONFIRMED") throw new Error("Intención no disponible");
    if (intent.status === "CONFIRMED") return { success: true, queued: false, version: intent.processedVersionId ? await prisma.documentVersion.findUnique({ where: { id: intent.processedVersionId } }) : null, scanStatus: DocumentScanStatus.CLEAN, message: "Carga ya confirmada." };
    if (!intent.queuedAt && intent.expiresAt <= new Date()) throw new Error("La autorización expiró");
    await prisma.documentUploadIntent.updateMany({ where: { id: intentId, status: "AWAITING_UPLOAD", queuedAt: null, expiresAt: { gt: new Date() } }, data: { queuedAt: new Date() } });
    return { success: true, queued: true, version: null, scanStatus: DocumentScanStatus.PENDING_SCAN, message: "Archivo en cola para verificación de seguridad. Todavía no está aprobado." };
  }

  /**
   * 3. Emisión de URL pre-firmada GET de descarga segura con control de cuarentena
   */
  public static async createSecureDownloadUrl(params: {
    versionId: string;
    actorUserId: string;
    actorRole: UserRole;
    ttlSeconds?: number;
  }) {
    const { versionId, actorUserId, actorRole, ttlSeconds } = params;

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { asset: true },
    });

    if (!version) {
      throw new Error(`Versión documental no encontrada: ${versionId}`);
    }

    // Regla de Seguridad Crítica: Solo objetos CLEAN pueden ser descargados
    if (version.scanStatus !== DocumentScanStatus.CLEAN) {
      await prisma.documentAccessAudit.create({
        data: {
          documentVersionId: version.id,
          assetId: version.assetId,
          applicationId: version.asset.applicationId,
          actorUserId,
          actorRole: actorRole.toString(),
          action: "DOWNLOAD_VIEW",
          isAuthorized: false,
          denialReason: `Descarga denegada: El documento se encuentra en estado '${version.scanStatus}'`,
        },
      });

      throw new Error(`Acceso denegado: El archivo se encuentra en cuarentena o infectado (Estado: ${version.scanStatus}).`);
    }

    // Generar URL pre-firmada efímera (máx 15m)
    const downloadAuth = await storageAdapter.createDownloadAuthorization({
      storageKey: version.storageKey,
      safeFileName: version.originalFileName,
      contentType: version.detectedMimeType,
      ttlSeconds,
      isQuarantine: false,
    });

    // Auditoría inmutable de visualización
    await prisma.documentAccessAudit.create({
      data: {
        documentVersionId: version.id,
        assetId: version.assetId,
        applicationId: version.asset.applicationId,
        actorUserId,
        actorRole: actorRole.toString(),
        action: "DOWNLOAD_VIEW",
        isAuthorized: true,
      },
    });

    return downloadAuth;
  }
}
