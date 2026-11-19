import { randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CommercialServiceError } from "@/lib/commercial/service";
import { OnboardingError, type RequestMetadata } from "./service";
export const ONBOARDING_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-fintera_onboarding_browser"
    : "fintera_onboarding_browser";
export function browserProof(request: NextRequest): string | null {
  const value = request.cookies.get(ONBOARDING_COOKIE)?.value;
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
export function initializeBrowserProof(
  request: NextRequest,
  response: NextResponse,
) {
  if (!browserProof(request))
    response.cookies.set(
      ONBOARDING_COOKIE,
      randomBytes(32).toString("base64url"),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 3600,
      },
    );
  return response;
}
export function noStoreJson(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new OnboardingError(
      "ORIGIN_DENIED",
      "Solicitud de origen no permitido.",
      403,
    );
}
export async function onboardingSubject(required = true) {
  let subject: string | null;
  try {
    subject = (await auth()).userId;
  } catch {
    throw new OnboardingError(
      "IDENTITY_UNAVAILABLE",
      "No fue posible verificar su sesión.",
      503,
    );
  }
  if (!subject && required)
    throw new OnboardingError(
      "SIGN_IN_REQUIRED",
      "Inicie sesión para continuar.",
      401,
    );
  return subject;
}
export async function onboardingBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
): Promise<T> {
  requireSameOrigin(request);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  )
    throw new OnboardingError(
      "INVALID_INPUT",
      "Formato de solicitud no admitido.",
      415,
    );
  const reader = request.body?.getReader();
  if (!reader) throw new OnboardingError("INVALID_INPUT", "Solicitud vacía.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new OnboardingError(
        "BODY_TOO_LARGE",
        "La solicitud supera el límite permitido.",
        413,
      );
    }
    chunks.push(value);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new OnboardingError("INVALID_INPUT", "Solicitud JSON inválida.");
  }
  return schema.parse(parsed);
}
export function requestMetadata(request: NextRequest): RequestMetadata {
  return {
    ipAddress:
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        .trim()
        .slice(0, 80) || null,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}
export function onboardingErrorResponse(error: unknown) {
  if (error instanceof OnboardingError)
    return noStoreJson(
      { code: error.code, error: error.message, message: error.message },
      error.status,
    );
  if (error instanceof z.ZodError)
    return noStoreJson(
      {
        code: "INVALID_INPUT",
        error: "Revise los campos y las aceptaciones requeridas.",
      },
      400,
    );
  if (error instanceof CommercialServiceError)
    return noStoreJson(
      { code: error.code, error: error.message },
      error.status,
    );
  const known = error as { code?: string; meta?: { code?: string } };
  const code = known?.code;
  if (
    code === "P2034" ||
    code === "P2002" ||
    (code === "P2010" && ["40001", "40P01"].includes(known.meta?.code || ""))
  )
    return noStoreJson(
      {
        code: "CONFLICT",
        error: "El registro cambió. Consulte su estado antes de reenviar.",
      },
      409,
    );
  return noStoreJson(
    {
      code: "UNAVAILABLE",
      error:
        "No fue posible confirmar la operación. Consulte su estado antes de reenviar.",
    },
    503,
  );
}
