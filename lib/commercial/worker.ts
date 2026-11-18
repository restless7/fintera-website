import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { SlaAutomationService } from "@/lib/automation/sla/sla-automation-service";
import { BiAggregationService } from "@/lib/automation/bi/bi-aggregation-service";
import {
  freshActor,
  verifiedNotificationContact,
  notificationContentHash,
} from "./service";
import { DashboardService } from "@/lib/crm/dashboard-service";

/** No generic domain_outbox claim: this worker can only claim its own approved messages. */
export class CommercialWorker {
  constructor(public readonly workerId: string) {
    if (!/^[a-zA-Z0-9_-]{3,100}$/.test(workerId))
      throw new Error("INVALID_WORKER_ID");
  }
  async tick() {
    const enabled =
      process.env.COMMERCIAL_DELIVERY_ENABLED === "true" &&
      !!process.env.RESEND_API_KEY &&
      !!process.env.RESEND_FROM_EMAIL;
    const now = new Date();
    await prisma.commercialWorkerHeartbeat.upsert({
      where: { id: this.workerId },
      create: {
        id: this.workerId,
        lastHeartbeatAt: now,
        notificationsEnabled: enabled,
      },
      update: { lastHeartbeatAt: now, notificationsEnabled: enabled },
    });
    let scanned = false;
    try {
      // Transaction-scoped scheduler lock remains held while existing canonical scans run. No outbox consumers.
      await prisma.$transaction(
        async (tx) => {
          const lock = await tx.$queryRaw<
            { acquired: boolean }[]
          >`SELECT pg_try_advisory_xact_lock(181120260002::bigint) AS acquired`;
          if (!lock[0]?.acquired) return;
          const last = await tx.commercialWorkerHeartbeat.findFirst({
            where: { lastScanAt: { not: null } },
            orderBy: { lastScanAt: "desc" },
          });
          if (
            last?.lastScanAt &&
            now.getTime() - last.lastScanAt.getTime() < 300000
          )
            return;
          await SlaAutomationService.runFullScan();
          await BiAggregationService.getExecutiveOverview();
          await tx.commercialWorkerHeartbeat.update({
            where: { id: this.workerId },
            data: { lastScanAt: new Date(), lastErrorCode: null },
          });
          scanned = true;
        },
        { timeout: 60000, maxWait: 1000 },
      );
      if (enabled) await this.dispatchOne();
      await prisma.commercialWorkerHeartbeat.update({
        where: { id: this.workerId },
        data: { lastHeartbeatAt: new Date(), lastErrorCode: null },
      });
      return { scanned, notificationsEnabled: enabled };
    } catch {
      await prisma.commercialWorkerHeartbeat.update({
        where: { id: this.workerId },
        data: {
          lastHeartbeatAt: new Date(),
          lastErrorCode: "COMMERCIAL_CYCLE_FAILED",
        },
      });
      return {
        scanned,
        notificationsEnabled: enabled,
        errorCode: "COMMERCIAL_CYCLE_FAILED",
      };
    }
  }
  async dispatchOne() {
    if (
      process.env.COMMERCIAL_DELIVERY_ENABLED !== "true" ||
      !process.env.RESEND_API_KEY ||
      !process.env.RESEND_FROM_EMAIL
    )
      return { status: "DISABLED" };
    const leaseToken = `${this.workerId}-${randomUUID()}`;
    const job = await prisma.$transaction(async (tx) => {
      // A lost acceptance ACK is not safe to replay indefinitely. Expired attempts require reconciliation.
      await tx.commercialNotification.updateMany({
        where: { status: "CLAIMED", leaseExpiresAt: { lt: new Date() } },
        data: {
          status: "UNKNOWN",
          errorCode: "PROVIDER_ACK_UNCERTAIN",
          revision: { increment: 1 },
        },
      });
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM commercial_notifications WHERE status='QUEUED' AND approved_at IS NOT NULL ORDER BY created_at,id LIMIT 1 FOR UPDATE SKIP LOCKED`;
      if (!rows[0]) return null;
      await tx.commercialNotification.update({
        where: { id: rows[0].id },
        data: {
          status: "CLAIMED",
          claimedBy: leaseToken,
          claimedAt: new Date(),
          leaseExpiresAt: new Date(Date.now() + 60000),
          revision: { increment: 1 },
        },
      });
      return tx.commercialNotification.findUnique({
        where: { id: rows[0].id },
      });
    });
    if (!job) return { status: "EMPTY" };
    try {
      return await prisma.$transaction(
        async (tx) => {
          const safeDeadline = Date.now() + 18000;
          let status = "UNKNOWN",
            errorCode: string | null = null,
            providerId: string | null = null;
          const approver = job.approvedBy
            ? await tx.appUser.findUnique({ where: { id: job.approvedBy } })
            : null;
          let a = null;
          try {
            if (approver) a = await freshActor(tx, approver.clerkUserId);
          } catch {
            /* denied approval remains terminal */
          }
          const app = a
            ? await tx.crmCreditApplication.findFirst({
                where: {
                  AND: [
                    { id: job.applicationId },
                    DashboardService.buildScopeFilter(
                      a.role,
                      a.userId,
                      a.teamIds,
                    ),
                  ],
                },
                include: {
                  client: {
                    include: {
                      consentRecords: {
                        where: { consentType: "COMMERCIAL_CONTACT" },
                        take: 1,
                      },
                    },
                  },
                },
              })
            : null;
          let contact = null;
          try {
            if (app)
              contact = await verifiedNotificationContact(tx, app.client);
          } catch {
            /* No provenance/consent/verified primary proof, no send. */
          }
          if (
            !a ||
            !["SUPER_ADMIN", "COMMERCIAL_DIRECTOR"].includes(a.role) ||
            !a.permissions.includes("crm:application:update") ||
            !app?.client.clerkUserId ||
            !contact ||
            contact.recipient !== job.recipient ||
            contact.consentRecordId !== job.consentRecordId ||
            app.commercialRevision !== job.applicationRevision ||
            app.client.updatedAt.getTime() !== job.clientUpdatedAt.getTime() ||
            notificationContentHash(job) !== job.contentHash
          ) {
            status = "FAILED";
            errorCode = "APPROVAL_REVOKED";
          } else {
            // Verify the interactive transaction and exact lease are still alive immediately before external I/O.
            const live = await tx.$queryRaw<{ id: string }[]>`
              SELECT id FROM public.commercial_notifications
              WHERE id=${job.id} AND status='CLAIMED' AND claimed_by=${leaseToken}
                AND lease_expires_at>${new Date(Date.now() + 12000)}
                AND content_hash=${job.contentHash} AND application_revision=${app.commercialRevision}
              FOR UPDATE
            `;
            if (!live.length || Date.now() + 12000 > safeDeadline)
              throw new Error("INSUFFICIENT_ATTEMPT_BUDGET");
            try {
              const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                  "Idempotency-Key": job.providerKey,
                },
                body: JSON.stringify({
                  from: process.env.RESEND_FROM_EMAIL,
                  to: [job.recipient],
                  subject: job.subject,
                  text: job.content,
                }),
                signal: AbortSignal.timeout(10000),
              });
              if (response.ok) {
                const body = (await response.json()) as { id?: unknown };
                if (typeof body.id === "string" && body.id.length < 200) {
                  status = "PROVIDER_ACCEPTED";
                  providerId = body.id;
                } else errorCode = "PROVIDER_ACK_INVALID";
              } else if (
                response.status >= 400 &&
                response.status < 500 &&
                response.status !== 408
              ) {
                status = "FAILED";
                errorCode = `PROVIDER_REJECTED_${response.status}`;
              } else errorCode = "PROVIDER_ACK_UNCERTAIN";
            } catch {
              errorCode = "PROVIDER_ACK_UNCERTAIN";
            }
          }
          const ack = await tx.commercialNotification.updateMany({
            where: {
              id: job.id,
              status: "CLAIMED",
              claimedBy: leaseToken,
              leaseExpiresAt: { gt: new Date() },
            },
            data: { status, errorCode, providerId, revision: { increment: 1 } },
          });
          if (ack.count !== 1) throw new Error("STALE_LEASE");
          await tx.accessAuditEvent.create({
            data: {
              userId: approver?.id,
              action: "COMMERCIAL_NOTIFICATION_ATTEMPT",
              resourceType: "CommercialNotification",
              resourceId: job.id,
              applicationId: job.applicationId,
              decision: status === "PROVIDER_ACCEPTED" ? "GRANTED" : "DENIED",
              reason: status,
              metadata: { providerId, errorCode },
            },
          });
          return { status, providerAccepted: status === "PROVIDER_ACCEPTED" };
        },
        { isolationLevel: "Serializable", timeout: 20000, maxWait: 5000 },
      );
    } catch {
      // A provider may accept before the local COMMIT ACK is lost. Never replay automatically.
      await prisma.commercialNotification.updateMany({
        where: { id: job.id, status: "CLAIMED", claimedBy: leaseToken },
        data: {
          status: "UNKNOWN",
          errorCode: "PROVIDER_OR_COMMIT_ACK_UNCERTAIN",
          revision: { increment: 1 },
        },
      });
      return { status: "UNKNOWN", providerAccepted: false };
    }
  }
}
