-- AlterTable
ALTER TABLE "domain_outbox_events" ADD COLUMN     "causationId" TEXT,
ADD COLUMN     "correlationId" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN     "leaseOwner" TEXT,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "otp_delivery_envelopes" (
    "id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "encrypted_otp" TEXT NOT NULL,
    "target_masked" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_delivery_envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_consumer_receipts" (
    "id" TEXT NOT NULL,
    "consumer_name" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "result_summary" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_consumer_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_dispatch_logs" (
    "id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CAPTURED_LOCAL',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_dispatch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_automation_tasks" (
    "id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "dedup_key" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "bank_application_id" TEXT,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assigned_role" TEXT NOT NULL,
    "assigned_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "action_required" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_automation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_daily_conversion_metrics" (
    "id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "bank_id" TEXT,
    "leads_captured" INTEGER NOT NULL DEFAULT 0,
    "prequalified" INTEGER NOT NULL DEFAULT 0,
    "docs_submitted" INTEGER NOT NULL DEFAULT 0,
    "bank_submissions" INTEGER NOT NULL DEFAULT 0,
    "conditional_approvals" INTEGER NOT NULL DEFAULT 0,
    "definitive_approvals" INTEGER NOT NULL DEFAULT 0,
    "disbursed_count" INTEGER NOT NULL DEFAULT 0,
    "disbursed_amount_cop" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "avg_turnaround_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bi_daily_conversion_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_bank_performance_metrics" (
    "id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "month_period" TEXT NOT NULL,
    "total_cases" INTEGER NOT NULL DEFAULT 0,
    "approved_cases" INTEGER NOT NULL DEFAULT 0,
    "rejected_cases" INTEGER NOT NULL DEFAULT 0,
    "avg_time_to_approval_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_time_to_disbursement_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sla_compliance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_bank_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bi_advisor_workload_metrics" (
    "id" TEXT NOT NULL,
    "advisor_user_id" TEXT NOT NULL,
    "active_applications" INTEGER NOT NULL DEFAULT 0,
    "overdue_tasks" INTEGER NOT NULL DEFAULT 0,
    "messages_pending" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bi_advisor_workload_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "otp_delivery_envelopes_challenge_id_key" ON "otp_delivery_envelopes"("challenge_id");

-- CreateIndex
CREATE INDEX "otp_delivery_envelopes_challenge_id_idx" ON "otp_delivery_envelopes"("challenge_id");

-- CreateIndex
CREATE INDEX "otp_delivery_envelopes_status_expires_at_idx" ON "otp_delivery_envelopes"("status", "expires_at");

-- CreateIndex
CREATE INDEX "outbox_consumer_receipts_consumer_name_idx" ON "outbox_consumer_receipts"("consumer_name");

-- CreateIndex
CREATE INDEX "outbox_consumer_receipts_event_id_idx" ON "outbox_consumer_receipts"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_consumer_receipts_consumer_name_event_id_key" ON "outbox_consumer_receipts"("consumer_name", "event_id");

-- CreateIndex
CREATE INDEX "notification_dispatch_logs_recipient_id_idx" ON "notification_dispatch_logs"("recipient_id");

-- CreateIndex
CREATE INDEX "notification_dispatch_logs_channel_idx" ON "notification_dispatch_logs"("channel");

-- CreateIndex
CREATE INDEX "notification_dispatch_logs_created_at_idx" ON "notification_dispatch_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sla_automation_tasks_dedup_key_key" ON "sla_automation_tasks"("dedup_key");

-- CreateIndex
CREATE INDEX "sla_automation_tasks_rule_code_idx" ON "sla_automation_tasks"("rule_code");

-- CreateIndex
CREATE INDEX "sla_automation_tasks_application_id_idx" ON "sla_automation_tasks"("application_id");

-- CreateIndex
CREATE INDEX "sla_automation_tasks_assigned_user_id_status_idx" ON "sla_automation_tasks"("assigned_user_id", "status");

-- CreateIndex
CREATE INDEX "bi_daily_conversion_metrics_metric_date_idx" ON "bi_daily_conversion_metrics"("metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "bi_daily_conversion_metrics_metric_date_bank_id_key" ON "bi_daily_conversion_metrics"("metric_date", "bank_id");

-- CreateIndex
CREATE INDEX "bi_bank_performance_metrics_bank_id_idx" ON "bi_bank_performance_metrics"("bank_id");

-- CreateIndex
CREATE UNIQUE INDEX "bi_bank_performance_metrics_bank_id_month_period_key" ON "bi_bank_performance_metrics"("bank_id", "month_period");

-- CreateIndex
CREATE UNIQUE INDEX "bi_advisor_workload_metrics_advisor_user_id_key" ON "bi_advisor_workload_metrics"("advisor_user_id");

-- CreateIndex
CREATE INDEX "bi_advisor_workload_metrics_advisor_user_id_idx" ON "bi_advisor_workload_metrics"("advisor_user_id");

-- CreateIndex
CREATE INDEX "domain_outbox_events_status_nextRetryAt_idx" ON "domain_outbox_events"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "domain_outbox_events_leaseOwner_leaseExpiresAt_idx" ON "domain_outbox_events"("leaseOwner", "leaseExpiresAt");
