import { NextRequest } from "next/server";
import { quickCaptureSchema } from "@/lib/onboarding/contracts";
import { CustomerOnboardingService } from "@/lib/onboarding/service";
import {
  browserProof,
  onboardingBody,
  onboardingErrorResponse,
  noStoreJson,
  requestMetadata,
} from "@/lib/onboarding/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const input = await onboardingBody(request, quickCaptureSchema);
    return noStoreJson(
      await CustomerOnboardingService.start(
        input,
        browserProof(request) || "",
        requestMetadata(request),
      ),
      201,
    );
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
