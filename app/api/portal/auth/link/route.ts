import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalIdentity, readPortalJson, portalApiError } from "@/lib/portal/portal-api-guard";
import { CustomerLinkService } from "@/lib/portal/customer-link-service";
export async function GET(req: NextRequest) {
  try { return NextResponse.json(await CustomerLinkService.getState(await requirePortalIdentity(req))); } catch (error) { return portalApiError(error); }
}
export async function POST(req: NextRequest) {
  try {
    const actor = await requirePortalIdentity(req, true);
    const input = z.object({ applicationId: z.string().min(1).max(100), confirm: z.literal(true) }).strict().parse(await readPortalJson(req));
    return NextResponse.json(await CustomerLinkService.confirm(actor, input.applicationId));
  } catch (error) { return portalApiError(error); }
}
