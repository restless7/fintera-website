/**
 * FASE 6.4: GATE E — CUSTOMER SAFE DOCUMENT DTO
 * Contratos de proyección documental seguros para el futuro Portal del Cliente (Gate F)
 * Aislamiento estricto: Oculta rutas internas S3, notas de analistas y diagnósticos de antivirus
 */

import { DocumentReviewStatus } from "@/prisma/generated/client";

export interface CustomerDocumentSummaryDTO {
  requirementId: string;
  bankId: string;
  requirementCode: string;
  title: string;
  description: string;
  category: string;
  isMandatory: boolean;
  validityDays: number | null;
  status: "PENDING_UPLOAD" | "UNDER_REVIEW" | "APPROVED" | "REJECTED_NEEDS_ACTION";
  rejectionReasonPublic?: string | null;
  customerVisibleNotes?: string | null;
  hasUploadedEvidence: boolean;
  uploadedAt?: string | null;
  validUntil?: string | null;
  canUploadNewVersion: boolean;
}

export class CustomerDocumentDtoMapper {
  /**
   * Proyecta una obligación documental hacia una representación amigable y segura para el cliente
   */
  public static toCustomerDto(item: {
    id: string;
    bankApplication: { bankId: string };
    requirementDefinition: {
      requirementCode: string;
      title: string;
      description: string;
      category: string;
      isMandatory: boolean;
      validityDays: number | null;
    };
    reviews: Array<{
      status: DocumentReviewStatus;
      rejectionReasonDescription?: string | null;
      customerVisibleNotes?: string | null;
      reviewedAt?: Date | null;
      validUntil?: Date | null;
      documentVersion?: {
        uploadedAt: Date;
      };
    }>;
  }): CustomerDocumentSummaryDTO {
    const latestReview = item.reviews[0];

    let publicStatus: CustomerDocumentSummaryDTO["status"] = "PENDING_UPLOAD";
    if (latestReview) {
      if (latestReview.status === DocumentReviewStatus.APPROVED) {
        publicStatus = "APPROVED";
      } else if (latestReview.status === DocumentReviewStatus.REJECTED) {
        publicStatus = "REJECTED_NEEDS_ACTION";
      } else {
        publicStatus = "UNDER_REVIEW";
      }
    }

    return {
      requirementId: item.id,
      bankId: item.bankApplication.bankId,
      requirementCode: item.requirementDefinition.requirementCode,
      title: item.requirementDefinition.title,
      description: item.requirementDefinition.description,
      category: item.requirementDefinition.category,
      isMandatory: item.requirementDefinition.isMandatory,
      validityDays: item.requirementDefinition.validityDays,
      status: publicStatus,
      rejectionReasonPublic: latestReview?.rejectionReasonDescription || null,
      customerVisibleNotes: latestReview?.customerVisibleNotes || null,
      hasUploadedEvidence: Boolean(latestReview?.documentVersion),
      uploadedAt: latestReview?.documentVersion?.uploadedAt?.toISOString() || null,
      validUntil: latestReview?.validUntil?.toISOString() || null,
      canUploadNewVersion: publicStatus !== "APPROVED",
    };
  }
}
