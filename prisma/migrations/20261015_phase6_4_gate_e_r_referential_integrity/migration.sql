-- Migration: 20261015_phase6_4_gate_e_r_referential_integrity
-- FASE 6.4: GATE E-R — REMEDIACIÓN DE INTEGRIDAD REFERENCIAL Y PRESERVACIÓN HISTÓRICA
-- Sustituye ON DELETE CASCADE por ON DELETE RESTRICT / SET NULL en evidencias documentales e historial

-- 1. client_consent_records -> clients
ALTER TABLE "client_consent_records" DROP CONSTRAINT IF EXISTS "client_consent_records_clientId_fkey";
ALTER TABLE "client_consent_records" ADD CONSTRAINT "client_consent_records_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. applicants -> crm_credit_applications
ALTER TABLE "applicants" DROP CONSTRAINT IF EXISTS "applicants_applicationId_fkey";
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. bank_applications -> crm_credit_applications
ALTER TABLE "bank_applications" DROP CONSTRAINT IF EXISTS "bank_applications_applicationId_fkey";
ALTER TABLE "bank_applications" ADD CONSTRAINT "bank_applications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. crm_activities -> crm_credit_applications
ALTER TABLE "crm_activities" DROP CONSTRAINT IF EXISTS "crm_activities_applicationId_fkey";
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. access_audit_events -> crm_credit_applications
ALTER TABLE "access_audit_events" DROP CONSTRAINT IF EXISTS "access_audit_events_applicationId_fkey";
ALTER TABLE "access_audit_events" ADD CONSTRAINT "access_audit_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "crm_credit_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. bank_stage_transitions -> bank_applications
ALTER TABLE "bank_stage_transitions" DROP CONSTRAINT IF EXISTS "bank_stage_transitions_bankApplicationId_fkey";
ALTER TABLE "bank_stage_transitions" ADD CONSTRAINT "bank_stage_transitions_bankApplicationId_fkey" FOREIGN KEY ("bankApplicationId") REFERENCES "bank_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. document_assets -> crm_credit_applications
ALTER TABLE "document_assets" DROP CONSTRAINT IF EXISTS "document_assets_application_id_fkey";
ALTER TABLE "document_assets" ADD CONSTRAINT "document_assets_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. document_versions -> document_assets
ALTER TABLE "document_versions" DROP CONSTRAINT IF EXISTS "document_versions_asset_id_fkey";
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "document_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. bank_document_requirements -> bank_applications
ALTER TABLE "bank_document_requirements" DROP CONSTRAINT IF EXISTS "bank_document_requirements_bank_application_id_fkey";
ALTER TABLE "bank_document_requirements" ADD CONSTRAINT "bank_document_requirements_bank_application_id_fkey" FOREIGN KEY ("bank_application_id") REFERENCES "bank_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 10. document_requirement_evidences -> bank_document_requirements
ALTER TABLE "document_requirement_evidences" DROP CONSTRAINT IF EXISTS "document_requirement_evidences_requirement_id_fkey";
ALTER TABLE "document_requirement_evidences" ADD CONSTRAINT "document_requirement_evidences_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "bank_document_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. document_bank_reviews -> bank_applications & bank_document_requirements
ALTER TABLE "document_bank_reviews" DROP CONSTRAINT IF EXISTS "document_bank_reviews_bank_application_id_fkey";
ALTER TABLE "document_bank_reviews" ADD CONSTRAINT "document_bank_reviews_bank_application_id_fkey" FOREIGN KEY ("bank_application_id") REFERENCES "bank_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "document_bank_reviews" DROP CONSTRAINT IF EXISTS "document_bank_reviews_requirement_id_fkey";
ALTER TABLE "document_bank_reviews" ADD CONSTRAINT "document_bank_reviews_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "bank_document_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 12. document_upload_intents -> crm_credit_applications
ALTER TABLE "document_upload_intents" DROP CONSTRAINT IF EXISTS "document_upload_intents_application_id_fkey";
ALTER TABLE "document_upload_intents" ADD CONSTRAINT "document_upload_intents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
