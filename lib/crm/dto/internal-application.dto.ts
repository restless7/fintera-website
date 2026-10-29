/**
 * DTO DE EXPEDIENTE OPERATIVO INTERNO (INTERNAL APPLICATION DTO)
 * FASE 6.3: GATE D — REMEDIATION C
 * 
 * Exclusivo para Asesores Comerciales, Supervisores, Directores y Auditores.
 * Contiene datos sensibles, notas confidenciales de suscripción,
 * contactos oficiales de bancos y bitácora interna.
 */

import { ApplicationStatus, BankStage, ActivityType } from "@/prisma/generated/client";

export interface InternalBankCaseDTO {
  id: string;
  bankId: string;
  productType: string;
  stage: BankStage;
  version: number;
  workflowVersion: string;
  customerVisibleStage: string;
  bankFilingNumber: string | null;
  filingDate: string | null;
  bankOfficialName: string | null;
  bankOfficialContact: string | null;
  approvedAmount: number | null;
  approvedRateEA: number | null;
  approvedTermMonths: number | null;
  slaDeadline: string | null;
  slaStatus: string;
  rejectionReason: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface InternalActivityDTO {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  isInternalOnly: boolean;
  authorName: string | null;
  authorRole: string | null;
  nextActionDate: string | null;
  createdAt: string;
}

export interface InternalApplicationDTO {
  id: string;
  fileNumber: string;
  status: ApplicationStatus;
  leadSource: string | null;
  productCategory: string;
  requestedAmount: number;
  termMonths: number;
  internalNotes: string | null;
  nextActionDate: string | null;
  nextActionNote: string | null;
  client: {
    id: string;
    documentType: string;
    documentNumber: string;
    fullName: string;
    email: string;
    phone: string;
    monthlyIncome: number;
    residenceCity: string;
  };
  assignedAdvisor: {
    id: string;
    name: string;
    email: string;
  } | null;
  financialSnapshot: {
    simulatedBankId: string | null;
    simulatedRateEA: number | null;
    simulatedMonthlyPayment: number | null;
    simulatedLifeInsurance: number | null;
    simulatedFireInsurance: number | null;
    simulatedDtiRatio: number | null;
  } | null;
  bankApplications: InternalBankCaseDTO[];
  activities: InternalActivityDTO[];
  createdAt: string;
  updatedAt: string;
}
