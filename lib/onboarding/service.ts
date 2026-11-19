import { createHash, createHmac } from "node:crypto";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Prisma, type CustomerServiceRequest } from "@/prisma/generated/client";
import { ONBOARDING_POLICIES } from "./policies";
import {
  serviceRequestDetailsSchema,
  quickCaptureSchema,
  submitServiceRequestSchema,
  type ServiceRequestReceiptDTO,
  type ServiceConsentReceiptDTO,
  serviceRequestStatusLabels,
  type QuickCaptureInput,
  type SubmitServiceRequestInput,
  type OnboardingStateDTO,
  type CustomerServiceRequestDTO,
  type ServiceRequestDetails,
} from "./contracts";

export class OnboardingError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const onboardingHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
function fail(code: string, message: string, status = 400): never {
  throw new OnboardingError(code, message, status);
}

export type RequestMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};
type Identity = { subject: string; email: string; verified: boolean };
export async function currentOnboardingIdentity(
  subject: string,
): Promise<Identity> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const user = await Promise.race([
      clerkClient().then((client) => client.users.getUser(subject)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("IDENTITY_TIMEOUT")), 5000);
      }),
    ]);
    if (user.id !== subject || user.banned || user.locked)
      fail("IDENTITY_UNAVAILABLE", "La cuenta no está disponible.", 403);
    const primary = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    );
    return {
      subject,
      email: primary?.emailAddress.trim().toLowerCase() || "",
      verified: primary?.verification?.status === "verified",
    };
  } catch (error) {
    if (error instanceof OnboardingError) throw error;
    throw new OnboardingError(
      "IDENTITY_UNAVAILABLE",
      "No fue posible verificar su cuenta. Intente más tarde.",
      503,
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function requireVerified(identity: Identity) {
  if (!identity.verified)
    fail(
      "VERIFIED_EMAIL_REQUIRED",
      "Verifique el correo principal de su cuenta para continuar.",
      403,
    );
}
export function serviceRequestDto(
  row: CustomerServiceRequest,
): CustomerServiceRequestDTO {
  const details = row.formalSnapshot
    ? serviceRequestDetailsSchema.parse(row.formalSnapshot)
    : serviceRequestDetailsSchema.parse(row.quickSnapshot);
  const receipts = row.formalReceipts as Record<
    string,
    { version?: string }
  > | null;
  return {
    id: row.id,
    revision: row.revision,
    status: row.status as CustomerServiceRequestDTO["status"],
    statusLabel:
      serviceRequestStatusLabels[
        row.status as CustomerServiceRequestDTO["status"]
      ],
    details,
    createdAt: row.createdAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() || null,
    publicMessage: row.publicMessage,
    applicationId: row.applicationId,
    canSubmit: row.status === "DRAFT",
    resumeUrl: `/onboarding/solicitud?requestId=${row.id}`,
    receiptUrl: row.submittedAt ? `/onboarding/constancia/${row.id}` : null,
    receipts: {
      quickPrivacyVersion: (row.quickConsent as { version: string }).version,
      requestDeclarationVersion: receipts?.declaration?.version || null,
      processingConsentVersion: receipts?.processing?.version || null,
    },
  };
}
export class CustomerOnboardingService {
  static async start(
    input: QuickCaptureInput,
    browserProof: string,
    metadata: RequestMetadata,
  ) {
    input = quickCaptureSchema.parse(input);
    if (!/^[A-Za-z0-9_-]{43}$/.test(browserProof))
      fail(
        "BROWSER_PROOF_REQUIRED",
        "Actualice la página antes de enviar el registro.",
        403,
      );
    const secret =
      process.env.CUSTOMER_LINK_SECRET || process.env.CLERK_SECRET_KEY;
    if (!secret)
      fail("UNAVAILABLE", "El registro no está disponible temporalmente.", 503);
    const details = serviceRequestDetailsSchema.parse({
      creditKind: input.creditKind,
      amountCOP: input.amountCOP,
      name: input.name,
      activity: input.activity,
      phone: input.phone,
      email: input.email,
    });
    const payloadHash = onboardingHash(JSON.stringify(input));
    const proofHash = onboardingHash(browserProof);
    const abuseHash = createHmac("sha256", secret)
      .update("customer-onboarding:" + (metadata.ipAddress || "unknown"))
      .digest("hex");
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT 1 FROM pg_advisory_xact_lock(191120260001::bigint)`;
        const previous = await tx.customerServiceRequest.findUnique({
          where: { idempotencyKey: input.commandId },
        });
        if (previous) {
          if (
            previous.browserProofHash !== proofHash ||
            previous.payloadHash !== payloadHash
          )
            fail(
              "IDEMPOTENCY_CONFLICT",
              "El registro requiere revisión. No se ha creado otro registro.",
              409,
            );
          return;
        }
        const since = new Date(Date.now() - 3600000);
        const [ipCount, emailCount, total] = await Promise.all([
          tx.customerServiceRequest.count({
            where: { abuseHash, createdAt: { gte: since } },
          }),
          tx.customerServiceRequest.count({
            where: { email: input.email, createdAt: { gte: since } },
          }),
          tx.customerServiceRequest.count({
            where: { createdAt: { gte: since } },
          }),
        ]);
        if (ipCount >= 20 || emailCount >= 5 || total >= 1000)
          fail("RATE_LIMITED", "Espere antes de enviar otro registro.", 429);
        const now = new Date();
        await tx.customerServiceRequest.create({
          data: {
            idempotencyKey: input.commandId,
            payloadHash,
            browserProofHash: proofHash,
            abuseHash,
            ...details,
            amountCOP: new Prisma.Decimal(details.amountCOP),
            quickSnapshot: json(details),
            quickConsent: json({
              ...ONBOARDING_POLICIES.quick,
              textHash: onboardingHash(ONBOARDING_POLICIES.quick.text),
              privacyUrl: ONBOARDING_POLICIES.privacyUrl,
              privacySource: ONBOARDING_POLICIES.privacySource,
              accepted: true,
              acceptedAt: now.toISOString(),
              ...metadata,
            }),
            claimExpiresAt: new Date(now.getTime() + 24 * 3600000),
          },
        });
      },
      { isolationLevel: "Serializable", timeout: 15000 },
    );
    return {
      success: true as const,
      status: "RECEIVED" as const,
      nextUrl: "/onboarding/sign-up" as const,
      message:
        "Registro recibido. Cree su cuenta o inicie sesión para continuar con su solicitud de servicios financieros.",
    };
  }
  static async state(
    subject: string | null,
    browserProof: string | null,
    requestId?: string,
  ): Promise<OnboardingStateDTO> {
    if (!subject)
      return {
        authenticated: false,
        state: "SIGN_IN_REQUIRED",
        message: "Cree su cuenta o inicie sesión para continuar.",
        requests: [],
        claimAvailable: false,
      };
    const identity = await currentOnboardingIdentity(subject);
    if (!identity.verified)
      return {
        authenticated: true,
        state: "VERIFIED_EMAIL_REQUIRED",
        message: "Verifique el correo principal de su cuenta para continuar.",
        requests: [],
        claimAvailable: false,
      };
    const rows = await prisma.customerServiceRequest.findMany({
      where: {
        claimedClerkUserId: subject,
        ...(requestId ? { id: requestId } : {}),
      },
      orderBy: { createdAt: "desc" },

    });
    if (requestId && !rows.length)
      fail("NOT_FOUND", "Solicitud no disponible.", 404);
    const candidate = browserProof
      ? await prisma.customerServiceRequest.findFirst({
          where: {
            browserProofHash: onboardingHash(browserProof),
            claimedClerkUserId: null,
            claimExpiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        })
      : null;
    const matches = !!candidate && candidate.email === identity.email;
    return {
      authenticated: true,
      state: matches
        ? "CLAIM_AVAILABLE"
        : rows.length
          ? "OWNED_REQUESTS"
          : candidate
            ? "EMAIL_MISMATCH"
            : "NO_REQUEST",
      message: matches
        ? "Confirme que desea continuar con el registro realizado en este navegador."
        : rows.length
          ? "Estas son sus solicitudes de servicios financieros; no equivalen a una aprobación bancaria."
          : candidate
            ? "Use la cuenta cuyo correo principal verificado corresponde a su registro, o realice un nuevo registro con su correo actual."
            : "Aún no tiene una solicitud de servicios financieros. Puede iniciar un registro breve.",
      requests: rows.map(serviceRequestDto),
      claimAvailable: matches,
    };
  }
  static async claim(subject: string, browserProof: string | null) {
    const identity = await currentOnboardingIdentity(subject);
    requireVerified(identity);
    if (!browserProof)
      fail(
        "BROWSER_PROOF_REQUIRED",
        "Reinicie el registro desde este navegador o solicite ayuda.",
        403,
      );
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${"customer-onboarding-claim:" + subject}))`;
        const row = await tx.customerServiceRequest.findFirst({
          where: {
            browserProofHash: onboardingHash(browserProof),
            claimedClerkUserId: null,
            claimExpiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (!row) return;
        if (row.email !== identity.email)
          fail(
            "EMAIL_MISMATCH",
            "El correo principal verificado no corresponde al registro.",
            403,
          );
        const changed = await tx.customerServiceRequest.updateMany({
          where: {
            id: row.id,
            revision: row.revision,
            claimedClerkUserId: null,
            claimExpiresAt: { gt: new Date() },
          },
          data: {
            claimedClerkUserId: subject,
            claimedAt: new Date(),
            revision: { increment: 1 },
          },
        });
        if (changed.count !== 1)
          fail("CONFLICT", "El registro cambió. Actualice su estado.", 409);
        await tx.accessAuditEvent.create({
          data: {
            clerkUserId: subject,
            action: "CUSTOMER_SERVICE_REQUEST_CLAIMED",
            resourceType: "CustomerServiceRequest",
            resourceId: row.id,
            decision: "GRANTED",
            reason:
              "Explicit browser possession proof and freshly verified Clerk primary email; no Client grant",
          },
        });
      },
      { isolationLevel: "Serializable", timeout: 15000 },
    );
    return this.state(subject, browserProof);
  }
  static async submit(
    subject: string,
    input: SubmitServiceRequestInput,
    browserProof: string | null,
    metadata: RequestMetadata,
  ) {
    input = submitServiceRequestSchema.parse(input);
    const identity = await currentOnboardingIdentity(subject);
    requireVerified(identity);
    if (input.details.email !== identity.email)
      fail(
        "EMAIL_MISMATCH",
        "Confirme el correo principal verificado de su cuenta.",
        403,
      );
    const payloadHash = onboardingHash(JSON.stringify(input));
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM customer_service_requests WHERE id=${input.requestId} AND claimed_clerk_user_id=${subject} FOR UPDATE`;
        const row = await tx.customerServiceRequest.findFirst({
          where: { id: input.requestId, claimedClerkUserId: subject },
        });
        if (!row) fail("NOT_FOUND", "Solicitud no disponible.", 404);
        if (row.submissionCommandId) {
          if (
            row.submissionCommandId === input.commandId &&
            row.formalPayloadHash === payloadHash
          )
            return;
          fail(
            "ALREADY_SUBMITTED",
            "La solicitud ya fue recibida y su comprobante permanece sin modificaciones.",
            409,
          );
        }
        if (row.revision !== input.expectedRevision || row.status !== "DRAFT")
          fail(
            "CONFLICT",
            "La solicitud cambió. Actualice antes de confirmar.",
            409,
          );
        const now = new Date();
        const receipt = (policy: { version: string; text: string }) => ({
          ...policy,
          textHash: onboardingHash(policy.text),
          accepted: true,
          acceptedAt: now.toISOString(),
          clerkUserId: subject,
          ...metadata,
        });
        const changed = await tx.customerServiceRequest.updateMany({
          where: {
            id: row.id,
            claimedClerkUserId: subject,
            revision: input.expectedRevision,
            status: "DRAFT",
          },
          data: {
            ...input.details,
            amountCOP: new Prisma.Decimal(input.details.amountCOP),
            status: "SUBMITTED",
            formalSnapshot: json(input.details),
            formalPayloadHash: payloadHash,
            submissionCommandId: input.commandId,
            formalReceipts: json({
              declaration: receipt(ONBOARDING_POLICIES.declaration),
              processing: receipt(ONBOARDING_POLICIES.processing),
              privacyUrl: ONBOARDING_POLICIES.privacyUrl,
              privacySource: ONBOARDING_POLICIES.privacySource,
              termsUrl: ONBOARDING_POLICIES.termsUrl,
              payloadHash: onboardingHash(JSON.stringify(input.details)),
            }),
            submittedAt: now,
            revision: { increment: 1 },
          },
        });
        if (changed.count !== 1)
          fail("CONFLICT", "La solicitud cambió. Actualice su estado.", 409);
        await tx.accessAuditEvent.create({
          data: {
            clerkUserId: subject,
            action: "CUSTOMER_SERVICE_REQUEST_SUBMITTED",
            resourceType: "CustomerServiceRequest",
            resourceId: row.id,
            decision: "GRANTED",
            reason:
              "Authenticated explicit service request and separate processing consent",
            metadata: {
              payloadHash,
              declarationVersion: ONBOARDING_POLICIES.declaration.version,
              processingVersion: ONBOARDING_POLICIES.processing.version,
            },
          },
        });
      },
      { isolationLevel: "Serializable", timeout: 15000 },
    );
    return this.state(subject, browserProof);
  }
  static async receipt(
    subject: string,
    requestId: string,
  ): Promise<ServiceRequestReceiptDTO> {
    const identity = await currentOnboardingIdentity(subject);
    requireVerified(identity);
    const row = await prisma.customerServiceRequest.findFirst({
      where: {
        id: requestId,
        claimedClerkUserId: subject,
        submittedAt: { not: null },
      },
    });
    if (!row) fail("NOT_FOUND", "Comprobante no disponible.", 404);
    const consentSchema = z.object({
      version: z.string(),
      text: z.string(),
      textHash: z.string().regex(/^[a-f0-9]{64}$/),
      accepted: z.literal(true),
      acceptedAt: z.string().datetime(),
      clerkUserId: z.string().optional(),
      ipAddress: z.string().nullable(),
      userAgent: z.string().nullable(),
      privacyUrl: z.string().optional(),
      privacySource: z
        .object({
          versionLabel: z.string(),
          repositoryCommit: z.string(),
          sourceFile: z.string(),
          sourceSha256: z.string(),
        })
        .optional(),
    });
    const quickConsent = consentSchema.parse(row.quickConsent);
    const formalReceipts = z
      .object({
        declaration: consentSchema,
        processing: consentSchema,
        privacyUrl: z.string(),
        termsUrl: z.string(),
        privacySource: z
          .object({
            versionLabel: z.string(),
            repositoryCommit: z.string(),
            sourceFile: z.string(),
            sourceSha256: z.string(),
          })
          .optional(),
        payloadHash: z.string(),
      })
      .parse(row.formalReceipts);
    for (const accepted of [
      quickConsent,
      formalReceipts.declaration,
      formalReceipts.processing,
    ])
      if (onboardingHash(accepted.text) !== accepted.textHash)
        fail("UNAVAILABLE", "No fue posible verificar el comprobante.", 503);
    return {
      requestId: row.id,
      status: row.status,
      submittedAt: row.submittedAt!.toISOString(),
      identitySubject: subject,
      quickSnapshot: serviceRequestDetailsSchema.parse(row.quickSnapshot),
      quickConsent: quickConsent as ServiceConsentReceiptDTO,
      submittedRequest: serviceRequestDetailsSchema.parse(row.formalSnapshot),
      formalReceipts,
      formalCommandPayloadHash: row.formalPayloadHash!,
      notice:
        "Comprobante de solicitud de servicios financieros y sus aceptaciones expresas; no es una aprobación ni una radicación bancaria.",
    };
  }
}
