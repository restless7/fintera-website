BEGIN;
-- AlterTable
ALTER TABLE "crm_credit_applications" ADD COLUMN     "commercial_revision" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "bank_stage_transitions" ADD COLUMN     "resolved_sla_deadline" TIMESTAMPTZ(3),
ADD COLUMN     "resolved_within_sla" BOOLEAN;

-- CreateTable
CREATE TABLE "commercial_leads" (
    "id" TEXT NOT NULL,
    "tracking_code" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "product_label" TEXT NOT NULL,
    "amount_cop" DECIMAL(18,2),
    "partner_name" TEXT,
    "capture" JSONB NOT NULL,
    "consent_version" TEXT NOT NULL,
    "consent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abuse_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assigned_advisor_id" TEXT,
    "team_id" TEXT,
    "next_action_at" TIMESTAMPTZ(3),
    "application_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commercial_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_commands" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_legacy_dispositions" (
    "legacy_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "disposition" TEXT NOT NULL,
    "application_id" TEXT,
    "reason" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commercial_legacy_dispositions_pkey" PRIMARY KEY ("legacy_id")
);

-- CreateTable
CREATE TABLE "commercial_contacts" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "lead_id" TEXT,
    "actor_user_id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "next_action_at" TIMESTAMPTZ(3),

    CONSTRAINT "commercial_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_handoffs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "delivered_at" TIMESTAMPTZ(3) NOT NULL,
    "evidence_reference" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,

    CONSTRAINT "commercial_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_conditions" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "due_at" TIMESTAMPTZ(3),
    "evidence_reference" TEXT,

    CONSTRAINT "commercial_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_disbursements" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "amount_cop" DECIMAL(18,2) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "evidence_reference" TEXT NOT NULL,
    "supersedes_id" TEXT,
    "actor_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_agreements" (
    "id" TEXT NOT NULL,
    "agreement_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "counterparty_type" TEXT NOT NULL,
    "counterparty_name" TEXT NOT NULL,
    "bank_id" TEXT,
    "partner_email" TEXT,
    "kind" TEXT NOT NULL,
    "rate_percent" DECIMAL(9,6),
    "fixed_amount_cop" DECIMAL(18,2),
    "trigger" TEXT NOT NULL,
    "valid_from" TIMESTAMPTZ(3) NOT NULL,
    "valid_until" TIMESTAMPTZ(3),
    "evidence_reference" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_receivables" (
    "agreement_key" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "bank_application_id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "trigger_reference" TEXT NOT NULL,
    "amount_cop" DECIMAL(18,2) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "due_at" TIMESTAMPTZ(3),
    "evidence_reference" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_receivables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_finance_entries" (
    "reverses_id" TEXT,
    "id" TEXT NOT NULL,
    "receivable_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount_cop" DECIMAL(18,2) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "evidence_reference" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,

    CONSTRAINT "commercial_finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_worker_heartbeats" (
    "id" TEXT NOT NULL,
    "last_heartbeat_at" TIMESTAMPTZ(3) NOT NULL,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_scan_at" TIMESTAMPTZ(3),
    "last_error_code" TEXT,

    CONSTRAINT "commercial_worker_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_notifications" (
    "application_revision" INTEGER NOT NULL,
    "client_updated_at" TIMESTAMPTZ(3) NOT NULL,
    "consent_record_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_APPROVAL',
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(3),
    "provider_key" TEXT NOT NULL,
    "provider_id" TEXT,
    "claimed_by" TEXT,
    "claimed_at" TIMESTAMPTZ(3),
    "lease_expires_at" TIMESTAMPTZ(3),
    "error_code" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commercial_leads_tracking_code_key" ON "commercial_leads"("tracking_code");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_leads_idempotency_key_key" ON "commercial_leads"("idempotency_key");

-- CreateIndex
CREATE INDEX "commercial_leads_assigned_advisor_id_created_at_idx" ON "commercial_leads"("assigned_advisor_id", "created_at");

-- CreateIndex
CREATE INDEX "commercial_leads_team_id_created_at_idx" ON "commercial_leads"("team_id", "created_at");

-- CreateIndex
CREATE INDEX "commercial_leads_abuse_hash_created_at_idx" ON "commercial_leads"("abuse_hash", "created_at");

-- CreateIndex
CREATE INDEX "commercial_leads_contact_email_created_at_idx" ON "commercial_leads"("contact_email", "created_at");

-- CreateIndex
CREATE INDEX "commercial_contacts_application_id_occurred_at_idx" ON "commercial_contacts"("application_id", "occurred_at");

-- CreateIndex
CREATE INDEX "commercial_contacts_lead_id_occurred_at_idx" ON "commercial_contacts"("lead_id", "occurred_at");

-- CreateIndex
CREATE INDEX "commercial_handoffs_application_id_idx" ON "commercial_handoffs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_handoffs_bank_application_id_reference_key" ON "commercial_handoffs"("bank_application_id", "reference");

-- CreateIndex
CREATE INDEX "commercial_conditions_application_id_idx" ON "commercial_conditions"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_disbursements_supersedes_id_key" ON "commercial_disbursements"("supersedes_id");

-- CreateIndex
CREATE INDEX "commercial_disbursements_application_id_idx" ON "commercial_disbursements"("application_id");

-- CreateIndex
CREATE INDEX "commercial_disbursements_bank_application_id_idx" ON "commercial_disbursements"("bank_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_agreements_agreement_key_version_key" ON "commercial_agreements"("agreement_key", "version");

-- CreateIndex
CREATE INDEX "commercial_receivables_application_id_idx" ON "commercial_receivables"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_receivables_bank_application_id_agreement_id_tri_key" ON "commercial_receivables"("bank_application_id", "agreement_id", "trigger_reference");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_receivables_bank_application_id_agreement_key_key" ON "commercial_receivables"("bank_application_id", "agreement_key");

-- CreateIndex
CREATE INDEX "commercial_finance_entries_occurred_at_idx" ON "commercial_finance_entries"("occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_finance_entries_receivable_id_kind_reference_key" ON "commercial_finance_entries"("receivable_id", "kind", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_notifications_provider_key_key" ON "commercial_notifications"("provider_key");

-- CreateIndex
CREATE INDEX "commercial_notifications_application_id_created_at_idx" ON "commercial_notifications"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "commercial_notifications_status_created_at_idx" ON "commercial_notifications"("status", "created_at");

-- AddForeignKey
ALTER TABLE "commercial_leads" ADD CONSTRAINT "commercial_leads_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_legacy_dispositions" ADD CONSTRAINT "commercial_legacy_dispositions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_contacts" ADD CONSTRAINT "commercial_contacts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_handoffs" ADD CONSTRAINT "commercial_handoffs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_conditions" ADD CONSTRAINT "commercial_conditions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_disbursements" ADD CONSTRAINT "commercial_disbursements_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_receivables" ADD CONSTRAINT "commercial_receivables_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "crm_credit_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_receivables" ADD CONSTRAINT "commercial_receivables_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "commercial_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_finance_entries" ADD CONSTRAINT "commercial_finance_entries_reverses_id_fkey" FOREIGN KEY ("reverses_id") REFERENCES "commercial_finance_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_finance_entries" ADD CONSTRAINT "commercial_finance_entries_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "commercial_receivables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE role_permission_policies DROP CONSTRAINT role_permission_policies_known_permissions;
ALTER TABLE role_permission_policies ADD CONSTRAINT role_permission_policies_known_permissions CHECK (cardinality(permissions)<=19 AND array_position(permissions,NULL) IS NULL AND permissions <@ ARRAY['crm:lead:read','crm:lead:create','crm:lead:assign','crm:application:read','crm:application:create','crm:application:update','crm:application:transition','crm:bank-case:manage','crm:document:read','crm:document:review','crm:document:upload','crm:policy:read','crm:policy:propose','crm:policy:approve','crm:policy:rollback','crm:report:read','crm:audit:read','crm:commercial:finance:read','crm:commercial:finance:write']::text[]);
ALTER TABLE role_permission_policies ADD CONSTRAINT commercial_finance_role_ceiling CHECK (role='COMMERCIAL_DIRECTOR' OR NOT (permissions && ARRAY['crm:commercial:finance:read','crm:commercial:finance:write']::text[]));

ALTER TABLE commercial_leads ADD CONSTRAINT commercial_lead_state CHECK (status IN ('NEW','CONTACTED','QUALIFIED','LOST','CONVERTED'));
ALTER TABLE commercial_leads ADD CONSTRAINT commercial_lead_amount CHECK(amount_cop IS NULL OR amount_cop>0);
ALTER TABLE commercial_conditions ADD CONSTRAINT commercial_condition_state CHECK(status IN ('OPEN','SATISFIED','WAIVED'));
ALTER TABLE commercial_contacts ADD CONSTRAINT commercial_contact_target CHECK ((application_id IS NULL) <> (lead_id IS NULL));
ALTER TABLE commercial_contacts ADD CONSTRAINT commercial_contact_lead_fk FOREIGN KEY(lead_id) REFERENCES commercial_leads(id) ON DELETE RESTRICT;
ALTER TABLE commercial_disbursements ADD CONSTRAINT commercial_disbursement_positive CHECK(amount_cop>0);
ALTER TABLE commercial_disbursements ADD CONSTRAINT commercial_disbursement_previous_fk FOREIGN KEY(supersedes_id) REFERENCES commercial_disbursements(id) ON DELETE RESTRICT;
ALTER TABLE commercial_agreements ADD CONSTRAINT commercial_agreement_terms CHECK((kind='RATE' AND rate_percent>0 AND rate_percent<=100 AND fixed_amount_cop IS NULL) OR (kind='FIXED' AND fixed_amount_cop>0 AND rate_percent IS NULL));
ALTER TABLE commercial_agreements ADD CONSTRAINT commercial_agreement_payer CHECK((counterparty_type='BANK' AND bank_id IS NOT NULL) OR (counterparty_type='ALLY' AND partner_email IS NOT NULL));
ALTER TABLE commercial_agreements ADD CONSTRAINT commercial_agreement_trigger CHECK(trigger IN ('BANK_FILING','DISBURSEMENT') AND NOT(kind='RATE' AND trigger='BANK_FILING'));
ALTER TABLE commercial_agreements ADD CONSTRAINT commercial_agreement_validity CHECK(valid_until IS NULL OR valid_until>valid_from);
ALTER TABLE commercial_receivables ADD CONSTRAINT commercial_receivable_positive CHECK(amount_cop>0);
ALTER TABLE commercial_finance_entries ADD CONSTRAINT commercial_entry_amount CHECK((kind='COLLECTION' AND amount_cop>0 AND reverses_id IS NULL) OR (kind='COST' AND amount_cop>=0 AND reverses_id IS NULL) OR (kind='ADJUSTMENT' AND amount_cop<>0 AND reverses_id IS NULL) OR(kind IN ('COLLECTION_REVERSAL','COST_REVERSAL') AND amount_cop>0 AND reverses_id IS NOT NULL));
ALTER TABLE commercial_notifications ADD CONSTRAINT commercial_notification_status CHECK(status IN ('AWAITING_APPROVAL','QUEUED','CLAIMED','PROVIDER_ACCEPTED','FAILED','UNKNOWN','DELIVERED','BOUNCED'));
ALTER TABLE commercial_notifications ADD CONSTRAINT commercial_notification_case_fk FOREIGN KEY(application_id) REFERENCES crm_credit_applications(id) ON DELETE RESTRICT;
COMMIT;
