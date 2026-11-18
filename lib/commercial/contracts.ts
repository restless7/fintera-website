import { z } from "zod";

export const COMMERCIAL_API = "/api/admin/commercial";
export const GROWTH_CHANNELS = [
  "B2B_FACTORING_CALCULATOR",
  "PARTNER_REFERRAL_B2C",
  "PARTNER_REFERRAL_B2B",
  "INSIGHTS_UTM_CONVERSION",
  "B2C_SIMULATOR_FASTTRACK",
] as const;
const id = z.string().trim().min(1).max(128);
const text = z.string().trim().min(2).max(500);
const revision = z.number().int().nonnegative();
const date = z.string().datetime({ offset: true });
export const money = z
  .string()
  .regex(
    /^(0|[1-9]\d{0,13})(\.\d{1,2})?$/,
    "Importe COP decimal sin separadores",
  );
const positiveMoney = money.refine(
  (v) => Number(v) > 0,
  "Importe mayor que cero",
);
const evidence = z.string().trim().min(5).max(500);
const base = { commandId: z.string().uuid(), reason: text };
export const growthCaptureSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    channel: z.enum(GROWTH_CHANNELS),
    pillar: z.enum([
      "VIVIENDA_B2C",
      "FACTORING_B2B",
      "AUTORIDAD_MERCADO",
      "CONFIANZA_OPORTUNIDADES",
    ]),
    clientName: z.string().trim().min(3).max(150),
    companyName: z.string().trim().max(150).optional(),
    contactEmail: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    contactPhone: z
      .string()
      .trim()
      .regex(/^\+?[\d ()-]{7,24}$/),
    city: z.string().trim().min(2).max(100),
    amountCOP: positiveMoney.optional(),
    productLabel: z.string().trim().min(2).max(150),
    partnerName: z.string().trim().max(150).optional(),
    partnerEmail: z.string().email().max(254).optional(),
    partnerCategory: z
      .enum([
        "INMOBILIARIA",
        "CONSTRUCTORA",
        "CONTADOR_PUBLICO",
        "CONSULTOR_FINANCIERO",
        "BROKER_INDEPENDIENTE",
      ])
      .optional(),
    utmSource: z.string().trim().max(100).optional(),
    utmMedium: z.string().trim().max(100).optional(),
    utmCampaign: z.string().trim().max(150).optional(),
    sourceArticleSlug: z.string().trim().max(200).optional(),
    consent: z.literal(true),
    consentVersion: z.literal("2026.V1"),
    website: z.string().max(0).optional(),
  })
  .strict();
