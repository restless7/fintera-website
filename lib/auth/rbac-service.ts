/**
 * FINTERA ENTERPRISE CRM — SERVICIO DE AUTORIZACIÓN SERVER-SIDE RBAC/ABAC
 * Fase 6.1 (Gate B)
 *
 * Implementa la regla mandataria:
 * Acceso = Identidad Válida (Clerk) ∧ Usuario Activo (DB) ∧ Permiso RBAC ∧ Scope ABAC ∧ Relación Expediente
 * Principio: Deny-by-default.
 */

import prisma from "@/lib/prisma";
import { ACCESS_PERMISSIONS, EDITABLE_POLICY_ROLES } from "./access-contracts";
import {
  AuthContext,
  AuthorizationResult,
  Permission,
  ResourceScope,
  ROLE_PERMISSIONS_MAP,
  UserRole,
} from "./types";

export type AuthContextState =
  | { status: "RESOLVED"; context: AuthContext }
  | { status: "NOT_PROVISIONED" | "INACTIVE" | "UNAVAILABLE" };

export class RbacService {
  /**
   * Obtiene el contexto de autenticación y autorización del usuario actual desde PostgreSQL.
   */
  static async resolveAuthContext(clerkUserId: string): Promise<AuthContext | null> {
    const result = await this.resolveAuthContextState(clerkUserId);
    return result.status === "RESOLVED" ? result.context : null;
  }

