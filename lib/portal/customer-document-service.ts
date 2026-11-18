import { DocumentProcessingWorker } from "@/lib/documents/document-processing-worker";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { CustomerIdentityService, CustomerSecurityError } from "@/lib/auth/customer-identity-service";
import { storageAdapter } from "@/lib/documents/storage/s3-storage-adapter";
import { CustomerGrantRole, Prisma, DocumentScanStatus } from "@/prisma/generated/client";
import { buildViviendaRequirements, supportsViviendaDocuments } from "./vivienda-document-catalog";
import { EMPTY_DOCUMENT_FACTS, VIVIENDA_DOCUMENT_CATALOG_VERSION, VIVIENDA_MAX_FILE_BYTES, VIVIENDA_MIME_TYPES,
  CustomerDocumentWorkspaceDTO, CustomerDocumentEvidenceDTO, CustomerDocumentStatus, CustomerUploadInput,
  CustomerUploadProcessingDTO, ProfileUpdateInput, CustomerDocumentProfileDTO, CustomerStaffReviewInput } from "./portal-contracts";

function activeIntentWhere(now = new Date()): Prisma.DocumentUploadIntentWhereInput {
  return { status: "AWAITING_UPLOAD", processingErrorCode: null, OR: [{ queuedAt: null, expiresAt: { gt: now } }, { queuedAt: { gt: new Date(now.getTime() - 86400000) } }] };
}
function isActiveIntent(intent: { status: string; processingErrorCode: string | null; queuedAt: Date | null; expiresAt: Date }) {
  return intent.status === "AWAITING_UPLOAD" && !intent.processingErrorCode && (intent.queuedAt ? intent.queuedAt.getTime() > Date.now() - 86400000 : intent.expiresAt > new Date());
}
const evidenceInclude = { documentVersion: { include: { asset: true } }, reviews: { orderBy: { reviewVersion: "desc" as const }, take: 1 } };
function conflict(): never { throw new CustomerSecurityError("La información cambió. Actualice antes de continuar.", 409, "CONFLICT"); }
function requirePerson(scope: { grantRole: CustomerGrantRole; applicantId: string | null }, applicantId: string | null) {
  if ((scope.grantRole === "CO_APPLICANT" && !scope.applicantId) || (scope.applicantId && applicantId !== scope.applicantId)) throw new CustomerSecurityError("Documento fuera del alcance autorizado.", 403, "APPLICANT_SCOPE_FORBIDDEN");
}
function evidenceDto(version: Prisma.DocumentVersionGetPayload<{ include: { asset: true } }>, review: { status: string; publicReason?: string | null; createdAt?: Date; customerVisibleNotes?: string | null; rejectionReasonDescription?: string | null; reviewedAt?: Date | null } | undefined, canUpload: boolean): CustomerDocumentEvidenceDTO {
  return { versionId: version.id, assetId: version.assetId, fileName: version.originalFileName, fileSizeBytes: version.fileSizeBytes,
    mimeType: version.detectedMimeType, uploadedAt: version.uploadedAt.toISOString(), versionNumber: version.versionNumber,
    isCurrent: version.asset.currentVersionId === version.id, scanStatus: version.scanStatus === "CLEAN" ? "CLEAN" : version.scanStatus === "INFECTED" || version.scanStatus === "QUARANTINED" ? "BLOCKED" : version.scanStatus === "SCAN_FAILED" ? "ERROR" : "PENDING",
    reviewStatus: review?.status === "APPROVED" ? "APPROVED" : review?.status === "REJECTED" ? "REJECTED" : "PENDING_REVIEW",
    publicReason: review?.publicReason || review?.customerVisibleNotes || null,
    reviewedAt: (review?.createdAt || review?.reviewedAt)?.toISOString() || null,
    canDownload: version.scanStatus === "CLEAN", canReplace: canUpload && version.asset.currentVersionId === version.id };
}
function evidenceStatus(evidence: CustomerDocumentEvidenceDTO[]): CustomerDocumentStatus {
  if (!evidence.length) return "PENDING_UPLOAD";
  if (evidence.some(e => e.reviewStatus === "REJECTED")) return "REJECTED_NEEDS_ACTION";
  return evidence.every(e => e.reviewStatus === "APPROVED") ? "APPROVED" : "UNDER_REVIEW";
}
function processingDto(intent: { id: string; status: string; expiresAt: Date; queuedAt: Date | null; processingToken: string | null; processingErrorCode: string | null; processedVersionId: string | null; customerRequirementId: string | null; requirementId: string | null }): CustomerUploadProcessingDTO {
  const status = intent.status === "CONFIRMED" ? "CONFIRMED" : intent.status === "CANCELLED" ? "CANCELLED" : (intent.processingErrorCode || (intent.queuedAt && intent.queuedAt.getTime() <= Date.now() - 86400000)) ? "PROCESSING_ERROR" : intent.queuedAt ? intent.processingToken ? "PROCESSING" : "QUEUED" : intent.status === "EXPIRED" || intent.expiresAt < new Date() ? "EXPIRED" : "AWAITING_UPLOAD";
  const messages = { CONFIRMED: "Archivo recibido y verificado. Está pendiente del dictamen documental.", QUEUED: "Archivo en cola para verificación de seguridad.", PROCESSING: "Verificación de seguridad en curso.", PROCESSING_ERROR: "El archivo permanece aislado. La verificación no pudo completarse; solicite ayuda o cargue un nuevo archivo.", CANCELLED: "El archivo no fue aceptado y permanece aislado.", EXPIRED: "La autorización de carga expiró. Genere una nueva carga.", AWAITING_UPLOAD: "Complete la carga del archivo antes de confirmar." };
  return { intentId: intent.id, status, accepted: !!intent.queuedAt || status === "CONFIRMED", versionId: intent.processedVersionId,
    requirementId: intent.customerRequirementId || intent.requirementId, message: messages[status], canRetry: status === "AWAITING_UPLOAD" };
}
export class CustomerDocumentService {
  static async getCustomerRequirements(clerkUserId: string, applicationId: string): Promise<CustomerDocumentWorkspaceDTO> {
    const scope = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, applicationId, "DOCUMENT_VIEW");
    let canUpload = false;
    try { await CustomerIdentityService.verifyApplicationAccess(clerkUserId, applicationId, "UPLOAD"); canUpload = true; } catch (error) { if (!(error instanceof CustomerSecurityError)) throw error; }
    const app = await prisma.crmCreditApplication.findUniqueOrThrow({ where: { id: applicationId }, select: { fileNumber: true, productCategory: true, applicants: { include: { documentProfile: true } } } });
    const applicants = app.applicants.filter(a => !scope.applicantId || a.id === scope.applicantId);
    const requirements = await prisma.customerDocumentRequirement.findMany({ where: { applicationId, applicantId: { in: applicants.map(a => a.id) }, catalogVersion: VIVIENDA_DOCUMENT_CATALOG_VERSION }, include: { evidence: { include: evidenceInclude } }, orderBy: [{ applicantId: "asc" }, { createdAt: "asc" }, { code: "asc" }, { slotKey: "asc" }] });
    const heartbeat = await prisma.documentWorkerHeartbeat.findFirst({ where: { scannerReady: true, lastSeenAt: { gt: new Date(Date.now() - 30000) } }, select: { workerId: true } });
    const bankRequirements = await prisma.bankDocumentRequirement.findMany({ where: { bankApplication: { applicationId }, ...(scope.applicantId ? { applicantId: scope.applicantId } : {}) }, include: { bankApplication: true, requirementDefinition: true, evidenceLinks: { include: { documentVersion: { include: { asset: true } } } }, reviews: { orderBy: { reviewVersion: "desc" } } } });
    const jobs = await prisma.documentUploadIntent.findMany({ where: { applicationId, createdByUserId: clerkUserId, ...(scope.applicantId ? { applicantId: scope.applicantId } : {}) }, orderBy: { createdAt: "desc" } });
    const activeJobs = await prisma.documentUploadIntent.findMany({ where: { applicationId, ...activeIntentWhere(), ...(scope.applicantId ? { applicantId: scope.applicantId } : {}) }, select: { customerRequirementId: true, requirementId: true, queuedAt: true, processingToken: true } });
    const supported = supportsViviendaDocuments(app.productCategory);
    return { applicationId, fileNumber: app.fileNumber, productCategory: app.productCategory, catalogVersion: VIVIENDA_DOCUMENT_CATALOG_VERSION,
      sessionScopeKey: crypto.createHash("sha256").update(`${clerkUserId}:${applicationId}`).digest("hex"), accessState: "READY",
      applicants: applicants.map(a => ({ id: a.id, name: `${a.firstName} ${a.lastName}`, role: a.role, occupation: a.occupation,
        profile: a.documentProfile ? { ...a.documentProfile, occupation: a.documentProfile.occupation as CustomerDocumentProfileDTO["occupation"], savedAt: a.documentProfile.updatedAt.toISOString() } : { ...EMPTY_DOCUMENT_FACTS, applicantId: a.id, revision: 0, savedAt: null }, canEditProfile: canUpload && supported })),
      requirements: !supported ? [] : applicants.flatMap(a => {
        const existing = requirements.filter(r => r.applicantId === a.id);
        if (!existing.length) return buildViviendaRequirements(EMPTY_DOCUMENT_FACTS).map(item => ({ ...item, id: `pending:${a.id}:${item.code}:${item.slotKey}`, applicantId: a.id, scope: "GENERAL_VIVIENDA" as const, revision: 0, status: item.applicability === "NEEDS_INFORMATION" ? "NEEDS_INFORMATION" as const : "PENDING_UPLOAD" as const, allowedMimeTypes: VIVIENDA_MIME_TYPES, maxFileSizeBytes: VIVIENDA_MAX_FILE_BYTES, canUpload: false, canAddEvidence: false, evidence: [], history: [] }));
        return existing.map(r => {
          const all = r.evidence.map(e => evidenceDto(e.documentVersion, e.reviews[0], canUpload)); const current = all.filter(e => e.isCurrent);
          const job = jobs.find(j => j.customerRequirementId === r.id);
          const activeJob = activeJobs.find(j => j.customerRequirementId === r.id);
          const status: CustomerDocumentStatus = r.applicability === "NEEDS_INFORMATION" ? "NEEDS_INFORMATION" : r.applicability === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : activeJob?.queuedAt ? activeJob.processingToken ? "PROCESSING" : "QUEUED" : job && job.queuedAt && job.status !== "CONFIRMED" ? processingDto(job).status === "PROCESSING_ERROR" ? "PROCESSING_ERROR" : job.processingToken ? "PROCESSING" : "QUEUED" : evidenceStatus(current);
          return { id: r.id, applicantId: r.applicantId, scope: "GENERAL_VIVIENDA" as const, code: r.code, slotKey: r.slotKey, title: r.title, description: r.description, category: r.category, periodLabel: r.periodLabel, applicability: r.applicability as "APPLIES" | "NOT_APPLICABLE" | "NEEDS_INFORMATION", applicabilityReason: r.applicabilityReason, isMandatory: r.isMandatory, revision: r.revision, status, allowedMimeTypes: VIVIENDA_MIME_TYPES, maxFileSizeBytes: VIVIENDA_MAX_FILE_BYTES, canUpload: canUpload && !activeJob && r.applicability === "APPLIES", canAddEvidence: canUpload && !activeJob && r.applicability === "APPLIES", evidence: current, history: all.filter(e => !e.isCurrent) };
        });
      }),
      bankRequirements: bankRequirements.map(r => {
        const latestLinkedByAsset = new Map<string, number>();
        for (const evidence of r.evidenceLinks) latestLinkedByAsset.set(evidence.documentVersion.assetId, Math.max(latestLinkedByAsset.get(evidence.documentVersion.assetId) || 0, evidence.documentVersion.versionNumber));
        const all = r.evidenceLinks.map(e => ({ ...evidenceDto(e.documentVersion, r.reviews.find(review => review.documentVersionId === e.documentVersionId), canUpload), isCurrent: latestLinkedByAsset.get(e.documentVersion.assetId) === e.documentVersion.versionNumber }));
        return {
        id: r.id, applicantId: r.applicantId, scope: "BANK_ADDITIONAL", bankId: r.bankApplication.bankId, title: r.requirementDefinition.title,
        description: r.requirementDefinition.description, category: r.requirementDefinition.category, isMandatory: r.isMandatory, revision: r.revision,
        status: r.applicabilityStatus === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : evidenceStatus(all.filter(e => e.isCurrent)), publicReason: null, evidence: all,
        canUpload: canUpload && (!all.length || all.some(e => e.canReplace)) && !activeJobs.some(j => j.requirementId === r.id) && r.applicabilityStatus === "APPLICABLE", canAddEvidence: false, allowedMimeTypes: r.requirementDefinition.allowedMimeTypes.filter(m => VIVIENDA_MIME_TYPES.includes(m)), maxFileSizeBytes: Math.min(r.requirementDefinition.maxSizeBytes, VIVIENDA_MAX_FILE_BYTES) }; }),
      permissions: { canViewDocuments: true, canUploadDocuments: canUpload, canEditProfile: canUpload && supported },
      pendingUploads: jobs.filter(j => j.status === "AWAITING_UPLOAD" && (isActiveIntent(j) || !!j.processingErrorCode)).map(processingDto),
      processing: { mode: "OUTBOUND_WORKER", configured: !!heartbeat, message: heartbeat ? "La verificación de seguridad está disponible. La aprobación documental la realiza su asesor." : "El verificador de seguridad no está disponible en este momento. Los archivos confirmados permanecerán aislados y en cola." } };
  }
  static async updateProfile(clerkUserId: string, input: ProfileUpdateInput) {
    await prisma.$transaction(async tx => {
      await CustomerIdentityService.verifyApplicationAccess(clerkUserId, input.applicationId, "DOCUMENT_VIEW", tx);
      const scope = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, input.applicationId, "UPLOAD", tx); requirePerson(scope, input.applicantId);
      const applicant = await tx.applicant.findFirst({ where: { id: input.applicantId, applicationId: input.applicationId }, include: { application: true } });
      if (!applicant || !supportsViviendaDocuments(applicant.application.productCategory)) throw new CustomerSecurityError("Este perfil documental corresponde únicamente a vivienda.", 400, "UNSUPPORTED_PRODUCT");
      await tx.$queryRaw`SELECT id FROM applicants WHERE id = ${input.applicantId} FOR UPDATE`;
      const prior = await tx.applicantDocumentProfile.findUnique({ where: { applicantId: input.applicantId } });
      if ((prior?.revision || 0) !== input.expectedRevision) conflict();
      const facts = { occupation: input.occupation, declaresIncomeTax: input.declaresIncomeTax, propertyRentalIncome: input.propertyRentalIncome, vehicleRentalIncome: input.vehicleRentalIncome, chamberOfCommerceApplies: input.chamberOfCommerceApplies, annualFinancialStatementsApply: input.annualFinancialStatementsApply };
      await tx.applicantDocumentProfile.upsert({ where: { applicantId: input.applicantId }, create: { ...facts, applicationId: input.applicationId, applicantId: input.applicantId, revision: 1 }, update: { ...facts, revision: { increment: 1 } } });
      for (const item of buildViviendaRequirements(facts)) await tx.customerDocumentRequirement.upsert({ where: { applicantId_code_slotKey_catalogVersion: { applicantId: input.applicantId, code: item.code, slotKey: item.slotKey, catalogVersion: item.catalogVersion } }, create: { ...item, applicationId: input.applicationId, applicantId: input.applicantId }, update: { ...item, revision: { increment: 1 } } });
      await tx.accessAuditEvent.create({ data: { clerkUserId, applicationId: input.applicationId, action: "CUSTOMER_DOCUMENT_PROFILE_SAVED", resourceType: "Applicant", resourceId: input.applicantId, decision: "GRANTED", metadata: { previousRevision: prior?.revision || 0, revision: (prior?.revision || 0) + 1 } } });
    }, { isolationLevel: "Serializable" });
    return this.getCustomerRequirements(clerkUserId, input.applicationId);
  }
  static async createCustomerUploadIntent(params: CustomerUploadInput & { clerkUserId: string; ipAddress?: string; userAgent?: string }) {
    if (!Number.isInteger(params.fileSize) || params.fileSize <= 0 || params.fileSize > VIVIENDA_MAX_FILE_BYTES || !VIVIENDA_MIME_TYPES.includes(params.mimeType)) throw new CustomerSecurityError("Use PDF, JPEG, PNG o WebP de hasta 15 MB.", 400, "INVALID_FILE");
    const scope = await CustomerIdentityService.verifyApplicationAccess(params.clerkUserId, params.applicationId, "UPLOAD");
    const base = params.scope === "GENERAL_VIVIENDA" ? await prisma.customerDocumentRequirement.findFirst({ where: { id: params.requirementId, applicationId: params.applicationId }, include: { application: true } }) : null;
    const bank = params.scope === "BANK_ADDITIONAL" ? await prisma.bankDocumentRequirement.findFirst({ where: { id: params.requirementId, bankApplication: { applicationId: params.applicationId } }, include: { requirementDefinition: true } }) : null;
    if (!base && !bank) throw new CustomerSecurityError("Requisito no encontrado.", 404, "REQUIREMENT_NOT_FOUND");
    const req = base || bank!; requirePerson(scope, req.applicantId);
    if (req.revision !== params.expectedRevision) conflict();
    if (base && (!supportsViviendaDocuments(base.application.productCategory) || base.applicability !== "APPLIES")) throw new CustomerSecurityError("Confirme el perfil antes de cargar este soporte.", 409, "PROFILE_REQUIRED");
    if (bank && (bank.applicabilityStatus !== "APPLICABLE" || !bank.requirementDefinition.allowedMimeTypes.includes(params.mimeType) || params.fileSize > bank.requirementDefinition.maxSizeBytes)) throw new CustomerSecurityError("El archivo no cumple la política de este requisito bancario.", 400, "INVALID_FILE");
    let assetId: string | null = null;
    if (params.mode === "REPLACE") {
      const version = await prisma.documentVersion.findUnique({ where: { id: params.replaceVersionId || "" }, include: { asset: true, customerEvidence: true, evidenceLinks: true } });
      if (!version || version.asset.applicationId !== params.applicationId || version.asset.applicantId !== req.applicantId || version.asset.currentVersionId !== version.id || !(base ? version.customerEvidence.some(e => e.requirementId === req.id) : version.evidenceLinks.some(e => e.requirementId === req.id))) throw new CustomerSecurityError("Seleccione una versión vigente del mismo requisito.", 409, "REPLACEMENT_CONFLICT");
      assetId = version.assetId;
    } else if (bank) {
      if (await prisma.documentRequirementEvidence.count({ where: { requirementId: bank.id } })) throw new CustomerSecurityError("Para este requisito bancario, sustituya la versión vigente.", 409, "REPLACEMENT_REQUIRED");
    }
    const key = `quarantine/apps/${params.applicationId}/${crypto.randomUUID()}.bin`;
    const expiresAt = new Date(Date.now() + 600000);
    const intent = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`document-upload:${params.clerkUserId}`}))`;
      const hourly = await tx.documentUploadIntent.count({ where: { createdByUserId: params.clerkUserId, createdAt: { gt: new Date(Date.now() - 3600000) } } });
      const outstanding = await tx.documentUploadIntent.count({ where: { createdByUserId: params.clerkUserId, ...activeIntentWhere() } });
      if (hourly >= 30 || outstanding >= 10) throw new CustomerSecurityError("Hay demasiadas cargas recientes o pendientes. Espere a que terminen antes de añadir más.", 429, "UPLOAD_RATE_LIMIT");
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`document-requirement:${params.scope}:${req.id}`}))`;
      if (await tx.documentUploadIntent.count({ where: { ...activeIntentWhere(), ...(base ? { customerRequirementId: req.id } : { requirementId: req.id }) } })) throw new CustomerSecurityError("Ya hay una carga pendiente para este requisito. Consulte su estado o cancele una carga no confirmada.", 409, "UPLOAD_IN_PROGRESS");
      const currentScope = await CustomerIdentityService.verifyApplicationAccess(params.clerkUserId, params.applicationId, "UPLOAD", tx); requirePerson(currentScope, req.applicantId);
      const current = base ? await tx.customerDocumentRequirement.findUnique({ where: { id: req.id } }) : await tx.bankDocumentRequirement.findUnique({ where: { id: req.id } });
      if (!current || current.revision !== params.expectedRevision) conflict();
      const created = await tx.documentUploadIntent.create({ data: { applicationId: params.applicationId, applicantId: req.applicantId,
        customerRequirementId: base?.id, requirementId: bank?.id, assetId, replaceVersionId: params.mode === "REPLACE" ? params.replaceVersionId : null,
        expectedRevision: params.expectedRevision, declaredCategory: base?.category || bank!.requirementDefinition.category, declaredTitle: base?.title || bank!.requirementDefinition.title,
        generatedStorageKey: key, declaredFileName: params.fileName, declaredMimeType: params.mimeType, maxAllowedBytes: params.fileSize,
        expiresAt, status: "AWAITING_UPLOAD", createdByUserId: params.clerkUserId, queuedActorRole: "CLIENT" } });
      await tx.documentAccessAudit.create({ data: { applicationId: params.applicationId, actorUserId: params.clerkUserId, actorRole: "CLIENT", action: "PRESIGN_UPLOAD", isAuthorized: true } });
      return created;
    }, { isolationLevel: "ReadCommitted" });
    let authorization;
    try { authorization = await storageAdapter.createUploadAuthorization({ storageKey: key, isQuarantine: true, declaredMimeType: params.mimeType, maxAllowedBytes: params.fileSize, ttlSeconds: 600 }); }
    catch (error) {
      await prisma.documentUploadIntent.updateMany({ where: { id: intent.id, queuedAt: null, status: "AWAITING_UPLOAD" }, data: { status: "CANCELLED", processingErrorCode: "UPLOAD_AUTHORIZATION_FAILED" } });
      throw error;
    }
    return { intentId: intent.id, uploadUrl: authorization.uploadUrl, uploadMethod: authorization.uploadMethod || "PUT" as const, uploadHeaders: authorization.uploadHeaders || { "Content-Type": params.mimeType }, expiresAt: expiresAt.toISOString(), providerExpiresAt: (authorization.providerExpiresAt || authorization.expiresAt).toISOString(), maxFileSizeBytes: params.fileSize };
  }
  static async getIntent(clerkUserId: string, intentId: string) {
    const intent = await prisma.documentUploadIntent.findUnique({ where: { id: intentId } });
    if (!intent || intent.createdByUserId !== clerkUserId) throw new CustomerSecurityError("Carga no encontrada.", 404, "INTENT_NOT_FOUND");
    const scope = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, intent.applicationId, "UPLOAD"); requirePerson(scope, intent.applicantId);
    return processingDto(intent);
  }
  static async confirmCustomerUpload(params: { clerkUserId: string; intentId: string; ipAddress?: string; userAgent?: string }) {
    const before = await this.getIntent(params.clerkUserId, params.intentId);
    if (before.accepted || before.status !== "AWAITING_UPLOAD") return before;
    const intent = await prisma.$transaction(async tx => {
      const current = await tx.documentUploadIntent.findUniqueOrThrow({ where: { id: params.intentId } });
      await tx.$queryRaw`SELECT id FROM document_upload_intents WHERE id = ${params.intentId} FOR UPDATE`;
      if (current.createdByUserId !== params.clerkUserId) throw new CustomerSecurityError("Carga no encontrada.", 404, "INTENT_NOT_FOUND");
      const scope = await CustomerIdentityService.verifyApplicationAccess(params.clerkUserId, current.applicationId, "UPLOAD", tx); requirePerson(scope, current.applicantId);
      if (!current.queuedAt && current.status === "AWAITING_UPLOAD" && current.expiresAt > new Date()) {
        await tx.documentUploadIntent.updateMany({ where: { id: current.id, status: "AWAITING_UPLOAD", queuedAt: null, expiresAt: { gt: new Date() } }, data: { queuedAt: new Date() } });
      }
      return tx.documentUploadIntent.findUniqueOrThrow({ where: { id: current.id } });
    });
    return processingDto(intent);
  }
  static async cancelIntent(clerkUserId: string, intentId: string) {
    await prisma.$transaction(async tx => {
      const intent = await tx.documentUploadIntent.findUnique({ where: { id: intentId } });
      if (!intent || intent.createdByUserId !== clerkUserId) throw new CustomerSecurityError("Carga no encontrada.", 404, "INTENT_NOT_FOUND");
      const scope = await CustomerIdentityService.verifyApplicationAccess(clerkUserId, intent.applicationId, "UPLOAD", tx); requirePerson(scope, intent.applicantId);
      if (intent.status === "CANCELLED") return;
      const changed = await tx.documentUploadIntent.updateMany({ where: { id: intentId, status: "AWAITING_UPLOAD", queuedAt: null, processingToken: null }, data: { status: "CANCELLED" } });
      if (changed.count !== 1) throw new CustomerSecurityError("La carga ya fue confirmada o está procesándose; no se canceló.", 409, "CANNOT_CANCEL_QUEUED_UPLOAD");
      await tx.documentAccessAudit.create({ data: { applicationId: intent.applicationId, actorUserId: clerkUserId, actorRole: "CLIENT", action: "CANCEL_UPLOAD", isAuthorized: true } });
    });
    return this.getIntent(clerkUserId, intentId);
  }
  static async getCustomerDownloadUrl(params: { clerkUserId: string; versionId: string; ipAddress?: string; userAgent?: string }) {
    const version = await prisma.documentVersion.findUnique({ where: { id: params.versionId }, include: { asset: true } });
    if (!version) throw new CustomerSecurityError("Documento no encontrado.", 404, "DOCUMENT_NOT_FOUND");
    const scope = await CustomerIdentityService.verifyApplicationAccess(params.clerkUserId, version.asset.applicationId, "DOCUMENT_VIEW"); requirePerson(scope, version.asset.applicantId);
    if (version.scanStatus !== DocumentScanStatus.CLEAN) throw new CustomerSecurityError("El archivo no está disponible para descarga.", 403, "PROHIBITED_DOWNLOAD_QUARANTINED");
    await prisma.documentAccessAudit.create({ data: { applicationId: version.asset.applicationId, documentVersionId: version.id, assetId: version.assetId, actorUserId: params.clerkUserId, actorRole: "CLIENT", action: "DOWNLOAD_VIEW", isAuthorized: true } });
    const authorization = await storageAdapter.createDownloadAuthorization({ storageKey: version.storageKey, safeFileName: version.originalFileName, ttlSeconds: 300, isQuarantine: false });
    return { downloadUrl: authorization.downloadUrl, expiresAt: authorization.expiresAt, fileName: version.originalFileName };
  }
  static async reviewCustomerDocument(applicationId: string, reviewerUserId: string, input: CustomerStaffReviewInput) {
    return prisma.$transaction(async tx => {
      await DocumentProcessingWorker.authorizeIntent({ applicationId, applicantId: null, createdByUserId: reviewerUserId, queuedActorRole: "STAFF" }, tx, "crm:document:review");
      const requirement = await tx.customerDocumentRequirement.findFirst({ where: { id: input.customerRequirementId, applicationId } });
      if (!requirement) throw new CustomerSecurityError("Requisito no encontrado.", 404, "REQUIREMENT_NOT_FOUND");
      const changed = await tx.customerDocumentRequirement.updateMany({ where: { id: requirement.id, revision: input.expectedRevision }, data: { revision: { increment: 1 } } });
      if (changed.count !== 1) conflict();
      const evidence = await tx.customerDocumentEvidence.findUnique({ where: { requirementId_documentVersionId: { requirementId: requirement.id, documentVersionId: input.documentVersionId } }, include: { documentVersion: { include: { asset: true } }, reviews: { orderBy: { reviewVersion: "desc" }, take: 1 } } });
      if (!evidence || evidence.documentVersion.asset.applicationId !== applicationId || evidence.documentVersion.asset.applicantId !== requirement.applicantId || evidence.documentVersion.scanStatus !== "CLEAN" || evidence.documentVersion.asset.currentVersionId !== input.documentVersionId) conflict();
      const review = await tx.customerDocumentReview.create({ data: { evidenceId: evidence.id, reviewerUserId, status: input.status, publicReason: input.publicReason.trim(), reviewVersion: (evidence.reviews[0]?.reviewVersion || 0) + 1 } });
      await tx.accessAuditEvent.create({ data: { userId: reviewerUserId, applicationId, action: "CUSTOMER_DOCUMENT_REVIEWED", resourceType: "CustomerDocumentEvidence", resourceId: evidence.id, decision: "GRANTED", metadata: { reviewId: review.id, status: input.status, revision: input.expectedRevision + 1 } } });
      return { success: true, revision: input.expectedRevision + 1 };
    }, { isolationLevel: "Serializable" });
  }
}
