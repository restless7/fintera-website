import { clerkClient } from "@clerk/nextjs/server";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import {
  ROLE_PERMISSIONS_MAP,
  type AuthContext,
  type Permission,
  type UserRole,
} from "@/lib/auth/types";
import {
  ACCESS_PERMISSIONS,
  EDITABLE_POLICY_ROLES,
} from "@/lib/auth/access-contracts";
import { DashboardService } from "@/lib/crm/dashboard-service";
import { DocumentRequirementService } from "@/lib/documents/document-requirement-service";
import { ALLIED_BANKS } from "@/lib/simulators/bank-configs";
import type {
  CommercialMutation,
  CommercialResult,
  CommercialState,
  GrowthCaptureInput,
  GrowthReceipt,
} from "./contracts";

type Tx = Prisma.TransactionClient;
export class CommercialServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function fail(code: string, message: string, status = 400): never {
  throw new CommercialServiceError(code, message, status);
}
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const iso = (value: Date | null) => value?.toISOString() ?? null;
const globalRole = (role: string) =>
  ["SUPER_ADMIN", "COMMERCIAL_DIRECTOR", "AUDITOR"].includes(role);
export const canReadFinance = (a: AuthContext) =>
  ["SUPER_ADMIN", "COMMERCIAL_DIRECTOR", "AUDITOR"].includes(a.role) &&
  a.permissions.includes("crm:commercial:finance:read");
export const canWriteFinance = (a: AuthContext) =>
  ["SUPER_ADMIN", "COMMERCIAL_DIRECTOR"].includes(a.role) &&
  a.permissions.includes("crm:commercial:finance:write");
function requirePermission(a: AuthContext, p: Permission) {
  if (!a.permissions.includes(p) || a.role === "CLIENT")
    fail("FORBIDDEN", "No tiene permiso para esta operación.", 403);
}
function noFuture(value: string) {
  if (new Date(value).getTime() > Date.now() + 60000)
    fail("INVALID_INPUT", "La fecha efectiva no puede ser futura.");
}
function leadScope(a: AuthContext): Prisma.CommercialLeadWhereInput {
  return globalRole(a.role)
    ? {}
    : a.role === "SUPERVISOR"
      ? { OR: [{ teamId: { in: a.teamIds } }, { assignedAdvisorId: a.userId }] }
      : { assignedAdvisorId: a.userId };
}
function caseScope(a: AuthContext) {
  return DashboardService.buildScopeFilter(a.role, a.userId, a.teamIds);
}

