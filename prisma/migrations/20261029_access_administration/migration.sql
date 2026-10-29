-- Additive access administration; no business/customer rows are modified.
ALTER TABLE "app_users" ADD COLUMN "accessRevision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "teams" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "role_permission_policies" (
  "role" "UserRole" NOT NULL,
  "permissions" TEXT[] NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "role_permission_policies_pkey" PRIMARY KEY ("role"),
  CONSTRAINT "role_permission_policies_editable_roles" CHECK ("role" IN ('COMMERCIAL_DIRECTOR','SUPERVISOR','COMMERCIAL_ADVISOR','DOCUMENT_ANALYST','OPERATIONS_OFFICER')),
  CONSTRAINT "role_permission_policies_known_permissions" CHECK (cardinality("permissions") <= 17 AND array_position("permissions", NULL) IS NULL AND "permissions" <@ ARRAY['crm:lead:read','crm:lead:create','crm:lead:assign','crm:application:read','crm:application:create','crm:application:update','crm:application:transition','crm:bank-case:manage','crm:document:read','crm:document:review','crm:document:upload','crm:policy:read','crm:policy:propose','crm:policy:approve','crm:policy:rollback','crm:report:read','crm:audit:read']::TEXT[])
);
