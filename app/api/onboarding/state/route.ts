import { NextRequest } from "next/server";
import { z } from "zod";
import {
  CustomerOnboardingService,
  OnboardingError,
} from "@/lib/onboarding/service";
import {
  browserProof,
  initializeBrowserProof,
  onboardingSubject,
  onboardingErrorResponse,
  noStoreJson,
} from "@/lib/onboarding/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new OnboardingError(
        "ORIGIN_DENIED",
        "Solicitud de origen no permitido.",
        403,
      );
    const selected = request.nextUrl.searchParams.get("requestId");
    const requestId = selected ? z.string().uuid().parse(selected) : undefined;
    const state = await CustomerOnboardingService.state(
      await onboardingSubject(false),
      browserProof(request),
      requestId,
    );
    return initializeBrowserProof(request, noStoreJson(state));
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
