/** Customer-safe portal contracts: no bucket keys, private notes or scanner diagnostics. */
export type DocumentProfileKind = "ASALARIADO" | "INDEPENDIENTE" | "UNKNOWN";
export interface ViviendaDocumentFacts {
  occupation: DocumentProfileKind;
  declaresIncomeTax: boolean | null;
  propertyRentalIncome: boolean | null;
  vehicleRentalIncome: boolean | null;
  chamberOfCommerceApplies: boolean | null;
  annualFinancialStatementsApply: boolean | null;
}
export interface CustomerDocumentProfileDTO extends ViviendaDocumentFacts { applicantId: string; revision: number; savedAt: string | null; }
export type RequirementApplicability = "APPLIES" | "NOT_APPLICABLE" | "NEEDS_INFORMATION";
export type CustomerDocumentStatus = "NEEDS_INFORMATION" | "NOT_APPLICABLE" | "PENDING_UPLOAD" | "QUEUED" | "PROCESSING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED_NEEDS_ACTION" | "PROCESSING_ERROR";
export interface CustomerDocumentEvidenceDTO {
  versionId: string; assetId: string; fileName: string; fileSizeBytes: number; mimeType: string; uploadedAt: string;
  versionNumber: number; isCurrent: boolean; scanStatus: "CLEAN" | "PENDING" | "BLOCKED" | "ERROR";
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED"; publicReason: string | null; reviewedAt: string | null;
  canDownload: boolean; canReplace: boolean;
}
export interface ViviendaRequirementDTO {
  id: string; applicantId: string; scope: "GENERAL_VIVIENDA"; code: string; slotKey: string; title: string;
  description: string; category: string; periodLabel: string | null; applicability: RequirementApplicability;
  applicabilityReason: string; isMandatory: boolean; revision: number; status: CustomerDocumentStatus;
  allowedMimeTypes: string[]; maxFileSizeBytes: number; canUpload: boolean; canAddEvidence: boolean;
  evidence: CustomerDocumentEvidenceDTO[]; history: CustomerDocumentEvidenceDTO[];
}
export interface BankAdditionalRequirementDTO {
  id: string; applicantId: string | null; scope: "BANK_ADDITIONAL"; bankId: string; title: string; description: string;
  category: string; isMandatory: boolean; revision: number; status: CustomerDocumentStatus; publicReason: string | null;
  evidence: CustomerDocumentEvidenceDTO[]; canUpload: boolean; canAddEvidence: boolean; allowedMimeTypes: string[]; maxFileSizeBytes: number;
}
export interface PortalApplicantDTO { id: string; name: string; role: string; occupation: string; profile: CustomerDocumentProfileDTO; canEditProfile: boolean; }
export interface CustomerDocumentWorkspaceDTO {
  applicationId: string; fileNumber: string; productCategory: string; catalogVersion: string;
  sessionScopeKey: string; accessState: "READY" | "LINK_REQUIRED" | "UNAVAILABLE";
  applicants: PortalApplicantDTO[]; requirements: ViviendaRequirementDTO[]; bankRequirements: BankAdditionalRequirementDTO[];
  permissions: { canViewDocuments: boolean; canUploadDocuments: boolean; canEditProfile: boolean };
  pendingUploads: CustomerUploadProcessingDTO[];
  processing: { mode: "OUTBOUND_WORKER"; configured: boolean; message: string };
}
export interface ProfileUpdateInput extends ViviendaDocumentFacts { applicationId: string; applicantId: string; expectedRevision: number; }
export interface CustomerUploadInput {
  applicationId: string; requirementId: string; scope: "GENERAL_VIVIENDA" | "BANK_ADDITIONAL";
  mode: "ADD" | "REPLACE"; replaceVersionId?: string; expectedRevision: number;
  fileName: string; mimeType: string; fileSize: number;
}
export type IntentProcessingState = "AWAITING_UPLOAD" | "QUEUED" | "PROCESSING" | "CONFIRMED" | "PROCESSING_ERROR" | "EXPIRED" | "CANCELLED";
export interface CustomerUploadAuthorizationDTO {
  intentId: string; uploadUrl: string; uploadMethod: "PUT"; uploadHeaders: Record<string, string>;
  expiresAt: string; providerExpiresAt: string; maxFileSizeBytes: number;
}
export interface CustomerUploadProcessingDTO {
  intentId: string; status: IntentProcessingState; accepted: boolean; versionId: string | null;
  requirementId: string | null; message: string; canRetry: boolean;
}
export interface CustomerLinkStateDTO {
  state: "LINKED" | "CONFIRM_EMAIL_LINK" | "SIGN_IN_REQUIRED" | "ASSISTED_LINK_REQUIRED";
  message: string; applications: Array<{ id: string; fileNumber: string }>;
}
export interface CustomerStaffReviewInput {
  customerRequirementId: string; documentVersionId: string; expectedRevision: number;
  status: "APPROVED" | "REJECTED"; publicReason: string;
}
export interface PortalApiError { error: string; code: string; }
export const PORTAL_DOCUMENTS_API = "/api/portal/documents";
export const VIVIENDA_DOCUMENT_CATALOG_VERSION = "vivienda-owner-20261117-v1";
export const VIVIENDA_MAX_FILE_BYTES = 15 * 1024 * 1024;
export const VIVIENDA_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const EMPTY_DOCUMENT_FACTS: ViviendaDocumentFacts = { occupation: "UNKNOWN", declaresIncomeTax: null, propertyRentalIncome: null, vehicleRentalIncome: null, chamberOfCommerceApplies: null, annualFinancialStatementsApply: null };
