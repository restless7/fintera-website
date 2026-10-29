import prisma from "@/lib/prisma";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { RbacService } from "./rbac-service";
import type { AuthContext, Permission } from "./types";
import { DashboardService } from "@/lib/crm/dashboard-service";

type AdminAccess =
  | { status: "AUTHORIZED"; context: AuthContext }
  | { status: "SIGNED_OUT" | "NOT_PROVISIONED" | "INACTIVE" | "CLIENT" | "UNAVAILABLE" };

/** Request-local identity resolution; never share employee context across requests. */
export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  let userId: string | null;
  try {
    userId = (await auth()).userId;
  } catch {
    return { status: "UNAVAILABLE" };
  }
  if (!userId) return { status: "SIGNED_OUT" };
  const result = await RbacService.resolveAuthContextState(userId);
  if (result.status !== "RESOLVED") return result;
  if (result.context.role === "CLIENT") return { status: "CLIENT" };
  return { status: "AUTHORIZED", context: result.context };
});

export const requireAdminSession = cache(async () => {
  const access = await getAdminAccess();
  if (access.status === "SIGNED_OUT") redirect("/sign-in");
  if (access.status !== "AUTHORIZED") redirect("/admin-access");
  return access.context;
});

export async function requireAdminPermission(permission: Permission) {
  const context = await requireAdminSession();
  if (!context.permissions.includes(permission)) notFound();
  return context;
}

export async function requireAdminApplication(applicationId: string, permission: Permission = "crm:application:read") {
  const context = await requireAdminPermission(permission);
  const scopedApplication = await prisma.crmCreditApplication.findFirst({
    where: { AND: [{ id: applicationId }, adminApplicationScope(context)] },
    select: { id: true },
  });
  if (!scopedApplication) notFound();
  const decision = await RbacService.authorize({
    clerkUserId: context.clerkUserId,
    permission,
    scope: { applicationId },
    logAudit: false,
  });
  if (!decision.authorized) notFound();
  return context;
}

export function adminApplicationScope(context: Awaited<ReturnType<typeof requireAdminSession>>) {
  return DashboardService.buildScopeFilter(context.role, context.userId, context.teamIds);
}
