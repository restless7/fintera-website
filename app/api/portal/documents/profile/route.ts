import { NextRequest, NextResponse } from "next/server";
import { requirePortalIdentity, readPortalJson, portalApiError } from "@/lib/portal/portal-api-guard";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
export const runtime = "nodejs";
import { profileInput } from "@/lib/portal/portal-validation";
export async function GET(req: NextRequest) {
  try {
    const actor = await requirePortalIdentity(req);
    const applicationId = req.nextUrl.searchParams.get("applicationId");
    if (!applicationId) return NextResponse.json({ error: "Seleccione una solicitud." }, { status: 400 });
    return NextResponse.json({ applicants: (await CustomerDocumentService.getCustomerRequirements(actor, applicationId)).applicants });
  } catch (error) { return portalApiError(error); }
}
export async function POST(req: NextRequest) {
  try {
    const actor = await requirePortalIdentity(req, true);
    return NextResponse.json(await CustomerDocumentService.updateProfile(actor, profileInput.parse(await readPortalJson(req))));
  } catch (error) { return portalApiError(error); }
}
