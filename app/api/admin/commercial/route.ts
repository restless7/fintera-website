import { NextRequest, NextResponse } from "next/server";
import { commercialMutationSchema } from "@/lib/commercial/contracts";
import {
  boundedJson,
  commercialActor,
  commercialError,
  noStore,
  verifyCommercialOrigin,
} from "@/lib/commercial/http";
import {
  CommercialServiceError,
  getCommercialState,
  mutateCommercial,
} from "@/lib/commercial/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const a = await commercialActor(),
      q = req.nextUrl.searchParams,
      page = Number(q.get("page") ?? 1),
      search = q.get("search")?.trim() ?? "",
      applicationId = q.get("applicationId") ?? undefined;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 100000 ||
      search.length > 120 ||
      (applicationId && applicationId.length > 128)
    )
      throw new CommercialServiceError("INVALID_INPUT", "Filtros inválidos.");
    return NextResponse.json(
      await getCommercialState(a, { page, search, applicationId }),
      { headers: noStore },
    );
  } catch (e) {
    return commercialError(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    verifyCommercialOrigin(req);
    const a = await commercialActor(),
      parsed = commercialMutationSchema.safeParse(await boundedJson(req));
    if (!parsed.success)
      throw new CommercialServiceError(
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
      );
    return NextResponse.json(
      await mutateCommercial(a.clerkUserId, parsed.data),
      { headers: noStore },
    );
  } catch (e) {
    return commercialError(e);
  }
}