  /** Distinguishes employee access from infrastructure failure without granting access. */
  static async resolveAuthContextState(clerkUserId: string): Promise<AuthContextState> {
    if (!clerkUserId || clerkUserId.trim() === "") {
      return { status: "NOT_PROVISIONED" };
    }

    try {
      const appUser = await prisma.appUser.findUnique({
        where: { clerkUserId },
        include: {
          teamMemberships: true,
        },
      });

      if (!appUser) return { status: "NOT_PROVISIONED" };
      if (!appUser.isActive) return { status: "INACTIVE" };

      const role = appUser.role as UserRole;
      if (!Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS_MAP, role)) return { status: "UNAVAILABLE" };
      let permissions = ROLE_PERMISSIONS_MAP[role];
      if ((EDITABLE_POLICY_ROLES as readonly string[]).includes(role)) {
        const policy = await prisma.rolePermissionPolicy.findUnique({ where: { role } });
        if (policy) {
          if (policy.permissions.length > 17 || new Set(policy.permissions).size !== policy.permissions.length || !policy.permissions.every(value => ACCESS_PERMISSIONS.includes(value as Permission))) return { status: "UNAVAILABLE" };
          permissions = policy.permissions as Permission[];
        }
      }
      const teamIds = appUser.teamMemberships.map((tm) => tm.teamId);

      const context: AuthContext = {
        userId: appUser.id,
        clerkUserId: appUser.clerkUserId,
        email: appUser.email,
        firstName: appUser.firstName,
        lastName: appUser.lastName,
        role,
        permissions,
        teamIds,
        isSuperAdmin: role === "SUPER_ADMIN",
        isDirector: role === "COMMERCIAL_DIRECTOR",
      };
      return { status: "RESOLVED", context };
    } catch (error) {
      console.error("[RbacService.resolveAuthContext] Error consultando usuario:", error);
      return { status: "UNAVAILABLE" };
    }
  }

  /**
   * Valida en el servidor si un actor tiene autorización para ejecutar una acción sobre un recurso.
   * Aplica evaluación estricta de Roles (RBAC) y de Atributos/Relación de Propiedad (ABAC).
   */
  static async authorize(params: {
    permission: Permission;
    clerkUserId?: string;
    scope?: ResourceScope;
    ipAddress?: string;
    userAgent?: string;
    logAudit?: boolean;
  }): Promise<AuthorizationResult> {
    const { permission, clerkUserId, scope, ipAddress, userAgent, logAudit = true } = params;

    // 1. Verificación de Identidad
    if (!clerkUserId) {
      await this.recordAudit({
        clerkUserId: undefined,
        action: permission,
        resourceId: scope?.applicationId || scope?.clientId,
        decision: "DENIED",
        reason: "Sesión no autenticada en Clerk",
        ipAddress,
        userAgent,
      });

      return {
        authorized: false,
        decision: "DENIED",
        reason: "Acceso denegado: Usuario no autenticado",
      };
    }

    // 2. Verificación de Usuario Activo en Base de Datos
    const authContext = await this.resolveAuthContext(clerkUserId);
    if (!authContext) {
      await this.recordAudit({
        clerkUserId,
        action: permission,
        resourceId: scope?.applicationId || scope?.clientId,
        decision: "DENIED",
        reason: "Usuario no registrado o inactivo en AppUser",
        ipAddress,
        userAgent,
      });

      return {
        authorized: false,
        decision: "DENIED",
        reason: "Acceso denegado: Identidad no vinculada o cuenta inactiva",
      };
    }

    // 3. Verificación de Permiso RBAC
    const hasPermission = authContext.permissions.includes(permission);
    if (!hasPermission) {
      await this.recordAudit({
        userId: authContext.userId,
        clerkUserId,
        action: permission,
        resourceId: scope?.applicationId || scope?.clientId,
        decision: "DENIED",
        reason: `Rol ${authContext.role} carece del permiso requerido ${permission}`,
        ipAddress,
        userAgent,
      });

      return {
        authorized: false,
        decision: "DENIED",
        reason: `Acceso denegado: El rol ${authContext.role} no tiene facultad para ${permission}`,
        authContext,
      };
    }

    // 4. Verificación de Alcance y Propiedad de Expediente (ABAC)
    const abacResult = await this.evaluateAbacScope(authContext, scope);
    if (!abacResult.granted) {
      await this.recordAudit({
        userId: authContext.userId,
        clerkUserId,
        action: permission,
        resourceId: scope?.applicationId || scope?.clientId,
        decision: "DENIED",
        reason: abacResult.reason,
        ipAddress,
        userAgent,
      });

      return {
        authorized: false,
        decision: "DENIED",
        reason: `Acceso denegado (ABAC): ${abacResult.reason}`,
        authContext,
      };
    }

    // 5. Autorización Concedida
    if (logAudit) {
      await this.recordAudit({
        userId: authContext.userId,
        clerkUserId,
        action: permission,
        resourceId: scope?.applicationId || scope?.clientId,
        decision: "GRANTED",
        reason: "Autorizado por política RBAC/ABAC",
        ipAddress,
        userAgent,
      });
    }

    return {
      authorized: true,
      decision: "GRANTED",
      authContext,
    };
  }

  /**
   * Evaluación de Atributos de Control de Acceso (ABAC)
   * Previene accesos cruzados (IDOR / BOLA) y escalamiento de privilegios.
   */
  private static async evaluateAbacScope(
    auth: AuthContext,
    scope?: ResourceScope
  ): Promise<{ granted: boolean; reason: string }> {
    // Si no hay scope específico requerido (e.g. listar reportes generales, consultar catálogo)
    if (!scope || (!scope.applicationId && !scope.clientId && !scope.teamId && !scope.assignedAdvisorId)) {
      return { granted: true, reason: "Operación general autorizada" };
    }

    // Super Admin y Director Comercial tienen alcance global en expedientes internos
    if (auth.isSuperAdmin || auth.isDirector) {
      return { granted: true, reason: "Alcance global empresarial concedido" };
    }

    // Auditor tiene alcance de lectura global
    if (auth.role === "AUDITOR") {
      return { granted: true, reason: "Alcance de auditoría concedido" };
    }

    // Si el usuario es un CLIENTE, SOLO puede acceder a sus propios expedientes
    if (auth.role === "CLIENT") {
      if (scope.clientClerkUserId && scope.clientClerkUserId !== auth.clerkUserId) {
        return { granted: false, reason: "Violación de aislamiento: Intento de acceder a datos de otro cliente (IDOR)" };
      }

      if (scope.applicationId) {
        const app = await prisma.crmCreditApplication.findUnique({
          where: { id: scope.applicationId },
          include: { client: true },
        });

        if (!app || app.client.clerkUserId !== auth.clerkUserId) {
          return { granted: false, reason: "El expediente no pertenece al cliente autenticado" };
        }
      }

      return { granted: true, reason: "Expediente propio de cliente verificado" };
    }

    // Si el usuario es ASESOR COMERCIAL: Solo expedientes asignados a su ID
    if (auth.role === "COMMERCIAL_ADVISOR") {
      if (scope.assignedAdvisorId && scope.assignedAdvisorId !== auth.userId) {
        return { granted: false, reason: "El expediente está asignado a otro asesor comercial" };
      }

      if (scope.applicationId) {
        const app = await prisma.crmCreditApplication.findUnique({
          where: { id: scope.applicationId },
          select: { assignedAdvisorId: true },
        });

        if (!app || app.assignedAdvisorId !== auth.userId) {
          return { granted: false, reason: "Expediente no asignado a la cartera de este asesor" };
        }
      }

      return { granted: true, reason: "Asesor asignado verificado" };
    }

    // Si el usuario es SUPERVISOR: Expedientes pertenecientes a equipos que supervisa
    if (auth.role === "SUPERVISOR") {
      if (scope.teamId && !auth.teamIds.includes(scope.teamId)) {
        return { granted: false, reason: "El equipo no se encuentra bajo la supervisión de este usuario" };
      }

      if (scope.applicationId) {
        const app = await prisma.crmCreditApplication.findUnique({
          where: { id: scope.applicationId },
          select: { teamId: true, assignedAdvisorId: true },
        });

        if (!app) {
          return { granted: false, reason: "Expediente no encontrado" };
        }

        // Si el expediente tiene equipo asignado, debe coincidir con los equipos del supervisor
        if (app.teamId && auth.teamIds.includes(app.teamId)) {
          return { granted: true, reason: "Expediente perteneciente al equipo supervisado" };
        }

        // O si el asesor asignado pertenece a alguno de sus equipos
        if (app.assignedAdvisorId) {
          const advisorTeam = await prisma.teamMembership.findFirst({
            where: {
              userId: app.assignedAdvisorId,
              teamId: { in: auth.teamIds },
            },
          });

          if (!advisorTeam) {
            return { granted: false, reason: "El asesor asignado no pertenece a los equipos supervisados" };
          }
        }
      }

      return { granted: true, reason: "Supervisión de equipo verificada" };
    }

    // Analistas Documentales y Oficiales de Operaciones
    if (auth.role === "DOCUMENT_ANALYST" || auth.role === "OPERATIONS_OFFICER") {
      return { granted: true, reason: "Alcance operacional autorizado" };
    }

    return { granted: false, reason: "Denegado por política de alcance predeterminado" };
  }

  /**
   * Registro seguro e inmutable de auditoría de acceso
   */
  private static async recordAudit(data: {
    userId?: string;
    clerkUserId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    decision: "GRANTED" | "DENIED";
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      await prisma.accessAuditEvent.create({
        data: {
          userId: data.userId,
          clerkUserId: data.clerkUserId,
          action: data.action,
          resourceType: data.resourceType || "CrmCreditApplication",
          resourceId: data.resourceId,
          decision: data.decision,
          reason: data.reason,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata || {},
        },
      });
    } catch (err) {
      console.error("[RbacService.recordAudit] Error registrando auditoría de acceso:", err);
    }
  }
}