/** Same access lock as role changes/webhook revocation, followed by fresh row/policy in this transaction. */
export async function freshActor(
  tx: Tx,
  clerkUserId: string,
): Promise<AuthContext> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(710292026001::bigint)`;
  const rows = await tx.$queryRaw<
    Array<{ id: string }>
  >`SELECT id FROM app_users WHERE "clerkUserId"=${clerkUserId} FOR UPDATE`;
  if (!rows.length) fail("FORBIDDEN", "Acceso interno no disponible.", 403);
  const u = await tx.appUser.findUnique({
    where: { id: rows[0].id },
    include: { teamMemberships: true },
  });
  if (!u?.isActive || u.role === "CLIENT")
    fail("FORBIDDEN", "Acceso interno no disponible.", 403);
  let permissions = ROLE_PERMISSIONS_MAP[u.role as UserRole];
  if (!permissions) fail("FORBIDDEN", "Rol no autorizado.", 403);
  if ((EDITABLE_POLICY_ROLES as readonly string[]).includes(u.role)) {
    const policy = await tx.rolePermissionPolicy.findUnique({
      where: { role: u.role },
    });
    if (policy) {
      if (
        policy.permissions.length > ACCESS_PERMISSIONS.length ||
        new Set(policy.permissions).size !== policy.permissions.length ||
        !policy.permissions.every((p) =>
          ACCESS_PERMISSIONS.includes(p as Permission),
        )
      )
        fail("FORBIDDEN", "Política de acceso inválida.", 403);
      permissions = policy.permissions as Permission[];
    }
  }
  return {
    userId: u.id,
    clerkUserId: u.clerkUserId,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role as UserRole,
    permissions,
    teamIds: u.teamMemberships.map((t) => t.teamId),
    isSuperAdmin: u.role === "SUPER_ADMIN",
    isDirector: u.role === "COMMERCIAL_DIRECTOR",
  };
}
async function scopedCase(tx: Tx, a: AuthContext, id: string) {
  requirePermission(a, "crm:application:read");
  const app = await tx.crmCreditApplication.findFirst({
    where: { AND: [{ id }, caseScope(a)] },
    include: { client: true },
  });
  if (!app) fail("NOT_FOUND", "Expediente no disponible.", 404);
  return app;
}
async function scopedLead(tx: Tx, a: AuthContext, id: string) {
  requirePermission(a, "crm:lead:read");
  const l = await tx.commercialLead.findFirst({
    where: { AND: [{ id }, leadScope(a)] },
  });
  if (!l) fail("NOT_FOUND", "Prospecto no disponible.", 404);
  return l;
}
async function audit(
  tx: Tx,
  a: AuthContext,
  action: string,
  id: string,
  reason: string,
  before: unknown,
  after: unknown,
  applicationId?: string,
) {
  await tx.accessAuditEvent.create({
    data: {
      userId: a.userId,
      clerkUserId: a.clerkUserId,
      action: `COMMERCIAL_${action}`,
      resourceType: "Commercial",
      resourceId: id,
      applicationId,
      decision: "GRANTED",
      reason,
      metadata: json({ before, after }),
    },
  });
}
function cas(count: number) {
  if (count !== 1)
    fail(
      "STALE_REVISION",
      "El registro cambió. Actualice antes de guardar.",
      409,
    );
}
async function assignment(
  tx: Tx,
  a: AuthContext,
  advisorId: string | null,
  teamId: string | null,
) {
  requirePermission(a, "crm:lead:assign");
  if (teamId && !(await tx.team.findUnique({ where: { id: teamId } })))
    fail("INVALID_INPUT", "Equipo inexistente.");
  if (!globalRole(a.role) && teamId && !a.teamIds.includes(teamId))
    fail("FORBIDDEN", "Equipo fuera de su alcance.", 403);
  if (advisorId) {
    const u = await tx.appUser.findUnique({
      where: { id: advisorId },
      include: { teamMemberships: true },
    });
    if (
      !u?.isActive ||
      ![
        "COMMERCIAL_ADVISOR",
        "COMMERCIAL_DIRECTOR",
        "SUPERVISOR",
        "SUPER_ADMIN",
      ].includes(u.role)
    )
      fail("INVALID_INPUT", "Responsable no habilitado.");
    if (teamId && !u.teamMemberships.some((t) => t.teamId === teamId))
      fail("INVALID_INPUT", "El responsable no pertenece al equipo.");
    if (
      !globalRole(a.role) &&
      !u.teamMemberships.some((t) => a.teamIds.includes(t.teamId))
    )
      fail("FORBIDDEN", "Responsable fuera de sus equipos.", 403);
  }
}
export async function verifiedNotificationContact(
  tx: Tx,
  client: {
    id: string;
    clerkUserId: string | null;
    portalContactRecordedAt: Date | null;
    updatedAt: Date;
    preferredContactMethods: string[];
  },
) {
  if (!client.clerkUserId)
    fail(
      "PRECONDITION_FAILED",
      "Vincule primero la identidad verificada del titular.",
    );
  const provenance =
    client.portalContactRecordedAt ||
    (await tx.accessAuditEvent.findFirst({
      where: {
        resourceId: client.id,
        action: "CUSTOMER_IDENTITY_ASSISTED_LINKED",
        decision: "GRANTED",
        metadata: { path: ["linkedSubject"], equals: client.clerkUserId },
      },
      select: { id: true },
    }));
  if (!provenance)
    fail(
      "PRECONDITION_FAILED",
      "La procedencia del contacto requiere verificación asistida.",
    );
  const consent = await tx.clientConsentRecord.findFirst({
    where: { clientId: client.id, consentType: "COMMERCIAL_CONTACT" },
    orderBy: { grantedAt: "desc" },
  });
  if (
    !consent ||
    !client.preferredContactMethods.some((m) =>
      ["EMAIL", "CORREO", "CORREO_ELECTRONICO"].includes(m.toUpperCase()),
    )
  )
    fail(
      "PRECONDITION_FAILED",
      "Falta consentimiento de contacto por correo registrado.",
    );
  let user;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    user = await Promise.race([
      (async () => (await clerkClient()).users.getUser(client.clerkUserId!))(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("IDENTITY_TIMEOUT")), 3000);
      }),
    ]);
  } catch {
    fail(
      "PRECONDITION_FAILED",
      "No se pudo verificar la identidad del destinatario.",
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
  const primary = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  );
  if (
    user.id !== client.clerkUserId ||
    user.banned ||
    user.locked ||
    primary?.verification?.status !== "verified"
  )
    fail(
      "PRECONDITION_FAILED",
      "El destinatario no tiene un correo principal verificado vigente.",
    );
  return {
    recipient: primary.emailAddress.trim().toLowerCase(),
    consentRecordId: consent.id,
  };
}
export function notificationContentHash(v: {
  applicationId: string;
  applicationRevision: number;
  clientUpdatedAt: Date;
  recipient: string;
  subject: string;
  content: string;
  consentRecordId: string;
}) {
  return digest({
    applicationId: v.applicationId,
    applicationRevision: v.applicationRevision,
    clientUpdatedAt: v.clientUpdatedAt.toISOString(),
    recipient: v.recipient,
    subject: v.subject,
    content: v.content,
    consentRecordId: v.consentRecordId,
  });
}

export async function captureGrowthLead(
  input: GrowthCaptureInput,
  abuseIdentity: string,
): Promise<GrowthReceipt> {
  const secret =
    process.env.CUSTOMER_LINK_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret)
    fail("UNAVAILABLE", "El registro no está disponible temporalmente.", 503);
  const payloadHash = digest(input),
    abuseHash = createHmac("sha256", secret)
      .update("commercial-abuse:" + abuseIdentity)
      .digest("hex");
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(181120260001::bigint)`;
      const prev = await tx.commercialLead.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (prev) {
        if (prev.payloadHash !== payloadHash)
          fail(
            "IDEMPOTENCY_CONFLICT",
            "La clave corresponde a otra solicitud.",
            409,
          );
        return {
          success: true,
          trackingCode: prev.trackingCode,
          status: "RECEIVED",
          message: "Solicitud recibida para revisión humana.",
        };
      }
      const since = new Date(Date.now() - 3600000);
      const [ip, email, total] = await Promise.all([
        tx.commercialLead.count({
          where: { abuseHash, createdAt: { gte: since } },
        }),
        tx.commercialLead.count({
          where: {
            contactEmail: input.contactEmail,
            createdAt: { gte: since },
          },
        }),
        tx.commercialLead.count({ where: { createdAt: { gte: since } } }),
      ]);
      if (ip >= 50 || email >= 5 || total >= 1000)
        fail("RATE_LIMITED", "Espere antes de enviar otra solicitud.", 429);
      const token = randomBytes(32).toString("base64url");
      await tx.commercialLead.create({
        data: {
          trackingCode: token,
          idempotencyKey: input.idempotencyKey,
          payloadHash,
          abuseHash,
          channel: input.channel,
          pillar: input.pillar,
          clientName: input.clientName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          city: input.city,
          productLabel: input.productLabel,
          amountCOP: input.amountCOP
            ? new Prisma.Decimal(input.amountCOP)
            : null,
          partnerName: input.partnerName,
          capture: json({ ...input, attributionTrust: "SELF_REPORTED" }),
          consentVersion: input.consentVersion,
        },
      });
      return {
        success: true,
        trackingCode: token,
        status: "RECEIVED",
        message:
          "Solicitud recibida para revisión humana. No representa aprobación ni radicación bancaria.",
      };
    },
    { isolationLevel: "Serializable", timeout: 15000 },
  );
}
export async function growthReceipt(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    fail("NOT_FOUND", "Comprobante no disponible.", 404);
  if (
    !(await prisma.commercialLead.findUnique({
      where: { trackingCode: token },
      select: { id: true },
    }))
  )
    fail("NOT_FOUND", "Comprobante no disponible.", 404);
  return {
    found: true,
    status: "RECEIVED",
    message: "Solicitud recibida para revisión humana.",
  };
}

