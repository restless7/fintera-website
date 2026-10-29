/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G01: Registro y Despachador de Consumidores de Eventos del Outbox
 */

import { CanonicalOutboxEvent, DOMAIN_EVENT_TYPES } from "./event-contracts";
import { IdempotencyService } from "./idempotency-service";
import { OtpEnvelopeService } from "../notifications/otp-envelope-service";
import { NotificationRouter } from "../notifications/notification-router";

export type EventConsumerHandler = (event: CanonicalOutboxEvent) => Promise<string | void>;

export class ConsumerRegistry {
  private static consumers: Map<string, { consumerName: string; handler: EventConsumerHandler }[]> = new Map();

  /**
   * Registra un consumidor para un tipo de evento específico
   */
  public static registerConsumer(
    eventType: string,
    consumerName: string,
    handler: EventConsumerHandler
  ): void {
    if (!this.consumers.has(eventType)) {
      this.consumers.set(eventType, []);
    }
    this.consumers.get(eventType)!.push({ consumerName, handler });
  }

  /**
   * Ejecuta todos los consumidores registrados para un evento de forma idempotente
   */
  public static async dispatchEvent(event: CanonicalOutboxEvent): Promise<{
    processedCount: number;
    skippedCount: number;
    results: { consumerName: string; status: "SUCCESS" | "SKIPPED" | "FAILED"; error?: string }[];
  }> {
    const registered = this.consumers.get(event.eventType) || [];
    let processedCount = 0;
    let skippedCount = 0;
    const results: { consumerName: string; status: "SUCCESS" | "SKIPPED" | "FAILED"; error?: string }[] = [];

    for (const { consumerName, handler } of registered) {
      // 1. Verificación de Idempotencia: ¿Ya fue procesado este evento por este consumidor?
      const alreadyProcessed = await IdempotencyService.hasBeenProcessed(consumerName, event.id);
      if (alreadyProcessed) {
        skippedCount++;
        results.push({ consumerName, status: "SKIPPED" });
        continue;
      }

      // 2. Ejecutar el manejador del consumidor fuera de transacciones del Outbox
      try {
        const summary = await handler(event);
        await IdempotencyService.recordReceipt(
          consumerName,
          event.id,
          "SUCCESS",
          summary || "Procesado correctamente"
        );
        processedCount++;
        results.push({ consumerName, status: "SUCCESS" });
      } catch (err: any) {
        await IdempotencyService.recordReceipt(
          consumerName,
          event.id,
          "FAILED",
          err?.message || String(err)
        );
        results.push({ consumerName, status: "FAILED", error: err?.message || String(err) });
        // Lanzar error para que el outbox worker active la política de reintentos
        throw err;
      }
    }

    return { processedCount, skippedCount, results };
  }

  /**
   * Inicializa los consumidores estándar del CRM
   */
  public static initializeStandardConsumers(): void {
    this.consumers.clear();

    // 1. Consumidor de Seguridad: Despacho de Reto OTP Cifrado
    this.registerConsumer(
      DOMAIN_EVENT_TYPES.CUSTOMER_OTP_CHALLENGE_ISSUED,
      "OtpDeliveryConsumer",
      async (event) => {
        const challengeId = event.payload?.challengeId || event.aggregateId;
        const result = await OtpEnvelopeService.unsealAndDeliverOtp(challengeId);
        return `Sobre OTP descifrado y entregado localmente a ${result.targetMasked} (${result.status})`;
      }
    );

    // 2. Consumidor de Notificación: Mensajes del Cliente hacia Asesor
    this.registerConsumer(
      DOMAIN_EVENT_TYPES.CUSTOMER_MESSAGE_RECEIVED,
      "CustomerMessageNotificationConsumer",
      async (event) => {
        const { applicationId, messageId, senderName } = event.payload;
        await NotificationRouter.dispatchNewCustomerMessageAlert(
          applicationId,
          messageId,
          senderName || "Cliente Verificado"
        );
        return `Alerta generada para asesor por mensaje ${messageId}`;
      }
    );

    // 3. Consumidor de Notificación: Transición Bancaria hacia Cliente (si está publicada)
    this.registerConsumer(
      DOMAIN_EVENT_TYPES.BANK_STAGE_TRANSITIONED,
      "BankStageCustomerNotificationConsumer",
      async (event) => {
        const { applicationId, bankId, toStage } = event.payload;
        // Solo notifica al cliente si se trata de un hito con proyección pública
        await NotificationRouter.dispatchCustomerStageNotification({
          applicationId,
          bankId,
          stageTitle: toStage,
          publicDescription: `Tu expediente bancario en ${bankId} ha registrado la etapa ${toStage}.`,
        });
        return `Notificación pública registrada para expediente ${applicationId}`;
      }
    );

    // 4. Consumidor de Notificación: Mensaje del Asesor hacia Cliente
    this.registerConsumer(
      DOMAIN_EVENT_TYPES.ADVISOR_MESSAGE_SENT,
      "AdvisorMessageCustomerNotificationConsumer",
      async (event) => {
        const { applicationId, messageId, advisorName } = event.payload;
        return `Notificación de respuesta de asesor (${advisorName || "Asesor Fintera"}) registrada para expediente ${applicationId}`;
      }
    );
  }
}

// Inicializar automáticamente al importar el módulo
ConsumerRegistry.initializeStandardConsumers();
