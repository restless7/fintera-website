/**
 * FASE 6.4: GATE E — DOCUMENT MULTIBANK SERVICE
 * Reutilización de versiones físicas entre múltiples entidades bancarias con decisiones y revisiones independientes
 */

import prisma from "@/lib/prisma";
import { UserRole } from "@/lib/auth/types";
import {
  DocumentReviewStatus,
  DocumentScanStatus,
} from "@/prisma/generated/client";

export interface AttachEvidenceInput {
  requirementId: string;
  documentVersionId: string;
  actorUserId: string;
  actorRole: UserRole;
}

export interface ReviewDocumentInput {
  bankApplicationId: string;
  requirementId: string;
  documentVersionId: string;
  status: DocumentReviewStatus | "APPROVED" | "REJECTED" | "SUBSANATION_REQUESTED";
  rejectionReasonCode?: string;
  rejectionReasonDescription?: string;
  internalNotes?: string;
  customerVisibleNotes?: string;
  validityDays?: number;
  validUntil?: Date;
  actorUserId: string;
  actorRole: UserRole;
}

export class DocumentMultibankService {
  private static readonly REVIEW_ROLES: UserRole[] = [
    UserRole.DOCUMENT_ANALYST,
    UserRole.OPERATIONS_OFFICER,
    UserRole.SUPERVISOR,
    UserRole.COMMERCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  ];

  /**
   * Asocia una versión física limpia a un requisito bancario específico (Reutilización N:M)
   */
  public static async attachVersionToRequirement(input: AttachEvidenceInput) {
    const { requirementId, documentVersionId, actorUserId, actorRole } = input;

    const requirement = await prisma.bankDocumentRequirement.findUnique({
      where: { id: requirementId },
      include: { bankApplication: true },
    });
    if (!requirement) {
      throw new Error(`Obligación documental no encontrada: ${requirementId}`);
    }

    const version = await prisma.documentVersion.findUnique({
      where: { id: documentVersionId },
      include: { asset: true },
    });
    if (!version) {
      throw new Error(`Versión documental no encontrada: ${documentVersionId}`);
    }

    // Regla de Seguridad: Solo versiones CLEAN pueden asociarse como evidencia a un banco
    if (version.scanStatus !== DocumentScanStatus.CLEAN) {
      throw new Error(
        `No se puede asociar un archivo en estado '${version.scanStatus}'. Debe estar verificado limpio por el antivirus.`
      );
    }

    // Comprobar pertenencia al mismo expediente comercial (Cero contaminación cruzada)
    if (requirement.bankApplication.applicationId !== version.asset.applicationId) {
      throw new Error("Violación de seguridad: El documento no pertenece al mismo expediente comercial.");
    }

    // Crear enlace de evidencia
    const evidence = await prisma.documentRequirementEvidence.upsert({
      where: {
        requirementId_documentVersionId: {
          requirementId,
          documentVersionId,
        },
      },
      update: {
        attachedAt: new Date(),
        attachedByUserId: actorUserId,
      },
      create: {
        requirementId,
        documentVersionId,
        attachedByUserId: actorUserId,
      },
    });

    // Crear registro de revisión pendiente
    const existingReviews = await prisma.documentBankReview.findMany({
      where: { requirementId, documentVersionId },
      orderBy: { reviewVersion: "desc" },
    });
    const nextVersion = (existingReviews[0]?.reviewVersion || 0) + 1;

    const review = await prisma.documentBankReview.create({
      data: {
        bankApplicationId: requirement.bankApplicationId,
        requirementId,
        documentVersionId,
        status: DocumentReviewStatus.PENDING_REVIEW,
        reviewVersion: nextVersion,
        internalNotes: "Evidencia vinculada al requisito. Pendiente por auditar.",
      },
    });

    // Auditoría
    await prisma.documentAccessAudit.create({
      data: {
        documentVersionId,
        assetId: version.assetId,
        applicationId: requirement.bankApplication.applicationId,
        actorUserId,
        actorRole: actorRole ? actorRole.toString() : "OPERATIONS_OFFICER",
        action: "ATTACH_TO_BANK",
        isAuthorized: true,
      },
    });

    return { evidence, review };
  }

