import { NextRequest, NextResponse } from "next/server";
import { requirePortalIdentity, portalApiError } from "@/lib/portal/portal-api-guard";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
export const runtime = "nodejs";
export async function GET(req: NextRequest, context: { params: Promise<{ intentId: string }> }) {
  try { return NextResponse.json(await CustomerDocumentService.getIntent(await requirePortalIdentity(req), (await context.params).intentId)); }
  catch (error) { return portalApiError(error); }
}
