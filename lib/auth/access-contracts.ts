import { z } from "zod";
import { ROLE_PERMISSIONS_MAP, UserRole, type Permission } from "./types";

export const ACCESS_ENDPOINT = "/api/admin/access";
export const ACCESS_ROLES = Object.values(UserRole);
export const ACCESS_PERMISSIONS = ROLE_PERMISSIONS_MAP.SUPER_ADMIN;
export const EDITABLE_POLICY_ROLES = ["COMMERCIAL_DIRECTOR", "SUPERVISOR", "COMMERCIAL_ADVISOR", "DOCUMENT_ANALYST", "OPERATIONS_OFFICER"] as const;
export type AccessMembership = { teamId: string; isLead: boolean };
export type AccessUser = { id: string; clerkUserId: string; email: string; firstName: string; lastName: string; role: UserRole; isActive: boolean; accessRevision: number; memberships: AccessMembership[] };
export type AccessTeam = { id: string; name: string; description: string | null; revision: number; memberCount: number };
export type AccessPolicy = { role: UserRole; label: string; permissions: Permission[]; defaultPermissions: Permission[]; revision: number; editable: boolean; scopeDescription: string; restriction: string };
export type AccessAudit = { id: string; action: string; resourceType: string; resourceId: string | null; reason: string | null; timestamp: string; actorEmail: string | null; metadata: unknown };
export type AccessState = { actorUserId: string; activeSuperAdminCount: number; users: AccessUser[]; total: number; page: number; pageSize: number; teams: AccessTeam[]; policies: AccessPolicy[]; permissionCatalog: { permission: Permission; label: string }[]; audit: AccessAudit[] };
export type VerifiedAccessIdentity = { clerkUserId: string; email: string; firstName: string; lastName: string; alreadyProvisioned: boolean };
export type AccessMutationResult = { success: true; identity?: VerifiedAccessIdentity };
export type AccessApiError = { error: string; code: "UNAUTHENTICATED" | "FORBIDDEN" | "INVALID_INPUT" | "STALE_REVISION" | "SELF_LOCKOUT" | "LAST_SUPER_ADMIN" | "IDENTITY_NOT_FOUND" | "IDENTITY_NOT_VERIFIED" | "IDENTITY_COLLISION" | "NOT_FOUND" | "CONFLICT" | "UNAVAILABLE" };
const role = z.enum(["SUPER_ADMIN", "COMMERCIAL_DIRECTOR", "SUPERVISOR", "COMMERCIAL_ADVISOR", "DOCUMENT_ANALYST", "OPERATIONS_OFFICER", "AUDITOR", "CLIENT"]);
const id = z.string().trim().min(1).max(128);
const reason = z.string().trim().min(5, "Indique un motivo de al menos 5 caracteres").max(500);
const revision = z.number().int().nonnegative();
const membership = z.object({ teamId: id, isLead: z.boolean() }).strict();
const memberships = z.array(membership).max(100).refine(value => new Set(value.map(x => x.teamId)).size === value.length, "Equipo duplicado");
const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());
export const accessMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("lookupIdentity"), email }).strict(),
  z.object({ action: z.literal("provisionUser"), email, clerkUserId: id, role, memberships, reason }).strict(),
  z.object({ action: z.literal("updateUser"), userId: id, expectedRevision: revision, role, isActive: z.boolean(), memberships, reason }).strict(),
  z.object({ action: z.literal("createTeam"), name: z.string().trim().min(2).max(100), description: z.string().trim().max(500), reason }).strict(),
  z.object({ action: z.literal("updateTeam"), teamId: id, expectedRevision: revision, name: z.string().trim().min(2).max(100), description: z.string().trim().max(500), reason }).strict(),
  z.object({ action: z.literal("updateRolePermissions"), role, expectedRevision: revision, permissions: z.array(z.string()).max(17).refine(value => new Set(value).size === value.length && value.every(p => ACCESS_PERMISSIONS.includes(p as Permission)), "Permisos inválidos"), reason }).strict(),
]);
export type AccessMutation = z.infer<typeof accessMutationSchema>;
