-- CreateEnum
CREATE TYPE "AccountLinkStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED_MAX_ATTEMPTS', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerGrantRole" AS ENUM ('PRIMARY_HOLDER', 'CO_APPLICANT', 'AUTHORIZED_REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('CUSTOMER', 'ADVISOR');

-- CreateTable
CREATE TABLE "customer_account_link_attempts" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "client_id" TEXT,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "hashed_verifier" TEXT NOT NULL,
    "verification_channel" TEXT NOT NULL,
    "target_phone" TEXT,
    "target_email" TEXT,
    "status" "AccountLinkStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_account_link_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_access_grants" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "application_id" TEXT,
    "applicant_id" TEXT,
    "grant_role" "CustomerGrantRole" NOT NULL DEFAULT 'PRIMARY_HOLDER',
    "can_view_application" BOOLEAN NOT NULL DEFAULT true,
    "can_view_documents" BOOLEAN NOT NULL DEFAULT true,
    "can_upload_documents" BOOLEAN NOT NULL DEFAULT true,
    "can_message_advisor" BOOLEAN NOT NULL DEFAULT true,
    "effective_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "granted_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_published_events" (
    "id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "canonical_stage" "BankStage" NOT NULL,
    "public_stage_title" TEXT NOT NULL,
    "public_explanation" TEXT NOT NULL,
    "action_required_note" TEXT,
    "published_by_user_id" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_published_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_messages" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sender_type" "MessageSenderType" NOT NULL,
    "sender_clerk_user_id" TEXT,
    "sender_user_id" TEXT,
    "sender_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_internal_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrative_exception_records" (
    "id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "target_stage" "BankStage" NOT NULL,
    "requested_by_user_id" TEXT NOT NULL,
    "approved_by_user_id" TEXT NOT NULL,
    "approval_code" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "supporting_evidence_ref" TEXT NOT NULL,
    "bank_filing_number" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administrative_exception_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_account_link_attempts_clerk_user_id_status_idx" ON "customer_account_link_attempts"("clerk_user_id", "status");

-- CreateIndex
CREATE INDEX "customer_account_link_attempts_document_type_document_numbe_idx" ON "customer_account_link_attempts"("document_type", "document_number");

-- CreateIndex
CREATE INDEX "customer_access_grants_clerk_user_id_revoked_at_idx" ON "customer_access_grants"("clerk_user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "customer_access_grants_client_id_idx" ON "customer_access_grants"("client_id");

-- CreateIndex
CREATE INDEX "customer_access_grants_application_id_idx" ON "customer_access_grants"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_access_grants_clerk_user_id_client_id_application__key" ON "customer_access_grants"("clerk_user_id", "client_id", "application_id", "applicant_id");

-- CreateIndex
CREATE INDEX "customer_published_events_bank_application_id_is_revoked_pu_idx" ON "customer_published_events"("bank_application_id", "is_revoked", "published_at");

-- CreateIndex
CREATE INDEX "customer_messages_application_id_created_at_idx" ON "customer_messages"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "administrative_exception_records_bank_application_id_approv_idx" ON "administrative_exception_records"("bank_application_id", "approval_code");

-- AddForeignKey
ALTER TABLE "customer_access_grants" ADD CONSTRAINT "customer_access_grants_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_access_grants" ADD CONSTRAINT "customer_access_grants_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_access_grants" ADD CONSTRAINT "customer_access_grants_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_published_events" ADD CONSTRAINT "customer_published_events_bank_application_id_fkey" FOREIGN KEY ("bank_application_id") REFERENCES "bank_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_published_events" ADD CONSTRAINT "customer_published_events_published_by_user_id_fkey" FOREIGN KEY ("published_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_messages" ADD CONSTRAINT "customer_messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_messages" ADD CONSTRAINT "customer_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_exception_records" ADD CONSTRAINT "administrative_exception_records_bank_application_id_fkey" FOREIGN KEY ("bank_application_id") REFERENCES "bank_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_exception_records" ADD CONSTRAINT "administrative_exception_records_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_exception_records" ADD CONSTRAINT "administrative_exception_records_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
