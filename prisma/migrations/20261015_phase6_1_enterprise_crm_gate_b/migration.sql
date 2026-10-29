-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'COMMERCIAL_DIRECTOR', 'SUPERVISOR', 'COMMERCIAL_ADVISOR', 'DOCUMENT_ANALYST', 'OPERATIONS_OFFICER', 'AUDITOR', 'CLIENT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('LEAD_CAPTURED', 'PROFILING', 'FINANCIALLY_PREQUALIFIED', 'DOCUMENTATION_IN_PROGRESS', 'FILE_COMPLETE', 'SUBMITTED_TO_BANKS', 'BANK_STUDY', 'PARTIALLY_APPROVED', 'LEGALLY_FORMALIZED', 'DISBURSED', 'REJECTED', 'CANCELLED_BY_CLIENT');

-- CreateEnum
CREATE TYPE "BankStage" AS ENUM ('STAGE_01_PRE_FILE', 'STAGE_02_INTERNAL_QA', 'STAGE_03_READY_FOR_BANK', 'STAGE_04_BANK_SUBMITTED', 'STAGE_05_RISK_EVALUATION', 'STAGE_06_CONDITIONAL_APPROVAL', 'STAGE_07_DEFINITIVE_APPROVAL', 'STAGE_08_APPRAISAL_LEGAL', 'STAGE_09_DISBURSED', 'STAGE_BANK_REJECTED', 'STAGE_BANK_SUSPENDED', 'STAGE_BANK_TRANSFERRED');

-- CreateEnum
CREATE TYPE "ApplicantRole" AS ENUM ('PRIMARY_HOLDER', 'CO_APPLICANT', 'GUARANTOR');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('HABEAS_DATA_LEY_1581', 'CREDIT_BUREAU_CONSULTATION', 'COMMERCIAL_CONTACT');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Ensure legacy credit_requests has requestNumber
ALTER TABLE "credit_requests" ADD COLUMN IF NOT EXISTS "requestNumber" SERIAL;

-- CreateTable: bank_policies (Fase 2)
CREATE TABLE IF NOT EXISTS "bank_policies" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minRateEA" DOUBLE PRECISION NOT NULL,
    "maxRateEA" DOUBLE PRECISION NOT NULL,
    "defaultRateEA" DOUBLE PRECISION NOT NULL,
    "minTermMonths" INTEGER NOT NULL,
    "maxTermMonths" INTEGER NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "maxLtvPercent" DOUBLE PRECISION NOT NULL,
    "requiresMortgage" BOOLEAN NOT NULL DEFAULT true,
    "fngCommissionPercent" DOUBLE PRECISION,
    "lifeInsuranceRateMonthly" DOUBLE PRECISION NOT NULL,
    "fireInsuranceRateMonthly" DOUBLE PRECISION NOT NULL,
    "fireInsuranceBase" TEXT NOT NULL,
    "regulatoryDtiBasis" TEXT NOT NULL,
    "maxDtiPercent" DOUBLE PRECISION NOT NULL,
    "sourceDocument" TEXT NOT NULL,
    "effectiveDate" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bank_policy_version_histories (Fase 2)
CREATE TABLE IF NOT EXISTS "bank_policy_version_histories" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "isRollback" BOOLEAN NOT NULL DEFAULT false,
    "rollbackFromVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_policy_version_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: policy_audit_logs (Fase 2)
CREATE TABLE IF NOT EXISTS "policy_audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: app_users (Fase 6)
CREATE TABLE IF NOT EXISTS "app_users" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'COMMERCIAL_ADVISOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: teams (Fase 6)
CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable: team_memberships (Fase 6)
CREATE TABLE IF NOT EXISTS "team_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable: clients (Fase 6)
CREATE TABLE IF NOT EXISTS "clients" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "secondName" TEXT,
    "firstLastName" TEXT NOT NULL,
    "secondLastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "preferredContactMethods" TEXT[],
    "residenceCity" TEXT NOT NULL,
    "residenceDepartment" TEXT NOT NULL,
    "residenceAddress" TEXT NOT NULL,
    "isPEP" BOOLEAN NOT NULL DEFAULT false,
    "clerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_consent_records (Fase 6)
