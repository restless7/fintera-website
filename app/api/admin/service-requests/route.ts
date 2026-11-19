import { NextRequest } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import { AdminServiceRequestService } from "@/lib/onboarding/admin-service";
import { adminServiceRequestMutationSchema } from "@/lib/onboarding/contracts";
import {
  onboardingBody,
  onboardingErrorResponse,
  noStoreJson,
} from "@/lib/onboarding/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeAdminApi("crm:lead:read");
    if (auth.response) return auth.response;
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000)
      return noStoreJson(
        { code: "INVALID_INPUT", error: "Página inválida." },
        400,
      );
    return noStoreJson(
      await AdminServiceRequestService.state(auth.context.clerkUserId, page),
    );
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdminApi("crm:lead:read");
    if (auth.response) return auth.response;
    const input = await onboardingBody(
      request,
      adminServiceRequestMutationSchema,
    );
    return noStoreJson(
      await AdminServiceRequestService.mutate(auth.context.clerkUserId, input),
    );
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