  /**
   * Registra una revisión humana y veredicto independiente para un banco aliado
   * Invariante E04: La decisión sobre Bancolombia no altera ni sobreescribe la de BBVA o Bogotá
   */
  public static async reviewDocumentForBank(input: ReviewDocumentInput) {
    const {
      bankApplicationId,
      requirementId,
      documentVersionId,
      status,
      rejectionReasonCode,
      rejectionReasonDescription,
      internalNotes,
      customerVisibleNotes,
      validityDays,
      actorUserId,
      actorRole,
    } = input;

    // 1. Verificación estricta de rol RBAC
    if (!this.REVIEW_ROLES.includes(actorRole)) {
      throw new Error(`Acceso denegado: El rol ${actorRole} no está facultado para emitir dictámenes documentales.`);
    }

    const requirement = await prisma.bankDocumentRequirement.findUniqueOrThrow({
      where: { id: requirementId },
      include: {
        bankApplication: true,
        requirementDefinition: true,
      },
    });

    if (requirement.bankApplicationId !== bankApplicationId) {
      throw new Error("El requisito no coincide con el subexpediente bancario indicado.");
    }

    const version = await prisma.documentVersion.findUniqueOrThrow({
      where: { id: documentVersionId },
      include: { asset: true },
    });

    if (version.scanStatus !== DocumentScanStatus.CLEAN) {
      throw new Error("No se puede aprobar un documento que no haya superado el análisis antivirus.");
    }

    // Calcular fecha de vigencia si es aprobado
    let validUntil: Date | null = null;
    if (status === "APPROVED") {
      const effectiveDays = validityDays || requirement.requirementDefinition.validityDays || 60;
      validUntil = new Date(Date.now() + effectiveDays * 24 * 60 * 60 * 1000);
    }

    // Obtener la versión de revisión para preservar inmutabilidad
    const lastReview = await prisma.documentBankReview.findFirst({
      where: { requirementId, documentVersionId },
      orderBy: { reviewVersion: "desc" },
    });
    const reviewVersion = (lastReview?.reviewVersion || 0) + 1;

    const reviewStatusEnum =
      status === "APPROVED"
        ? DocumentReviewStatus.APPROVED
        : status === "REJECTED" || (status as string) === "SUBSANATION_REQUESTED"
        ? DocumentReviewStatus.REJECTED
        : (status as DocumentReviewStatus);

    const effectiveActorId = actorUserId || (input as any).reviewerUserId || "system";
    let validReviewerId: string | null = null;
    if (effectiveActorId) {
      const userExists = await prisma.appUser.findUnique({ where: { id: effectiveActorId } });
      if (userExists) validReviewerId = userExists.id;
    }

    const newReview = await prisma.documentBankReview.create({
      data: {
        bankApplicationId,
        requirementId,
        documentVersionId,
        reviewerUserId: validReviewerId,
        status: reviewStatusEnum,
        rejectionReasonCode: reviewStatusEnum === DocumentReviewStatus.REJECTED ? rejectionReasonCode || "OBSERVACIONES" : null,
        rejectionReasonDescription: reviewStatusEnum === DocumentReviewStatus.REJECTED ? rejectionReasonDescription : null,
        internalNotes,
        customerVisibleNotes,
        reviewedAt: new Date(),
        validUntil: validUntil || (status === "APPROVED" ? new Date(Date.now() + 60 * 24 * 3600 * 1000) : null),
        reviewVersion,
      },
    });

    // Registrar en auditoría
    await prisma.documentAccessAudit.create({
      data: {
        documentVersionId,
        assetId: version.assetId,
        applicationId: requirement.bankApplication.applicationId,
        actorUserId: effectiveActorId,
        actorRole: actorRole.toString(),
        action: status === "APPROVED" ? "APPROVE_REVIEW" : "REJECT_REVIEW",
        isAuthorized: true,
      },
    });

    return newReview;
  }
}
