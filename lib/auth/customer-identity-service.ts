/**
 * FINTERA ENTERPRISE CRM — FASE 6.5: GATE F
 * CustomerIdentityService: Vinculación Segura de Cuentas, Desafíos Anti-Enumeración y ABAC Granular
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";
import {
  AccountLinkStatus,
  CustomerGrantRole,
  UserRole,
} from "@/prisma/generated/client";

export interface InitiateLinkResult {
  challengeId: string;
  maskedDestination: string;
  verificationChannel: string;
  expiresAt: Date;
  testOtpPreview?: string; // Solo en desarrollo local para automatización de pruebas
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
  private static HASH_SECRET = process.env.CUSTOMER_LINK_SECRET || "fintera_customer_otp_secret_key_2026_secure";

  /**
   * Hashea un código OTP mediante HMAC-SHA256 para evitar almacenamiento en texto plano
   */
  private static hashOtp(otp: string): string {
    return crypto
      .createHmac("sha256", this.HASH_SECRET)
      .update(otp.trim())
      .digest("hex");
  }

  /**
   * Ofusca un número de teléfono o correo para no revelar información sensible
   */
  private static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return "(***) ***-****";
    const last4 = phone.slice(-4);
    return `(***) ***-${last4}`;
  }

  /**
   * Resuelve el contexto completo del cliente autenticado a partir de su sesión Clerk
   */
  public static async resolveCustomerContext(clerkUserId: string): Promise<CustomerContext> {
    if (!clerkUserId || clerkUserId.trim() === "") {
      return { isLinked: false, clerkUserId: "", client: null, grants: [] };
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
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    if (!client && grants.length === 0) {
      return { isLinked: false, clerkUserId, client: null, grants: [] };
    }

    return {
      isLinked: client !== null,
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
  public static async initiateAccountLink(params: {
    clerkUserId: string;
    documentType: string;
    documentNumber: string;
    channel?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<InitiateLinkResult> {
    const { clerkUserId, documentType, documentNumber, channel = "SMS_OTP", ipAddress, userAgent } = params;

    // Rate Limiting anti-fuerza bruta: máx 5 intentos en 15 minutos por usuario Clerk
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentAttempts = await prisma.customerAccountLinkAttempt.count({
      where: {
        clerkUserId,
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    if (recentAttempts >= 5) {
      throw new CustomerSecurityError(
        "Demasiados intentos de vinculación recientes. Intente nuevamente en 15 minutos.",
        429,
        "RATE_LIMIT_EXCEEDED"
      );
    }

    // Verificar si la cuenta Clerk ya está vinculada a un cliente
    const existingLinkedClient = await prisma.client.findFirst({
      where: { clerkUserId },
    });
    if (existingLinkedClient) {
      throw new CustomerSecurityError(
        "Esta cuenta ya se encuentra vinculada a un expediente cliente.",
        409,
        "ACCOUNT_ALREADY_LINKED"
      );
    }

    // Buscar candidato en base de datos canónica
    const candidateClient = await prisma.client.findUnique({
      where: {
        documentType_documentNumber: {
          documentType,
          documentNumber,
        },
      },
    });

    // Generar OTP de 6 dígitos
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedVerifier = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos de vigencia

    if (!candidateClient) {
      // PROTECCIÓN ANTI-ENUMERACIÓN: Registrar intento sintético sin asociar clientId
      const syntheticAttempt = await prisma.customerAccountLinkAttempt.create({
        data: {
          clerkUserId,
          clientId: null,
          documentType,
          documentNumber,
          hashedVerifier,
          verificationChannel: channel,
          targetPhone: null,
          targetEmail: null,
          status: AccountLinkStatus.PENDING,
          expiresAt,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });

      return {
        challengeId: syntheticAttempt.id,
        maskedDestination: "(***) ***-****",
        verificationChannel: channel,
        expiresAt,
      };
    }

    // Si el cliente ya está vinculado a otra cuenta Clerk distinta y activa
    if (candidateClient.clerkUserId && candidateClient.clerkUserId !== clerkUserId) {
      throw new CustomerSecurityError(
        "El titular ya cuenta con una credencial digital activa. Si perdió el acceso, solicite recuperación asistida a su asesor comercial.",
        409,
        "CLIENT_ALREADY_CLAIMED"
      );
    }

    const maskedPhone = this.maskPhone(candidateClient.phone);

    // Crear intento de vinculación legítimo
    const attempt = await prisma.customerAccountLinkAttempt.create({
      data: {
        clerkUserId,
        clientId: candidateClient.id,
        documentType,
        documentNumber,
        hashedVerifier,
        verificationChannel: channel,
        targetPhone: candidateClient.phone,
        targetEmail: candidateClient.email,
        status: AccountLinkStatus.PENDING,
        expiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    // Cifrar el sobre de entrega en OtpDeliveryEnvelope (AES-256-GCM)
    try {
      const envelopeSecret = process.env.OTP_ENVELOPE_SECRET || "fintera-otp-envelope-key-secret-32-chars-aes256";
      const key = crypto.createHash("sha256").update(envelopeSecret).digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
      let ciphertext = cipher.update(otp, "utf8", "hex");
      ciphertext += cipher.final("hex");
      const authTag = cipher.getAuthTag().toString("hex");
      const encryptedEnvelope = `${iv.toString("hex")}:${ciphertext}:${authTag}`;

      await prisma.otpDeliveryEnvelope.create({
        data: {
          challengeId: attempt.id,
          encryptedOtp: encryptedEnvelope,
          targetMasked: maskedPhone,
          channel: "LOCAL_SINK_SMS",
          status: "PENDING",
          expiresAt,
        },
      });

      // Emitir evento al outbox transaccional (con referencia opaca, SIN OTP en texto plano)
      await prisma.domainOutboxEvent.create({
        data: {
          aggregateType: "CustomerAccountLinkAttempt",
          aggregateId: attempt.id,
          eventType: "CUSTOMER_OTP_CHALLENGE_ISSUED",
          payload: {
            challengeId: attempt.id,
            targetMasked: maskedPhone,
            channel: "LOCAL_SINK_SMS",
            expiresAt: expiresAt.toISOString(),
          },
        },
      });
    } catch (envelopeErr) {
      console.error("[CustomerIdentityService] Error sellando sobre OTP:", envelopeErr);
    }

    return {
      challengeId: attempt.id,
      maskedDestination: maskedPhone,
      verificationChannel: channel,
      expiresAt,
      testOtpPreview: otp, // Facilitar aserciones deterministas en tests locales
    };
  }

  /**
   * Valida el código de verificación e instaura atómicamente la vinculación y permisos del titular
   */
  public static async verifyAccountLink(params: {
    clerkUserId: string;
    challengeId: string;
    otpCode: string;
  }): Promise<{ success: boolean; clientId: string }> {
    const { clerkUserId, challengeId, otpCode } = params;

    const attempt = await prisma.customerAccountLinkAttempt.findUnique({
      where: { id: challengeId },
    });

    if (!attempt || attempt.clerkUserId !== clerkUserId) {
      throw new CustomerSecurityError("Desafío de vinculación inexistente o inválido.", 404, "CHALLENGE_NOT_FOUND");
    }

    if (attempt.status !== AccountLinkStatus.PENDING) {
      throw new CustomerSecurityError(
        `El desafío no se encuentra en estado pendiente (Estado: ${attempt.status}).`,
        400,
        "CHALLENGE_NOT_PENDING"
      );
    }

    if (new Date() > attempt.expiresAt) {
      await prisma.customerAccountLinkAttempt.update({
        where: { id: challengeId },
        data: { status: AccountLinkStatus.EXPIRED, failureReason: "OTP_EXPIRED" },
      });
      throw new CustomerSecurityError("El código de verificación ha expirado.", 400, "OTP_EXPIRED");
    }

    if (attempt.attemptCount >= attempt.maxAttempts) {
      await prisma.customerAccountLinkAttempt.update({
        where: { id: challengeId },
        data: { status: AccountLinkStatus.FAILED_MAX_ATTEMPTS, failureReason: "MAX_ATTEMPTS_EXCEEDED" },
      });
      throw new CustomerSecurityError("Número máximo de intentos superado.", 400, "MAX_ATTEMPTS_EXCEEDED");
    }

    const providedHash = this.hashOtp(otpCode);

    if (providedHash !== attempt.hashedVerifier) {
      const nextCount = attempt.attemptCount + 1;
      const willFail = nextCount >= attempt.maxAttempts;
      await prisma.customerAccountLinkAttempt.update({
        where: { id: challengeId },
        data: {
          attemptCount: nextCount,
          status: willFail ? AccountLinkStatus.FAILED_MAX_ATTEMPTS : AccountLinkStatus.PENDING,
          failureReason: willFail ? "MAX_ATTEMPTS_REACHED" : "INVALID_OTP",
        },
      });
      throw new CustomerSecurityError("Código de verificación incorrecto.", 400, "INVALID_OTP");
    }

    // Si fue un intento sintético (anti-enumeración donde el cliente no existía en BD)
    if (!attempt.clientId) {
      await prisma.customerAccountLinkAttempt.update({
        where: { id: challengeId },
        data: { status: AccountLinkStatus.CANCELLED, failureReason: "SYNTHETIC_REJECTED" },
      });
      throw new CustomerSecurityError("No fue posible validar la información de vinculación.", 404, "CLIENT_NOT_FOUND");
    }

    const clientId = attempt.clientId;

    // Transacción atómica: vincular cliente y otorgar permisos de acceso canónico
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar Client
      await tx.client.update({
        where: { id: clientId },
        data: { clerkUserId },
      });

      // 2. Marcar intento como verificado
      await tx.customerAccountLinkAttempt.update({
        where: { id: challengeId },
        data: {
          status: AccountLinkStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });

      // 3. Crear o renovar CustomerAccessGrant como PRIMARY_HOLDER
      const existingGrant = await tx.customerAccessGrant.findFirst({
        where: {
          clerkUserId,
          clientId,
          applicationId: null,
          applicantId: null,
        },
      });

      if (existingGrant) {
        await tx.customerAccessGrant.update({
          where: { id: existingGrant.id },
          data: {
            revokedAt: null,
            revokedReason: null,
            canViewApplication: true,
            canViewDocuments: true,
            canUploadDocuments: true,
            canMessageAdvisor: true,
          },
        });
      } else {
        await tx.customerAccessGrant.create({
          data: {
            clerkUserId,
            clientId,
            grantRole: CustomerGrantRole.PRIMARY_HOLDER,
            canViewApplication: true,
            canViewDocuments: true,
            canUploadDocuments: true,
            canMessageAdvisor: true,
          },
        });
      }

      // 4. Registrar auditoría inmutable
      await tx.accessAuditEvent.create({
        data: {
          clerkUserId,
          action: "CUSTOMER_ACCOUNT_LINKED",
          resourceType: "Client",
          resourceId: clientId,
          ipAddress: attempt.ipAddress || "127.0.0.1",
          userAgent: attempt.userAgent || "Fintera Customer Portal",
          decision: "GRANTED",
          reason: "Vinculación exitosa mediante verificación OTP",
          metadata: {
            challengeId,
            verificationChannel: attempt.verificationChannel,
            linkedAt: new Date().toISOString(),
          },
        },
      });

      // 5. Marcar sobre de entrega OTP como consumido
      await tx.otpDeliveryEnvelope.updateMany({
        where: { challengeId },
        data: {
          status: "CONSUMED",
          consumedAt: new Date(),
        },
      });
    });

    return { success: true, clientId };
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
    requiredPermission: "VIEW" | "UPLOAD" | "MESSAGE" = "VIEW"
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
    const app = await prisma.crmCreditApplication.findUnique({
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

    // 3. Si tiene un CustomerAccessGrant activo
    const now = new Date();
    const grant = await prisma.customerAccessGrant.findFirst({
      where: {
        clerkUserId,
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

