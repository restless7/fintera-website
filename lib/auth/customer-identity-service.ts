/**
 * FINTERA ENTERPRISE CRM — FASE 6.5: GATE F
 * CustomerIdentityService: Vinculación Segura de Cuentas, Desafíos Anti-Enumeración y ABAC Granular
 */

import prisma from "@/lib/prisma";
import {
  CustomerGrantRole,
  Prisma,
} from "@/prisma/generated/client";
import { parseMagicActorId } from "./magic-tracking-token";

export interface InitiateLinkResult {
  challengeId: string;
  maskedDestination: string;
  verificationChannel: string;
  expiresAt: Date;
}

export interface CustomerContext {
  isLinked: boolean;
  clerkUserId: string;
  client: {
    id: string;
    documentType: string;
    documentNumber: string;
    firstName: string;
    firstLastName: string;
    email: string;
    phone: string;
    isBlocked?: boolean;
  } | null;
  grants: Array<{
    id: string;
    clientId: string;
    applicationId: string | null;
    applicantId: string | null;
    grantRole: CustomerGrantRole;
    canViewApplication: boolean;
    canViewDocuments: boolean;
    canUploadDocuments: boolean;
    canMessageAdvisor: boolean;
  }>;
}

export class CustomerSecurityError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 403, code: string = "SECURITY_VIOLATION") {
    super(message);
    this.name = "CustomerSecurityError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class CustomerIdentityService {
  /**
   * Resuelve el contexto completo del cliente autenticado a partir de su sesión Clerk
   */
  public static async resolveCustomerContext(clerkUserId: string): Promise<CustomerContext> {
    if (!clerkUserId || clerkUserId.trim() === "") {
      return { isLinked: false, clerkUserId: "", client: null, grants: [] };
    }

    // 0. Soporte de Magic Tracking Token HMAC-SHA256 con alcance restringido (Fase 2 Enterprise)
    const magicActor = parseMagicActorId(clerkUserId);
    if (magicActor) {
      const app = await prisma.crmCreditApplication.findUnique({
        where: { id: magicActor.applicationId },
        include: { client: true },
      });

      if (!app || app.clientId !== magicActor.clientId) {
        return { isLinked: false, clerkUserId, client: null, grants: [] };
      }

      return {
        isLinked: true,
        clerkUserId,
        client: {
          id: app.client.id,
          documentType: "",
          documentNumber: "",
          firstName: "",
          firstLastName: "",
          email: "",
          phone: "",
        },
        grants: [
          {
            id: `magic_grant_${app.id}`,
            clientId: app.clientId,
            applicationId: app.id,
            applicantId: null,
            grantRole: CustomerGrantRole.PRIMARY_HOLDER,
            canViewApplication: true,
            canViewDocuments: false,
            canUploadDocuments: false,
            canMessageAdvisor: false,
          },
        ],
      };
    }

    // 1. Buscar cliente vinculado directamente
    const client = await prisma.client.findFirst({
      where: { clerkUserId },
    });

    // 2. Buscar permisos y accesos activos no revocados
    const now = new Date();
    const grants = await prisma.customerAccessGrant.findMany({
      where: {
        clerkUserId,
        revokedAt: null,
        effectiveAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    if (!client && grants.length === 0) {
      return { isLinked: false, clerkUserId, client: null, grants: [] };
    }

    return {
      isLinked: client !== null || grants.length > 0,
      clerkUserId,
      client: client
        ? {
            id: client.id,
            documentType: client.documentType,
            documentNumber: client.documentNumber,
            firstName: client.firstName,
            firstLastName: client.firstLastName,
            email: client.email,
            phone: client.phone,
          }
        : null,
      grants: grants.map((g) => ({
        id: g.id,
        clientId: g.clientId,
        applicationId: g.applicationId,
        applicantId: g.applicantId,
        grantRole: g.grantRole,
        canViewApplication: g.canViewApplication,
        canViewDocuments: g.canViewDocuments,
        canUploadDocuments: g.canUploadDocuments,
        canMessageAdvisor: g.canMessageAdvisor,
      })),
    };
  }

  /**
   * Inicia el proceso de vinculación de cuenta con resistencia a enumeración y rate limiting
   */
  public static async initiateAccountLink(_params: {
    clerkUserId: string;
    documentType: string;
    documentNumber: string;
    channel?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<InitiateLinkResult> {
    throw new CustomerSecurityError("Use el vínculo de correo verificado o solicite ayuda a su asesor.", 409, "VERIFIED_IDENTITY_REQUIRED");
  }

  public static async verifyAccountLink(_params: {
    clerkUserId: string;
    challengeId: string;
    otpCode: string;
  }): Promise<{ success: boolean; clientId: string }> {
    throw new CustomerSecurityError("Use el vínculo de correo verificado o solicite ayuda a su asesor.", 409, "VERIFIED_IDENTITY_REQUIRED");
  }

  /**
   * Concede acceso granular a un co-deudor / cotitular para una solicitud y solicitante específico
   */
  public static async grantCoApplicantAccess(params: {
    primaryClerkUserId: string;
    coApplicantClerkUserId: string;
    applicationId: string;
    applicantId: string;
    canViewDocuments?: boolean;
    canUploadDocuments?: boolean;
    canMessageAdvisor?: boolean;
  }): Promise<{ grantId: string }> {
    const {
      primaryClerkUserId,
      coApplicantClerkUserId,
      applicationId,
      applicantId,
      canViewDocuments = true,
      canUploadDocuments = true,
      canMessageAdvisor = false,
    } = params;

    // 1. Validar que la solicitud existe y pertenece al primaryClerkUserId
    const app = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: { client: true, applicants: true },
    });

    if (!app || app.client.clerkUserId !== primaryClerkUserId) {
      throw new CustomerSecurityError(
        "No está autorizado para delegar accesos en este expediente.",
        403,
        "UNAUTHORIZED_DELEGATION"
      );
    }

    // 2. Validar que el applicantId pertenece a la solicitud y es co-deudor
    const targetApplicant = app.applicants.find((a) => a.id === applicantId);
    if (!targetApplicant) {
      throw new CustomerSecurityError("El solicitante no pertenece a este expediente.", 404, "APPLICANT_NOT_FOUND");
    }

    // 3. Crear el CustomerAccessGrant con alcance restringido
    const grant = await prisma.customerAccessGrant.upsert({
      where: {
        clerkUserId_clientId_applicationId_applicantId: {
          clerkUserId: coApplicantClerkUserId,
          clientId: app.clientId,
          applicationId,
          applicantId,
        },
      },
      create: {
        clerkUserId: coApplicantClerkUserId,
        clientId: app.clientId,
        applicationId,
        applicantId,
        grantRole: CustomerGrantRole.CO_APPLICANT,
        canViewApplication: true, // Ve la solicitud pero filtrada
        canViewDocuments,
        canUploadDocuments,
        canMessageAdvisor,
        grantedByUserId: primaryClerkUserId,
      },
      update: {
        revokedAt: null,
        revokedReason: null,
        canViewDocuments,
        canUploadDocuments,
        canMessageAdvisor,
      },
    });

    // 4. Auditoría
    await prisma.accessAuditEvent.create({
      data: {
        clerkUserId: primaryClerkUserId,
        action: "CO_APPLICANT_ACCESS_GRANTED",
        resourceType: "CrmCreditApplication",
        resourceId: applicationId,
        applicationId,
        decision: "GRANTED",
        reason: "Permiso delegado por titular principal al co-deudor",
        metadata: {
          coApplicantClerkUserId,
          applicantId,
          grantId: grant.id,
        },
      },
    });

    return { grantId: grant.id };
  }

  /**
   * Revoca un permiso de acceso de forma inmediata
   */
  public static async revokeAccessGrant(grantId: string, reason: string, actorUserId: string): Promise<void> {
    const grant = await prisma.customerAccessGrant.findUnique({
      where: { id: grantId },
    });

    if (!grant) {
      throw new CustomerSecurityError("Permiso de acceso no encontrado.", 404, "GRANT_NOT_FOUND");
    }

    await prisma.customerAccessGrant.update({
      where: { id: grantId },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    await prisma.accessAuditEvent.create({
      data: {
        userId: actorUserId,
        action: "CUSTOMER_ACCESS_GRANT_REVOKED",
        resourceType: "CustomerAccessGrant",
        resourceId: grantId,
        decision: "GRANTED",
        reason,
        metadata: { clerkUserId: grant.clerkUserId },
      },
    });
  }

  /**
   * Control de Autorización por Objeto (BOLA / IDOR Defense)
   * Comprueba si el usuario autenticado tiene autorización para acceder a una solicitud específica
   */
  public static async verifyApplicationAccess(
    clerkUserId: string,
    applicationId: string,
    requiredPermission: "VIEW" | "DOCUMENT_VIEW" | "UPLOAD" | "MESSAGE" = "VIEW",
    db: Prisma.TransactionClient = prisma
  ): Promise<{
    isAuthorized: boolean;
    grantRole: CustomerGrantRole;
    applicantId: string | null;
    clientId: string;
  }> {
    if (!clerkUserId || !applicationId) {
      throw new CustomerSecurityError("Parámetros de autorización incompletos.", 401, "UNAUTHENTICATED");
    }

    // 1. Obtener la solicitud
    const app = await db.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: { client: true },
    });

    if (!app) {
      throw new CustomerSecurityError("Expediente no encontrado.", 404, "APPLICATION_NOT_FOUND");
    }

    // 2. Si es el titular principal vinculado en Client
    if (app.client.clerkUserId === clerkUserId) {
      return {
        isAuthorized: true,
        grantRole: CustomerGrantRole.PRIMARY_HOLDER,
        applicantId: null,
        clientId: app.clientId,
      };
    }

    // 2.5 Si accede mediante Magic Tracking Token HMAC-SHA256 (BOLA estricto al clientId y applicationId)
    const magicActor = parseMagicActorId(clerkUserId);
    if (magicActor) {
      if (requiredPermission === "VIEW" && app.id === magicActor.applicationId && app.clientId === magicActor.clientId) {
        return {
          isAuthorized: true,
          grantRole: CustomerGrantRole.PRIMARY_HOLDER,
          applicantId: null,
          clientId: app.clientId,
        };
      }
      throw new CustomerSecurityError(
        "Acceso denegado: El token de seguimiento no autoriza el acceso a este expediente.",
        403,
        "IDOR_FORBIDDEN"
      );
    }

    // 3. Si tiene un CustomerAccessGrant activo
    const now = new Date();
    const grant = await db.customerAccessGrant.findFirst({
      where: {
        clerkUserId,
        clientId: app.clientId,
        effectiveAt: { lte: now },
        revokedAt: null,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          {
            OR: [
              { applicationId: null, clientId: app.clientId }, // Acceso global a nivel cliente
              { applicationId: app.id }, // Acceso específico a este expediente
            ],
          },
        ],
      },
    });

    if (!grant) {
      throw new CustomerSecurityError(
        "Acceso denegado: No posee permisos autorizados sobre este expediente.",
        403,
        "IDOR_FORBIDDEN"
      );
    }

    if ((grant.grantRole === CustomerGrantRole.CO_APPLICANT && !grant.applicantId) || (requiredPermission === "VIEW" && !grant.canViewApplication) || (requiredPermission === "DOCUMENT_VIEW" && !grant.canViewDocuments)) {
      throw new CustomerSecurityError("No tiene permiso para consultar este recurso.", 403, "VIEW_FORBIDDEN");
    }
    // Validar permiso requerido
    if (requiredPermission === "UPLOAD" && !grant.canUploadDocuments) {
      throw new CustomerSecurityError("No tiene permiso para cargar documentos.", 403, "UPLOAD_FORBIDDEN");
    }
    if (requiredPermission === "MESSAGE" && !grant.canMessageAdvisor) {
      throw new CustomerSecurityError("No tiene permiso para enviar mensajes en este caso.", 403, "MESSAGE_FORBIDDEN");
    }

    return {
      isAuthorized: true,
      grantRole: grant.grantRole,
      applicantId: grant.applicantId,
      clientId: app.clientId,
    };
  }

  /**
   * Revoca inmediatamente la vinculación de identidad de un cliente y todos sus accesos
   */
  public static async revokeAccountLink(clientId: string, reason: string): Promise<void> {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new CustomerSecurityError("Cliente no encontrado.", 404, "CLIENT_NOT_FOUND");
    }

    const previousClerkId = client.clerkUserId;

    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: {
          clerkUserId: null,
        },
      });

      if (previousClerkId) {
        await tx.customerAccessGrant.updateMany({
          where: {
            clerkUserId: previousClerkId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            revokedReason: reason,
          },
        });

        await tx.accessAuditEvent.create({
          data: {
            clerkUserId: previousClerkId,
            action: "CUSTOMER_ACCOUNT_LINK_REVOKED",
            resourceType: "Client",
            resourceId: clientId,
            decision: "REVOKED",
            reason,
            metadata: {
              revokedAt: new Date().toISOString(),
            },
          },
        });
      }
    });
  }
}

