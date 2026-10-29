/**
 * SERVICIO DE IDEMPOTENCIA TRANSACCIONAL (CRM IDEMPOTENCY SERVICE)
 * FASE 6.3: GATE D — REMEDIATION A
 * 
 * Garantiza que reintentos de red o envíos duplicados con la misma clave de intención
 * retornen el resultado original sin crear expedientes duplicados, al tiempo que
 * permite solicitudes legítimas concurrentes o independientes del mismo cliente.
 */

import prisma from "@/lib/prisma";
import crypto from "crypto";

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  status: "PENDING" | "COMPLETED" | "FAILED";
  cachedResponse?: any;
  recordId?: string;
}

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export class IdempotencyService {
  /**
   * Genera el fingerprint SHA-256 de una carga de datos para comparar intenciones idénticas
   */
  static generateFingerprint(payload: Record<string, unknown>): string {
    const sortedString = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash("sha256").update(sortedString).digest("hex");
  }

  /**
   * Verifica o adquiere una clave de idempotencia
   */
  static async checkOrAcquireKey(params: {
    key: string;
    scope?: string;
    payload: Record<string, unknown>;
    ttlHours?: number;
  }): Promise<IdempotencyCheckResult> {
    const { key, scope = "CREDIT_REQUEST_INTAKE", payload, ttlHours = 24 } = params;
    const fingerprint = this.generateFingerprint(payload);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    const existing = await prisma.crmIdempotencyRecord.findUnique({
      where: { key },
    });

    if (existing) {
      // Si la clave existe con diferente fingerprint, es un conflicto de reuso ilegal
      if (existing.fingerprint !== fingerprint) {
        throw new IdempotencyConflictError(
          `Conflicto de Idempotencia: La clave '${key}' ya fue utilizada previamente con un payload diferente.`
        );
      }

      // Si ya está completada, retornar la respuesta cacheada
      if (existing.status === "COMPLETED" && existing.responsePayload) {
        return {
          isDuplicate: true,
          status: "COMPLETED",
          cachedResponse: existing.responsePayload,
          recordId: existing.id,
        };
      }

      // Si está pendiente (procesando en concurrencia inmediata)
      return {
        isDuplicate: true,
        status: existing.status as any,
        recordId: existing.id,
      };
    }

    // Registrar nueva clave pendiente
    try {
      const created = await prisma.crmIdempotencyRecord.create({
        data: {
          key,
          scope,
          fingerprint,
          status: "PENDING",
          expiresAt,
        },
      });

      return {
        isDuplicate: false,
        status: "PENDING",
        recordId: created.id,
      };
    } catch (err: any) {
      // Capturar colisión en caso de envío paralelo exacto en el mismo milisegundo
      if (err.code === "P2002") {
        const rechecked = await prisma.crmIdempotencyRecord.findUnique({ where: { key } });
        return {
          isDuplicate: true,
          status: (rechecked?.status as any) || "PENDING",
          cachedResponse: rechecked?.responsePayload,
          recordId: rechecked?.id,
        };
      }
      throw err;
    }
  }

  /**
   * Marca la clave de idempotencia como completada con la respuesta persistida
   */
  static async completeKey(params: {
    key: string;
    applicationId: string;
    responsePayload: Record<string, unknown>;
  }): Promise<void> {
    const { key, applicationId, responsePayload } = params;
    await prisma.crmIdempotencyRecord.update({
      where: { key },
      data: {
        status: "COMPLETED",
        applicationId,
        responsePayload: responsePayload as any,
      },
    });
  }

  /**
   * Marca la clave como fallida si la transacción abortó
   */
  static async failKey(key: string): Promise<void> {
    await prisma.crmIdempotencyRecord.update({
      where: { key },
      data: {
        status: "FAILED",
      },
    }).catch(() => {});
  }
}
