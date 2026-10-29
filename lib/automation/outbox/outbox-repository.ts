/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G01: Repositorio Canónico del Outbox Transaccional y Coordinación de Concurrencia
 */

import prisma from "@/lib/prisma";
import { CanonicalOutboxEvent, OUTBOX_STATUS } from "./event-contracts";

export class OutboxRepository {
  /**
   * Reclama un lote acotado de eventos elegibles de manera atómica utilizando FOR UPDATE SKIP LOCKED.
   * La transacción es deliberadamente breve: solo reserva el lease y confirma inmediatamente.
   */
  public static async claimBatch(
    workerId: string,
    batchSize: number = 20,
    leaseDurationMs: number = 30000
  ): Promise<CanonicalOutboxEvent[]> {
    const now = new Date();
    const leaseExpiry = new Date(now.getTime() + leaseDurationMs);

    return await prisma.$transaction(async (tx) => {
      // 1. Consulta con bloqueo de fila no bloqueante (SKIP LOCKED)
      // Selecciona eventos PENDING, reintentos FAILED cuya hora de reintento haya llegado,
      // o eventos CLAIMED cuyo lease haya caducado (recuperación de crash).
      const rawEvents = await tx.$queryRaw<any[]>`
        SELECT id
        FROM "domain_outbox_events"
        WHERE ("status" = 'PENDING' AND "published" = false)
           OR ("status" = 'FAILED' AND "nextRetryAt" <= ${now})
           OR ("status" = 'CLAIMED' AND "leaseExpiresAt" <= ${now})
        ORDER BY "createdAt" ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      `;

      if (!rawEvents || rawEvents.length === 0) {
        return [];
      }

      const eventIds: string[] = rawEvents.map((r) => r.id);

      // 2. Establecer el lease y token de esgrima atómicamente
      await tx.$executeRaw`
        UPDATE "domain_outbox_events"
        SET "status" = 'CLAIMED',
            "leaseOwner" = ${workerId},
            "leaseExpiresAt" = ${leaseExpiry}
        WHERE "id" = ANY(${eventIds}::text[])
      `;

      // 3. Recuperar las entidades completas actualizadas
      const claimedRecords = await tx.domainOutboxEvent.findMany({
        where: { id: { in: eventIds } },
      });

      return claimedRecords.map((r) => ({
        id: r.id,
        aggregateType: r.aggregateType,
        aggregateId: r.aggregateId,
        eventType: r.eventType,
        payload: r.payload,
        status: r.status as any,
        retryCount: r.retryCount,
        nextRetryAt: r.nextRetryAt,
        errorMessage: r.errorMessage,
        leaseOwner: r.leaseOwner,
        leaseExpiresAt: r.leaseExpiresAt,
        processedAt: r.processedAt,
        correlationId: r.correlationId,
        causationId: r.causationId,
        createdAt: r.createdAt,
      }));
    });
  }

  /**
   * Confirma el procesamiento exitoso de un evento
   */
  public static async acknowledgeSuccess(eventId: string): Promise<void> {
    const now = new Date();
    await prisma.domainOutboxEvent.update({
      where: { id: eventId },
      data: {
        status: OUTBOX_STATUS.PROCESSED,
        published: true,
        processedAt: now,
        leaseOwner: null,
        leaseExpiresAt: null,
        errorMessage: null,
      },
    });
  }

  /**
   * Registra el fallo en el procesamiento con retroceso exponencial (Exponential Backoff + Jitter)
   * o transiciona a Dead-Letter Queue (DLQ) si se agotan los reintentos.
   */
  public static async recordFailure(
    eventId: string,
    error: any,
    maxRetries: number = 5
  ): Promise<{ status: string; retryCount: number }> {
    const current = await prisma.domainOutboxEvent.findUnique({
      where: { id: eventId },
      select: { retryCount: true },
    });

    const newRetryCount = (current?.retryCount || 0) + 1;
    const errorMessage = (error?.message || String(error)).slice(0, 1000);

    if (newRetryCount >= maxRetries) {
      // Transición a DEAD_LETTER
      await prisma.domainOutboxEvent.update({
        where: { id: eventId },
        data: {
          status: OUTBOX_STATUS.DEAD_LETTER,
          retryCount: newRetryCount,
          errorMessage: `[DLQ EXHAUSTED ${maxRetries} RETRIES]: ${errorMessage}`,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      });

      return { status: OUTBOX_STATUS.DEAD_LETTER, retryCount: newRetryCount };
    }

    // Cálculo de retroceso exponencial con Jitter: min(60s, 1000ms * 2^retries) + jitter(0..500ms)
    const baseBackoffMs = Math.min(60000, 1000 * Math.pow(2, newRetryCount));
    const jitterMs = Math.floor(Math.random() * 500);
    const nextRetryAt = new Date(Date.now() + baseBackoffMs + jitterMs);

    await prisma.domainOutboxEvent.update({
      where: { id: eventId },
      data: {
        status: OUTBOX_STATUS.FAILED,
        retryCount: newRetryCount,
        nextRetryAt,
        errorMessage,
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });

    return { status: OUTBOX_STATUS.FAILED, retryCount: newRetryCount };
  }

  /**
   * Reintento manual autorizado de un evento en Dead-Letter Queue
   */
  public static async replayDeadLetter(eventId: string, authorizedUserId: string): Promise<boolean> {
    const event = await prisma.domainOutboxEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.status !== OUTBOX_STATUS.DEAD_LETTER) {
      return false;
    }

    await prisma.domainOutboxEvent.update({
      where: { id: eventId },
      data: {
        status: OUTBOX_STATUS.PENDING,
        retryCount: 0,
        nextRetryAt: null,
        errorMessage: `[REPLAY AUTORIZADO por ${authorizedUserId} el ${new Date().toISOString()}]`,
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    });

    return true;
  }

  /**
   * Métricas y profundidad de la cola
   */
  public static async getQueueMetrics(): Promise<{
    pending: number;
    claimed: number;
    processed: number;
    failed: number;
    deadLetter: number;
  }> {
    const counts = await prisma.domainOutboxEvent.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const metrics = {
      pending: 0,
      claimed: 0,
      processed: 0,
      failed: 0,
      deadLetter: 0,
    };

    for (const c of counts) {
      if (c.status === OUTBOX_STATUS.PENDING) metrics.pending = c._count.id;
      if (c.status === OUTBOX_STATUS.CLAIMED) metrics.claimed = c._count.id;
      if (c.status === OUTBOX_STATUS.PROCESSED) metrics.processed = c._count.id;
      if (c.status === OUTBOX_STATUS.FAILED) metrics.failed = c._count.id;
      if (c.status === OUTBOX_STATUS.DEAD_LETTER) metrics.deadLetter = c._count.id;
    }

    return metrics;
  }
}
