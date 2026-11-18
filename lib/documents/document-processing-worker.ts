import crypto from "crypto";
import prisma from "@/lib/prisma";
import { Prisma, DocumentCategory } from "@/prisma/generated/client";
import { storageAdapter } from "./storage/s3-storage-adapter";
import { MagicBytesValidator } from "./security/magic-bytes-validator";
import { AntivirusScanner } from "./security/antivirus-scanner";
import { CustomerIdentityService } from "@/lib/auth/customer-identity-service";
import { DashboardService } from "@/lib/crm/dashboard-service";
import { ROLE_PERMISSIONS_MAP, UserRole } from "@/lib/auth/types";
import { ACCESS_PERMISSIONS, EDITABLE_POLICY_ROLES } from "@/lib/auth/access-contracts";

const MAX_BYTES = 15728640;
const LEASE_MS = 120000;
export class DocumentProcessingWorker {
  static async heartbeat(workerId: string) {
    const status = await AntivirusScanner.getEngineStatus();
    await prisma.documentWorkerHeartbeat.upsert({ where: { workerId }, create: { workerId, lastSeenAt: new Date(), scannerReady: status.isOnline, scannerEngine: status.isOnline ? status.versionString : null }, update: { lastSeenAt: new Date(), scannerReady: status.isOnline, scannerEngine: status.isOnline ? status.versionString : null } });
    return status.isOnline;
  }
  static async claimNext() {
    const now = new Date();
    await prisma.documentUploadIntent.updateMany({ where: { status: "AWAITING_UPLOAD", queuedAt: { lt: new Date(now.getTime() - 86400000) }, OR: [{ processingToken: null }, { leaseUntil: { lt: now } }], processingErrorCode: null }, data: { processingErrorCode: "PROCESSING_DEADLINE" } });
    const candidates = await prisma.documentUploadIntent.findMany({ where: { status: "AWAITING_UPLOAD", queuedAt: { not: null, gt: new Date(now.getTime() - 86400000) }, processingErrorCode: null, OR: [{ processingToken: null }, { leaseUntil: { lt: now } }] }, orderBy: { queuedAt: "asc" }, take: 10, select: { id: true } });
    for (const candidate of candidates) {
      const token = crypto.randomUUID();
      const changed = await prisma.documentUploadIntent.updateMany({ where: { id: candidate.id, queuedAt: { not: null, gt: new Date(now.getTime() - 86400000) }, status: "AWAITING_UPLOAD", processingErrorCode: null, OR: [{ processingToken: null }, { leaseUntil: { lt: now } }] }, data: { processingToken: token, leaseUntil: new Date(now.getTime() + LEASE_MS) } });
      if (changed.count) return { intentId: candidate.id, token };
    }
    return null;
  }
  static async processClaim(intentId: string, token: string) {
    const intent = await prisma.documentUploadIntent.findFirst({ where: { id: intentId, status: "AWAITING_UPLOAD", processingToken: token, leaseUntil: { gt: new Date() }, queuedAt: { not: null } } });
    if (!intent) return { committed: false, code: "STALE_CLAIM" };
    let cleanKey: string | null = null;
    try {
      await this.authorizeIntent(intent);
      const metadata = await storageAdapter.getObjectMetadata(intent.generatedStorageKey, true);
      const cap = Math.min(intent.maxAllowedBytes, MAX_BYTES);
      if (metadata.contentLength <= 0 || metadata.contentLength > cap) throw new Error("SIZE_LIMIT");
      const buffer = await storageAdapter.getObjectBuffer(intent.generatedStorageKey, true, cap);
      if (!buffer.length || buffer.length > cap) throw new Error("SIZE_LIMIT");
      const validation = MagicBytesValidator.validateBuffer(buffer, intent.declaredMimeType);
      if (!validation.isValid || validation.isPolyglot || validation.detectedMimeType !== intent.declaredMimeType) throw new Error("INVALID_FILE_TYPE");
      const scan = await AntivirusScanner.scanFile(buffer);
      if (!scan.isClean || !scan.isEngineVerified) throw new Error(scan.threatName?.includes("SCANNER") || !scan.isEngineVerified ? "SCANNER_UNAVAILABLE" : "MALWARE_BLOCKED");
      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
      cleanKey = `clean/apps/${intent.applicationId}/${intent.id}/${token}/${sha256}.bin`;
      // Unique immutable destination and exactly the buffer that was scanned; never reread quarantine.
      await storageAdapter.promoteQuarantinedObject({ quarantineKey: intent.generatedStorageKey, cleanKey, scannedBuffer: buffer, metadata: { detectedMimeType: validation.detectedMimeType || intent.declaredMimeType, sha256 } });
      const version = await prisma.$transaction(async tx => {
        const claimed = await tx.documentUploadIntent.updateMany({ where: { id: intentId, status: "AWAITING_UPLOAD", processingToken: token, leaseUntil: { gt: new Date() } }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
        if (claimed.count !== 1) throw new Error("STALE_CLAIM");
        await this.authorizeIntent(intent, tx);
        const customerReq = intent.customerRequirementId ? await tx.customerDocumentRequirement.findUniqueOrThrow({ where: { id: intent.customerRequirementId } }) : null;
        const bankReq = intent.requirementId ? await tx.bankDocumentRequirement.findUniqueOrThrow({ where: { id: intent.requirementId }, include: { bankApplication: true } }) : null;
        if (customerReq && (customerReq.applicability !== "APPLIES" || customerReq.applicationId !== intent.applicationId || customerReq.applicantId !== intent.applicantId)) throw new Error("REQUIREMENT_CHANGED");
        if (bankReq && (bankReq.bankApplication.applicationId !== intent.applicationId || bankReq.applicabilityStatus !== "APPLICABLE" || bankReq.applicantId !== intent.applicantId)) throw new Error("REQUIREMENT_CHANGED");
        if (customerReq) {
          if (intent.expectedRevision === null) throw new Error("REQUIREMENT_CHANGED");
          const changed = await tx.customerDocumentRequirement.updateMany({ where: { id: customerReq.id, revision: intent.expectedRevision }, data: { revision: { increment: 1 } } });
          if (changed.count !== 1) throw new Error("REQUIREMENT_CHANGED");
        }
        if (bankReq) {
          if (intent.expectedRevision === null) throw new Error("REQUIREMENT_CHANGED");
          const changed = await tx.bankDocumentRequirement.updateMany({ where: { id: bankReq.id, revision: intent.expectedRevision }, data: { revision: { increment: 1 } } });
          if (changed.count !== 1) throw new Error("REQUIREMENT_CHANGED");
        }
        if (intent.applicantId && !await tx.applicant.findFirst({ where: { id: intent.applicantId, applicationId: intent.applicationId }, select: { id: true } })) throw new Error("REQUIREMENT_CHANGED");
        let assetId = intent.assetId;
        let versionNumber = 1;
        if (assetId) {
          await tx.$queryRaw`SELECT id FROM document_assets WHERE id = ${assetId} FOR UPDATE`;
          const asset = await tx.documentAsset.findUniqueOrThrow({ where: { id: assetId } });
          if (asset.applicationId !== intent.applicationId || asset.applicantId !== intent.applicantId || !intent.replaceVersionId || asset.currentVersionId !== intent.replaceVersionId) throw new Error("REPLACEMENT_CONFLICT");
          const latest = await tx.documentVersion.findFirst({ where: { assetId }, orderBy: { versionNumber: "desc" } });
          versionNumber = (latest?.versionNumber || 0) + 1;
          await tx.documentVersion.update({ where: { id: intent.replaceVersionId }, data: { supersededAt: new Date() } });
        } else {
          const asset = await tx.documentAsset.create({ data: { applicationId: intent.applicationId, applicantId: intent.applicantId, category: intent.declaredCategory || DocumentCategory.IDENTIFICATION, title: intent.declaredTitle || intent.declaredFileName, createdByUserId: intent.createdByUserId } });
          assetId = asset.id;
        }
        const staff = intent.queuedActorRole !== "CLIENT" ? await tx.appUser.findUnique({ where: { id: intent.createdByUserId || "" }, select: { id: true } }) : null;
        const created = await tx.documentVersion.create({ data: { assetId, versionNumber, storageKey: cleanKey!, originalFileName: intent.declaredFileName, fileSizeBytes: buffer.length, detectedMimeType: validation.detectedMimeType || intent.declaredMimeType, sha256, scanStatus: "CLEAN", scanEngine: scan.scannerEngine, scanCompletedAt: new Date(), uploadedByUserId: staff?.id } });
        await tx.documentAsset.update({ where: { id: assetId }, data: { currentVersionId: created.id } });
        if (customerReq) {
          await tx.customerDocumentEvidence.create({ data: { requirementId: customerReq.id, documentVersionId: created.id } });
        }
        if (bankReq) {
          await tx.documentRequirementEvidence.create({ data: { requirementId: bankReq.id, documentVersionId: created.id, attachedByUserId: intent.createdByUserId } });
          await tx.documentBankReview.create({ data: { requirementId: bankReq.id, bankApplicationId: bankReq.bankApplicationId, documentVersionId: created.id, status: "PENDING_REVIEW" } });
        }
        await tx.documentUploadIntent.update({ where: { id: intentId }, data: { assetId, processedVersionId: created.id, processingToken: null, leaseUntil: null } });
        await tx.documentAccessAudit.create({ data: { applicationId: intent.applicationId, assetId, documentVersionId: created.id, actorUserId: intent.createdByUserId || "", actorRole: intent.queuedActorRole || "CLIENT", action: "CONFIRM_UPLOAD", isAuthorized: true } });
        return created;
      }, { isolationLevel: "Serializable", timeout: 15000 });
      // Cleanup is deliberately after COMMIT ACK; failure here cannot invalidate the committed file.
      try { await storageAdapter.deleteObject(intent.generatedStorageKey, true); } catch { /* isolated remainder retained */ }
      return { committed: true, versionId: version.id };
    } catch (error) {
      const known = ["SIZE_LIMIT", "INVALID_FILE_TYPE", "SCANNER_UNAVAILABLE", "MALWARE_BLOCKED", "STALE_CLAIM", "REQUIREMENT_CHANGED", "REPLACEMENT_CONFLICT"];
      const code = error instanceof Error && known.includes(error.message) ? error.message : cleanKey ? "FINALIZATION_UNCERTAIN" : "PROCESSING_FAILED";
      // Never overwrite a confirmed/other worker's result, and never automatically replay ambiguous storage/DB ACKs.
      await prisma.documentUploadIntent.updateMany({ where: { id: intentId, status: "AWAITING_UPLOAD", processingToken: token }, data: { processingErrorCode: code, processingToken: null, leaseUntil: null } });
      return { committed: false, code };
    }
  }
  static async authorizeIntent(intent: { applicationId: string; applicantId: string | null; createdByUserId: string | null; queuedActorRole: string | null }, tx: Prisma.TransactionClient = prisma, permission: "crm:document:upload" | "crm:document:review" = "crm:document:upload") {
    if (!intent.createdByUserId) throw new Error("ACTOR_UNAVAILABLE");
    if (intent.queuedActorRole === "CLIENT") {
      if (permission !== "crm:document:upload") throw new Error("ACTOR_UNAVAILABLE");
      if (tx !== prisma) {
        await tx.$queryRaw`SELECT id FROM clients WHERE "clerkUserId" = ${intent.createdByUserId} FOR SHARE`;
        await tx.$queryRaw`SELECT id FROM customer_access_grants WHERE clerk_user_id = ${intent.createdByUserId} FOR SHARE`;
      }
      const scope = await CustomerIdentityService.verifyApplicationAccess(intent.createdByUserId, intent.applicationId, "UPLOAD", tx);
      if ((scope.grantRole === "CO_APPLICANT" && !scope.applicantId) || (scope.applicantId && scope.applicantId !== intent.applicantId)) throw new Error("APPLICANT_SCOPE_FORBIDDEN");
    } else {
      if (tx !== prisma) await tx.$queryRaw`SELECT id FROM app_users WHERE id = ${intent.createdByUserId} FOR SHARE`;
      const actor = await tx.appUser.findUnique({ where: { id: intent.createdByUserId }, include: { teamMemberships: true } });
      if (!actor?.isActive || actor.role === "CLIENT") throw new Error("ACTOR_UNAVAILABLE");
      let permissions: readonly string[] = ROLE_PERMISSIONS_MAP[actor.role as UserRole];
      if ((EDITABLE_POLICY_ROLES as readonly string[]).includes(actor.role)) {
        if (tx !== prisma) await tx.$queryRaw`SELECT role FROM role_permission_policies WHERE role::text = ${actor.role} FOR SHARE`;
        const policy = await tx.rolePermissionPolicy.findUnique({ where: { role: actor.role } });
        if (policy) {
          if (policy.permissions.length > 17 || new Set(policy.permissions).size !== policy.permissions.length || !policy.permissions.every(value => (ACCESS_PERMISSIONS as readonly string[]).includes(value))) throw new Error("ACTOR_POLICY_INVALID");
          permissions = policy.permissions;
        }
      }
      if (tx !== prisma) await tx.$queryRaw`SELECT id FROM team_memberships WHERE "userId" = ${actor.id} FOR SHARE`;
      if (!permissions.includes(permission)) throw new Error("ACTOR_UNAVAILABLE");
      const app = await tx.crmCreditApplication.findFirst({ where: { AND: [{ id: intent.applicationId }, DashboardService.buildScopeFilter(actor.role as UserRole, actor.id, actor.teamMemberships.map(m => m.teamId))] }, select: { id: true } });
      if (!app) throw new Error("ACTOR_SCOPE_REVOKED");
    }
  }
}
