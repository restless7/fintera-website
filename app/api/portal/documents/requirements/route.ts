import { NextRequest, NextResponse } from "next/server";
import { requirePortalIdentity, portalApiError } from "@/lib/portal/portal-api-guard";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const actor = await requirePortalIdentity(req);
    const applicationId = req.nextUrl.searchParams.get("applicationId");
    if (!applicationId) return NextResponse.json({ error: "Seleccione una solicitud.", code: "INVALID_INPUT" }, { status: 400 });
    return NextResponse.json(await CustomerDocumentService.getCustomerRequirements(actor, applicationId));
  } catch (error) { return portalApiError(error); }
}
