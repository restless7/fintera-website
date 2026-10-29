/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G01: Servicio de Idempotencia y Recibos Durables de Consumidores
 */

import prisma from "@/lib/prisma";

export class IdempotencyService {
  /**
   * Verifica si un evento ya fue procesado de manera exitosa por un consumidor específico
   */
  public static async hasBeenProcessed(consumerName: string, eventId: string): Promise<boolean> {
    const existing = await prisma.outboxConsumerReceipt.findUnique({
      where: {
        consumerName_eventId: {
          consumerName,
          eventId,
        },
      },
    });

    return !!existing && existing.status === "SUCCESS";
  }

  /**
   * Registra de manera durable el recibo de procesamiento de un evento para un consumidor
   */
  public static async recordReceipt(
    consumerName: string,
    eventId: string,
    status: "SUCCESS" | "FAILED",
    resultSummary?: string
  ): Promise<void> {
    await prisma.outboxConsumerReceipt.upsert({
      where: {
        consumerName_eventId: {
          consumerName,
          eventId,
        },
      },
      update: {
        status,
        resultSummary: resultSummary || null,
        processedAt: new Date(),
      },
      create: {
        consumerName,
        eventId,
        status,
        resultSummary: resultSummary || null,
      },
    });
  }
}
