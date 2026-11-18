import { NextRequest, NextResponse } from "next/server";
import { growthCaptureSchema } from "@/lib/commercial/contracts";
import {
  boundedJson,
  commercialError,
  noStore,
  verifyCommercialOrigin,
} from "@/lib/commercial/http";
import {
  captureGrowthLead,
  CommercialServiceError,
  growthReceipt,
} from "@/lib/commercial/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      await growthReceipt(req.nextUrl.searchParams.get("trackingCode") ?? ""),
      { headers: noStore },
    );
  } catch (e) {
    return commercialError(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    verifyCommercialOrigin(req);
    const parsed = growthCaptureSchema.safeParse(await boundedJson(req, 8192));
    if (!parsed.success)
      throw new CommercialServiceError(
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Datos inválidos.",
      );
    const identity =
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    return NextResponse.json(await captureGrowthLead(parsed.data, identity), {
      status: 201,
      headers: noStore,
    });
  } catch (e) {
    return commercialError(e);
  }
}
