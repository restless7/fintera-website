/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G02 / P0: Servicio de Sobre Cifrado y Entrega Segura de Retos OTP (AES-256-GCM)
 * 
 * Cumple con el principio de mínima exposición:
 * El código OTP en texto plano JAMÁS ingresa a la tabla general de outbox_events
 * ni a logs de auditoría general. Se custodia temporalmente en un sobre cifrado
 * y autenticado (AES-256-GCM) accesible exclusivamente por el despachador de seguridad.
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";

// Clave de cifrado de sobre OTP derivada o provista por entorno
const OTP_ENVELOPE_SECRET = process.env.OTP_ENVELOPE_SECRET || "fintera-otp-envelope-key-secret-32-chars-aes256";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

export interface SealedOtpResult {
  rawOtp: string; // Solo en memoria durante la invocación inicial
  verifier: string; // Verificador HMAC-SHA256 para validación
  envelopeId: string;
  challengeId: string;
  targetMasked: string;
  channel: "LOCAL_SINK_SMS" | "LOCAL_SINK_WHATSAPP";
  expiresAt: Date;
}

export class OtpEnvelopeService {
  /**
   * Genera criptográficamente el código OTP de 6 dígitos, cifra el sobre con AES-256-GCM
   * y calcula el verificador HMAC-SHA256 para la validación del intento.
   */
  public static async generateAndSealOtp(
    challengeId: string,
    targetMasked: string,
    channel: "LOCAL_SINK_SMS" | "LOCAL_SINK_WHATSAPP" = "LOCAL_SINK_SMS",
    ttlMinutes: number = 10
  ): Promise<SealedOtpResult> {
    // 1. Generación criptográficamente segura del código de 6 dígitos
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // 2. Cifrado AES-256-GCM del sobre de entrega
    const key = crypto.createHash("sha256").update(OTP_ENVELOPE_SECRET).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let ciphertext = cipher.update(rawOtp, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    // Formato serializado del sobre: iv:ciphertext:authTag
    const encryptedOtp = `${iv.toString("hex")}:${ciphertext}:${authTag}`;

    // 3. Verificador criptográfico unidireccional HMAC-SHA256 para la validación
    const verifier = crypto
      .createHmac("sha256", OTP_ENVELOPE_SECRET)
      .update(`${challengeId}:${rawOtp}`)
      .digest("hex");

    // 4. Persistir el sobre cifrado en la base de datos
    const envelope = await prisma.otpDeliveryEnvelope.create({
      data: {
        challengeId,
        encryptedOtp,
        targetMasked,
        channel,
        status: "PENDING",
        expiresAt,
      },
    });

    return {
      rawOtp,
      verifier,
      envelopeId: envelope.id,
      challengeId,
      targetMasked,
      channel,
      expiresAt,
    };
  }

  /**
   * Descifra el sobre de entrega para su despacho seguro hacia el sumidero de notificación local.
   * Valida expiración, estado pendiente y autenticidad GCM.
   */
  public static async unsealAndDeliverOtp(
    challengeId: string
  ): Promise<{ success: boolean; channel: string; targetMasked: string; status: string }> {
    const envelope = await prisma.otpDeliveryEnvelope.findUnique({
      where: { challengeId },
    });

    if (!envelope) {
      throw new Error(`Sobre de entrega OTP para desafío ${challengeId} no encontrado.`);
    }

    if (envelope.status !== "PENDING") {
      return {
        success: false,
        channel: envelope.channel,
        targetMasked: envelope.targetMasked,
        status: envelope.status,
      };
    }

    if (new Date() > envelope.expiresAt) {
      await prisma.otpDeliveryEnvelope.update({
        where: { id: envelope.id },
        data: { status: "EXPIRED" },
      });
      return {
        success: false,
        channel: envelope.channel,
        targetMasked: envelope.targetMasked,
        status: "EXPIRED",
      };
    }

    // Descifrado AES-256-GCM
    const parts = envelope.encryptedOtp.split(":");
    if (parts.length !== 3) {
      throw new Error("Formato de sobre cifrado inválido o corrupto.");
    }

    const [ivHex, ciphertextHex, authTagHex] = parts;
    const key = crypto.createHash("sha256").update(OTP_ENVELOPE_SECRET).digest();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decryptedOtp = decipher.update(ciphertextHex, "hex", "utf8");
    decryptedOtp += decipher.final("utf8");

    // Registro seguro en sumidero de notificación local (Simulación auditada)
    // El contenido es seguro y redactado en bitácoras generales
    await prisma.notificationDispatchLog.create({
      data: {
        recipientType: "CLIENT",
        recipientId: challengeId,
        channel: envelope.channel,
        templateCode: "OTP_SECURITY_CHALLENGE",
        title: "Código de Verificación Fintera",
        content: `Tu código de verificación de acceso seguro al Portal Fintera es: [PROTECTED_OTP_DISPATCHED_TO_${envelope.targetMasked}]`,
        status: "CAPTURED_LOCAL",
        metadata: {
          challengeId,
          targetMasked: envelope.targetMasked,
          channel: envelope.channel,
          dispatchedAt: new Date().toISOString(),
          // Nota de gobernanza: El código real no se loguea en JSON plano
        },
      },
    });

    // Actualizar estado del sobre a DELIVERED_LOCAL
    await prisma.otpDeliveryEnvelope.update({
      where: { id: envelope.id },
      data: { status: "DELIVERED_LOCAL" },
    });

    return {
      success: true,
      channel: envelope.channel,
      targetMasked: envelope.targetMasked,
      status: "DELIVERED_LOCAL",
    };
  }

  /**
   * Marca el sobre como consumido una vez que el cliente valida satisfactoriamente su OTP
   */
  public static async markConsumed(challengeId: string): Promise<void> {
    await prisma.otpDeliveryEnvelope.updateMany({
      where: { challengeId },
      data: {
        status: "CONSUMED",
        consumedAt: new Date(),
      },
    });
  }
}
