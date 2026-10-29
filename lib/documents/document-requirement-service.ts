/**
 * FASE 6.4: GATE E — DOCUMENT REQUIREMENT SERVICE
 * Materialización de obligaciones documentales y evaluación de suficiencia probatoria para radicación
 */

import prisma from "@/lib/prisma";
import {
  DocumentReviewStatus,
  DocumentScanStatus,
  RequirementApplicabilityStatus,
} from "@/prisma/generated/client";
import { OFFICIAL_DOCUMENT_REQUIREMENTS } from "./document-requirement-catalog";

export interface DocumentaryReadinessResult {
  isReady: boolean;
  code: "READY" | "NO_REQUIREMENTS_MATERIALIZED" | "PENDING_DOCUMENTS" | "EXPIRED_DOCUMENTS" | "QUARANTINED_DOCUMENTS";
  message: string;
  totalMandatory: number;
  approvedCount: number;
  pendingRequirements: Array<{
    requirementId: string;
    code: string;
    title: string;
    status: DocumentReviewStatus | "NO_EVIDENCE_ATTACHED";
    reason?: string;
  }>;
}

export class DocumentRequirementService {
  /**
   * Inicializa el catálogo de definiciones oficiales si no existe en base de datos
   */
  public static async seedDefinitions(): Promise<number> {
    let created = 0;
    for (const def of OFFICIAL_DOCUMENT_REQUIREMENTS) {
      const existing = await prisma.documentRequirementDefinition.findUnique({
        where: { requirementCode: def.requirementCode },
      });
      if (!existing) {
        await prisma.documentRequirementDefinition.create({
          data: {
            requirementCode: def.requirementCode,
            bankId: def.bankId,
            productType: def.productType,
            applicantProfile: def.applicantProfile,
            category: def.category,
            title: def.title,
            description: def.description,
            isMandatory: def.isMandatory,
            validityDays: def.validityDays,
            allowedMimeTypes: def.allowedMimeTypes,
            maxSizeBytes: def.maxSizeBytes,
            sourceClassification: def.sourceClassification,
          },
        });
        created++;
      }
    }
    return created;
  }

  /**
   * Materializa el checklist de requisitos obligatorios para un trámite bancario específico
   */
  public static async materializeRequirements(bankApplicationId: string, actorUserId?: string): Promise<number> {
    await this.seedDefinitions();

    const bankApp = await prisma.bankApplication.findUnique({
      where: { id: bankApplicationId },
      include: {
        application: {
          include: {
            applicants: true,
          },
        },
      },
    });

    if (!bankApp) {
      throw new Error(`Subexpediente bancario no encontrado: ${bankApplicationId}`);
    }

    const bankId = bankApp.bankId;
    const productType = bankApp.productType;
    const primaryApplicant =
      bankApp.application.applicants.find((a) => a.role === "PRIMARY_HOLDER") ||
      bankApp.application.applicants[0];

    if (!primaryApplicant) {
      throw new Error(`El expediente comercial ${bankApp.applicationId} no cuenta con ningún solicitante registrado.`);
    }

    const profile = (primaryApplicant.occupation?.toUpperCase() || "ASALARIADO") as
      "ASALARIADO" | "INDEPENDIENTE" | "PENSIONADO" | "COLEX" | "TODOS";

    // Buscar definiciones aplicables:
    // 1. Transversales (bankId is null)
    // 2. Específicas de este banco
    // 3. Específicas o transversales de producto
    // 4. Específicas o transversales de perfil
    const applicableDefs = await prisma.documentRequirementDefinition.findMany({
      where: {
        OR: [
          { bankId: null },
          { bankId: bankId },
        ],
        AND: [
          {
            OR: [
              { productType: null },
              { productType: productType },
            ],
          },
          {
            OR: [
              { applicantProfile: "TODOS" },
              { applicantProfile: profile },
            ],
          },
        ],
      },
    });

    const materialized = [];
    for (const def of applicableDefs) {
      const record = await prisma.bankDocumentRequirement.upsert({
        where: {
          bankApplicationId_requirementDefinitionId_applicantId: {
            bankApplicationId: bankApp.id,
            requirementDefinitionId: def.id,
            applicantId: primaryApplicant.id,
          },
        },
        update: {},
        create: {
          bankApplicationId: bankApp.id,
          requirementDefinitionId: def.id,
          applicantId: primaryApplicant.id,
          requirementVersion: def.requirementVersion,
          isMandatory: def.isMandatory,
          applicabilityStatus: RequirementApplicabilityStatus.APPLICABLE,
        },
      });
      materialized.push(record);
    }

    return materialized.length;
  }