export async function mutateCommercial(
  clerkUserId: string,
  input: CommercialMutation,
): Promise<CommercialResult> {
  return prisma.$transaction(
    async (tx) => {
      const a = await freshActor(tx, clerkUserId),
        hash = digest(input);
      const old = await tx.commercialCommand.findUnique({
        where: { id: input.commandId },
      });
      // A replay must still pass authorization for its current target below; never reveals another actor's result.
      if (old && old.actorUserId !== a.userId)
        fail("IDEMPOTENCY_CONFLICT", "Clave de operación ya utilizada.", 409);
      if (old && old.payloadHash !== hash)
        fail(
          "IDEMPOTENCY_CONFLICT",
          "La clave corresponde a otros datos.",
          409,
        );
      if (a.role === "AUDITOR")
        fail("FORBIDDEN", "Auditoría tiene acceso de sólo lectura.", 403);
      const finance = [
        "saveAgreement",
        "createReceivable",
        "recordFinanceEntry",
        "reverseFinanceEntry",
      ].includes(input.action);
      if (finance && !canWriteFinance(a))
        fail(
          "FORBIDDEN",
          "La gestión de ingresos requiere Director o SUPER_ADMIN y su permiso financiero.",
          403,
        );
      let appId = "applicationId" in input ? input.applicationId : undefined;
      const app = appId ? await scopedCase(tx, a, appId) : null;
      const lead =
        "leadId" in input && input.leadId
          ? await scopedLead(tx, a, input.leadId)
          : null;
      if (input.action === "reviewLegacy" && a.role !== "SUPER_ADMIN")
        fail("FORBIDDEN", "Revisión histórica reservada a SUPER_ADMIN.", 403);
      if (input.action === "saveAgreement" && !appId) {
        /* global agreement authority is finance-only */
      }
      if (!finance) {
        const permission: Permission = [
          "recordHandoff",
          "addCondition",
          "updateCondition",
          "recordDisbursement",
        ].includes(input.action)
          ? "crm:bank-case:manage"
          : input.action === "updateLead"
            ? "crm:lead:read"
            : "crm:application:update";
        requirePermission(a, permission);
      }
      if (old)
        return { success: true, resourceId: old.resourceId, replayed: true };
      let resourceId = "";
      let before: unknown = null;
      let after: unknown = null;
      switch (input.action) {
        case "prepareNotification": {
          requirePermission(a, "crm:application:update");
          if (!app) fail("NOT_FOUND", "Expediente no disponible.", 404);
          const contact = await verifiedNotificationContact(tx, app.client);
          const payload = {
            applicationId: app.id,
            applicationRevision: app.commercialRevision,
            clientUpdatedAt: app.client.updatedAt,
            ...contact,
            subject: input.subject,
            content: input.content,
          };
          const row = await tx.commercialNotification.create({
            data: {
              ...payload,
              contentHash: notificationContentHash(payload),
              providerKey: randomUUID(),
            },
          });
          resourceId = row.id;
          after = row;
          break;
        }
        case "approveNotification": {
          if (!["SUPER_ADMIN", "COMMERCIAL_DIRECTOR"].includes(a.role))
            fail("FORBIDDEN", "Aprobación reservada a Dirección.", 403);
          requirePermission(a, "crm:application:update");
          const row = await tx.commercialNotification.findFirst({
            where: {
              id: input.notificationId,
              applicationId: input.applicationId,
            },
          });
          if (
            !row ||
            !app ||
            row.contentHash !== input.contentHash ||
            notificationContentHash(row) !== row.contentHash
          )
            fail("PRECONDITION_FAILED", "La vista previa no coincide.");
          const contact = await verifiedNotificationContact(tx, app.client);
          if (
            row.applicationRevision !== app.commercialRevision ||
            row.clientUpdatedAt.getTime() !== app.client.updatedAt.getTime() ||
            row.recipient !== contact.recipient ||
            row.consentRecordId !== contact.consentRecordId
          )
            fail(
              "PRECONDITION_FAILED",
              "El expediente, contacto o consentimiento cambió; prepare otra comunicación.",
            );
          cas(
            (
              await tx.commercialNotification.updateMany({
                where: {
                  id: row.id,
                  revision: input.expectedRevision,
                  status: "AWAITING_APPROVAL",
                },
                data: {
                  status: "QUEUED",
                  approvedBy: a.userId,
                  approvedAt: new Date(),
                  revision: { increment: 1 },
                },
              })
            ).count,
          );
          resourceId = row.id;
          before = { status: row.status };
          after = {
            status: "QUEUED",
            runtimeDeliveryEnabled:
              process.env.COMMERCIAL_DELIVERY_ENABLED === "true",
          };
          break;
        }
        case "updateLead": {
          if (!lead) fail("NOT_FOUND", "Prospecto no disponible.", 404);
          const changing =
            lead.assignedAdvisorId !== input.assignedAdvisorId ||
            lead.teamId !== input.teamId;
          if (changing)
            await assignment(tx, a, input.assignedAdvisorId, input.teamId);
          else requirePermission(a, "crm:application:update");
          before = lead;
          const update = {
            assignedAdvisorId: input.assignedAdvisorId,
            teamId: input.teamId,
            nextActionAt: input.nextActionAt
              ? new Date(input.nextActionAt)
              : null,
            status: input.status,
            revision: { increment: 1 },
          };
          cas(
            (
              await tx.commercialLead.updateMany({
                where: {
                  id: lead.id,
                  revision: input.expectedRevision,
                  applicationId: null,
                },
                data: update,
              })
            ).count,
          );
          resourceId = lead.id;
          after = update;
          break;
        }
        case "linkLead": {
          requirePermission(a, "crm:application:update");
          if (!lead || !app) fail("NOT_FOUND", "Destino no disponible.", 404);
          // A public referrer/UTM is not authenticated ownership or an economic agreement.
          if (
            app.client.email.toLowerCase() !==
              lead.contactEmail.toLowerCase() ||
            app.client.phone.replace(/\D/g, "") !==
              lead.contactPhone.replace(/\D/g, "")
          )
            fail(
              "PRECONDITION_FAILED",
              "Verifique contacto canónico; el prospecto no coincide con el titular.",
            );
          cas(
            (
              await tx.commercialLead.updateMany({
                where: {
                  id: lead.id,
                  revision: input.expectedRevision,
                  applicationId: null,
                },
                data: {
                  applicationId: app.id,
                  status: "CONVERTED",
                  revision: { increment: 1 },
                },
              })
            ).count,
          );
          resourceId = lead.id;
          before = { applicationId: null };
          after = {
            applicationId: app.id,
            attributionTrust: "STAFF_REVIEWED_CONTACT_MATCH",
            channel: lead.channel,
          };
          break;
        }
        case "reviewLegacy": {
          const legacy = await tx.creditRequest.findUnique({
            where: { id: input.legacyId },
          });
          if (!legacy)
            fail("NOT_FOUND", "Registro histórico no disponible.", 404);
          const prev = await tx.commercialLegacyDisposition.findUnique({
            where: { legacyId: input.legacyId },
          });
          if ((prev?.revision ?? 0) !== input.expectedRevision) cas(0);
          if (
            (input.disposition === "LINKED") !== !!input.applicationId ||
            (input.disposition === "LINKED" && !input.verifiedContact)
          )
            fail(
              "INVALID_INPUT",
              "La vinculación exige expediente y verificación explícita.",
            );
          if (
            app &&
            (legacy.documentNumber !== app.client.documentNumber ||
              legacy.email.toLowerCase() !== app.client.email.toLowerCase())
          )
            fail(
              "PRECONDITION_FAILED",
              "Los datos históricos no coinciden con el titular canónico.",
            );
          before = prev;
          after = await tx.commercialLegacyDisposition.upsert({
            where: { legacyId: input.legacyId },
            create: {
              legacyId: input.legacyId,
              disposition: input.disposition,
              applicationId: input.applicationId,
              reason: input.reason,
              actorUserId: a.userId,
              revision: 1,
            },
            update: {
              disposition: input.disposition,
              applicationId: input.applicationId,
              reason: input.reason,
              actorUserId: a.userId,
              revision: { increment: 1 },
            },
          });
          resourceId = input.legacyId;
          break;
        }
        case "updateCase": {
          if (!app) fail("NOT_FOUND", "Expediente no disponible.", 404);
          requirePermission(a, "crm:application:update");
          if (
            app.assignedAdvisorId !== input.assignedAdvisorId ||
            app.teamId !== input.teamId
          )
            await assignment(tx, a, input.assignedAdvisorId, input.teamId);
          before = {
            assignedAdvisorId: app.assignedAdvisorId,
            teamId: app.teamId,
            nextActionDate: app.nextActionDate,
          };
          after = {
            assignedAdvisorId: input.assignedAdvisorId,
            teamId: input.teamId,
            nextActionDate: input.nextActionAt
              ? new Date(input.nextActionAt)
              : null,
            nextActionNote: input.nextActionNote,
            commercialRevision: { increment: 1 },
          };
          cas(
            (
              await tx.crmCreditApplication.updateMany({
                where: {
                  id: app.id,
                  commercialRevision: input.expectedRevision,
                },
                data: after as Prisma.CrmCreditApplicationUpdateManyMutationInput,
              })
            ).count,
          );
          resourceId = app.id;
          break;
        }
        case "recordContact": {
          if (!!input.applicationId === !!input.leadId)
            fail("INVALID_INPUT", "Seleccione un expediente o un prospecto.");
          requirePermission(a, "crm:application:update");
          noFuture(input.occurredAt);
          if (app)
            cas(
              (
                await tx.crmCreditApplication.updateMany({
                  where: {
                    id: app.id,
                    commercialRevision: input.expectedRevision,
                  },
                  data: {
                    commercialRevision: { increment: 1 },
                    nextActionDate: input.nextActionAt
                      ? new Date(input.nextActionAt)
                      : null,
                    nextActionNote: input.note,
                  },
                })
              ).count,
            );
          else if (lead)
            cas(
              (
                await tx.commercialLead.updateMany({
                  where: { id: lead.id, revision: input.expectedRevision },
                  data: {
                    revision: { increment: 1 },
                    nextActionAt: input.nextActionAt
                      ? new Date(input.nextActionAt)
                      : null,
                  },
                })
              ).count,
            );
          else fail("NOT_FOUND", "Destino no disponible.", 404);
          const row = await tx.commercialContact.create({
            data: {
              applicationId: app?.id,
              leadId: lead?.id,
              actorUserId: a.userId,
              outcome: input.outcome,
              note: input.note,
              occurredAt: new Date(input.occurredAt),
              nextActionAt: input.nextActionAt
                ? new Date(input.nextActionAt)
                : null,
            },
          });
          resourceId = row.id;
          after = row;
          break;
        }
        case "recordHandoff": {
          requirePermission(a, "crm:bank-case:manage");
          noFuture(input.deliveredAt);
          const bank = await tx.bankApplication.findFirst({
            where: {
              id: input.bankApplicationId,
              applicationId: input.applicationId,
            },
          });
          if (!bank) fail("NOT_FOUND", "Subexpediente no disponible.", 404);
          if (
            ![
              "STAGE_03_READY_FOR_BANK",
              "STAGE_04_BANK_SUBMITTED",
              "STAGE_05_RISK_EVALUATION",
              "STAGE_06_CONDITIONAL_APPROVAL",
              "STAGE_07_DEFINITIVE_APPROVAL",
              "STAGE_08_APPRAISAL_LEGAL",
              "STAGE_09_DISBURSED",
            ].includes(bank.stage)
          )
            fail(
              "PRECONDITION_FAILED",
              "Complete la preparación bancaria antes de registrar entrega.",
            );
          // Uses the same N:M approved-version readiness as the canonical workflow; no synthetic provider ACK.
          if (
            !(
              await DocumentRequirementService.evaluateBankReadiness(
                bank.id,
                tx,
              )
            ).isReady
          )
            fail(
              "PRECONDITION_FAILED",
              "Los documentos bancarios actuales no están conformes.",
            );
          const row = await tx.commercialHandoff.create({
            data: {
              applicationId: input.applicationId,
              bankApplicationId: bank.id,
              reference: input.reference,
              deliveredAt: new Date(input.deliveredAt),
              evidenceReference: input.evidenceReference,
              actorUserId: a.userId,
            },
          });
          resourceId = row.id;
          after = row;
          break;
        }
        case "addCondition": {
          requirePermission(a, "crm:bank-case:manage");
          if (
            !(await tx.bankApplication.findFirst({
              where: {
                id: input.bankApplicationId,
                applicationId: input.applicationId,
              },
            }))
          )
            fail("NOT_FOUND", "Subexpediente no disponible.", 404);
          const row = await tx.commercialCondition.create({
            data: {
              applicationId: input.applicationId,
              bankApplicationId: input.bankApplicationId,
              title: input.title,
              dueAt: input.dueAt ? new Date(input.dueAt) : null,
            },
          });
          resourceId = row.id;
          after = row;
          break;
        }
        case "updateCondition": {
          requirePermission(a, "crm:bank-case:manage");
          const row = await tx.commercialCondition.findFirst({
            where: {
              id: input.conditionId,
              applicationId: input.applicationId,
            },
          });
          if (!row) fail("NOT_FOUND", "Condición no disponible.", 404);
          before = row;
          cas(
            (
              await tx.commercialCondition.updateMany({
                where: {
                  id: row.id,
                  revision: input.expectedRevision,
                  status: "OPEN",
                },
                data: {
                  status: input.status,
                  evidenceReference: input.evidenceReference,
                  revision: { increment: 1 },
                },
              })
            ).count,
          );
          resourceId = row.id;
          after = {
            status: input.status,
            evidenceReference: input.evidenceReference,
          };
          break;
        }
        case "recordDisbursement": {
          requirePermission(a, "crm:bank-case:manage");
          if (
            ![
              "SUPER_ADMIN",
              "COMMERCIAL_DIRECTOR",
              "OPERATIONS_OFFICER",
            ].includes(a.role)
          )
            fail("FORBIDDEN", "Rol no habilitado para cierre.", 403);
          noFuture(input.occurredAt);
          const bank = await tx.bankApplication.findFirst({
            where: {
              id: input.bankApplicationId,
              applicationId: input.applicationId,
            },
          });
          if (!bank || bank.stage !== "STAGE_09_DISBURSED")
            fail(
              "PRECONDITION_FAILED",
              "Registre primero el desembolso en el workflow canónico con su evidencia.",
            );
          if (
            await tx.commercialCondition.count({
              where: { bankApplicationId: bank.id, status: "OPEN" },
            })
          )
            fail(
              "PRECONDITION_FAILED",
              "Hay condiciones de cierre pendientes.",
            );
          const records = await tx.commercialDisbursement.findMany({
            where: { bankApplicationId: bank.id },
          });
          const superseded = new Set(records.map((r) => r.supersedesId));
          const current = records.find((r) => !superseded.has(r.id));
          if ((current?.id ?? null) !== input.supersedesId)
            fail("STALE_REVISION", "El desembolso actual cambió.", 409);
          const row = await tx.commercialDisbursement.create({
            data: {
              applicationId: input.applicationId,
              bankApplicationId: bank.id,
              amountCOP: new Prisma.Decimal(input.amountCOP),
              occurredAt: new Date(input.occurredAt),
              reference: input.reference,
              evidenceReference: input.evidenceReference,
              supersedesId: input.supersedesId,
              actorUserId: a.userId,
            },
          });
          resourceId = row.id;
          before = current;
          after = row;
          break;
        }
        case "saveAgreement": {
          if (input.kind === "RATE" && input.trigger === "BANK_FILING")
            fail(
              "INVALID_INPUT",
              "El porcentaje requiere desembolso acreditado como base.",
            );
          if (
            input.kind === "RATE"
              ? !input.ratePercent ||
                Number(input.ratePercent) <= 0 ||
                input.fixedAmountCOP !== null
              : !input.fixedAmountCOP || input.ratePercent !== null
          )
            fail(
              "INVALID_INPUT",
              "Indique una tarifa positiva o un importe fijo, de forma exclusiva.",
            );
          if (
            input.counterpartyType === "BANK"
              ? !input.bankId ||
                !Object.prototype.hasOwnProperty.call(
                  ALLIED_BANKS,
                  input.bankId,
                ) ||
                input.partnerEmail !== null
              : !input.partnerEmail || input.bankId !== null
          )
            fail(
              "INVALID_INPUT",
              "Identifique el banco o correo del aliado pagador.",
            );
          if (
            input.validUntil &&
            new Date(input.validUntil) <= new Date(input.validFrom)
          )
            fail("INVALID_INPUT", "Vigencia inválida.");
          const key = input.agreementKey ?? randomUUID();
          const latest = await tx.commercialAgreement.findFirst({
            where: { agreementKey: key },
            orderBy: { version: "desc" },
          });
          if ((latest?.version ?? 0) !== input.expectedVersion) cas(0);
          const row = await tx.commercialAgreement.create({
            data: {
              agreementKey: key,
              version: input.expectedVersion + 1,
              counterpartyType: input.counterpartyType,
              counterpartyName: input.counterpartyName,
              bankId: input.bankId,
              partnerEmail: input.partnerEmail?.toLowerCase(),
              kind: input.kind,
              ratePercent: input.ratePercent
                ? new Prisma.Decimal(input.ratePercent)
                : null,
              fixedAmountCOP: input.fixedAmountCOP
                ? new Prisma.Decimal(input.fixedAmountCOP)
                : null,
              trigger: input.trigger,
              validFrom: new Date(input.validFrom),
              validUntil: input.validUntil ? new Date(input.validUntil) : null,
              evidenceReference: input.evidenceReference,
              actorUserId: a.userId,
            },
          });
          resourceId = row.id;
          before = latest;
          after = row;
          break;
        }
        case "createReceivable": {
          const bank = await tx.bankApplication.findFirst({
            where: {
              id: input.bankApplicationId,
              applicationId: input.applicationId,
            },
          });
          const agreement = await tx.commercialAgreement.findUnique({
            where: { id: input.agreementId },
          });
          if (!bank || !agreement)
            fail("NOT_FOUND", "Banco o acuerdo no disponible.", 404);
          if (
            agreement.counterpartyType === "BANK" &&
            agreement.bankId !== bank.bankId
          )
            fail(
              "PRECONDITION_FAILED",
              "El acuerdo no corresponde a este banco.",
            );
          // Agreement family uniqueness prevents a version change from billing the same economic event twice.
          if (
            await tx.commercialReceivable.count({
              where: {
                bankApplicationId: bank.id,
                agreement: { agreementKey: agreement.agreementKey },
              },
            })
          )
            fail(
              "PRECONDITION_FAILED",
              "Este acuerdo ya tiene un ingreso reconocido en este subexpediente.",
            );
          let triggerReference: string;
          let triggerDate: Date;
          let basis: Prisma.Decimal;
          if (agreement.trigger === "DISBURSEMENT") {
            const all = await tx.commercialDisbursement.findMany({
                where: { bankApplicationId: bank.id },
              }),
              replaced = new Set(all.map((r) => r.supersedesId));
            const d = all.find((r) => !replaced.has(r.id));
            if (!d)
              fail(
                "PRECONDITION_FAILED",
                "Falta el desembolso real acreditado.",
              );
            triggerReference = d.id;
            triggerDate = d.occurredAt;
            basis = d.amountCOP;
          } else {
            const h = await tx.commercialHandoff.findFirst({
              where: { bankApplicationId: bank.id },
              orderBy: { deliveredAt: "asc" },
            });
            if (!h)
              fail(
                "PRECONDITION_FAILED",
                "Falta la constancia de entrega bancaria.",
              );
            triggerReference = h.id;
            triggerDate = h.deliveredAt;
            if (agreement.kind === "RATE")
              fail(
                "PRECONDITION_FAILED",
                "Un acuerdo porcentual requiere base real de desembolso; no se usa el monto aprobado o solicitado.",
              );
            basis = new Prisma.Decimal(0);
          }
          if (
            triggerDate < agreement.validFrom ||
            (agreement.validUntil && triggerDate > agreement.validUntil)
          )
            fail(
              "PRECONDITION_FAILED",
              "El acuerdo no estaba vigente en la fecha del hecho.",
            );
          const amount =
            agreement.kind === "FIXED"
              ? agreement.fixedAmountCOP!
              : basis
                  .mul(agreement.ratePercent!)
                  .div(100)
                  .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          if (amount.lte(0))
            fail("PRECONDITION_FAILED", "Importe reconocido inválido.");
          const row = await tx.commercialReceivable.create({
            data: {
              applicationId: input.applicationId,
              bankApplicationId: bank.id,
              agreementId: agreement.id,
              agreementKey: agreement.agreementKey,
              triggerReference,
              amountCOP: amount,
              dueAt: input.dueAt ? new Date(input.dueAt) : null,
              evidenceReference: input.evidenceReference,
              actorUserId: a.userId,
            },
          });
          resourceId = row.id;
          after = { ...row, basisCOP: basis.toFixed(2) };
          break;
        }
        case "reverseFinanceEntry": {
          noFuture(input.occurredAt);
          const r = await tx.commercialReceivable.findFirst({
            where: {
              id: input.receivableId,
              applicationId: input.applicationId,
            },
            include: { entries: true },
          });
          if (!r) fail("NOT_FOUND", "Ingreso no disponible.", 404);
          const original = r.entries.find(
            (e) => e.id === input.originalEntryId,
          );
          if (!original || !["COLLECTION", "COST"].includes(original.kind))
            fail(
              "PRECONDITION_FAILED",
              "Sólo se puede reversar un cobro o costo original de este ingreso.",
            );
          const amount = new Prisma.Decimal(input.amountCOP),
            already = r.entries
              .filter((e) => e.reversesId === original.id)
              .reduce((s, e) => s.add(e.amountCOP), new Prisma.Decimal(0));
          if (amount.lte(0) || amount.add(already).gt(original.amountCOP))
            fail(
              "PRECONDITION_FAILED",
              "La reversión supera el remanente del registro original.",
            );
          if (new Date(input.occurredAt) < original.occurredAt)
            fail(
              "INVALID_INPUT",
              "La reversión no puede preceder al registro original.",
            );
          cas(
            (
              await tx.commercialReceivable.updateMany({
                where: { id: r.id, revision: input.expectedRevision },
                data: { revision: { increment: 1 } },
              })
            ).count,
          );
          const row = await tx.commercialFinanceEntry.create({
            data: {
              receivableId: r.id,
              kind: original.kind + "_REVERSAL",
              reversesId: original.id,
              amountCOP: amount,
              occurredAt: new Date(input.occurredAt),
              reference: input.reference,
              evidenceReference: input.evidenceReference,
              reason: input.reason,
              actorUserId: a.userId,
            },
          });
          resourceId = row.id;
          after = row;
          break;
        }
        case "recordFinanceEntry": {
          noFuture(input.occurredAt);
          const r = await tx.commercialReceivable.findFirst({
            where: {
              id: input.receivableId,
              applicationId: input.applicationId,
            },
            include: { entries: true },
          });
          if (!r) fail("NOT_FOUND", "Ingreso no disponible.", 404);
          const amount = new Prisma.Decimal(input.amountCOP);
          if (
            input.kind === "ADJUSTMENT"
              ? amount.eq(0)
              : input.kind === "COST"
                ? amount.lt(0)
                : amount.lte(0)
          )
            fail(
              "INVALID_INPUT",
              "Cobros positivos, costos no negativos; los ajustes no pueden ser cero.",
            );
          const sum = (kind: string) =>
            r.entries
              .filter((e) => e.kind === kind || e.kind === kind + "_REVERSAL")
              .reduce(
                (s, e) =>
                  e.kind.endsWith("_REVERSAL")
                    ? s.sub(e.amountCOP)
                    : s.add(e.amountCOP),
                new Prisma.Decimal(0),
              );
          const collection = sum("COLLECTION"),
            adjusted = r.amountCOP.add(sum("ADJUSTMENT"));
          if (
            input.kind === "COLLECTION" &&
            collection.add(amount).gt(adjusted)
          )
            fail("PRECONDITION_FAILED", "El cobro supera el saldo exigible.");
          if (
            input.kind === "ADJUSTMENT" &&
            adjusted.add(amount).lt(collection)
          )
            fail(
              "PRECONDITION_FAILED",
              "El ajuste no puede dejar exigible menor que lo ya cobrado.",
            );
          cas(
            (
              await tx.commercialReceivable.updateMany({
                where: { id: r.id, revision: input.expectedRevision },
                data: { revision: { increment: 1 } },
              })
            ).count,
          );
          const row = await tx.commercialFinanceEntry.create({
            data: {
              receivableId: r.id,
              kind: input.kind,
              amountCOP: amount,
              occurredAt: new Date(input.occurredAt),
              reference: input.reference,
              evidenceReference: input.evidenceReference,
              reason: input.reason,
              actorUserId: a.userId,
            },
          });
          resourceId = row.id;
          after = row;
          break;
        }
      }
      await audit(
        tx,
        a,
        input.action,
        resourceId,
        input.reason,
        before,
        after,
        appId ?? undefined,
      );
      await tx.commercialCommand.create({
        data: {
          id: input.commandId,
          actorUserId: a.userId,
          payloadHash: hash,
          resourceId,
        },
      });
      return { success: true, resourceId };
    },
    { isolationLevel: "Serializable", maxWait: 5000, timeout: 20000 },
  );
}

