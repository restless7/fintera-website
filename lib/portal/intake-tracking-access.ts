import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { extractMagicTrackingTokenFromRequest, signMagicTrackingToken } from "@/lib/auth/magic-tracking-token";
import type { IntakeResult } from "@/lib/crm/application-service";

/** A public retry is not a credential; issue tracking only to a new client or proven owner. */
export async function issueIntakeTracking(req: NextRequest, result: IntakeResult): Promise<string | null> {
  let permitted = !result.isExistingClient && !result.isDuplicateRetry;
  const prior = extractMagicTrackingTokenFromRequest(req);
  if (prior?.applicationId === result.applicationId && prior.clientId === result.clientId) permitted = true;
  if (!permitted) {
    try {
      const { userId } = await auth();
      if (userId) permitted = !!await prisma.client.findFirst({ where: { id: result.clientId, clerkUserId: userId }, select: { id: true } });
    } catch { /* Auth failure never recovers a bearer. */ }
  }
  return permitted ? signMagicTrackingToken(result) : null;
}