  /**
   * Alias explícito para la API REST
   */
  public static async materializeRequirementsForBankApplication(bankApplicationId: string, actorUserId?: string): Promise<number> {
    return this.materializeRequirements(bankApplicationId, actorUserId);
  }

  /**
   * P0 FIX CRÍTICO: Evalúa si un expediente bancario cuenta con la documentación requerida
   * para radicación (STAGE_04_BANK_SUBMITTED)
   *
   * Regla de Oro: Si no hay requisitos materializados, RETORNA FALSE (no aprueba en falso vacíos).
   */
  public static async evaluateBankReadiness(bankApplicationId: string): Promise<DocumentaryReadinessResult> {
    // 1. Consultar todos los requisitos obligatorios aplicables
    const mandatoryRequirements = await prisma.bankDocumentRequirement.findMany({
      where: {
        bankApplicationId,
        isMandatory: true,
        applicabilityStatus: RequirementApplicabilityStatus.APPLICABLE,
      },
      include: {
        requirementDefinition: true,
        reviews: {
          orderBy: { reviewVersion: "desc" },
          take: 1,
          include: {
            documentVersion: true,
          },
        },
      },
    });

    // P0: Bloqueo explícito si el conjunto de requisitos está vacío
    if (mandatoryRequirements.length === 0) {
      return {
        isReady: false,
        code: "NO_REQUIREMENTS_MATERIALIZED",
        message: "Bloqueo de radicación: No existen requisitos documentales materializados para esta entidad bancaria. Debe inicializar el checklist antes de avanzar.",
        totalMandatory: 0,
        approvedCount: 0,
        pendingRequirements: [],
      };
    }

    const pendingList: Array<{
      requirementId: string;
      code: string;
      title: string;
      status: DocumentReviewStatus | "NO_EVIDENCE_ATTACHED";
      reason?: string;
    }> = [];

    let approvedCount = 0;
    const now = new Date();

    for (const req of mandatoryRequirements) {
      const latestReview = req.reviews[0];

      if (!latestReview) {
        pendingList.push({
          requirementId: req.id,
          code: req.requirementDefinition.requirementCode,
          title: req.requirementDefinition.title,
          status: "NO_EVIDENCE_ATTACHED",
          reason: "No se ha asociado ningún soporte documental a esta obligación.",
        });
        continue;
      }

      if (latestReview.status !== DocumentReviewStatus.APPROVED) {
        pendingList.push({
          requirementId: req.id,
          code: req.requirementDefinition.requirementCode,
          title: req.requirementDefinition.title,
          status: latestReview.status,
          reason: latestReview.rejectionReasonDescription || `Estado de revisión: ${latestReview.status}`,
        });
        continue;
      }

      // Validar vigencia temporal
      if (latestReview.validUntil && latestReview.validUntil < now) {
        pendingList.push({
          requirementId: req.id,
          code: req.requirementDefinition.requirementCode,
          title: req.requirementDefinition.title,
          status: DocumentReviewStatus.EXPIRED,
          reason: `Documento vencido desde ${latestReview.validUntil.toISOString().slice(0, 10)}. Requiere actualización.`,
        });
        continue;
      }

      // Validar estado antivirus de la versión física
      if (latestReview.documentVersion.scanStatus !== DocumentScanStatus.CLEAN) {
        pendingList.push({
          requirementId: req.id,
          code: req.requirementDefinition.requirementCode,
          title: req.requirementDefinition.title,
          status: latestReview.status,
          reason: `El archivo físico asociado se encuentra en cuarentena o infectado (Estado: ${latestReview.documentVersion.scanStatus}).`,
        });
        continue;
      }

      approvedCount++;
    }

    if (pendingList.length > 0) {
      const hasExpired = pendingList.some((p) => p.status === DocumentReviewStatus.EXPIRED);
      return {
        isReady: false,
        code: hasExpired ? "EXPIRED_DOCUMENTS" : "PENDING_DOCUMENTS",
        message: `Bloqueo de radicación: Faltan ${pendingList.length} de ${mandatoryRequirements.length} requisitos documentales obligatorios por aprobar conforme.`,
        totalMandatory: mandatoryRequirements.length,
        approvedCount,
        pendingRequirements: pendingList,
      };
    }

    return {
      isReady: true,
      code: "READY",
      message: `Documentación completa: Todos los ${mandatoryRequirements.length} requisitos obligatorios están aprobados y vigentes.`,
      totalMandatory: mandatoryRequirements.length,
      approvedCount,
      pendingRequirements: [],
    };
  }
}