export type GrowthCaptureInput = z.infer<typeof growthCaptureSchema>;
export type GrowthReceipt = {
  success: true;
  trackingCode: string;
  status: "RECEIVED";
  message: string;
};
export type LeadDTO = {
  id: string;
  revision: number;
  trackingCode: string;
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  channel: string;
  productLabel: string;
  amountCOP: string | null;
  partnerName: string | null;
  attribution: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    trust: "SELF_REPORTED";
  };
  status: string;
  assignedAdvisorId: string | null;
  teamId: string | null;
  nextActionAt: string | null;
  applicationId: string | null;
  createdAt: string;
};
export type ContactDTO = {
  id: string;
  applicationId: string | null;
  leadId: string | null;
  outcome: string;
  note: string;
  occurredAt: string;
  nextActionAt: string | null;
  actorUserId: string;
};
export type BankHandoffDTO = {
  id: string;
  applicationId: string;
  bankApplicationId: string;
  bankId: string;
  reference: string;
  deliveredAt: string;
  evidenceReference: string;
  closingConditions: ClosingConditionDTO[];
};
export type ClosingConditionDTO = {
  id: string;
  revision: number;
  title: string;
  status: "OPEN" | "SATISFIED" | "WAIVED";
  dueAt: string | null;
  evidenceReference: string | null;
};
export type DisbursementDTO = {
  id: string;
  applicationId: string;
  bankApplicationId: string;
  amountCOP: string;
  occurredAt: string;
  reference: string;
  evidenceReference: string;
  supersedesId: string | null;
  isCurrent: boolean;
};
export type AgreementDTO = {
  id: string;
  agreementKey: string;
  version: number;
  counterpartyType: "BANK" | "ALLY";
  counterpartyName: string;
  bankId: string | null;
  partnerEmail: string | null;
  kind: "RATE" | "FIXED";
  ratePercent: string | null;
  fixedAmountCOP: string | null;
  trigger: "BANK_FILING" | "DISBURSEMENT";
  validFrom: string;
  validUntil: string | null;
  evidenceReference: string;
  createdAt: string;
};
export type EntryDTO = {
  reversesId: string | null;
  remainingReversibleCOP: string;
  id: string;
  kind:
    | "COLLECTION"
    | "ADJUSTMENT"
    | "COST"
    | "COLLECTION_REVERSAL"
    | "COST_REVERSAL";
  amountCOP: string;
  occurredAt: string;
  reference: string;
  evidenceReference: string;
  reason: string;
};
export type ReceivableDTO = {
  id: string;
  revision: number;
  applicationId: string;
  fileNumber: string;
  agreementId: string;
  counterpartyName: string;
  amountCOP: string;
  collectedCOP: string;
  adjustmentCOP: string;
  costCOP: string | null;
  outstandingCOP: string;
  contributionCOP: string | null;
  dueAt: string | null;
  entries: EntryDTO[];
};
export type CommercialState = {
  permissions: {
    canOperate: boolean;
    canAssign: boolean;
    canManageBanks: boolean;
    canRecordDisbursement: boolean;
    canReadFinance: boolean;
    canWriteFinance: boolean;
    canReviewLegacy: boolean;
    canApproveNotifications: boolean;
  };
  actorUserId: string;
  leads: LeadDTO[];
  totalLeads: number;
  page: number;
  advisors: { id: string; name: string; teamIds: string[] }[];
  teams: { id: string; name: string }[];
  applications: {
    id: string;
    fileNumber: string;
    revision: number;
    assignedAdvisorId: string | null;
    teamId: string | null;
    nextActionDate: string | null;
    nextActionNote: string | null;
    status: string;
    leadSource: string | null;
  }[];
  legacy: {
    id: string;
    requestedAmountCOP: string | null;
    createdAt: string;
    clientName: string;
    contactEmail: string;
    contactPhone: string;
    documentLast4: string;
    disposition: string | null;
    applicationId: string | null;
    revision: number;
  }[];
  bankCatalog: { id: string; name: string }[];
  optionsTruncated: boolean;
  bankApplications: {
    id: string;
    applicationId: string;
    bankId: string;
    stage: string;
  }[];
  metrics: {
    lightLeads: number;
    canonicalCases: number;
    bankCases: number;
    recordedDisbursements: number;
    actualDisbursedCOP: string;
    recognizedIncomeCOP: string | null;
    collectedIncomeCOP: string | null;
    conversionRate: number | null;
    avgDaysToDisbursement: number | null;
    fundingTimeSampleCount: number;
    attributionModel: "MULTI_TOUCH_NON_ADDITIVE";
    slaComplianceRate: number | null;
    slaSampleCount: number;
    bySource: {
      source: string;
      attributionTrust: "SELF_REPORTED_STAFF_LINKED";
      lightLeads: number;
      linkedCases: number;
      fundedCases: number;
      collectedIncomeCOP: string | null;
    }[];
    byPayer: {
      counterpartyType: string;
      recognizedIncomeCOP: string;
      collectedIncomeCOP: string;
    }[];
  };
  closingConditions: (ClosingConditionDTO & {
    applicationId: string;
    bankApplicationId: string;
  })[];
  contacts: ContactDTO[];
  handoffs: BankHandoffDTO[];
  disbursements: DisbursementDTO[];
  agreements: AgreementDTO[];
  receivables: ReceivableDTO[];
  notifications: {
    id: string;
    applicationId: string;
    recipient: string;
    subject: string;
    content: string;
    contentHash: string;
    revision: number;
    status: string;
    providerId: string | null;
  }[];
  worker: {
    configured: boolean;
    lastHeartbeatAt: string | null;
    notificationsEnabled: boolean;
    message: string;
  };
};
export const commercialMutationSchema = z.discriminatedUnion("action", [
  z
    .object({
      ...base,
      action: z.literal("reverseFinanceEntry"),
      applicationId: id,
      receivableId: id,
      expectedRevision: revision,
      originalEntryId: id,
      amountCOP: positiveMoney,
      occurredAt: date,
      reference: text,
      evidenceReference: evidence,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("prepareNotification"),
      applicationId: id,
      subject: z.string().trim().min(3).max(150),
      content: z.string().trim().min(10).max(2000),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("approveNotification"),
      applicationId: id,
      notificationId: id,
      expectedRevision: revision,
      contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("updateLead"),
      leadId: id,
      expectedRevision: revision,
      assignedAdvisorId: id.nullable(),
      teamId: id.nullable(),
      nextActionAt: date.nullable(),
      status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "LOST"]),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("linkLead"),
      leadId: id,
      expectedRevision: revision,
      applicationId: id,
      verifiedContact: z.literal(true),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("reviewLegacy"),
      legacyId: id,
      expectedRevision: revision,
      disposition: z.enum(["REVIEWED_NO_CONVERSION", "DUPLICATE", "LINKED"]),
      applicationId: id.nullable(),
      verifiedContact: z.boolean(),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("updateCase"),
      applicationId: id,
      expectedRevision: revision,
      assignedAdvisorId: id.nullable(),
      teamId: id.nullable(),
      nextActionAt: date.nullable(),
      nextActionNote: z.string().trim().max(500),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("recordContact"),
      applicationId: id.optional(),
      leadId: id.optional(),
      expectedRevision: revision,
      outcome: z.enum([
        "REACHED",
        "NO_ANSWER",
        "CALLBACK",
        "DOCUMENTS_REQUESTED",
        "NOT_INTERESTED",
      ]),
      note: text,
      occurredAt: date,
      nextActionAt: date.nullable(),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("recordHandoff"),
      applicationId: id,
      bankApplicationId: id,
      reference: text,
      deliveredAt: date,
      evidenceReference: evidence,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("addCondition"),
      applicationId: id,
      bankApplicationId: id,
      title: text,
      dueAt: date.nullable(),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("updateCondition"),
      applicationId: id,
      conditionId: id,
      expectedRevision: revision,
      status: z.enum(["SATISFIED", "WAIVED"]),
      evidenceReference: evidence,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("recordDisbursement"),
      applicationId: id,
      bankApplicationId: id,
      amountCOP: positiveMoney,
      occurredAt: date,
      reference: text,
      evidenceReference: evidence,
      supersedesId: id.nullable(),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("saveAgreement"),
      agreementKey: id.optional(),
      expectedVersion: revision,
      counterpartyType: z.enum(["BANK", "ALLY"]),
      counterpartyName: text,
      bankId: id.nullable(),
      partnerEmail: z.string().email().max(254).nullable(),
      kind: z.enum(["RATE", "FIXED"]),
      ratePercent: z
        .string()
        .regex(/^(\d{1,2}(\.\d{1,6})?|100(\.0{1,6})?)$/)
        .nullable(),
      fixedAmountCOP: positiveMoney.nullable(),
      trigger: z.enum(["BANK_FILING", "DISBURSEMENT"]),
      validFrom: date,
      validUntil: date.nullable(),
      evidenceReference: evidence,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("createReceivable"),
      applicationId: id,
      bankApplicationId: id,
      agreementId: id,
      dueAt: date.nullable(),
      evidenceReference: evidence,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal("recordFinanceEntry"),
      applicationId: id,
      receivableId: id,
      expectedRevision: revision,
      kind: z.enum(["COLLECTION", "ADJUSTMENT", "COST"]),
      amountCOP: z.string().regex(/^-?(0|[1-9]\d{0,13})(\.\d{1,2})?$/),
      occurredAt: date,
      reference: text,
      evidenceReference: evidence,
    })
    .strict(),
]);
export type CommercialMutation = z.infer<typeof commercialMutationSchema>;
export type CommercialResult = {
  success: true;
  resourceId: string;
  replayed?: boolean;
};
export type CommercialError = {
  error: string;
  code:
    | "INVALID_INPUT"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "STALE_REVISION"
    | "IDEMPOTENCY_CONFLICT"
    | "RATE_LIMITED"
    | "PRECONDITION_FAILED"
    | "UNAVAILABLE";
};
