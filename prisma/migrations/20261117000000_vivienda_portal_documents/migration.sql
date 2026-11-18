BEGIN;
-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "portal_contact_recorded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "bank_document_requirements" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "document_upload_intents" ADD COLUMN     "applicant_id" TEXT,
ADD COLUMN     "customer_requirement_id" TEXT,
ADD COLUMN     "declared_category" "DocumentCategory",
ADD COLUMN     "declared_title" TEXT,
ADD COLUMN     "expected_revision" INTEGER,
ADD COLUMN     "lease_until" TIMESTAMP(3),
ADD COLUMN     "processed_version_id" TEXT,
ADD COLUMN     "processing_error_code" TEXT,
ADD COLUMN     "processing_token" TEXT,
ADD COLUMN     "queued_actor_role" TEXT,
ADD COLUMN     "queued_at" TIMESTAMP(3),
ADD COLUMN     "replace_version_id" TEXT;

-- CreateTable
CREATE TABLE "applicant_document_profiles" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "occupation" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "declares_income_tax" BOOLEAN,
    "property_rental_income" BOOLEAN,
    "vehicle_rental_income" BOOLEAN,
    "chamber_of_commerce_applies" BOOLEAN,
    "annual_financial_statements_apply" BOOLEAN,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicant_document_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_document_requirements" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slot_key" TEXT NOT NULL,
    "catalog_version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "period_label" TEXT,
    "applicability" TEXT NOT NULL,
    "applicability_reason" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_document_evidence" (
    "id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "document_version_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_document_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_document_reviews" (
    "id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "status" "DocumentReviewStatus" NOT NULL,
    "public_reason" TEXT NOT NULL,
    "review_version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_document_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_worker_heartbeats" (
    "worker_id" TEXT NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "scanner_ready" BOOLEAN NOT NULL,
    "scanner_engine" TEXT,

    CONSTRAINT "document_worker_heartbeats_pkey" PRIMARY KEY ("worker_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applicant_document_profiles_applicant_id_key" ON "applicant_document_profiles"("applicant_id");

-- CreateIndex
CREATE INDEX "applicant_document_profiles_application_id_idx" ON "applicant_document_profiles"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_document_profiles_applicant_id_application_id_key" ON "applicant_document_profiles"("applicant_id", "application_id");

-- CreateIndex
CREATE INDEX "customer_document_requirements_application_id_applicant_id_idx" ON "customer_document_requirements"("application_id", "applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_document_requirements_applicant_id_code_slot_key_c_key" ON "customer_document_requirements"("applicant_id", "code", "slot_key", "catalog_version");

-- CreateIndex
CREATE INDEX "customer_document_evidence_document_version_id_idx" ON "customer_document_evidence"("document_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_document_evidence_requirement_id_document_version__key" ON "customer_document_evidence"("requirement_id", "document_version_id");

-- CreateIndex
CREATE INDEX "customer_document_reviews_reviewer_user_id_idx" ON "customer_document_reviews"("reviewer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_document_reviews_evidence_id_review_version_key" ON "customer_document_reviews"("evidence_id", "review_version");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_id_applicationId_key" ON "applicants"("id", "applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "document_upload_intents_processed_version_id_key" ON "document_upload_intents"("processed_version_id");

-- CreateIndex
CREATE INDEX "document_upload_intents_status_queued_at_lease_until_idx" ON "document_upload_intents"("status", "queued_at", "lease_until");

-- CreateIndex
CREATE INDEX "document_upload_intents_customer_requirement_id_idx" ON "document_upload_intents"("customer_requirement_id");

-- AddForeignKey
ALTER TABLE "document_upload_intents" ADD CONSTRAINT "document_upload_intents_customer_requirement_id_fkey" FOREIGN KEY ("customer_requirement_id") REFERENCES "customer_document_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_document_profiles" ADD CONSTRAINT "applicant_document_profiles_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_document_profiles" ADD CONSTRAINT "applicant_document_profiles_applicant_id_application_id_fkey" FOREIGN KEY ("applicant_id", "application_id") REFERENCES "applicants"("id", "applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_requirements" ADD CONSTRAINT "customer_document_requirements_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_requirements" ADD CONSTRAINT "customer_document_requirements_applicant_id_application_id_fkey" FOREIGN KEY ("applicant_id", "application_id") REFERENCES "applicants"("id", "applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_evidence" ADD CONSTRAINT "customer_document_evidence_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "customer_document_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_evidence" ADD CONSTRAINT "customer_document_evidence_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_reviews" ADD CONSTRAINT "customer_document_reviews_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "customer_document_evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_document_reviews" ADD CONSTRAINT "customer_document_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Fail closed on unknown policy states, without changing existing financial records.
ALTER TABLE "applicant_document_profiles" ADD CONSTRAINT "document_profile_occupation_check" CHECK ("occupation" IN ('ASALARIADO','INDEPENDIENTE','UNKNOWN'));
ALTER TABLE "customer_document_requirements" ADD CONSTRAINT "customer_requirement_applicability_check" CHECK ("applicability" IN ('APPLIES','NOT_APPLICABLE','NEEDS_INFORMATION'));
ALTER TABLE "customer_document_reviews" ADD CONSTRAINT "customer_review_human_status_check" CHECK ("status" IN ('APPROVED','REJECTED') AND length("public_reason") BETWEEN 1 AND 2000);

COMMIT;
