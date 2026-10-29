import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DashboardService } from "@/lib/crm/dashboard-service";
import { RbacService } from "./rbac-service";
import type { AuthContext, Permission } from "./types";

type ApiAuthorization = { context: AuthContext; response?: never } | { context?: never; response: NextResponse };

/** Internal API identities come exclusively from the verified Clerk server session. */
export async function authorizeAdminApi(permission: Permission, applicationId?: string): Promise<ApiAuthorization> {
  let clerkUserId: string | null;
  try {
    clerkUserId = (await auth()).userId;
  } catch {
    return { response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (!clerkUserId) return { response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  const context = await RbacService.resolveAuthContext(clerkUserId);
  if (!context || context.role === "CLIENT" || !context.permissions.includes(permission)) {
    return { response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) };
  }
  if (applicationId) {
    const decision = await RbacService.authorize({ permission, clerkUserId, scope: { applicationId }, logAudit: false });
    if (!decision.authorized || !decision.authContext || decision.authContext.role === "CLIENT") {
      return { response: NextResponse.json({ error: "Acceso denegado al expediente" }, { status: 403 }) };
    }
    // Use the same fresh canonical context for scope and downstream actor attribution.
    const verifiedContext = decision.authContext;
    const application = await prisma.crmCreditApplication.findFirst({
      where: { AND: [{ id: applicationId }, DashboardService.buildScopeFilter(verifiedContext.role, verifiedContext.userId, verifiedContext.teamIds)] },
      select: { id: true },
    });
    if (!application) return { response: NextResponse.json({ error: "Acceso denegado al expediente" }, { status: 403 }) };
    return { context: verifiedContext };
  }
  return { context };
}

/** Bind every supplied documentary reference to the already-authorized URL case. */
export async function verifyDocumentReferences(applicationId: string, references: {
  bankApplicationId?: unknown; requirementId?: unknown; documentVersionId?: unknown;
  applicantId?: unknown; assetId?: unknown; intentId?: unknown;
}): Promise<NextResponse | null> {
  for (const value of Object.values(references)) {
    if (value !== undefined && value !== null && (typeof value !== "string" || !value.trim())) {
      return NextResponse.json({ error: "Referencia documental inválida" }, { status: 400 });
    }
  }
  const { bankApplicationId, requirementId, documentVersionId, applicantId, assetId, intentId } = references as Record<string, string | undefined>;
  type Reference = { id: string; applicantId?: string | null; asset?: { applicantId: string | null } | null; requirement?: { applicantId: string | null } | null };
  const checks: Array<{ kind: string; query: Promise<Reference | null> }> = [];
  if (bankApplicationId) checks.push({ kind: "bank", query: prisma.bankApplication.findFirst({ where: { id: bankApplicationId, applicationId }, select: { id: true } }) });
  if (requirementId) checks.push({ kind: "requirement", query: prisma.bankDocumentRequirement.findFirst({ where: { id: requirementId, bankApplication: { applicationId }, OR: [{ applicantId: null }, { applicant: { applicationId } }], ...(bankApplicationId ? { bankApplicationId } : {}) }, select: { id: true, applicantId: true } }) });
  if (documentVersionId) checks.push({ kind: "version", query: prisma.documentVersion.findFirst({ where: { id: documentVersionId, asset: { applicationId, OR: [{ applicantId: null }, { applicant: { applicationId } }] } }, select: { id: true, asset: { select: { applicantId: true } } } }) });
  if (applicantId) checks.push({ kind: "applicant", query: prisma.applicant.findFirst({ where: { id: applicantId, applicationId }, select: { id: true } }) });
  if (assetId) checks.push({ kind: "asset", query: prisma.documentAsset.findFirst({ where: { id: assetId, applicationId, OR: [{ applicantId: null }, { applicant: { applicationId } }] }, select: { id: true, applicantId: true } }) });
  if (intentId) checks.push({ kind: "intent", query: prisma.documentUploadIntent.findFirst({ where: { id: intentId, applicationId, AND: [{ OR: [{ assetId: null }, { asset: { applicationId, OR: [{ applicantId: null }, { applicant: { applicationId } }] } }] }, { OR: [{ requirementId: null }, { requirement: { bankApplication: { applicationId }, OR: [{ applicantId: null }, { applicant: { applicationId } }] } }] }] }, select: { id: true, asset: { select: { applicantId: true } }, requirement: { select: { applicantId: true } } } }) });
  const results = await Promise.all(checks.map(check => check.query));
  if (results.some(result => !result)) return NextResponse.json({ error: "Referencia no pertenece al expediente autorizado" }, { status: 403 });
  const found = new Map(checks.map((check, index) => [check.kind, results[index]!]));
  const applicantReferences = [applicantId, found.get("requirement")?.applicantId, found.get("version")?.asset?.applicantId, found.get("asset")?.applicantId, found.get("intent")?.asset?.applicantId, found.get("intent")?.requirement?.applicantId].filter((id): id is string => !!id);
  if (new Set(applicantReferences).size > 1) return NextResponse.json({ error: "Referencias documentales de solicitantes diferentes" }, { status: 403 });
  return null;
}

/** API-only JSON boundary: preserve int8 values exactly; Date/Decimal keep their usual toJSON. */
export function adminJson(value: object, init?: ResponseInit): NextResponse {
  const serialized = JSON.stringify(value, (_key, entry) => typeof entry === "bigint" ? entry.toString() : entry);
  return NextResponse.json(JSON.parse(serialized), init);
}
