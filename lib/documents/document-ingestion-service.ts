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
  DocumentReviewStatus,
  DocumentLifecycleStatus,
  UploadIntentStatus,
} from "@/prisma/generated/client";
import { storageAdapter } from "./storage/s3-storage-adapter";
import { MagicBytesValidator } from "./security/magic-bytes-validator";
import { AntivirusScanner } from "./security/antivirus-scanner";

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
  private static readonly ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

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

    // Generar clave única impredecible en zona de cuarentena
    const randomToken = crypto.randomBytes(12).toString("hex");
    const quarantineStorageKey = `quarantine/apps/${applicationId}/intent_${randomToken}.bin`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Solicitar autorización de subida al StorageAdapter
    const uploadAuth = await storageAdapter.createUploadAuthorization({
      storageKey: quarantineStorageKey,
      isQuarantine: true,
      declaredMimeType,
      maxAllowedBytes,
      ttlSeconds: 600,
    });

    // Registrar intención en PostgreSQL
    const intent = await prisma.documentUploadIntent.create({
      data: {
        applicationId,
        assetId: assetId || null,
        requirementId: requirementId || null,
        generatedStorageKey: quarantineStorageKey,
        declaredFileName,
        declaredMimeType,
        maxAllowedBytes,
        expiresAt,
        status: UploadIntentStatus.AWAITING_UPLOAD,
        createdByUserId: actorUserId,
      },
    });

    // Auditoría inmutable de emisión de URL pre-firmada
    await prisma.documentAccessAudit.create({
      data: {
        applicationId,
        assetId: assetId || null,
        actorUserId,
        actorRole: actorRole.toString(),
        action: "PRESIGN_UPLOAD",
        isAuthorized: true,
      },
    });

    return {
      intentId: intent.id,
      uploadUrl: uploadAuth.uploadUrl,
      storageKey: quarantineStorageKey,
      expiresAt: uploadAuth.expiresAt,
      maxAllowedBytes,
    };
  }

  /**
   * 2. Confirma la recepción del archivo, ejecuta inspección de magic-bytes,
   * escaneo antivirus completo, cálculo de SHA-256 y promoción a almacenamiento limpio
   */
  public static async confirmAndProcessUpload(input: ConfirmUploadInput) {
    const { intentId, actorUserId, actorRole } = input;

    const intent = await prisma.documentUploadIntent.findUnique({
      where: { id: intentId },
      include: {
        application: true,
        asset: true,
        requirement: true,
      },
    });

    if (!intent) {
      throw new Error(`Intención de subida no encontrada: ${intentId}`);
    }

    if (intent.status === UploadIntentStatus.CONFIRMED) {
      throw new Error("La intención de subida ya fue procesada previamente (reintento duplicado).");
    }

    if (new Date() > intent.expiresAt) {
      await prisma.documentUploadIntent.update({
        where: { id: intentId },
        data: { status: UploadIntentStatus.EXPIRED },
      });
      throw new Error("La autorización de subida ha expirado. Genere una nueva solicitud.");
    }

    const quarantineKey = intent.generatedStorageKey;

    // 2.1 Verificar existencia del archivo en la zona de cuarentena
    const exists = await storageAdapter.confirmObject(quarantineKey, true);
    if (!exists) {
      throw new Error("El archivo no se encuentra en el almacenamiento de cuarentena. Complete la carga PUT antes de confirmar.");
    }

    // 2.2 Descargar buffer completo para análisis forense
    const fileBuffer = await storageAdapter.getObjectBuffer(quarantineKey, true);

    // 2.3 Validación estricta de tamaño real
    if (fileBuffer.length > intent.maxAllowedBytes) {
      await storageAdapter.deleteObject(quarantineKey, true);
      await prisma.documentUploadIntent.update({
        where: { id: intentId },
        data: { status: UploadIntentStatus.CANCELLED },
      });
      throw new Error(`El archivo excede el tamaño máximo permitido de ${intent.maxAllowedBytes / (1024 * 1024)} MB.`);
    }

    // 2.4 Validación de magic-bytes reales (anti-extensiones falsas y ejecutables)
    const magicValidation = MagicBytesValidator.validateBuffer(fileBuffer, intent.declaredMimeType);
    if (!magicValidation.isValid) {
      await storageAdapter.deleteObject(quarantineKey, true);
      await prisma.documentUploadIntent.update({
        where: { id: intentId },
        data: { status: UploadIntentStatus.CANCELLED },
      });
      throw new Error(`Archivo rechazado: ${magicValidation.error}`);
    }

    // 2.5 Cálculo de integridad criptográfica SHA-256
    const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // 2.6 Escaneo antivirus del archivo COMPLETO
    const avResult = await AntivirusScanner.scanFile(fileBuffer);

    // 2.7 Si el archivo está INFECTADO o FALLÓ el escáner
    if (!avResult.isClean) {
      // Registrar auditoría de seguridad
      await prisma.documentAccessAudit.create({
        data: {
          applicationId: intent.applicationId,
          assetId: intent.assetId,
          actorUserId,
          actorRole: actorRole.toString(),
          action: "ANTIVIRUS_DETECTION_BLOCKED",
          isAuthorized: false,
          denialReason: `Amenaza detectada: ${avResult.threatName}. ${avResult.details}`,
        },
      });

      await prisma.documentUploadIntent.update({
        where: { id: intentId },
        data: { status: UploadIntentStatus.CANCELLED },
      });

      // El archivo permanece aislado en cuarentena para análisis forense, jamás promovido
      return {
        success: false,
        scanStatus: DocumentScanStatus.INFECTED,
        threatName: avResult.threatName,
        details: avResult.details,
        message: "El archivo ha sido bloqueado por el motor antivirus y no se encuentra disponible.",
      };
    }

    // 2.8 ARCHIVO LIMPIO: Promoción hacia almacenamiento limpio
    const cleanStorageKey = `clean/apps/${intent.applicationId}/docs/${intent.assetId || "asset_" + crypto.randomBytes(6).toString("hex")}/v_${Date.now()}_${sha256.slice(0, 12)}.${magicValidation.detectedExtension}`;

    await storageAdapter.promoteQuarantinedObject({
      quarantineKey,
      cleanKey: cleanStorageKey,
      metadata: {
        sha256,
        detectedMimeType: magicValidation.detectedMimeType,
        verifiedClean: "true",
      },
    });

    // 2.9 Transacción atómica en PostgreSQL para materializar la versión inmutable
    const finalized = await prisma.$transaction(async (tx) => {
      // Upsert o recuperación del Asset
      let assetId = intent.assetId;
      if (!assetId) {
        const newAsset = await tx.documentAsset.create({
          data: {
            applicationId: intent.applicationId,
            category: DocumentCategory.IDENTIFICATION, // fallback si no especificado
            title: intent.declaredFileName,
            createdByUserId: actorUserId,
          },
        });
        assetId = newAsset.id;
      }

      // Obtener el siguiente número de versión
      const lastVersion = await tx.documentVersion.findFirst({
        where: { assetId },
        orderBy: { versionNumber: "desc" },
      });
      const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

      // Validar si actorUserId corresponde a un AppUser interno para respetar FK
      let validAppUserId: string | null = null;
      if (actorUserId) {
        const appUser = await tx.appUser.findUnique({ where: { id: actorUserId } });
        if (appUser) {
          validAppUserId = appUser.id;
        }
      }

      // Crear la nueva versión inmutable
      const newVersion = await tx.documentVersion.create({
        data: {
          assetId,
          versionNumber: nextVersionNumber,
          storageKey: cleanStorageKey,
          originalFileName: intent.declaredFileName,
          fileSizeBytes: fileBuffer.length,
          detectedMimeType: magicValidation.detectedMimeType,
          sha256,
          scanStatus: DocumentScanStatus.CLEAN,
          scanEngine: avResult.scannerEngine,
          scanCompletedAt: new Date(),
          scanDetails: avResult.details,
          uploadedByUserId: validAppUserId,
        },
      });

      // Marcar versión anterior como reemplazada (superseded)
      if (lastVersion) {
        await tx.documentVersion.update({
          where: { id: lastVersion.id },
          data: { supersededAt: new Date() },
        });
      }

      // Actualizar currentVersionId en el Asset
      await tx.documentAsset.update({
        where: { id: assetId },
        data: { currentVersionId: newVersion.id },
      });

      // Si la carga vino asociada a un requisito bancario, enlazar evidencia y crear revisión
      if (intent.requirementId) {
        await tx.documentRequirementEvidence.upsert({
          where: {
            requirementId_documentVersionId: {
              requirementId: intent.requirementId,
              documentVersionId: newVersion.id,
            },
          },
          update: {},
          create: {
            requirementId: intent.requirementId,
            documentVersionId: newVersion.id,
            attachedByUserId: actorUserId,
          },
        });

        // Crear registro de revisión pendiente para este banco
        const req = await tx.bankDocumentRequirement.findUniqueOrThrow({
          where: { id: intent.requirementId },
        });

        await tx.documentBankReview.create({
          data: {
            bankApplicationId: req.bankApplicationId,
            requirementId: intent.requirementId,
            documentVersionId: newVersion.id,
            status: DocumentReviewStatus.PENDING_REVIEW,
            internalNotes: "Carga reciente confirmada y verificada limpia por el antivirus.",
          },
        });
      }

      // Confirmar la intención
      await tx.documentUploadIntent.update({
        where: { id: intentId },
        data: {
          status: UploadIntentStatus.CONFIRMED,
          confirmedAt: new Date(),
          assetId,
        },
      });

      // Registrar auditoría de éxito
      await tx.documentAccessAudit.create({
        data: {
          documentVersionId: newVersion.id,
          assetId,
          applicationId: intent.applicationId,
          actorUserId,
          actorRole: actorRole.toString(),
          action: "CONFIRM_UPLOAD",
          isAuthorized: true,
        },
      });

      return newVersion;
    });

    return {
      success: true,
      scanStatus: DocumentScanStatus.CLEAN,
      version: finalized,
      message: "Documento verificado, analizado por antivirus y versionado exitosamente.",
    };
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
