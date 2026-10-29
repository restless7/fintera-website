/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G01: Contratos Canónicos de Eventos de Dominio y Esquemas de Carga Útil
 */

export const OUTBOX_STATUS = {
  PENDING: "PENDING",
  CLAIMED: "CLAIMED",
  PROCESSED: "PROCESSED",
  FAILED: "FAILED",
  DEAD_LETTER: "DEAD_LETTER",
} as const;

export type OutboxEventStatus = (typeof OUTBOX_STATUS)[keyof typeof OUTBOX_STATUS];

export const DOMAIN_EVENT_TYPES = {
  // Transiciones y Estados Bancarios
  BANK_STAGE_TRANSITIONED: "BANK_STAGE_TRANSITIONED",
  BANK_STAGE_OVERDUE: "BANK_STAGE_OVERDUE",

  // Ciclo de Vida de Solicitud Comercial
  APPLICATION_CREATED: "APPLICATION_CREATED",
  APPLICATION_STATUS_CHANGED: "APPLICATION_STATUS_CHANGED",

  // Retos de Seguridad y Autenticación (OTP)
  CUSTOMER_OTP_CHALLENGE_ISSUED: "CUSTOMER_OTP_CHALLENGE_ISSUED",

  // Mensajería Cliente-Asesor
  CUSTOMER_MESSAGE_RECEIVED: "CUSTOMER_MESSAGE_RECEIVED",
  ADVISOR_MESSAGE_SENT: "ADVISOR_MESSAGE_SENT",

  // Gestión Documental
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_VERIFIED: "DOCUMENT_VERIFIED",
  DOCUMENT_REJECTED: "DOCUMENT_REJECTED",
  DOCUMENT_EXPIRING_WARNING: "DOCUMENT_EXPIRING_WARNING",

  // Automatización y Alertas
  SLA_BREACH_DETECTED: "SLA_BREACH_DETECTED",
  INACTIVE_CASE_DETECTED: "INACTIVE_CASE_DETECTED",
} as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[keyof typeof DOMAIN_EVENT_TYPES];

export interface BaseDomainEventPayload {
  correlationId?: string;
  causationId?: string;
  emittedAt?: string;
}

export interface BankStageTransitionedPayload extends BaseDomainEventPayload {
  applicationId: string;
  bankApplicationId: string;
  bankId: string;
  fromStage: string;
  toStage: string;
  version: number;
  transitionEventId: string;
  actorUserId?: string | null;
  actorRole?: string;
  transitionedAt: string;
}

export interface CustomerOtpChallengeIssuedPayload extends BaseDomainEventPayload {
  challengeId: string;
  targetMasked: string; // e.g. "+57 *** *** 4589"
  channel: "LOCAL_SINK_SMS" | "LOCAL_SINK_WHATSAPP";
  expiresAt: string;
  // IMPORTANTE: El código OTP en texto plano JAMÁS viaja en este payload.
  // El material de entrega se custodia en la tabla cifrada OtpDeliveryEnvelope.
}

export interface CustomerMessageReceivedPayload extends BaseDomainEventPayload {
  messageId: string;
  applicationId: string;
  senderClerkUserId?: string | null;
  senderName: string;
  receivedAt: string;
}

export interface AdvisorMessageSentPayload extends BaseDomainEventPayload {
  messageId: string;
  applicationId: string;
  advisorUserId: string;
  advisorName: string;
  sentAt: string;
}

export interface CanonicalOutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  status: OutboxEventStatus;
  retryCount: number;
  nextRetryAt: Date | null;
  errorMessage: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  processedAt: Date | null;
  correlationId: string | null;
  causationId: string | null;
  createdAt: Date;
}
