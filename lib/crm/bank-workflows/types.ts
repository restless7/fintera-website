/**
 * TIPOS Y CONTRATOS DEL MOTOR DE WORKFLOWS BANCARIOS
 * FASE 6.3: GATE D — VERSIONED BANK WORKFLOW REGISTRY
 */

import { BankStage } from "@/prisma/generated/client";
import { UserRole } from "@/lib/auth/types";

export type RequirementSource = "OFFICIAL_DOCUMENTED" | "FINTERA_INTERNAL_POLICY" | "PENDING_BANK_CONFIRMATION";

export interface WorkflowPrerequisite {
  code: string;
  name: string;
  description: string;
  source: RequirementSource;
  isMandatory: boolean;
  validationFn?: (context: WorkflowValidationContext) => boolean | Promise<boolean>;
}

export interface WorkflowValidationContext {
  bankApplicationId: string;
  bankId: string;
  productType: string;
  currentStage: BankStage;
  targetStage: BankStage;
  bankFilingNumber?: string | null;
  approvedAmount?: number | null;
  approvedRateEA?: number | null;
  approvedTermMonths?: number | null;
  rejectionReason?: string | null;
  evidenceType?: string | null;
  evidenceReference?: string | null;
  actorRole: UserRole;
  actorUserId: string;
}

export interface AdministrativeExceptionTransitionInput {
  bankApplicationId: string;
  targetStage: BankStage;
  expectedVersion: number;
  reason: string;
  actorUserId: string;
  actorRole: UserRole;
  exceptionApprovalCode: string; // e.g. "EXC-DIR-2026-0042"
  exceptionReason: string; // min 20 chars
  supportingEvidenceReference: string;
  bankFilingNumber?: string;
  approvedAmount?: number;
  approvedRateEA?: number;
  approvedTermMonths?: number;
  rejectionReason?: string;
  requestedByUserId?: string;
  approvedByUserId?: string;
}

export interface StageTransitionRule {
  fromStage: BankStage;
  toStage: BankStage;
  allowedRoles: UserRole[];
  prerequisites: WorkflowPrerequisite[];
  requiresReason: boolean;
  requiresEvidence: boolean;
  isExceptionalOrCompensating?: boolean;
}

export interface CustomerStageProjection {
  customerVisibleStage: string;
  publicDescription: string;
  actionRequiredByClient: string | null;
  isPubliclyVisible: boolean;
}

export interface BankWorkflowDefinition {
  workflowId: string;
  bankId: string;
  productType: string;
  version: string;
  effectiveDate: string; // ISO Date YYYY-MM-DD
  displayName: string;
  initialStage: BankStage;
  terminalStages: BankStage[];
  permittedTransitions: Record<BankStage, BankStage[]>;
  transitionRules: StageTransitionRule[];
  customerStageMap: Record<BankStage, CustomerStageProjection>;
}
