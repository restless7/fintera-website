-- AlterTable
ALTER TABLE "bank_applications" ADD COLUMN IF NOT EXISTS "assignedOperatorId" TEXT,
ADD COLUMN IF NOT EXISTS "slaEffectiveDeadline" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "slaPausedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "slaStatus" TEXT NOT NULL DEFAULT 'ON_TRACK',
ADD COLUMN IF NOT EXISTS "slaTotalPausedMs" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "workflowVersion" TEXT NOT NULL DEFAULT 'v1.0';

-- DropIndex on credit_requests if exists to allow multiple requests per client (Remediation B)
DROP INDEX IF EXISTS "credit_requests_documentNumber_key";
DROP INDEX IF EXISTS "credit_applications_documentNumber_key";

-- CreateTable bank_stage_transitions
CREATE TABLE IF NOT EXISTS "bank_stage_transitions" (
    "id" TEXT NOT NULL,
    "bankApplicationId" TEXT NOT NULL,
    "fromStage" "BankStage" NOT NULL,
    "toStage" "BankStage" NOT NULL,
    "workflowVersion" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceType" TEXT,
    "evidenceReference" TEXT,
    "evidenceMetadata" JSONB,
    "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_stage_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable crm_idempotency_records (Remediation A)
CREATE TABLE IF NOT EXISTS "crm_idempotency_records" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'CREDIT_REQUEST_INTAKE',
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responsePayload" JSONB,
    "applicationId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable domain_outbox_events
CREATE TABLE IF NOT EXISTS "domain_outbox_events" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bank_stage_transitions_bankApplicationId_transitionedAt_idx" ON "bank_stage_transitions"("bankApplicationId", "transitionedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "crm_idempotency_records_key_key" ON "crm_idempotency_records"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_idempotency_records_key_scope_idx" ON "crm_idempotency_records"("key", "scope");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "domain_outbox_events_aggregateType_aggregateId_idx" ON "domain_outbox_events"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "domain_outbox_events_published_createdAt_idx" ON "domain_outbox_events"("published", "createdAt");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bank_applications_assignedOperatorId_fkey'
    ) THEN
        ALTER TABLE "bank_applications" ADD CONSTRAINT "bank_applications_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bank_stage_transitions_bankApplicationId_fkey'
    ) THEN
        ALTER TABLE "bank_stage_transitions" ADD CONSTRAINT "bank_stage_transitions_bankApplicationId_fkey" FOREIGN KEY ("bankApplicationId") REFERENCES "bank_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bank_stage_transitions_actorUserId_fkey'
    ) THEN
        ALTER TABLE "bank_stage_transitions" ADD CONSTRAINT "bank_stage_transitions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
