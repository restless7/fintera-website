import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalIdentity, readPortalJson, portalApiError } from "@/lib/portal/portal-api-guard";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
export const runtime = "nodejs";
export async function POST(req: NextRequest, context: { params: Promise<{ intentId: string }> }) {
  try {
    const actor = await requirePortalIdentity(req, true);
    z.object({}).strict().parse(await readPortalJson(req));
    return NextResponse.json(await CustomerDocumentService.cancelIntent(actor, (await context.params).intentId));
  } catch (error) { return portalApiError(error); }
}
