import prisma from "@/lib/prisma";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { RbacService } from "./rbac-service";
import type { Permission } from "./types";
import { DashboardService } from "@/lib/crm/dashboard-service";

/** Request-local identity resolution; never share employee context across requests. */
export const requireAdminSession = cache(async () => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const context = await RbacService.resolveAuthContext(userId);
  if (!context || context.role === "CLIENT") notFound();
  return context;
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
