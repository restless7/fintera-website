import { NextRequest, NextResponse } from "next/server";
import { requirePortalIdentity, readPortalJson, portalApiError } from "@/lib/portal/portal-api-guard";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
export const runtime = "nodejs";
import { z } from "zod";
export async function POST(req: NextRequest) {
  try {
    const clerkUserId = await requirePortalIdentity(req, true);
    const { intentId } = z.object({ intentId: z.string().min(1).max(100) }).strict().parse(await readPortalJson(req));
    const result = await CustomerDocumentService.confirmCustomerUpload({ clerkUserId, intentId });
    return NextResponse.json(result, { status: result.status === "QUEUED" || result.status === "PROCESSING" ? 202 : 200 });
  } catch (error) { return portalApiError(error); }
}
