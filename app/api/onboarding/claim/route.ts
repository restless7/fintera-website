import { NextRequest } from "next/server";
import { z } from "zod";
import { CustomerOnboardingService } from "@/lib/onboarding/service";
import {
  browserProof,
  onboardingBody,
  onboardingSubject,
  onboardingErrorResponse,
  noStoreJson,
} from "@/lib/onboarding/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    await onboardingBody(request, z.object({}).strict());
    return noStoreJson(
      await CustomerOnboardingService.claim(
        (await onboardingSubject())!,
        browserProof(request),
      ),
    );
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
