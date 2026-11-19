import { z } from "zod";
import { CustomerOnboardingService } from "@/lib/onboarding/service";
import {
  onboardingSubject,
  onboardingErrorResponse,
  noStoreJson,
} from "@/lib/onboarding/http";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    z.string().uuid().parse(id);
    const response = noStoreJson(
      await CustomerOnboardingService.receipt((await onboardingSubject())!, id),
    );
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="solicitud-servicios-${id}.json"`,
    );
    return response;
  } catch (error) {
    return onboardingErrorResponse(error);
  }
}
