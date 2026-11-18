import { NextRequest, NextResponse } from "next/server";
import { requirePortalIdentity, readPortalJson, portalApiError } from "@/lib/portal/portal-api-guard";
import { CustomerDocumentService } from "@/lib/portal/customer-document-service";
export const runtime = "nodejs";
import { uploadInput } from "@/lib/portal/portal-validation";
export async function POST(req: NextRequest) {
  try {
    const clerkUserId = await requirePortalIdentity(req, true);
    return NextResponse.json(await CustomerDocumentService.createCustomerUploadIntent({ ...uploadInput.parse(await readPortalJson(req)), clerkUserId }), { status: 201 });
  } catch (error) { return portalApiError(error); }
}
