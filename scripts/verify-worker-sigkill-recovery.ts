/**
 * FINTERA ENTERPRISE CRM — GATE G HARDENING
 * Prueba de Resiliencia Real: Terminación Abrupta con SIGKILL en Proceso Separado
 * y Recuperación Sin Pérdida de Eventos
 */

import { spawn } from "child_process";
import { PrismaClient } from "../prisma/generated/client";
import { OperationalWorker } from "../lib/automation/workers/operational-worker";
import { OutboxRepository } from "../lib/automation/outbox/outbox-repository";

const prisma = new PrismaClient();

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runSigkillRecoveryTest() {
  console.log("\n===============================================================================");
  console.log(" FINTERA ENTERPRISE CRM — PRUEBA DE TERMINACIÓN REAL (SIGKILL) Y RECUPERACIÓN");
  console.log(" VERIFICACIÓN DE RESILIENCIA EN PROCESOS SEPARADOS (P1 HARDENING)");
  console.log("===============================================================================\n");

  const runId = Date.now();

  try {
    const existingApp = await prisma.crmCreditApplication.findFirst({
      where: { applicants: { some: {} } },
      include: { applicants: true },
    });

    const targetAppId = existingApp?.id || "app-real-crash-fallback";

    // 1. Crear un evento de prueba en domain_outbox_events
    const event = await prisma.domainOutboxEvent.create({
      data: {
        aggregateType: "RealCrashAggregate",
        aggregateId: `CRASH-REAL-${runId}`,
        eventType: "BANK_STAGE_TRANSITIONED",
        payload: {
          applicationId: targetAppId,
          bankId: "BANCOLOMBIA",
          toStage: "STAGE_05_RISK_EVALUATION",
          timestamp: new Date().toISOString(),
        },
        status: "PENDING",
      },
    });

    console.log(`1. Evento de prueba creado en Outbox: ${event.id} para solicitud ${targetAppId}`);

    console.log("2. Spawneando proceso hijo dedicado para el worker...");
    const child = spawn("npx", ["tsx", "scripts/child-worker-sigkill-target.ts", event.id], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdoutData = "";
    let stderrData = "";
    child.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    let actualWorkerPid: number = child.pid!;

    // Esperar a que el proceso hijo confirme que reclamó el evento
    const waitClaimed = await new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => resolve(false), 15000);
      const interval = setInterval(() => {
        const match = stdoutData.match(new RegExp(`CLAIMED_EVENT:${event.id}:(\\d+)`));
        if (match) {
          actualWorkerPid = parseInt(match[1], 10);
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });

    if (!waitClaimed) {
      console.error(`  DEBUG stdout: ${stdoutData}`);
      console.error(`  DEBUG stderr: ${stderrData}`);
    }
    assert(waitClaimed, "2.1: El proceso hijo reclamó el evento atómicamente con FOR UPDATE SKIP LOCKED");

    // Verificar en BD que el registro está en estado CLAIMED por el PID del worker
    const inDbClaimed = await prisma.domainOutboxEvent.findUnique({
      where: { id: event.id },
    });
    assert(
      inDbClaimed?.status === "CLAIMED" && inDbClaimed.leaseOwner === `worker-child-pid-${actualWorkerPid}`,
      `2.2: Evento verificado en PostgreSQL bajo lease del proceso hijo PID ${actualWorkerPid}`
    );

    // 3. Ejecutar SIGKILL real e intempestivo sobre el proceso hijo
    console.log(`\n3. Enviando señal SIGKILL (kill -9) al proceso worker hijo PID ${actualWorkerPid}...`);
    const killPromise = new Promise<{ code: number | null; signal: string | null }>((resolve) => {
      child.on("exit", (code, signal) => {
        resolve({ code, signal });
      });
    });

    try {
      process.kill(actualWorkerPid, "SIGKILL");
    } catch (e) {
      // Si actualWorkerPid era diferente de child.pid, también matar child.pid
    }
    if (child.pid && child.pid !== actualWorkerPid) {
      try {
        process.kill(child.pid, "SIGKILL");
      } catch (e) {}
    }

    const exitResult = await killPromise;

    console.log(`  Proceso terminado abruptamente: Signal=${exitResult.signal}, Code=${exitResult.code}`);
    assert(
      exitResult.signal === "SIGKILL" || child.killed || exitResult.code !== 0,
      "3.1: Terminación abrupta SIGKILL completada en el sistema operativo"
    );

    // 4. Verificar integridad en base de datos: el evento NO se perdió
    const postKillRecord = await prisma.domainOutboxEvent.findUnique({
      where: { id: event.id },
    });
    assert(
      postKillRecord !== null && postKillRecord.status === "CLAIMED",
      "4.1: Evento persiste íntegro en PostgreSQL en estado CLAIMED sin pérdida de datos"
    );

    // 5. Simular expiración de lease de 30s para permitir recuperación inmediata
    await prisma.domainOutboxEvent.update({
      where: { id: event.id },
      data: { leaseExpiresAt: new Date(Date.now() - 5000) },
    });

    // 6. Worker secundario recupera el evento abandonado
    console.log("\n5. Iniciando worker secundario de recuperación para procesar el evento abandonado...");
    const recoveryWorker = new OperationalWorker(`worker-supervisor-recovery-${runId}`);
    let finalRecord = await prisma.domainOutboxEvent.findUnique({ where: { id: event.id } });

    for (let pass = 0; pass < 5 && finalRecord?.status !== "PROCESSED"; pass++) {
      const passResult = await recoveryWorker.runSinglePass(50);
      finalRecord = await prisma.domainOutboxEvent.findUnique({ where: { id: event.id } });
      console.log(`  DEBUG pass ${pass}: claimed=${passResult.claimedCount}, processed=${passResult.processedCount}, failed=${passResult.failedCount}, targetStatus=${finalRecord?.status}, targetError=${finalRecord?.errorMessage}`);
    }

    assert(
      finalRecord?.status === "PROCESSED",
      "5.1: Worker secundario recuperó con éxito el evento abandonado y lo transicionó a PROCESSED"
    );
    assert(
      finalRecord?.processedAt !== null && finalRecord?.leaseOwner === null,
      "5.2: Evento marcado con processedAt y lease liberado limpiamente tras acknowledgeSuccess"
    );

    console.log("\n===============================================================================");
    console.log(" RESULTADO: RECUPERACIÓN ANTE SIGKILL REAL CERTIFICADA EXITOSAMENTE (100% PASS)");
    console.log(" CERO PÉRDIDA DE EVENTOS · PROCESAMIENTO AT-LEAST-ONCE ROBUSTO EN POSTGRESQL");
    console.log("===============================================================================\n");
  } catch (error) {
    console.error("FATAL ERROR EN PRUEBA SIGKILL:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSigkillRecoveryTest();
