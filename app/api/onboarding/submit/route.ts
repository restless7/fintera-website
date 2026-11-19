import { NextRequest } from "next/server";
import { submitServiceRequestSchema } from "@/lib/onboarding/contracts";
import { CustomerOnboardingService } from "@/lib/onboarding/service";
import {
  browserProof,
  onboardingBody,
  onboardingSubject,
  onboardingErrorResponse,
  noStoreJson,
  requestMetadata,
} from "@/lib/onboarding/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const input = await onboardingBody(request, submitServiceRequestSchema);
    return noStoreJson(
      await CustomerOnboardingService.submit(
        (await onboardingSubject())!,
        input,
        browserProof(request),
        requestMetadata(request),
      ),
    );
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
