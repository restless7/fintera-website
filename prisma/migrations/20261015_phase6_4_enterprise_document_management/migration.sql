-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('IDENTIFICATION', 'LABOR_INCOME', 'INDEPENDENT_INCOME', 'PENSION_INCOME', 'PROPERTY_DOCS', 'COLEX_CONSULAR', 'TAX_FINANCIAL', 'BANK_FORMS');

-- CreateEnum
CREATE TYPE "DocumentScanStatus" AS ENUM ('PENDING_SCAN', 'SCANNING', 'CLEAN', 'QUARANTINED', 'INFECTED', 'SCAN_FAILED');

-- CreateEnum
CREATE TYPE "DocumentReviewStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentLifecycleStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "RequirementApplicabilityStatus" AS ENUM ('APPLICABLE', 'WAIVED_WITH_AUTHORIZATION', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "UploadIntentStatus" AS ENUM ('INTENT_CREATED', 'AWAITING_UPLOAD', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequirementClassification" AS ENUM ('OFFICIAL_DOCUMENTED', 'FINTERA_INTERNAL_POLICY', 'PENDING_BANK_CONFIRMATION');

-- AlterTable
ALTER TABLE "app_users" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "applicants" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bank_applications" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bank_policies" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_credit_applications" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "outbox_events" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "teams" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "document_assets" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "applicant_id" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "current_version_id" TEXT,
    "lifecycleStatus" "DocumentLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "storage_key" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "detected_mime_type" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "scanStatus" "DocumentScanStatus" NOT NULL DEFAULT 'PENDING_SCAN',
    "scan_engine" TEXT,
    "scan_completed_at" TIMESTAMP(3),
    "scan_details" TEXT,
    "uploaded_by_user_id" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "superseded_at" TIMESTAMP(3),

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirement_definitions" (
    "id" TEXT NOT NULL,
    "requirement_code" TEXT NOT NULL,
    "bank_id" TEXT,
    "product_type" TEXT,
    "applicant_profile" TEXT NOT NULL DEFAULT 'TODOS',
    "requirement_version" TEXT NOT NULL DEFAULT 'v1.0',
    "effective_date" TEXT NOT NULL DEFAULT '2026-01-01',
    "source_document" TEXT,
    "source_classification" "RequirementClassification" NOT NULL DEFAULT 'OFFICIAL_DOCUMENTED',
    "category" "DocumentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "validity_days" INTEGER,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "allowed_mime_types" TEXT[] DEFAULT ARRAY['application/pdf', 'image/jpeg', 'image/png']::TEXT[],
    "max_size_bytes" INTEGER NOT NULL DEFAULT 15728640,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_requirement_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_document_requirements" (
    "id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "applicant_id" TEXT,
    "requirement_definition_id" TEXT NOT NULL,
    "requirement_version" TEXT NOT NULL DEFAULT 'v1.0',
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "applicability_status" "RequirementApplicabilityStatus" NOT NULL DEFAULT 'APPLICABLE',
    "waiver_reason" TEXT,
    "waived_by_user_id" TEXT,
    "due_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirement_evidences" (
    "id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "document_version_id" TEXT NOT NULL,
    "attached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attached_by_user_id" TEXT,

    CONSTRAINT "document_requirement_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_bank_reviews" (
    "id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "document_version_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT,
    "status" "DocumentReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejection_reason_code" TEXT,
    "rejection_reason_description" TEXT,
    "internal_notes" TEXT,
    "customer_visible_notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "review_version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_bank_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_upload_intents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "requirement_id" TEXT,
    "generated_storage_key" TEXT NOT NULL,
    "declared_file_name" TEXT NOT NULL,
    "declared_mime_type" TEXT NOT NULL,
    "max_allowed_bytes" INTEGER NOT NULL DEFAULT 15728640,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "UploadIntentStatus" NOT NULL DEFAULT 'INTENT_CREATED',
    "confirmed_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_upload_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_audits" (
    "id" TEXT NOT NULL,
    "document_version_id" TEXT,
    "asset_id" TEXT,
    "application_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "is_authorized" BOOLEAN NOT NULL,
    "denial_reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_access_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_assets_application_id_idx" ON "document_assets"("application_id");

-- CreateIndex
CREATE INDEX "document_assets_applicant_id_idx" ON "document_assets"("applicant_id");

-- CreateIndex
CREATE INDEX "document_versions_storage_key_idx" ON "document_versions"("storage_key");

-- CreateIndex
CREATE INDEX "document_versions_sha256_idx" ON "document_versions"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_asset_id_versionNumber_key" ON "document_versions"("asset_id", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "document_requirement_definitions_requirement_code_key" ON "document_requirement_definitions"("requirement_code");

-- CreateIndex
CREATE INDEX "document_requirement_definitions_bank_id_product_type_appli_idx" ON "document_requirement_definitions"("bank_id", "product_type", "applicant_profile");

-- CreateIndex
CREATE INDEX "bank_document_requirements_bank_application_id_is_mandatory_idx" ON "bank_document_requirements"("bank_application_id", "is_mandatory");

-- CreateIndex
CREATE UNIQUE INDEX "bank_document_requirements_bank_application_id_requirement__key" ON "bank_document_requirements"("bank_application_id", "requirement_definition_id", "applicant_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_requirement_evidences_requirement_id_document_vers_key" ON "document_requirement_evidences"("requirement_id", "document_version_id");

-- CreateIndex
CREATE INDEX "document_bank_reviews_bank_application_id_status_idx" ON "document_bank_reviews"("bank_application_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "document_bank_reviews_requirement_id_document_version_id_re_key" ON "document_bank_reviews"("requirement_id", "document_version_id", "review_version");

-- CreateIndex
CREATE UNIQUE INDEX "document_upload_intents_generated_storage_key_key" ON "document_upload_intents"("generated_storage_key");

-- CreateIndex
CREATE INDEX "document_upload_intents_application_id_status_idx" ON "document_upload_intents"("application_id", "status");

-- CreateIndex
CREATE INDEX "document_access_audits_application_id_timestamp_idx" ON "document_access_audits"("application_id", "timestamp");

-- CreateIndex
CREATE INDEX "document_access_audits_actor_user_id_timestamp_idx" ON "document_access_audits"("actor_user_id", "timestamp");

-- AddForeignKey
ALTER TABLE "document_assets" ADD CONSTRAINT "document_assets_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_assets" ADD CONSTRAINT "document_assets_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "document_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_document_requirements" ADD CONSTRAINT "bank_document_requirements_bank_application_id_fkey" FOREIGN KEY ("bank_application_id") REFERENCES "bank_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_document_requirements" ADD CONSTRAINT "bank_document_requirements_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_document_requirements" ADD CONSTRAINT "bank_document_requirements_requirement_definition_id_fkey" FOREIGN KEY ("requirement_definition_id") REFERENCES "document_requirement_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requirement_evidences" ADD CONSTRAINT "document_requirement_evidences_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "bank_document_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requirement_evidences" ADD CONSTRAINT "document_requirement_evidences_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_bank_reviews" ADD CONSTRAINT "document_bank_reviews_bank_application_id_fkey" FOREIGN KEY ("bank_application_id") REFERENCES "bank_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_bank_reviews" ADD CONSTRAINT "document_bank_reviews_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "bank_document_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_bank_reviews" ADD CONSTRAINT "document_bank_reviews_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_bank_reviews" ADD CONSTRAINT "document_bank_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_upload_intents" ADD CONSTRAINT "document_upload_intents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_upload_intents" ADD CONSTRAINT "document_upload_intents_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_upload_intents" ADD CONSTRAINT "document_upload_intents_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "bank_document_requirements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_audits" ADD CONSTRAINT "document_access_audits_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_audits" ADD CONSTRAINT "document_access_audits_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "document_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

