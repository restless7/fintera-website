-- Migration Phase 6.2: CRM Operational Core (Activities, Next Action, Lead Source, Bank Subcase Notes)

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'STATUS_CHANGE', 'BANK_UPDATE', 'TASK');

-- AlterTable crm_credit_applications
ALTER TABLE "crm_credit_applications" ADD COLUMN IF NOT EXISTS "leadSource" TEXT DEFAULT 'SIMULATOR_WEB';
ALTER TABLE "crm_credit_applications" ADD COLUMN IF NOT EXISTS "nextActionDate" TIMESTAMP(3);
ALTER TABLE "crm_credit_applications" ADD COLUMN IF NOT EXISTS "nextActionNote" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_credit_applications_nextActionDate_idx" ON "crm_credit_applications"("nextActionDate");

-- AlterTable bank_applications
ALTER TABLE "bank_applications" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "bank_applications" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- CreateTable crm_activities
CREATE TABLE IF NOT EXISTS "crm_activities" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "ActivityType" NOT NULL DEFAULT 'NOTE',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isInternalOnly" BOOLEAN NOT NULL DEFAULT true,
    "nextActionDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_activities_applicationId_idx" ON "crm_activities"("applicationId");
CREATE INDEX IF NOT EXISTS "crm_activities_authorId_idx" ON "crm_activities"("authorId");
CREATE INDEX IF NOT EXISTS "crm_activities_createdAt_idx" ON "crm_activities"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'crm_activities_applicationId_fkey'
    ) THEN
        ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'crm_activities_authorId_fkey'
    ) THEN
        ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
