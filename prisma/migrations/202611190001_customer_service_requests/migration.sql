BEGIN;
-- CreateTable
CREATE TABLE "customer_service_requests" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "browser_proof_hash" TEXT NOT NULL,
    "abuse_hash" TEXT NOT NULL,
    "credit_kind" TEXT NOT NULL,
    "amount_cop" DECIMAL(18,2) NOT NULL,
    "name" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "quick_snapshot" JSONB NOT NULL,
    "quick_consent" JSONB NOT NULL,
    "claim_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "claimed_clerk_user_id" TEXT,
    "claimed_at" TIMESTAMPTZ(3),
    "revision" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "formal_snapshot" JSONB,
    "formal_payload_hash" TEXT,
    "submission_command_id" TEXT,
    "formal_receipts" JSONB,
    "submitted_at" TIMESTAMPTZ(3),
    "assigned_advisor_id" TEXT,
    "team_id" TEXT,
    "next_action_at" TIMESTAMPTZ(3),
    "public_message" TEXT,
    "application_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customer_service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_service_requests_idempotency_key_key" ON "customer_service_requests"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "customer_service_requests_submission_command_id_key" ON "customer_service_requests"("submission_command_id");

-- CreateIndex
CREATE INDEX "customer_service_requests_claimed_clerk_user_id_created_at_idx" ON "customer_service_requests"("claimed_clerk_user_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_service_requests_browser_proof_hash_created_at_idx" ON "customer_service_requests"("browser_proof_hash", "created_at");

-- CreateIndex
CREATE INDEX "customer_service_requests_abuse_hash_created_at_idx" ON "customer_service_requests"("abuse_hash", "created_at");

-- CreateIndex
CREATE INDEX "customer_service_requests_email_created_at_idx" ON "customer_service_requests"("email", "created_at");

-- CreateIndex
CREATE INDEX "customer_service_requests_assigned_advisor_id_created_at_idx" ON "customer_service_requests"("assigned_advisor_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_service_requests_team_id_created_at_idx" ON "customer_service_requests"("team_id", "created_at");

-- AddForeignKey
ALTER TABLE "customer_service_requests" ADD CONSTRAINT "customer_service_requests_assigned_advisor_id_fkey" FOREIGN KEY ("assigned_advisor_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_service_requests" ADD CONSTRAINT "customer_service_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_service_requests" ADD CONSTRAINT "customer_service_requests_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE customer_service_requests
 ADD CONSTRAINT customer_service_kind CHECK(credit_kind IN ('VIVIENDA','LIBRE_DESTINO','LIBRANZA','VEHICULO')),
 ADD CONSTRAINT customer_service_activity CHECK(activity IN ('ASALARIADO','INDEPENDIENTE','PENSIONADO','OTRO')),
 ADD CONSTRAINT customer_service_amount CHECK(amount_cop>0),
 ADD CONSTRAINT customer_service_status CHECK(status IN ('DRAFT','SUBMITTED','IN_REVIEW','CLOSED')),
 ADD CONSTRAINT customer_service_revision CHECK(revision>=0),
 ADD CONSTRAINT customer_service_claim CHECK ((claimed_clerk_user_id IS NULL)=(claimed_at IS NULL)),
 ADD CONSTRAINT customer_service_submission CHECK (
  (status='DRAFT' AND submitted_at IS NULL AND formal_snapshot IS NULL AND formal_payload_hash IS NULL AND submission_command_id IS NULL AND formal_receipts IS NULL) OR
  (status<>'DRAFT' AND submitted_at IS NOT NULL AND formal_snapshot IS NOT NULL AND formal_payload_hash IS NOT NULL AND submission_command_id IS NOT NULL AND formal_receipts IS NOT NULL AND claimed_clerk_user_id IS NOT NULL)
 ),
 ADD CONSTRAINT customer_service_link CHECK (application_id IS NULL OR (status<>'DRAFT' AND claimed_clerk_user_id IS NOT NULL));
CREATE INDEX "customer_service_requests_created_at_idx" ON "customer_service_requests"("created_at");
COMMIT;
