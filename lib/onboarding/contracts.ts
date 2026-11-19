import { z } from "zod";

export const ONBOARDING_API = "/api/onboarding";
export const QUICK_PRIVACY_VERSION = "2026-11-19.QUICK.1";
export const SERVICE_DECLARATION_VERSION = "2026-11-19.SERVICE.1";
export const PROCESSING_CONSENT_VERSION = "2026-11-19.PROCESSING.1";
export const LEGACY_PROCESSING_CONSENT_VERSION = "2026.V3.EXPLICIT";
export const CREDIT_KINDS = [
  "VIVIENDA",
  "LIBRE_DESTINO",
  "LIBRANZA",
  "VEHICULO",
] as const;
export const CUSTOMER_ACTIVITIES = [
  "ASALARIADO",
  "INDEPENDIENTE",
  "PENSIONADO",
  "OTRO",
] as const;
export const SERVICE_REQUEST_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "CLOSED",
] as const;
export const creditKindLabels: Record<(typeof CREDIT_KINDS)[number], string> = {
  VIVIENDA: "Vivienda",
  LIBRE_DESTINO: "Libre destino",
  LIBRANZA: "Libranza",
  VEHICULO: "Vehículo",
};
export const serviceRequestStatusLabels: Record<
  (typeof SERVICE_REQUEST_STATUSES)[number],
  string
> = {
  DRAFT: "Pendiente de solicitud formal",
  SUBMITTED: "Solicitud recibida",
  IN_REVIEW: "En revisión por FINTERA",
  CLOSED: "Gestión cerrada",
};
const amount = z
  .string()
  .regex(
    /^(?:[1-9]\d{0,13})(?:\.\d{1,2})?$/,
    "Monto COP positivo, sin separadores",
  );
export const serviceRequestDetailsSchema = z
  .object({
    creditKind: z.enum(CREDIT_KINDS),
    amountCOP: amount,
    name: z.string().trim().min(3).max(150),
    activity: z.enum(CUSTOMER_ACTIVITIES),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d ()-]+$/)
      .transform((v) => v.replace(/[ ()-]/g, ""))
      .refine((v) => /^\+?\d{7,15}$/.test(v), "Teléfono de 7 a 15 dígitos"),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
  })
  .strict();
export const quickCaptureSchema = serviceRequestDetailsSchema
  .extend({
    commandId: z.string().uuid(),
    privacyConsent: z.literal(true),
    privacyVersion: z.literal(QUICK_PRIVACY_VERSION),
    website: z.string().max(0).optional(),
  })
  .strict();
export const submitServiceRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    expectedRevision: z.number().int().nonnegative(),
    commandId: z.string().uuid(),
    details: serviceRequestDetailsSchema,
    requestDeclaration: z.literal(true),
    requestDeclarationVersion: z.literal(SERVICE_DECLARATION_VERSION),
    processingConsent: z.literal(true),
    processingConsentVersion: z.literal(PROCESSING_CONSENT_VERSION),
  })
  .strict();
export const adminServiceRequestMutationSchema = z
  .object({
    commandId: z.string().uuid(),
    requestId: z.string().uuid(),
    expectedRevision: z.number().int().nonnegative(),
    action: z.enum(["REVIEW", "LINK_APPLICATION"]),
    reason: z.string().trim().min(5).max(1000),
    status: z.enum(["SUBMITTED", "IN_REVIEW", "CLOSED"]).optional(),
    assignedAdvisorId: z.string().min(1).max(128).nullable().optional(),
    teamId: z.string().min(1).max(128).nullable().optional(),
    nextActionAt: z.string().datetime({ offset: true }).nullable().optional(),
    publicMessage: z.string().trim().max(1000).optional(),
    applicationId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.action === "LINK_APPLICATION" &&
      [
        v.status,
        v.assignedAdvisorId,
        v.teamId,
        v.nextActionAt,
        v.publicMessage,
      ].some((x) => x !== undefined)
    )
      ctx.addIssue({
        code: "custom",
        message: "La vinculación no modifica la revisión",
      });
    if (v.action === "LINK_APPLICATION" && !v.applicationId)
      ctx.addIssue({
        code: "custom",
        path: ["applicationId"],
        message: "Seleccione un expediente existente",
      });
    if (v.action === "REVIEW" && v.applicationId)
      ctx.addIssue({
        code: "custom",
        path: ["applicationId"],
        message: "Use la vinculación explícita",
      });
  });
