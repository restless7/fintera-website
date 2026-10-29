/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * G01: Orquestador Operativo del Outbox Worker (Proceso Autónomo y Resiliente)
 */

import { OutboxRepository } from "../outbox/outbox-repository";
import { ConsumerRegistry } from "../outbox/consumer-registry";
import { CanonicalOutboxEvent } from "../outbox/event-contracts";

export interface WorkerHealthStatus {
  workerId: string;
  isRunning: boolean;
  totalProcessed: number;
  totalFailed: number;
  lastHeartbeat: Date;
  queueDepth: {
    pending: number;
    claimed: number;
    processed: number;
    failed: number;
    deadLetter: number;
  };
}

export class OperationalWorker {
  private workerId: string;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private totalProcessed: number = 0;
  private totalFailed: number = 0;
  private lastHeartbeat: Date = new Date();

  constructor(workerId?: string) {
    this.workerId = workerId || `worker-g01-${process.pid}-${Math.random().toString(36).substring(2, 7)}`;
    ConsumerRegistry.initializeStandardConsumers();
  }

  /**
   * Ejecuta una pasada de procesamiento de eventos acotada y determinista (útil para pruebas y cron)
   */
  public async runSinglePass(batchSize: number = 20): Promise<{
    claimedCount: number;
    processedCount: number;
    failedCount: number;
  }> {
    this.lastHeartbeat = new Date();

    // 1. Reclamar lote atómicamente con FOR UPDATE SKIP LOCKED
    const events: CanonicalOutboxEvent[] = await OutboxRepository.claimBatch(
      this.workerId,
      batchSize,
      30000 // 30s de duración de lease
    );

    if (events.length === 0) {
      return { claimedCount: 0, processedCount: 0, failedCount: 0 };
    }

    let processedCount = 0;
    let failedCount = 0;

    // 2. Procesar cada evento fuera de la transacción del claim
    for (const event of events) {
      try {
        await ConsumerRegistry.dispatchEvent(event);
        await OutboxRepository.acknowledgeSuccess(event.id);
        processedCount++;
        this.totalProcessed++;
      } catch (err: any) {
        failedCount++;
        this.totalFailed++;
        await OutboxRepository.recordFailure(event.id, err);
      }
    }

    return {
      claimedCount: events.length,
      processedCount,
      failedCount,
    };
  }

  /**
   * Inicia el bucle continuo del worker
   */
  public start(intervalMs: number = 1000): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const loop = async () => {
      if (!this.isRunning) return;
      try {
        await this.runSinglePass();
      } catch (err) {
        console.error(`[OperationalWorker ${this.workerId}] Error en ciclo:`, err);
      } finally {
        if (this.isRunning) {
          this.timer = setTimeout(loop, intervalMs);
        }
      }
    };

    loop();
  }

  /**
   * Detiene de manera ordenada el bucle del worker
   */
  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Reporta el estado de salud y telemetría operativa del worker
   */
  public async getHealth(): Promise<WorkerHealthStatus> {
    const queueDepth = await OutboxRepository.getQueueMetrics();
    return {
      workerId: this.workerId,
      isRunning: this.isRunning,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      lastHeartbeat: this.lastHeartbeat,
      queueDepth,
    };
  }

  public getWorkerId(): string {
    return this.workerId;
  }
}