CREATE TABLE IF NOT EXISTS "client_consent_records" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: crm_credit_applications (Fase 6)
CREATE TABLE IF NOT EXISTS "crm_credit_applications" (
    "id" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "assignedAdvisorId" TEXT,
    "teamId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'LEAD_CAPTURED',
    "productCategory" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "internalNotes" TEXT,
    "customerVisibleNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_credit_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: applicants (Fase 6)
CREATE TABLE IF NOT EXISTS "applicants" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "role" "ApplicantRole" NOT NULL DEFAULT 'PRIMARY_HOLDER',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "monthlyIncome" DOUBLE PRECISION NOT NULL,
    "monthlyExpenses" DOUBLE PRECISION NOT NULL,
    "existingObligations" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAssets" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLiabilities" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occupation" TEXT NOT NULL,
    "companyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bank_applications (Fase 6)
CREATE TABLE IF NOT EXISTS "bank_applications" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "stage" "BankStage" NOT NULL DEFAULT 'STAGE_01_PRE_FILE',
    "customerVisibleStage" TEXT NOT NULL DEFAULT 'En integración de documentos',
    "customerVisible" BOOLEAN NOT NULL DEFAULT true,
    "bankFilingNumber" TEXT,
    "filingDate" TIMESTAMP(3),
    "bankOfficialName" TEXT,
    "bankOfficialContact" TEXT,
    "approvedAmount" DOUBLE PRECISION,
    "approvedRateEA" DOUBLE PRECISION,
    "approvedTermMonths" INTEGER,
    "slaDeadline" TIMESTAMP(3),
    "slaBreached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: simulation_snapshots (Fase 6)
CREATE TABLE IF NOT EXISTS "simulation_snapshots" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "simulatedBankId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "propertyValue" DOUBLE PRECISION NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "rateEA" DOUBLE PRECISION NOT NULL,
    "rateMV" DOUBLE PRECISION NOT NULL,
    "initialMonthlyBasePayment" DOUBLE PRECISION NOT NULL,
    "lifeInsuranceMonthly" DOUBLE PRECISION NOT NULL,
    "fireInsuranceMonthly" DOUBLE PRECISION NOT NULL,
    "initialMonthlyTotalPayment" DOUBLE PRECISION NOT NULL,
    "dtiRatio" DOUBLE PRECISION NOT NULL,
    "globalDtiRatio" DOUBLE PRECISION NOT NULL,
    "existingObligations" DOUBLE PRECISION NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "sourceDocument" TEXT NOT NULL,
    "effectiveDate" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: access_audit_events (Fase 6)
CREATE TABLE IF NOT EXISTS "access_audit_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clerkUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "applicationId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: outbox_events (Fase 6)
CREATE TABLE IF NOT EXISTS "outbox_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- Unique & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "bank_policies_bankId_productType_version_key" ON "bank_policies"("bankId", "productType", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "app_users_clerkUserId_key" ON "app_users"("clerkUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "app_users_email_key" ON "app_users"("email");
CREATE INDEX IF NOT EXISTS "app_users_role_idx" ON "app_users"("role");
CREATE INDEX IF NOT EXISTS "app_users_clerkUserId_idx" ON "app_users"("clerkUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "teams_name_key" ON "teams"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "team_memberships_userId_teamId_key" ON "team_memberships"("userId", "teamId");
CREATE UNIQUE INDEX IF NOT EXISTS "clients_documentType_documentNumber_key" ON "clients"("documentType", "documentNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "clients_clerkUserId_key" ON "clients"("clerkUserId");
CREATE INDEX IF NOT EXISTS "clients_email_idx" ON "clients"("email");
CREATE INDEX IF NOT EXISTS "clients_clerkUserId_idx" ON "clients"("clerkUserId");
CREATE INDEX IF NOT EXISTS "client_consent_records_clientId_idx" ON "client_consent_records"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "crm_credit_applications_fileNumber_key" ON "crm_credit_applications"("fileNumber");
CREATE INDEX IF NOT EXISTS "crm_credit_applications_status_idx" ON "crm_credit_applications"("status");
CREATE INDEX IF NOT EXISTS "crm_credit_applications_assignedAdvisorId_idx" ON "crm_credit_applications"("assignedAdvisorId");
CREATE INDEX IF NOT EXISTS "crm_credit_applications_teamId_idx" ON "crm_credit_applications"("teamId");
CREATE INDEX IF NOT EXISTS "applicants_applicationId_idx" ON "applicants"("applicationId");
CREATE UNIQUE INDEX IF NOT EXISTS "bank_applications_applicationId_bankId_productType_key" ON "bank_applications"("applicationId", "bankId", "productType");
CREATE INDEX IF NOT EXISTS "bank_applications_bankId_stage_idx" ON "bank_applications"("bankId", "stage");
CREATE UNIQUE INDEX IF NOT EXISTS "simulation_snapshots_applicationId_key" ON "simulation_snapshots"("applicationId");
CREATE INDEX IF NOT EXISTS "access_audit_events_userId_idx" ON "access_audit_events"("userId");
CREATE INDEX IF NOT EXISTS "access_audit_events_action_idx" ON "access_audit_events"("action");
CREATE INDEX IF NOT EXISTS "access_audit_events_timestamp_idx" ON "access_audit_events"("timestamp");
CREATE INDEX IF NOT EXISTS "outbox_events_status_nextRetryAt_idx" ON "outbox_events"("status", "nextRetryAt");

-- Foreign Keys
ALTER TABLE "bank_policy_version_histories" DROP CONSTRAINT IF EXISTS "bank_policy_version_histories_policyId_fkey";
ALTER TABLE "bank_policy_version_histories" ADD CONSTRAINT "bank_policy_version_histories_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "bank_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_memberships" DROP CONSTRAINT IF EXISTS "team_memberships_userId_fkey";
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_memberships" DROP CONSTRAINT IF EXISTS "team_memberships_teamId_fkey";
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_consent_records" DROP CONSTRAINT IF EXISTS "client_consent_records_clientId_fkey";
ALTER TABLE "client_consent_records" ADD CONSTRAINT "client_consent_records_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_credit_applications" DROP CONSTRAINT IF EXISTS "crm_credit_applications_clientId_fkey";
ALTER TABLE "crm_credit_applications" ADD CONSTRAINT "crm_credit_applications_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "crm_credit_applications" DROP CONSTRAINT IF EXISTS "crm_credit_applications_assignedAdvisorId_fkey";
ALTER TABLE "crm_credit_applications" ADD CONSTRAINT "crm_credit_applications_assignedAdvisorId_fkey" FOREIGN KEY ("assignedAdvisorId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_credit_applications" DROP CONSTRAINT IF EXISTS "crm_credit_applications_teamId_fkey";
ALTER TABLE "crm_credit_applications" ADD CONSTRAINT "crm_credit_applications_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "applicants" DROP CONSTRAINT IF EXISTS "applicants_applicationId_fkey";
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_applications" DROP CONSTRAINT IF EXISTS "bank_applications_applicationId_fkey";
ALTER TABLE "bank_applications" ADD CONSTRAINT "bank_applications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "simulation_snapshots" DROP CONSTRAINT IF EXISTS "simulation_snapshots_applicationId_fkey";
ALTER TABLE "simulation_snapshots" ADD CONSTRAINT "simulation_snapshots_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_audit_events" DROP CONSTRAINT IF EXISTS "access_audit_events_userId_fkey";
ALTER TABLE "access_audit_events" ADD CONSTRAINT "access_audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_audit_events" DROP CONSTRAINT IF EXISTS "access_audit_events_applicationId_fkey";
ALTER TABLE "access_audit_events" ADD CONSTRAINT "access_audit_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
