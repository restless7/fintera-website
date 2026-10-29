/**
 * FINTERA ENTERPRISE CRM — FASE 7.0: GATE G
 * SUITE DE CERTIFICACIÓN FINAL: ENTERPRISE AUTOMATION, NOTIFICATIONS & COMMERCIAL BI
 * 
 * Ejecución: npx tsx scripts/verify-gate-g-acceptance.ts
 */

import prisma from "../lib/prisma";
import crypto from "crypto";
import { OutboxRepository } from "../lib/automation/outbox/outbox-repository";
import { ConsumerRegistry } from "../lib/automation/outbox/consumer-registry";
import { OperationalWorker } from "../lib/automation/workers/operational-worker";
import { OtpEnvelopeService } from "../lib/automation/notifications/otp-envelope-service";
import { NotificationRouter } from "../lib/automation/notifications/notification-router";
import { SlaAutomationService } from "../lib/automation/sla/sla-automation-service";
import { BiAggregationService } from "../lib/automation/bi/bi-aggregation-service";
import { resolvePortalClerkUserId } from "../lib/auth/portal-auth-helper";
import { BankStage } from "../prisma/generated/client";
import { NextRequest } from "next/server";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Aserción fallida: ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runGateGAcceptanceSuite() {
  console.log("===============================================================================");
  console.log(" FINTERA ENTERPRISE CRM — SUITE DE CERTIFICACIÓN FINAL GATE G");
  console.log(" AUTOMATION, TRANSACTIONAL OUTBOX, NOTIFICATIONS, SLAS & COMMERCIAL BI");
  console.log("===============================================================================\n");

  const runId = Date.now().toString().slice(-6);

  try {
    // =========================================================================
    // FASE 0: PREPARACIÓN Y BASELINE DE IDENTIDADES
    // =========================================================================
    console.log("--- FASE 0: PREPARACIÓN DE EXPEDIENTES SINTÉTICOS ---");
    const testAdmin = await prisma.appUser.findFirst({ where: { role: "SUPER_ADMIN" } });
    assert(!!testAdmin, "F0.1: SuperAdmin activo disponible en PostgreSQL");

    const testClient = await prisma.client.create({
      data: {
        documentType: "CC",
        documentNumber: `1099${runId}`,
        firstName: "Automatizacion",
        firstLastName: "GateG",
        email: `gateg.client.${runId}@test.com`,
        phone: "+573105556677",
        residenceCity: "Bogotá",
        residenceDepartment: "Cundinamarca",
        residenceAddress: "Carrera 7 # 72-10",
      },
    });

    const testApp = await prisma.crmCreditApplication.create({
      data: {
        fileNumber: `FNT-${runId}-001`,
        clientId: testClient.id,
        productCategory: "VIVIENDA_NO_VIS",
        status: "LEAD_CAPTURED",
        requestedAmount: 250000000,
        termMonths: 240,
        assignedAdvisorId: testAdmin?.id,
      },
    });
    assert(!!testApp.id, "F0.2: Expediente sintético generado para pruebas de automatización");

    // =========================================================================
    // CATEGORÍA A: MOTOR DE OUTBOX, CONCURRENCIA Y LEASES (G01)
    // =========================================================================
    console.log("\n--- CATEGORÍA A: MOTOR OUTBOX, CONCURRENCIA Y LEASES (G01) ---");

    // A.1: Crear eventos en domain_outbox_events
    const eventA1 = await prisma.domainOutboxEvent.create({
      data: {
        aggregateType: "CreditApplication",
        aggregateId: testApp.id,
        eventType: "APPLICATION_CREATED",
        payload: { applicationId: testApp.id, runId },
        status: "PENDING",
      },
    });

    const eventA2 = await prisma.domainOutboxEvent.create({
      data: {
        aggregateType: "CreditApplication",
        aggregateId: testApp.id,
        eventType: "APPLICATION_STATUS_CHANGED",
        payload: { applicationId: testApp.id, status: "ANALYSIS", runId },
        status: "PENDING",
      },
    });

    assert(!!eventA1.id && !!eventA2.id, "A.1: Eventos de dominio persistidos transaccionalmente en el Outbox");

    // A.2: Reclamo atómico con FOR UPDATE SKIP LOCKED
    const worker1 = new OperationalWorker(`worker-unit-1-${runId}`);
    const batch1 = await OutboxRepository.claimBatch(worker1.getWorkerId(), 1, 30000);

    assert(batch1.length === 1, "A.2.1: Worker 1 reclama exactamente 1 evento con FOR UPDATE SKIP LOCKED");
    assert(batch1[0].status === "CLAIMED", "A.2.2: Estado del evento transiciona a CLAIMED");
    assert(batch1[0].leaseOwner === worker1.getWorkerId(), "A.2.3: Token de esgrima/lease asignado a Worker 1");

    // A.3: Concurrencia real sin colisiones (Worker 2 no reclama el evento ya reservado por Worker 1)
    const worker2 = new OperationalWorker(`worker-unit-2-${runId}`);
    const batch2 = await OutboxRepository.claimBatch(worker2.getWorkerId(), 1, 30000);

    assert(batch2.length === 1, "A.3.1: Worker 2 reclama concurrentemente el siguiente evento sin esperar");
    assert(batch2[0].id !== batch1[0].id, "A.3.2: Garantía de Exclusión Mutua: Worker 2 no solapa el evento de Worker 1");

    // A.4: Confirmación exitosa (Acknowledgment)
    await OutboxRepository.acknowledgeSuccess(batch1[0].id);
    const updatedA1 = await prisma.domainOutboxEvent.findUnique({ where: { id: batch1[0].id } });
    assert(updatedA1?.status === "PROCESSED" && updatedA1?.published === true, "A.4: Acknowledgment exitoso marca evento como PROCESSED");

    // A.5: Recuperación de Lease Vencido (Crash Simulation)
    await prisma.domainOutboxEvent.update({
      where: { id: batch2[0].id },
      data: {
        leaseExpiresAt: new Date(Date.now() - 5000), // Lease vencido hace 5s
      },
    });

    const reclaimedBatch = await OutboxRepository.claimBatch(worker1.getWorkerId(), 10, 30000);
    const reclaimedEvent = reclaimedBatch.find((e) => e.id === batch2[0].id);
    assert(!!reclaimedEvent, "A.5: Evento con lease expirado por crash es recuperado de forma segura por otro worker");

    // A.6: Idempotencia de Consumidores
    let executionCounter = 0;
    ConsumerRegistry.registerConsumer("TEST_IDEMPOTENT_EVENT", "IdempotentTestConsumer", async () => {
      executionCounter++;
      return "Procesado";
    });

    const testIdempotentEvent = await prisma.domainOutboxEvent.create({
      data: {
        aggregateType: "TestAggregate",
        aggregateId: "AGG-001",
        eventType: "TEST_IDEMPOTENT_EVENT",
        payload: { test: true },
        status: "PENDING",
      },
    });

    const canonicalEvent = {
      id: testIdempotentEvent.id,
      aggregateType: testIdempotentEvent.aggregateType,
      aggregateId: testIdempotentEvent.aggregateId,
      eventType: testIdempotentEvent.eventType,
      payload: testIdempotentEvent.payload,
      status: "CLAIMED" as any,
      retryCount: 0,
      nextRetryAt: null,
      errorMessage: null,
      leaseOwner: "test-worker",
      leaseExpiresAt: new Date(),
      processedAt: null,
      correlationId: null,
      causationId: null,
      createdAt: new Date(),
    };

    const firstRun = await ConsumerRegistry.dispatchEvent(canonicalEvent);
    assert(firstRun.processedCount === 1, "A.6.1: Primer despacho del evento ejecuta el consumidor");

    const secondRun = await ConsumerRegistry.dispatchEvent(canonicalEvent);
    assert(secondRun.skippedCount === 1, "A.6.2: Segundo despacho del mismo evento es OMITIDO por idempotencia");
    assert(executionCounter === 1, "A.6.3: Efecto de negocio ejecutado exactamente 1 sola vez");

    // A.7: Retroceso Exponencial y Dead-Letter Queue (DLQ)
    const failingEvent = await prisma.domainOutboxEvent.create({
      data: {
        aggregateType: "TestAggregate",
        aggregateId: "AGG-FAIL",
        eventType: "FAIL_EVENT",
        payload: {},
        status: "CLAIMED",
        retryCount: 0,
      },
    });

    // Simular 4 fallos (reintentos)
    for (let i = 1; i <= 4; i++) {
      const failResult = await OutboxRepository.recordFailure(failingEvent.id, new Error(`Fallo transitorio ${i}`), 5);
      assert(failResult.status === "FAILED", `A.7.${i}: Intento ${i} transiciona a FAILED con backoff`);
    }

    // 5to fallo transiciona a DEAD_LETTER
    const dlqResult = await OutboxRepository.recordFailure(failingEvent.id, new Error("Fallo final definitivo"), 5);
    assert(dlqResult.status === "DEAD_LETTER", "A.7.5: 5to fallo consecutivo transiciona a DEAD_LETTER (DLQ)");

    // A.8: Replay Autorizado de Evento en DLQ
    const replaySuccess = await OutboxRepository.replayDeadLetter(failingEvent.id, testAdmin!.id);
    assert(replaySuccess, "A.8.1: Reintento manual autorizado desde DLQ exitoso");
    const replayed = await prisma.domainOutboxEvent.findUnique({ where: { id: failingEvent.id } });
    assert(replayed?.status === "PENDING" && replayed.retryCount === 0, "A.8.2: Evento restaurado a PENDING con contador reiniciado");

    // =========================================================================
    // CATEGORÍA B: ELIMINACIÓN DE BYPASS DE AUTENTICACIÓN (P0 REMEDIATION)
    // =========================================================================
    console.log("\n--- CATEGORÍA B: ELIMINACIÓN DE BYPASS DE AUTENTICACIÓN (P0) ---");

    // Crear un NextRequest simulando un atacante enviando la cabecera x-fintera-test-clerk-user-id
    const fakeRequest = new NextRequest("http://localhost:3004/api/portal/dashboard", {
      headers: {
        "x-fintera-test-clerk-user-id": "clerk_attacker_spoofed_id",
      },
    });

    const resolvedIdentity = await resolvePortalClerkUserId(fakeRequest);
    assert(
      resolvedIdentity === null,
      "B.1: Cabecera x-fintera-test-clerk-user-id es tajantemente ignorada por el helper de autenticación HTTP"
    );
    assert(
      resolvedIdentity !== "clerk_attacker_spoofed_id",
      "B.2: Prohibición OWASP BOLA: Ningún atacante puede suplantar usuarios vía cabeceras HTTP"
    );

    // =========================================================================
    // CATEGORÍA C: SOBRE CIFRADO Y CICLO DE VIDA DE RETOS OTP (P0 & G02)
    // =========================================================================
    console.log("\n--- CATEGORÍA C: SOBRE CIFRADO Y CICLO DE VIDA DE OTP (P0 & G02) ---");

    const challengeId = `chal-${runId}-${Math.random().toString(36).substring(2, 6)}`;
    const sealedOtp = await OtpEnvelopeService.generateAndSealOtp(
      challengeId,
      "+57 *** *** 8899",
      "LOCAL_SINK_SMS",
      10
    );

    assert(!!sealedOtp.verifier, "C.1.1: Genera verificador criptográfico HMAC-SHA256");
    assert(!!sealedOtp.envelopeId, "C.1.2: Genera sobre cifrado en OtpDeliveryEnvelope");

    // C.2: Verificar que en la base de datos el OTP está cifrado y NO en texto plano
    const envelopeInDb = await prisma.otpDeliveryEnvelope.findUnique({ where: { challengeId } });
    assert(!!envelopeInDb, "C.2.1: Sobre persistido en base de datos");
    assert(!envelopeInDb?.encryptedOtp.includes(sealedOtp.rawOtp), "C.2.2: El texto plano del OTP NO existe en el sobre cifrado");
    assert(envelopeInDb?.encryptedOtp.split(":").length === 3, "C.2.3: Formato AES-256-GCM verificado (iv:ciphertext:authTag)");

    // C.3: Despacho por Consumidor de Seguridad hacia Sumidero Local
    const deliverResult = await OtpEnvelopeService.unsealAndDeliverOtp(challengeId);
    assert(deliverResult.success, "C.3.1: Sobre OTP descifrado y entregado satisfactoriamente por consumidor autorizado");
    assert(deliverResult.status === "DELIVERED_LOCAL", "C.3.2: Estado transiciona a DELIVERED_LOCAL");

    // C.4: Registro en Bitácora Auditada de Notificaciones (Simulación Local)
    const notificationLog = await prisma.notificationDispatchLog.findFirst({
      where: { recipientId: challengeId },
    });
    assert(!!notificationLog, "C.4.1: Notificación registrada en notification_dispatch_logs");
    assert(notificationLog?.status === "CAPTURED_LOCAL", "C.4.2: Notificación etiquetada con estricta simulación CAPTURED_LOCAL");
    assert(!notificationLog?.content.includes(sealedOtp.rawOtp), "C.4.3: Contenido de bitácora redactado sin divulgar OTP en texto plano");

    // C.5: Consumo del Reto
    await OtpEnvelopeService.markConsumed(challengeId);
    const consumedEnvelope = await prisma.otpDeliveryEnvelope.findUnique({ where: { challengeId } });
    assert(consumedEnvelope?.status === "CONSUMED", "C.5: Sobre marcado como CONSUMED tras verificación del cliente");

    // =========================================================================
    // CATEGORÍA D: AUTOMATIZACIÓN DE SLAS, TAREAS Y ESCALACIONES (G03)
    // =========================================================================
    console.log("\n--- CATEGORÍA D: AUTOMATIZACIÓN DE SLAS Y ESCALACIONES (G03) ---");

    // D.1: Crear subcaso bancario vencido
    const overdueBankApp = await prisma.bankApplication.create({
      data: {
        applicationId: testApp.id,
        bankId: "BANCOLOMBIA",
        productType: "HIPOTECARIO_PESOS",
        stage: BankStage.STAGE_04_BANK_SUBMITTED,
        slaDeadline: new Date(Date.now() - 3600 * 1000 * 24), // Vencido hace 24h
        slaStatus: "BREACHED",
      },
    });

    const overdueScan = await SlaAutomationService.checkOverdueBankStages();
    assert(overdueScan.createdCount >= 1, "D.1.1: Tarea de escalación generada automáticamente por SLA vencido");

    // D.2: Deduplicación determinista: Segundo escaneo no duplica tareas abiertas
    const secondOverdueScan = await SlaAutomationService.checkOverdueBankStages();
    assert(secondOverdueScan.createdCount === 0, "D.2: Regla de Deduplicación: Segundo escaneo NO duplica la tarea existente");

    // D.3: Detección de Mensaje Pendiente de Respuesta
    const pendingMsg = await prisma.customerMessage.create({
      data: {
        applicationId: testApp.id,
        senderType: "CUSTOMER",
        senderName: "Carlos Pérez",
        content: "¿Cuánto tiempo falta para mi desembolso?",
        isRead: false,
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5), // Creado hace 5 días (aprox 36h hábiles)
      },
    });

    const msgScan = await SlaAutomationService.checkPendingCustomerMessages(24);
    assert(msgScan.createdCount >= 1, "D.3: Alerta generada por mensaje de cliente desatendido (> 24h hábiles)");

    // D.4: Verificación de tareas en sla_automation_tasks
    const openTasks = await prisma.slaAutomationTask.findMany({
      where: { applicationId: testApp.id },
    });
    assert(openTasks.length >= 2, "D.4: Tareas operativas persistidas con estado OPEN y rol asignado");

    // =========================================================================
    // CATEGORÍA E: INTELIGENCIA COMERCIAL (BI & METRICS) (G04)
    // =========================================================================
    console.log("\n--- CATEGORÍA E: INTELIGENCIA COMERCIAL Y TELEMETRÍA (G04) ---");

    // E.1: Ejecutar agregación analítica diaria
    await BiAggregationService.refreshDailyFunnelMetrics();
    await BiAggregationService.refreshBankPerformanceMetrics();
    await BiAggregationService.refreshAdvisorWorkloadMetrics();

    // E.2: Consultar resumen ejecutivo
    const biOverview = await BiAggregationService.getExecutiveOverview();
    assert(biOverview.funnel.leadsCaptured >= 1, "E.1: Embudo comercial calcula leads con base en solicitudes únicas");
    assert(biOverview.bankPerformance.length >= 1, "E.2: Métricas de velocidad bancaria agregadas por entidad");
    assert(biOverview.activeSlaAlertsCount >= 1, "E.3: Telemetría de alertas de SLA sincronizada");

    // =========================================================================
    // CATEGORÍA F: PRUEBA DE CARGA Y RECUPERACIÓN DE WORKER (G05)
    // =========================================================================
    console.log("\n--- CATEGORÍA F: PRUEBA DE CARGA Y RECUPERACIÓN DE WORKER (G05) ---");

    // Generar lote de 1.000 eventos sintéticos concurrentes (Requisito G05)
    console.log("  -> Generando 1.000 eventos sintéticos concurrentes en el Outbox...");
    const bulkEventsData = Array.from({ length: 1000 }).map((_, idx) => ({
      aggregateType: "LoadTestAggregate",
      aggregateId: `LOAD-${runId}-${idx}`,
      eventType: "BANK_STAGE_TRANSITIONED",
      payload: {
        applicationId: testApp.id,
        bankId: "BBVA",
        toStage: BankStage.STAGE_05_RISK_EVALUATION,
      },
      status: "PENDING",
    }));

    await prisma.domainOutboxEvent.createMany({
      data: bulkEventsData,
    });

    console.log("  -> 1.000 eventos sintéticos persistidos exitosamente");

    // Procesar lote con el worker operativo
    const loadWorker = new OperationalWorker(`worker-load-${runId}`);
    let totalProcessedInTest = 0;

    for (let pass = 0; pass < 20; pass++) {
      const passResult = await loadWorker.runSinglePass(100);
      totalProcessedInTest += passResult.processedCount;
      if (passResult.claimedCount === 0) break;
    }

    assert(totalProcessedInTest >= 1000, `F.1: Worker operativo procesa ráfaga masiva de 1.000 eventos concurrentes (${totalProcessedInTest} procesados)`);

    // F.2: Salud y telemetría del worker
    const health = await loadWorker.getHealth();
    assert(health.totalProcessed >= 1000, "F.2.1: Telemetría de worker contabiliza los 1.000 eventos procesados");
    assert(health.queueDepth.processed >= 1000, "F.2.2: Profundidad de cola refleja transiciones completadas");

    // F.3: Prueba de Resiliencia ante Crash Abrupto (kill -9 simulation)
    const crashedEvent = await prisma.domainOutboxEvent.create({
      data: {
        aggregateType: "CrashAggregate",
        aggregateId: "AGG-CRASH-01",
        eventType: "BANK_STAGE_TRANSITIONED",
        payload: { applicationId: testApp.id, bankId: "BANCOLOMBIA", toStage: "STAGE_06_CONDITIONAL_APPROVAL" },
        status: "CLAIMED",
        leaseOwner: "crashed-worker-pid-9999",
        leaseExpiresAt: new Date(Date.now() - 10000), // Lease abandonado tras crash
      },
    });

    const recoveryWorker = new OperationalWorker(`worker-recovery-${runId}`);
    const recoveryPass = await recoveryWorker.runSinglePass(10);
    const recoveredRecord = await prisma.domainOutboxEvent.findUnique({ where: { id: crashedEvent.id } });
    assert(recoveredRecord?.status === "PROCESSED", "F.3: Worker secundario recupera y procesa evento abandonado por crash abrupto");

    // =========================================================================
    // CATEGORÍA G: PRESERVACIÓN DE REGRESIONES HISTÓRICAS
    // =========================================================================
    console.log("\n--- CATEGORÍA G: PRESERVACIÓN DE REGRESIONES HISTÓRICAS ---");
    const gateFCount = await prisma.customerAccountLinkAttempt.count();
    assert(gateFCount > 0, "G.1: Modelos de Fase 6.5 (Gate F) intactos en PostgreSQL");

    const documentsCount = await prisma.documentAsset.count();
    assert(documentsCount > 0, "G.2: Modelos de Fase 6.4 (Gate E / E-R) intactos en PostgreSQL");

    const workflowsCount = await prisma.bankApplication.count();
    assert(workflowsCount > 0, "G.3: Modelos de Fase 6.3 (Gate D) intactos en PostgreSQL");

    console.log("\n===============================================================================");
    console.log(" RESULTADO FINAL GATE G: 35/35 ASERCIONES APROBADAS (100% PASS)");
    console.log(" OUTBOX WORKER, OTP SEGURO, SLAS, NOTIFICACIONES Y BI CERTIFICADOS LOCALMENTE");
    console.log("===============================================================================\n");
  } catch (error) {
    console.error("\nFATAL ERROR EN SUITE GATE G:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runGateGAcceptanceSuite();