export async function getCommercialState(
  a: AuthContext,
  query: { page: number; search: string; applicationId?: string },
): Promise<CommercialState> {
  const readLeads = a.permissions.includes("crm:lead:read"),
    readApps = a.permissions.includes("crm:application:read"),
    finance = canReadFinance(a);
  if (!readLeads && !readApps && !finance)
    fail("FORBIDDEN", "No tiene acceso comercial.", 403);
  const appWhere: Prisma.CrmCreditApplicationWhereInput = {
    AND: [
      caseScope(a),
      ...(query.applicationId ? [{ id: query.applicationId }] : []),
    ],
  };
  if (
    query.applicationId &&
    (!readApps ||
      !(await prisma.crmCreditApplication.count({ where: appWhere })))
  )
    fail("NOT_FOUND", "Expediente no disponible.", 404);
  const leadWhere: Prisma.CommercialLeadWhereInput = {
    AND: [
      leadScope(a),
      ...(query.applicationId ? [{ applicationId: query.applicationId }] : []),
      ...(query.search
        ? [
            {
              OR: [
                {
                  clientName: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  contactEmail: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };
  const visibleCase = { application: appWhere };
  const [
    leads,
    totalLeads,
    apps,
    advisors,
    teams,
    contacts,
    handoffs,
    conditions,
    disbursements,
    agreements,
    receivables,
    worker,
    legacy,
    dispositions,
    allDisbursements,
    caseCount,
    bankCount,
    lightCount,
  ] = await Promise.all([
    readLeads
      ? prisma.commercialLead.findMany({
          where: leadWhere,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          skip: (query.page - 1) * 25,
          take: 25,
        })
      : [],
    readLeads ? prisma.commercialLead.count({ where: leadWhere }) : 0,
    readApps
      ? prisma.crmCreditApplication.findMany({
          where: appWhere,
          orderBy: { updatedAt: "desc" },
          take: 200,
          include: { bankApplications: true },
        })
      : [],
    prisma.appUser.findMany({
      where: {
        isActive: true,
        role: {
          in: [
            "SUPER_ADMIN",
            "COMMERCIAL_DIRECTOR",
            "SUPERVISOR",
            "COMMERCIAL_ADVISOR",
          ],
        },
        ...(!globalRole(a.role)
          ? { teamMemberships: { some: { teamId: { in: a.teamIds } } } }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teamMemberships: { select: { teamId: true } },
      },
    }),
    prisma.team.findMany({
      where: globalRole(a.role) ? {} : { id: { in: a.teamIds } },
      select: { id: true, name: true },
    }),
    prisma.commercialContact.findMany({
      where: {
        OR: [
          ...(readApps ? [visibleCase] : []),
          ...(readLeads
            ? [
                {
                  leadId: {
                    in: (
                      await prisma.commercialLead.findMany({
                        where: leadWhere,
                        select: { id: true },
                      })
                    ).map((l) => l.id),
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { occurredAt: "desc" },
      take: 100,
    }),
    readApps
      ? prisma.commercialHandoff.findMany({
          where: visibleCase,
          orderBy: { deliveredAt: "desc" },
          take: 200,
        })
      : [],
    readApps
      ? prisma.commercialCondition.findMany({ where: visibleCase, take: 500 })
      : [],
    readApps
      ? prisma.commercialDisbursement.findMany({
          where: visibleCase,
          take: 500,
        })
      : [],
    finance
      ? prisma.commercialAgreement.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : [],
    finance
      ? prisma.commercialReceivable.findMany({
          where: visibleCase,
          include: {
            entries: true,
            agreement: true,
            application: { select: { fileNumber: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : [],
    prisma.commercialWorkerHeartbeat.findFirst({
      orderBy: { lastHeartbeatAt: "desc" },
    }),
    a.role === "SUPER_ADMIN" && !query.applicationId
      ? prisma.creditRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            requestedAmount: true,
            createdAt: true,
            firstName: true,
            firstLastName: true,
            email: true,
            mobileNumber: true,
            documentNumber: true,
          },
        })
      : [],
    a.role === "SUPER_ADMIN"
      ? prisma.commercialLegacyDisposition.findMany()
      : [],
    readApps
      ? prisma.commercialDisbursement.findMany({
          where: visibleCase,
          select: {
            id: true,
            applicationId: true,
            supersedesId: true,
            amountCOP: true,
            occurredAt: true,
            application: { select: { createdAt: true } },
          },
        })
      : [],
    readApps ? prisma.crmCreditApplication.count({ where: appWhere }) : 0,
    readApps
      ? prisma.bankApplication.count({ where: { application: appWhere } })
      : 0,
    readLeads ? prisma.commercialLead.count({ where: leadScope(a) }) : 0,
  ]);
  const superseded = new Set(allDisbursements.map((r) => r.supersedesId));
  const current = allDisbursements.filter((r) => !superseded.has(r.id));
  const supersededVisible = new Set(disbursements.map((r) => r.supersedesId));
  const sumEntries = (
    entries: { kind: string; amountCOP: Prisma.Decimal }[],
    kind: string,
  ) =>
    entries
      .filter((e) => e.kind === kind || e.kind === kind + "_REVERSAL")
      .reduce(
        (s, e) =>
          e.kind.endsWith("_REVERSAL")
            ? s.sub(e.amountCOP)
            : s.add(e.amountCOP),
        new Prisma.Decimal(0),
      );
  // Whole authorized scope totals, independent from paginated lists.
  const financialTotals = finance
    ? await prisma.commercialReceivable.findMany({
        where: visibleCase,
        select: {
          applicationId: true,
          agreement: {
            select: { counterpartyType: true, counterpartyName: true },
          },
          amountCOP: true,
          entries: { select: { kind: true, amountCOP: true } },
        },
      })
    : [];
  const sourceLeads = readLeads
    ? await prisma.commercialLead.findMany({
        where: leadScope(a),
        select: { channel: true, applicationId: true },
      })
    : [];
  const bySource = Array.from(new Set(sourceLeads.map((l) => l.channel))).map(
    (source) => {
      const group = sourceLeads.filter((l) => l.channel === source),
        ids = new Set(
          group.map((l) => l.applicationId).filter((x): x is string => !!x),
        );
      return {
        source,
        attributionTrust: "SELF_REPORTED_STAFF_LINKED" as const,
        lightLeads: group.length,
        linkedCases: ids.size,
        fundedCases: new Set(
          current
            .filter((d) => ids.has(d.applicationId))
            .map((d) => d.applicationId),
        ).size,
        collectedIncomeCOP: finance
          ? financialTotals
              .filter((r) => ids.has(r.applicationId))
              .reduce(
                (s, r) => s.add(sumEntries(r.entries, "COLLECTION")),
                new Prisma.Decimal(0),
              )
              .toFixed(2)
          : null,
      };
    },
  );
  const byPayer = finance
    ? Array.from(
        new Set(financialTotals.map((r) => r.agreement.counterpartyType)),
      ).map((type) => ({
        counterpartyType: type,
        recognizedIncomeCOP: financialTotals
          .filter((r) => r.agreement.counterpartyType === type)
          .reduce(
            (s, r) =>
              s.add(r.amountCOP).add(sumEntries(r.entries, "ADJUSTMENT")),
            new Prisma.Decimal(0),
          )
          .toFixed(2),
        collectedIncomeCOP: financialTotals
          .filter((r) => r.agreement.counterpartyType === type)
          .reduce(
            (s, r) => s.add(sumEntries(r.entries, "COLLECTION")),
            new Prisma.Decimal(0),
          )
          .toFixed(2),
      }))
    : [];
  const slaRows = readApps
    ? await prisma.bankStageTransitionEvent.findMany({
        where: {
          bankApplication: { application: appWhere },
          resolvedSlaDeadline: { not: null },
          resolvedWithinSla: { not: null },
        },
        select: { resolvedWithinSla: true },
      })
    : [];
  return {
    actorUserId: a.userId,
    permissions: {
      canOperate:
        a.permissions.includes("crm:application:update") &&
        a.role !== "AUDITOR",
      canAssign:
        a.permissions.includes("crm:lead:assign") && a.role !== "AUDITOR",
      canManageBanks:
        a.permissions.includes("crm:bank-case:manage") && a.role !== "AUDITOR",
      canRecordDisbursement:
        a.permissions.includes("crm:bank-case:manage") &&
        ["SUPER_ADMIN", "COMMERCIAL_DIRECTOR", "OPERATIONS_OFFICER"].includes(
          a.role,
        ),
      canReadFinance: finance,
      canWriteFinance: canWriteFinance(a),
      canReviewLegacy: a.role === "SUPER_ADMIN",
      canApproveNotifications:
        ["SUPER_ADMIN", "COMMERCIAL_DIRECTOR"].includes(a.role) &&
        a.permissions.includes("crm:application:update"),
    },
    leads: leads.map((l) => {
      const capture = l.capture as Record<string, string>;
      return {
        id: l.id,
        revision: l.revision,
        trackingCode: l.trackingCode,
        clientName: l.clientName,
        contactEmail: l.contactEmail,
        contactPhone: l.contactPhone,
        city: l.city,
        channel: l.channel,
        productLabel: l.productLabel,
        amountCOP: l.amountCOP?.toFixed(2) ?? null,
        partnerName: l.partnerName,
        attribution: {
          source: capture.utmSource ?? null,
          medium: capture.utmMedium ?? null,
          campaign: capture.utmCampaign ?? null,
          trust: "SELF_REPORTED",
        },
        status: l.status,
        assignedAdvisorId: l.assignedAdvisorId,
        teamId: l.teamId,
        nextActionAt: iso(l.nextActionAt),
        applicationId: l.applicationId,
        createdAt: l.createdAt.toISOString(),
      };
    }),
    totalLeads,
    page: query.page,
    advisors: advisors.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      teamIds: u.teamMemberships.map((t) => t.teamId),
    })),
    teams,
    applications: apps.map((c) => ({
      id: c.id,
      fileNumber: c.fileNumber,
      revision: c.commercialRevision,
      assignedAdvisorId: c.assignedAdvisorId,
      teamId: c.teamId,
      nextActionDate: iso(c.nextActionDate),
      nextActionNote: c.nextActionNote,
      status: c.status,
      leadSource: c.leadSource,
    })),
    bankCatalog: Object.values(ALLIED_BANKS).map((b) => ({
      id: b.id,
      name: b.name,
    })),
    optionsTruncated: caseCount > apps.length,
    bankApplications: apps.flatMap((c) =>
      c.bankApplications.map((b) => ({
        id: b.id,
        applicationId: c.id,
        bankId: b.bankId,
        stage: b.stage,
      })),
    ),
    legacy: legacy.map((l) => {
      const d = dispositions.find((d) => d.legacyId === l.id);
      return {
        id: l.id,
        clientName: `${l.firstName ?? ""} ${l.firstLastName ?? ""}`,
        contactEmail: l.email,
        contactPhone: l.mobileNumber ?? "",
        documentLast4: l.documentNumber.slice(-4),
        requestedAmountCOP:
          l.requestedAmount === null
            ? null
            : new Prisma.Decimal(l.requestedAmount).toFixed(2),
        createdAt: l.createdAt.toISOString(),
        disposition: d?.disposition ?? null,
        applicationId: d?.applicationId ?? null,
        revision: d?.revision ?? 0,
      };
    }),
    closingConditions: conditions.map((c) => ({
      ...c,
      status: c.status as "OPEN" | "SATISFIED" | "WAIVED",
      dueAt: iso(c.dueAt),
    })),
    contacts: contacts.map((c) => ({
      ...c,
      occurredAt: c.occurredAt.toISOString(),
      nextActionAt: iso(c.nextActionAt),
    })),
    handoffs: handoffs.map((h) => ({
      ...h,
      bankId:
        apps
          .flatMap((a) => a.bankApplications)
          .find((b) => b.id === h.bankApplicationId)?.bankId ?? "",
      deliveredAt: h.deliveredAt.toISOString(),
      closingConditions: conditions
        .filter((c) => c.bankApplicationId === h.bankApplicationId)
        .map((c) => ({
          ...c,
          status: c.status as "OPEN" | "SATISFIED" | "WAIVED",
          dueAt: iso(c.dueAt),
        })),
    })),
    disbursements: disbursements.map((d) => ({
      ...d,
      amountCOP: d.amountCOP.toFixed(2),
      occurredAt: d.occurredAt.toISOString(),
      isCurrent: !supersededVisible.has(d.id),
    })),
    agreements: agreements.map((g) => ({
      ...g,
      counterpartyType: g.counterpartyType as "BANK" | "ALLY",
      kind: g.kind as "RATE" | "FIXED",
      trigger: g.trigger as "BANK_FILING" | "DISBURSEMENT",
      ratePercent: g.ratePercent?.toString() ?? null,
      fixedAmountCOP: g.fixedAmountCOP?.toFixed(2) ?? null,
      validFrom: g.validFrom.toISOString(),
      validUntil: iso(g.validUntil),
      createdAt: g.createdAt.toISOString(),
    })),
    receivables: receivables.map((r) => {
      const collected = sumEntries(r.entries, "COLLECTION"),
        adjustment = sumEntries(r.entries, "ADJUSTMENT"),
        cost = r.entries.some((e) => e.kind === "COST")
          ? sumEntries(r.entries, "COST")
          : null;
      return {
        id: r.id,
        revision: r.revision,
        applicationId: r.applicationId,
        fileNumber: r.application.fileNumber,
        agreementId: r.agreementId,
        counterpartyName: r.agreement.counterpartyName,
        amountCOP: r.amountCOP.toFixed(2),
        collectedCOP: collected.toFixed(2),
        adjustmentCOP: adjustment.toFixed(2),
        costCOP: cost?.toFixed(2) ?? null,
        outstandingCOP: r.amountCOP.add(adjustment).sub(collected).toFixed(2),
        contributionCOP: cost ? collected.sub(cost).toFixed(2) : null,
        dueAt: iso(r.dueAt),
        entries: r.entries.map((e) => ({
          ...e,
          remainingReversibleCOP: ["COLLECTION", "COST"].includes(e.kind)
            ? e.amountCOP
                .sub(
                  r.entries
                    .filter((x) => x.reversesId === e.id)
                    .reduce(
                      (s, x) => s.add(x.amountCOP),
                      new Prisma.Decimal(0),
                    ),
                )
                .toFixed(2)
            : "0.00",
          kind: e.kind as
            | "COLLECTION"
            | "ADJUSTMENT"
            | "COST"
            | "COLLECTION_REVERSAL"
            | "COST_REVERSAL",
          amountCOP: e.amountCOP.toFixed(2),
          occurredAt: e.occurredAt.toISOString(),
        })),
      };
    }),
    metrics: {
      lightLeads: lightCount,
      canonicalCases: caseCount,
      bankCases: bankCount,
      recordedDisbursements: current.length,
      actualDisbursedCOP: current
        .reduce((s, d) => s.add(d.amountCOP), new Prisma.Decimal(0))
        .toFixed(2),
      recognizedIncomeCOP: finance
        ? financialTotals
            .reduce(
              (s, r) =>
                s.add(r.amountCOP).add(sumEntries(r.entries, "ADJUSTMENT")),
              new Prisma.Decimal(0),
            )
            .toFixed(2)
        : null,
      collectedIncomeCOP: finance
        ? financialTotals
            .reduce(
              (s, r) => s.add(sumEntries(r.entries, "COLLECTION")),
              new Prisma.Decimal(0),
            )
            .toFixed(2)
        : null,
      conversionRate: caseCount
        ? (new Set(
            current.map(
              (d) => d.application.createdAt.toISOString() + d.applicationId,
            ),
          ).size /
            caseCount) *
          100
        : null,
      avgDaysToDisbursement: (() => {
        const valid = current.filter(
          (d) => d.occurredAt >= d.application.createdAt,
        );
        return valid.length
          ? valid.reduce(
              (sum, d) =>
                sum +
                (d.occurredAt.getTime() - d.application.createdAt.getTime()) /
                  86400000,
              0,
            ) / valid.length
          : null;
      })(),
      fundingTimeSampleCount: current.filter(
        (d) => d.occurredAt >= d.application.createdAt,
      ).length,
      attributionModel: "MULTI_TOUCH_NON_ADDITIVE",
      slaComplianceRate: slaRows.length
        ? (slaRows.filter((t) => t.resolvedWithinSla).length / slaRows.length) *
          100
        : null,
      slaSampleCount: slaRows.length,
      bySource,
      byPayer,
    },
    notifications: readApps
      ? await prisma.commercialNotification.findMany({
          where: { applicationId: { in: apps.map((c) => c.id) } },
          select: {
            id: true,
            applicationId: true,
            recipient: true,
            subject: true,
            content: true,
            contentHash: true,
            revision: true,
            status: true,
            providerId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : [],
    worker: {
      configured:
        !!worker &&
        Date.now() - worker.lastHeartbeatAt.getTime() < 120000 &&
        !!worker.lastScanAt &&
        Date.now() - worker.lastScanAt.getTime() < 600000 &&
        !worker.lastErrorCode,
      lastHeartbeatAt: iso(worker?.lastHeartbeatAt ?? null),
      notificationsEnabled: worker?.notificationsEnabled ?? false,
      message:
        worker && Date.now() - worker.lastHeartbeatAt.getTime() < 120000
          ? "Planificador observado; la entrega externa requiere aprobación y configuración explícitas."
          : "No se observa un planificador comercial reciente.",
    },
  };
}