export type ServiceRequestDetails = z.infer<typeof serviceRequestDetailsSchema>;
export type QuickCaptureInput = z.infer<typeof quickCaptureSchema>;
export type SubmitServiceRequestInput = z.infer<
  typeof submitServiceRequestSchema
>;
export type AdminServiceRequestMutation = z.infer<
  typeof adminServiceRequestMutationSchema
>;
export type CustomerServiceRequestDTO = {
  id: string;
  revision: number;
  status: (typeof SERVICE_REQUEST_STATUSES)[number];
  statusLabel: string;
  details: ServiceRequestDetails;
  createdAt: string;
  submittedAt: string | null;
  publicMessage: string | null;
  applicationId: string | null;
  canSubmit: boolean;
  resumeUrl: string;
  receiptUrl: string | null;
  receipts: {
    quickPrivacyVersion: string;
    requestDeclarationVersion: string | null;
    processingConsentVersion: string | null;
  };
};
export type OnboardingStateDTO = {
  authenticated: boolean;
  state:
    | "SIGN_IN_REQUIRED"
    | "VERIFIED_EMAIL_REQUIRED"
    | "CLAIM_AVAILABLE"
    | "EMAIL_MISMATCH"
    | "NO_REQUEST"
    | "OWNED_REQUESTS";
  message: string;
  requests: CustomerServiceRequestDTO[];
  claimAvailable: boolean;
};
export type QuickCaptureReceipt = {
  success: true;
  status: "RECEIVED";
  nextUrl: "/onboarding/sign-up";
  message: string;
};
export type AdminServiceRequestsDTO = {
  requests: Array<
    CustomerServiceRequestDTO & {
      claimed: boolean;
      assignedAdvisorId: string | null;
      teamId: string | null;
      nextActionAt: string | null;
    }
  >;
  total: number;
  page: number;
  permissions: {
    canReview: boolean;
    canAssign: boolean;
    canLinkApplication: boolean;
  };
  advisors: Array<{ id: string; name: string; teamIds: string[] }>;
  teams: Array<{ id: string; name: string }>;
  applications: Array<{ id: string; fileNumber: string; requestIds: string[] }>;
  optionsTruncated: boolean;
};

export type PolicySourceAnchorDTO = {
  versionLabel: string;
  repositoryCommit: string;
  sourceFile: string;
  sourceSha256: string;
};
export type ServiceConsentReceiptDTO = {
  version: string;
  text: string;
  textHash: string;
  accepted: true;
  acceptedAt: string;
  clerkUserId?: string;
  ipAddress: string | null;
  userAgent: string | null;
  privacyUrl?: string;
  privacySource?: PolicySourceAnchorDTO;
};
export type ServiceRequestReceiptDTO = {
  requestId: string;
  status: string;
  submittedAt: string;
  identitySubject: string;
  quickSnapshot: ServiceRequestDetails;
  quickConsent: ServiceConsentReceiptDTO;
  submittedRequest: ServiceRequestDetails;
  formalReceipts: {
    declaration: ServiceConsentReceiptDTO;
    processing: ServiceConsentReceiptDTO;
    privacyUrl: string;
    termsUrl: string;
    privacySource?: PolicySourceAnchorDTO;
    payloadHash: string;
  };
  formalCommandPayloadHash: string;
  notice: string;
};
