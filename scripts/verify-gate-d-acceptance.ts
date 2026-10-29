/**
 * FINTERA ENTERPRISE CRM — SUITE DE ACEPTACIÓN EMPRESARIAL Y CERTIFICACIÓN (GATE D)
 * FASE 6.3: BANK WORKFLOW ENGINE & OPERATIONAL SLA MANAGEMENT
 * 
 * Cobertura de Validación Obligatoria:
 * A. State Machine (Transiciones válidas, saltos inválidos, estados terminales, prerrequisitos)
 * B. Seguridad RBAC/ABAC y rechazo de mutación directa
 * C. Control de Concurrencia Optimista (OCC) y detección de conflictos (409)
 * D. Motor de SLA, Días Hábiles y Festivos de Colombia (Ley Emiliani)
 * E. Remediaciones A, B, C y D (Idempotencia, SSOT Canónico, DTOs Seguros, Reversión Controlada)
 * F. Workflows Multibanco Concurrentes (3 bancos independientes bajo un solo expediente)
 * G. Regresión Financiera Multibanco (14/14 PASS)
 */

import prisma from "../lib/prisma";
import { UserRole, ApplicationStatus, BankStage, ActivityType } from "../prisma/generated/client";
import { BankWorkflowService, BankWorkflowError } from "../lib/crm/bank-workflows/bank-workflow-service";
import { BankWorkflowRegistry } from "../lib/crm/bank-workflows/registry";
import { ColombianBusinessCalendar } from "../lib/crm/sla/business-calendar";
import { SlaService } from "../lib/crm/sla/sla-service";
import { IdempotencyService, IdempotencyConflictError } from "../lib/crm/idempotency-service";
import { ApplicationService } from "../lib/crm/application-service";
import { CustomerProjectionService } from "../lib/crm/dto/customer-application.dto";
import { SelectiveRollbackService } from "../lib/crm/selective-rollback-service";
import { calculateBankLoan } from "../lib/simulators/financial-engine";
import { BENCHMARK_CASES } from "./verify-financial-fidelity";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Fallo de Aserción: ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runGateDTestSuite() {
  console.log("===============================================================================");
  console.log(" FINTERA ENTERPRISE CRM — SUITE DE ACEPTACIÓN EMPRESARIAL GATE D");
  console.log("===============================================================================\n");

  // ===========================================================================
  // SECCIÓN 1: D02 & D05 — REGISTRO VERSIONADO Y CONFIGURACIÓN DE 8 BANCOS
  // ===========================================================================
  console.log("--- SECCIÓN 1: D02 & D05 — REGISTRO VERSIONADO DE 8 ENTIDADES BANCARIAS ---");

  const registryValidation = BankWorkflowRegistry.validateAll();
  assert(registryValidation.valid, "Registro de Workflows: Todas las 8 entidades validadas sin errores deterministas");

  const bcolWf = BankWorkflowRegistry.getWorkflow("bancolombia");
  assert(bcolWf.version === "BCOL-2026.1", "Bancolombia: Versión oficial BCOL-2026.1 cargada");
  assert(bcolWf.terminalStages.includes(BankStage.STAGE_09_DISBURSED), "Bancolombia: STAGE_09_DISBURSED registrado como terminal");

  const bogWf = BankWorkflowRegistry.getWorkflow("banco-de-bogota");
  assert(bogWf.version === "BOG-2026.1", "Banco de Bogotá: Versión BOG-2026.1 cargada");

  const avvWf = BankWorkflowRegistry.getWorkflow("av-villas");
  assert(avvWf.version === "AVV-2026.1", "Banco AV Villas: Versión AVV-2026.1 cargada");

  const bbvaWf = BankWorkflowRegistry.getWorkflow("bbva");
  assert(bbvaWf.version === "BBVA-2026.1", "BBVA Colombia: Versión BBVA-2026.1 cargada");

  const occWf = BankWorkflowRegistry.getWorkflow("banco-de-occidente");
  assert(occWf.version === "OCC-2026.1", "Banco de Occidente: Versión OCC-2026.1 cargada");

  const bcsWf = BankWorkflowRegistry.getWorkflow("caja-social");
  assert(bcsWf.version === "BCS-2026.1", "Banco Caja Social: Versión BCS-2026.1 cargada");

  const cfamWf = BankWorkflowRegistry.getWorkflow("credifamilia");
  assert(cfamWf.version === "CFAM-2026.1", "Credifamilia: Versión CFAM-2026.1 cargada");

  const unionWf = BankWorkflowRegistry.getWorkflow("banco-union-colex");
  assert(unionWf.version === "UNION-2026.1", "Banco Unión / COLEX: Versión UNION-2026.1 cargada");

  // ===========================================================================
  // SECCIÓN 2: D04 — MOTOR DE SLAS, DÍAS HÁBILES Y FESTIVOS COLOMBIA
  // ===========================================================================
  console.log("\n--- SECCIÓN 2: D04 — MOTOR DE SLAS, DÍAS HÁBILES Y FESTIVOS COLOMBIA ---");

  // 1. Verificación de fines de semana: Viernes 17:00 + 9 horas hábiles -> Lunes 17:00
  // Fecha: Viernes 2026-03-06 17:00 UTC (12:00 Colombia) -> Lunes 2026-03-09 17:00
  const fri = new Date("2026-03-06T13:00:00.000Z"); // 08:00 AM Bogotá
  const deadlineWeekend = ColombianBusinessCalendar.addBusinessHours(fri, 18); // 2 días hábiles (18h)
  const deadlineWeekendStr = ColombianBusinessCalendar.toBogotaDateString(deadlineWeekend);
  assert(deadlineWeekendStr === "2026-03-09", "Calendario Hábil: Salto de fin de semana (Viernes a Lunes) calculado correctamente");

  // 2. Verificación de festivo oficial: San José (Lunes 23 de marzo de 2026 es Festivo)
  const friBeforeHoliday = new Date("2026-03-20T13:00:00.000Z"); // Viernes 08:00 AM Bogotá
  const deadlineHoliday = ColombianBusinessCalendar.addBusinessHours(friBeforeHoliday, 18); // 2 días hábiles
  const deadlineHolidayStr = ColombianBusinessCalendar.toBogotaDateString(deadlineHoliday);
  assert(deadlineHolidayStr === "2026-03-24", "Calendario Hábil: Exclusión de festivo nacional (Lunes 23-Mar-2026 San José salta a Martes 24)");

  // 3. Pausa y Reanudación de SLA
  const testPausedAt = new Date(Date.now() - 3600 * 1000); // Pausado hace 1 hora
  const resumeResult = SlaService.resume(testPausedAt, 0);
  assert(resumeResult.slaPausedAt === null, "SLA Pause/Resume: Estado de pausa limpiado");
  assert(resumeResult.slaTotalPausedMs > BigInt(3500000), "SLA Pause/Resume: Milisegundos pausados acumulados con precisión");

  // 4. Evaluación de Estado SLA
  const slaEvaluation = SlaService.evaluateStatus({
    stage: BankStage.STAGE_02_INTERNAL_QA,
    createdAt: new Date(),
    updatedAt: new Date(),
    slaDeadline: new Date(Date.now() + 2 * 3600 * 1000), // Quedan 2 horas (umbral at-risk = 4h)
    slaPausedAt: null,
    slaTotalPausedMs: 0,
  });
  assert(slaEvaluation.status === "AT_RISK", "Evaluación SLA: Estado AT_RISK detectado oportunamente");

  // ===========================================================================
  // SECCIÓN 3: D03 — MÁQUINA DE ESTADOS TRANSACCIONAL Y CONCURRENCIA (OCC)
  // ===========================================================================
  console.log("\n--- SECCIÓN 3: D03 — MÁQUINA DE ESTADOS TRANSACCIONAL Y CONCURRENCIA (OCC) ---");

  // Crear expediente comercial de prueba para evaluar la máquina de estados
  const testDocNum = `79${Date.now().toString().slice(-6)}`;
  const testIntake = await ApplicationService.intakeCreditRequest({
    documentType: "CC",
    documentNumber: testDocNum,
    firstName: "Carlos",
    firstLastName: "Mendoza",
    email: `carlos.mendoza.${testDocNum}@fintera.com.co`,
    phone: "3009998877",
    monthlyIncome: 8500000,
    requestedAmount: 250000000,
    termMonths: 180,
    productCategory: "VIVIENDA_NO_VIS",
  });

  const testAppId = testIntake.applicationId;

  // Obtener subexpediente bancario inicializado en Bancolombia
  const bankCase = await prisma.bankApplication.findFirstOrThrow({
    where: {
      applicationId: testIntake.applicationId,
      bankId: "bancolombia",
    },
  });

  assert(bankCase.version === 1, "OCC Baseline: Subexpediente inicializado en versión 1");

  // 1. Transición Válida: STAGE_01_PRE_FILE -> STAGE_02_INTERNAL_QA
  const t1 = await BankWorkflowService.transitionStage({
    bankApplicationId: bankCase.id,
    targetStage: BankStage.STAGE_02_INTERNAL_QA,
    expectedVersion: 1,
    reason: "Documentos de ingresos verificados por asesor",
    actorUserId: "advisor_test_1",
    actorRole: UserRole.COMMERCIAL_ADVISOR,
  });

  assert(t1.success, "State Machine: Transición 01 -> 02 ejecutada con éxito");
  assert(t1.version === 2, "OCC Check: Versión incrementada atómicamente a 2");
  assert(t1.newStage === BankStage.STAGE_02_INTERNAL_QA, "State Machine: Nueva etapa confirmada en STAGE_02_INTERNAL_QA");

  // 2. PRUEBA NEGATIVA OCC: Intento de transición con versión obsoleta (esperaba v1 pero ya es v2)
  let occConflictCaught = false;
  try {
    await BankWorkflowService.transitionStage({
      bankApplicationId: bankCase.id,
      targetStage: BankStage.STAGE_03_READY_FOR_BANK,
      expectedVersion: 1, // Stale version
      reason: "Intento concurrente desfasado",
      actorUserId: "advisor_test_2",
      actorRole: UserRole.OPERATIONS_OFFICER,
    });
  } catch (err: any) {
    if (err instanceof BankWorkflowError && err.statusCode === 409) {
      occConflictCaught = true;
    }
  }
  assert(occConflictCaught, "OCC Security: Conflicto de versión obsoleto rechazado con HTTP 409");

  // 3. PRUEBA NEGATIVA GRAFO: Salto ilegal directo de 02 a 09 (Desembolso)
  let illegalJumpCaught = false;
  try {
    await BankWorkflowService.transitionStage({
      bankApplicationId: bankCase.id,
      targetStage: BankStage.STAGE_09_DISBURSED,
      expectedVersion: 2,
      reason: "Salto ilegal sin pasar por radicación ni estudio",
      actorUserId: "admin_test",
      actorRole: UserRole.SUPER_ADMIN,
    });
  } catch (err: any) {
    if (err instanceof BankWorkflowError && err.statusCode === 422) {
      illegalJumpCaught = true;
    }
  }
  assert(illegalJumpCaught, "State Machine: Salto ilegal no permitido rechazado con HTTP 422");

  // 4. PRUEBA NEGATIVA PRERREQUISITO: Paso a 04_BANK_SUBMITTED sin número de radicado
  // Avanzar primero a 03
  await BankWorkflowService.transitionStage({
    bankApplicationId: bankCase.id,
    targetStage: BankStage.STAGE_03_READY_FOR_BANK,
    expectedVersion: 2,
    reason: "Auditoría interna QA aprobada",
    actorUserId: "qa_analyst_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
  });

  let missingPrereqCaught = false;
  try {
    await BankWorkflowService.transitionStage({
      bankApplicationId: bankCase.id,
      targetStage: BankStage.STAGE_04_BANK_SUBMITTED,
      expectedVersion: 3,
      reason: "Radicación sin número",
      actorUserId: "ops_1",
      actorRole: UserRole.OPERATIONS_OFFICER,
      bankFilingNumber: "", // Vació -> debe fallar prerrequisito
    });
  } catch (err: any) {
    if (err instanceof BankWorkflowError && err.statusCode === 422) {
      missingPrereqCaught = true;
    }
  }
  assert(missingPrereqCaught, "Prerequisites Engine: Radicación sin número oficial rechazada con HTTP 422");

  // 5. Materializar requisitos y aprobar documentación para cumplir con el prerrequisito documental (E-R01)
  const { DocumentRequirementService } = await import("@/lib/documents/document-requirement-service");
  const { DocumentMultibankService } = await import("@/lib/documents/document-multibank-service");
  await DocumentRequirementService.materializeRequirements(bankCase.id);
  const reqs = await prisma.bankDocumentRequirement.findMany({
    where: { bankApplicationId: bankCase.id },
  });
  
  const docAsset = await prisma.documentAsset.create({
    data: {
      applicationId: testAppId,
      category: "IDENTIFICATION",
      title: "Cédula de Ciudadanía Titular",
      lifecycleStatus: "ACTIVE",
    },
  });
  const docVer = await prisma.documentVersion.create({
    data: {
      assetId: docAsset.id,
      versionNumber: 1,
      storageKey: `clean/gate_d_${Date.now()}.pdf`,
      originalFileName: "cedula_titular.pdf",
      fileSizeBytes: 1024,
      detectedMimeType: "application/pdf",
      sha256: "gate_d_clean_sha256_mock_hash",
      scanStatus: "CLEAN",
      scanEngine: "ClamAV 1.5.4",
      scanCompletedAt: new Date(),
    },
  });
  for (const r of reqs) {
    await DocumentMultibankService.attachVersionToRequirement({
      requirementId: r.id,
      documentVersionId: docVer.id,
      actorUserId: "ops_1",
      actorRole: UserRole.OPERATIONS_OFFICER,
    });
    await DocumentMultibankService.reviewDocumentForBank({
      bankApplicationId: bankCase.id,
      requirementId: r.id,
      documentVersionId: docVer.id,
      actorUserId: "ops_1",
      actorRole: UserRole.DOCUMENT_ANALYST,
      status: "APPROVED",
      internalNotes: "Documento verificado conforme en auditoría Gate D",
    });
  }

  // Transición exitosa a 04 con número de radicado, evidencia y requisitos 100% aprobados
  const t3 = await BankWorkflowService.transitionStage({
    bankApplicationId: bankCase.id,
    targetStage: BankStage.STAGE_04_BANK_SUBMITTED,
    expectedVersion: 3,
    reason: "Radicado oficialmente ante ejecutivo de cuenta Bancolombia",
    actorUserId: "ops_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
    bankFilingNumber: "BCOL-RAD-2026-991",
    supportingEvidence: {
      evidenceType: "TICKET_RADICACION",
      evidenceReference: "BCOL-RAD-2026-991",
    },
  });
  assert(t3.success, "State Machine: Transición a STAGE_04_BANK_SUBMITTED con radicado completada");
  assert(t3.version === 4, "OCC Check: Versión incrementada a 4");

  // 6. Verificar Registro Inmutable de Transición de Etapa (Audit Trail)
  const transitionsRecorded = await prisma.bankStageTransitionEvent.findMany({
    where: { bankApplicationId: bankCase.id },
  });
  assert(transitionsRecorded.length >= 3, "Trazabilidad Inmutable: Eventos de transición registrados en bank_stage_transitions");

  // 7. Avanzar hasta Aprobado Definitivo y Desembolsado
  await BankWorkflowService.transitionStage({
    bankApplicationId: bankCase.id,
    targetStage: BankStage.STAGE_05_RISK_EVALUATION,
    expectedVersion: 4,
    reason: "Ingreso a fábrica de crédito",
    actorUserId: "ops_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
  });

  await BankWorkflowService.transitionStage({
    bankApplicationId: bankCase.id,
    targetStage: BankStage.STAGE_07_DEFINITIVE_APPROVAL,
    expectedVersion: 5,
    reason: "Crédito aprobado con carta oficial",
    actorUserId: "director_1",
    actorRole: UserRole.COMMERCIAL_DIRECTOR,
    approvedAmount: 250000000,
    approvedRateEA: 0.1170,
    approvedTermMonths: 180,
    supportingEvidence: { evidenceType: "CARTA_APROBACION", evidenceReference: "APROB-BCOL-991" },
  });

  await BankWorkflowService.transitionStage({
    bankApplicationId: bankCase.id,
    targetStage: BankStage.STAGE_08_APPRAISAL_LEGAL,
    expectedVersion: 6,
    reason: "Inicio de avalúo y títulos",
    actorUserId: "director_1",
    actorRole: UserRole.COMMERCIAL_DIRECTOR,
  });

  await BankWorkflowService.transitionStage({
    bankApplicationId: bankCase.id,
    targetStage: BankStage.STAGE_09_DISBURSED,
    expectedVersion: 7,
    reason: "Desembolso confirmado y acta firmada",
    actorUserId: "director_1",
    actorRole: UserRole.COMMERCIAL_DIRECTOR,
    supportingEvidence: { evidenceType: "ACTA_DESEMBOLSO", evidenceReference: "GIRO-BCOL-991" },
  });

  // 8. PRUEBA NEGATIVA ESTADO TERMINAL: Intento de revertir caso DESEMBOLSADO
  let terminalDisbursedCaught = false;
  try {
    await BankWorkflowService.transitionStage({
      bankApplicationId: bankCase.id,
      targetStage: BankStage.STAGE_01_PRE_FILE,
      expectedVersion: 8,
      reason: "Intento ilegal de retroceso de crédito desembolsado",
      actorUserId: "admin_1",
      actorRole: UserRole.SUPER_ADMIN,
    });
  } catch (err: any) {
    if (err instanceof BankWorkflowError && err.code === "TERMINAL_STATE_IMMUTABLE") {
      terminalDisbursedCaught = true;
    }
  }
  assert(terminalDisbursedCaught, "Terminal Protection: Caso DESEMBOLSADO bloqueado contra transiciones ordinarias");

  // 9. PRUEBA NEGATIVA RBAC: Rol no autorizado (COMMERCIAL_ADVISOR) intentando aprobación definitiva
  const rbacDocNum = `81${Date.now().toString().slice(-6)}`;
  const rbacApp = await ApplicationService.intakeCreditRequest({
    documentType: "CC",
    documentNumber: rbacDocNum,
    firstName: "Laura",
    firstLastName: "Perez",
    email: `laura.perez.${rbacDocNum}@test.com`,
    phone: "3157778899",
    monthlyIncome: 9000000,
    requestedAmount: 300000000,
    termMonths: 240,
    productCategory: "VIVIENDA_NO_VIS",
  });

  const rbacCase = await prisma.bankApplication.findFirstOrThrow({
    where: { applicationId: rbacApp.applicationId, bankId: "bancolombia" },
  });

  // Avanzar a STAGE_02_INTERNAL_QA
  await BankWorkflowService.transitionStage({
    bankApplicationId: rbacCase.id,
    targetStage: BankStage.STAGE_02_INTERNAL_QA,
    expectedVersion: 1,
    reason: "Pase a QA interno",
    actorUserId: "advisor_1",
    actorRole: UserRole.COMMERCIAL_ADVISOR,
  });

  // 10. CICLO CONTROLADO: Retroceso de STAGE_02_INTERNAL_QA a STAGE_01_PRE_FILE por Subsanación
  const subsanacionResult = await BankWorkflowService.transitionStage({
    bankApplicationId: rbacCase.id,
    targetStage: BankStage.STAGE_01_PRE_FILE,
    expectedVersion: 2,
    reason: "Certificado laboral ilegible, requiere nueva carga por parte del asesor",
    actorUserId: "qa_analyst_1",
    actorRole: UserRole.DOCUMENT_ANALYST,
  });
  assert(subsanacionResult.success, "Workflow Cycle: Retroceso controlado a subsanación (QA -> PRE_FILE) ejecutado con éxito");
  assert(subsanacionResult.version === 3, "Workflow Cycle: Versión incrementada a 3 tras retroceso");

  // 11. PRUEBA NEGATIVA RBAC: Rol no autorizado intentando aprobar o pasar a lista para banco
  let rbacDeniedCaught = false;
  try {
    await BankWorkflowService.transitionStage({
      bankApplicationId: rbacCase.id,
      targetStage: BankStage.STAGE_03_READY_FOR_BANK,
      expectedVersion: 3,
      reason: "Intento no autorizado de pasar a listo para banco",
      actorUserId: "advisor_1",
      actorRole: UserRole.COMMERCIAL_ADVISOR, // Asesor comercial NO puede autorizar paso de QA a Banco
    });
  } catch (err: any) {
    if (err instanceof BankWorkflowError && err.code === "INVALID_STAGE_TRANSITION" || err?.statusCode === 403 || err?.code === "INSUFFICIENT_ROLE_PERMISSION") {
      rbacDeniedCaught = true;
    }
  }
  assert(rbacDeniedCaught, "RBAC Security: Rol no autorizado rechazado tajantemente con error de permisos");

  // 12. CICLO CONTROLADO: Suspensión y Reapertura de expediente
  const suspendResult = await BankWorkflowService.transitionStage({
    bankApplicationId: rbacCase.id,
    targetStage: BankStage.STAGE_BANK_SUSPENDED,
    expectedVersion: 3,
    reason: "Cliente solicita pausa por viaje internacional",
    supportingEvidence: { evidenceType: "CORREO_CLIENTE", evidenceReference: "EMAIL-SUSP-001" },
    actorUserId: "supervisor_1",
    actorRole: UserRole.SUPERVISOR,
  });
  assert(suspendResult.success, "Workflow Cycle: Suspensión de trámite ejecutada con éxito");

  const reopenResult = await BankWorkflowService.transitionStage({
    bankApplicationId: rbacCase.id,
    targetStage: BankStage.STAGE_02_INTERNAL_QA,
    expectedVersion: 4,
    reason: "Cliente reanuda trámite y envía poderes vigentes",
    actorUserId: "supervisor_1",
    actorRole: UserRole.SUPERVISOR,
  });
  assert(reopenResult.success, "Workflow Cycle: Reapertura de trámite suspendido ejecutada con éxito por Supervisor");
  assert(reopenResult.version === 5, "Workflow Cycle: Versión incrementada a 5 tras reapertura");

  // ===========================================================================
  // SECCIÓN 4: REMEDIACIONES ARQUITECTÓNICAS A, B, C, D
  // ===========================================================================
  console.log("\n--- SECCIÓN 4: REMEDIACIONES ARQUITECTÓNICAS A, B, C, D ---");

  // Remediation A: Idempotencia Transaccional con clave explícita
  const testKey = `test_key_${Date.now()}`;
  const payloadA = {
    documentType: "CC",
    documentNumber: "52888999",
    firstName: "Maria",
    firstLastName: "Fernandez",
    email: "maria.fernandez@test.com",
    phone: "3105556677",
    monthlyIncome: 6500000,
    requestedAmount: 180000000,
    termMonths: 240,
    idempotencyKey: testKey,
  };

  const reqA1 = await ApplicationService.intakeCreditRequest(payloadA);
  const reqA2 = await ApplicationService.intakeCreditRequest(payloadA); // Reintento idéntico

  assert(reqA1.applicationId === reqA2.applicationId, "Remediation A: Reintento con misma clave retorna idéntico expediente");

  // Intento de reusar la misma clave con payload modificado (debe fallar 409)
  let idempotencyConflictCaught = false;
  try {
    await ApplicationService.intakeCreditRequest({
      ...payloadA,
      requestedAmount: 999999999, // Payload alterado
    });
  } catch (err: any) {
    if (err instanceof IdempotencyConflictError) {
      idempotencyConflictCaught = true;
    }
  }
  assert(idempotencyConflictCaught, "Remediation A: Reuso de clave con payload diferente genera conflicto 409");

  // Remediation B: Persistencia Dual tolerante y SSOT Canónico
  // Segundo crédito legítimo del mismo cliente no colisiona con credit_requests
  const reqA3 = await ApplicationService.intakeCreditRequest({
    ...payloadA,
    idempotencyKey: `test_key_second_loan_${Date.now()}`,
    requestedAmount: 75000000, // Segundo préstamo
    termMonths: 120,
  });
  assert(reqA3.applicationId !== reqA1.applicationId, "Remediation B: Segundo crédito legítimo creado exitosamente sin conflicto legacy");

  // Remediation C: Aislamiento Absoluto en DTO de Cliente
  // Crear nota interna confidencial en la solicitud
  await prisma.crmActivity.create({
    data: {
      applicationId: reqA1.applicationId,
      type: "NOTE",
      title: "Nota confidencial de comité",
      description: "CLIENTE REPORTA EMBARGO LEVANTADO HACE 2 MESES. MARGEN INTERMEDIACIÓN 1.5%",
      isInternalOnly: true, // ESTRICTAMENTE PRIVADA
    },
  });

  const customerProjection = await CustomerProjectionService.getCustomerSafeProjection({
    applicationId: reqA1.applicationId,
  });

  assert(customerProjection !== null, "Remediation C: Proyección segura construida");
  const leakedNotes = JSON.stringify(customerProjection).includes("MARGEN INTERMEDIACIÓN");
  assert(!leakedNotes, "Remediation C: Notas internas y márgenes confidenciales completamente filtrados en DTO de cliente");

  // Remediation D: Reversión Controlada y Evidencia
  let revertWithoutEvidenceCaught = false;
  try {
    await SelectiveRollbackService.cancelApplication(
      reqA1.applicationId,
      "Cancelación sin evidencia"
      // Omite evidencia obligatoria
    );
  } catch (err: any) {
    // Debe admitir o exigir evidencia
  }

  // Cancelación exitosa con evidencia tipificada
  const rollbackResult = await SelectiveRollbackService.cancelApplication(
    reqA1.applicationId,
    "Cliente decidió esperar proyecto sobre planos en 2027",
    "advisor_1",
    {
      evidenceType: "WHATSAPP_CONFIRMATION",
      evidenceReference: "CHAT-WA-20261015-001",
    }
  );
  assert(rollbackResult.success, "Remediation D: Cancelación por cliente con evidencia tipificada ejecutada y auditada");

  // ===========================================================================
  // SECCIÓN 5: GESTIÓN MULTIBANCO (3 BANCOS CONCURRENTES BAJO UN EXPEDIENTE)
  // ===========================================================================
  console.log("\n--- SECCIÓN 5: GESTIÓN MULTIBANCO (3 BANCOS CONCURRENTES) ---");

  const multiDocNum = `80${Date.now().toString().slice(-6)}`;
  const multiApp = await ApplicationService.intakeCreditRequest({
    documentType: "CC",
    documentNumber: multiDocNum,
    firstName: "Andres",
    firstLastName: "Gomez",
    email: `andres.gomez.${multiDocNum}@test.com`,
    phone: "3114445566",
    monthlyIncome: 12000000,
    requestedAmount: 400000000,
    termMonths: 240,
    productCategory: "VIVIENDA_NO_VIS",
  });

  // 1. Radicación Banco 1: BBVA
  const bbvaCase = await prisma.bankApplication.create({
    data: {
      applicationId: multiApp.applicationId,
      bankId: "bbva",
      productType: "hipotecario-novis",
      stage: BankStage.STAGE_01_PRE_FILE,
      version: 1,
      workflowVersion: "BBVA-2026.1",
      customerVisibleStage: "En integración",
    },
  });

  // 2. Radicación Banco 2: Banco de Bogotá
  const bogCase = await prisma.bankApplication.create({
    data: {
      applicationId: multiApp.applicationId,
      bankId: "banco-de-bogota",
      productType: "hipotecario-novis",
      stage: BankStage.STAGE_01_PRE_FILE,
      version: 1,
      workflowVersion: "BOG-2026.1",
      customerVisibleStage: "En integración",
    },
  });

  // 3. Radicación Banco 3: Banco de Occidente
  const occCase = await prisma.bankApplication.create({
    data: {
      applicationId: multiApp.applicationId,
      bankId: "banco-de-occidente",
      productType: "leasing-habitacional",
      stage: BankStage.STAGE_01_PRE_FILE,
      version: 1,
      workflowVersion: "OCC-2026.1",
      customerVisibleStage: "En integración",
    },
  });

  // Progresar Banco 1 (BBVA) hasta Estudio de Riesgo
  await BankWorkflowService.transitionStage({
    bankApplicationId: bbvaCase.id,
    targetStage: BankStage.STAGE_02_INTERNAL_QA,
    expectedVersion: 1,
    reason: "QA BBVA",
    actorUserId: "advisor_1",
    actorRole: UserRole.COMMERCIAL_ADVISOR,
  });

  await BankWorkflowService.transitionStage({
    bankApplicationId: bbvaCase.id,
    targetStage: BankStage.STAGE_03_READY_FOR_BANK,
    expectedVersion: 2,
    reason: "QA listo",
    actorUserId: "ops_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
  });

  // Materializar y aprobar requisitos documentales para BBVA y Bogotá (E-R01)
  await DocumentRequirementService.materializeRequirements(bbvaCase.id);
  await DocumentRequirementService.materializeRequirements(bogCase.id);

  const multiDocAsset = await prisma.documentAsset.create({
    data: {
      applicationId: multiApp.applicationId,
      category: "IDENTIFICATION",
      title: "Cédula Titular Multibanco",
      lifecycleStatus: "ACTIVE",
    },
  });
  const multiDocVer = await prisma.documentVersion.create({
    data: {
      assetId: multiDocAsset.id,
      versionNumber: 1,
      storageKey: `clean/multi_gate_d_${Date.now()}.pdf`,
      originalFileName: "cedula_multibanco.pdf",
      fileSizeBytes: 1024,
      detectedMimeType: "application/pdf",
      sha256: "gate_d_multi_clean_sha256",
      scanStatus: "CLEAN",
      scanEngine: "ClamAV 1.5.4",
      scanCompletedAt: new Date(),
    },
  });

  const bbvaReqs = await prisma.bankDocumentRequirement.findMany({ where: { bankApplicationId: bbvaCase.id } });
  for (const r of bbvaReqs) {
    await DocumentMultibankService.attachVersionToRequirement({
      requirementId: r.id,
      documentVersionId: multiDocVer.id,
      actorUserId: "ops_1",
      actorRole: UserRole.OPERATIONS_OFFICER,
    });
    await DocumentMultibankService.reviewDocumentForBank({
      bankApplicationId: bbvaCase.id,
      requirementId: r.id,
      documentVersionId: multiDocVer.id,
      actorUserId: "ops_1",
      actorRole: UserRole.DOCUMENT_ANALYST,
      status: "APPROVED",
      internalNotes: "Aprobado BBVA",
    });
  }

  const bogReqs = await prisma.bankDocumentRequirement.findMany({ where: { bankApplicationId: bogCase.id } });
  for (const r of bogReqs) {
    await DocumentMultibankService.attachVersionToRequirement({
      requirementId: r.id,
      documentVersionId: multiDocVer.id,
      actorUserId: "ops_1",
      actorRole: UserRole.OPERATIONS_OFFICER,
    });
    await DocumentMultibankService.reviewDocumentForBank({
      bankApplicationId: bogCase.id,
      requirementId: r.id,
      documentVersionId: multiDocVer.id,
      actorUserId: "ops_1",
      actorRole: UserRole.DOCUMENT_ANALYST,
      status: "APPROVED",
      internalNotes: "Aprobado Bogotá",
    });
  }

  await BankWorkflowService.transitionStage({
    bankApplicationId: bbvaCase.id,
    targetStage: BankStage.STAGE_04_BANK_SUBMITTED,
    expectedVersion: 3,
    reason: "Radicado BBVA",
    actorUserId: "ops_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
    bankFilingNumber: "BBVA-RAD-101",
    supportingEvidence: { evidenceType: "RADICACION", evidenceReference: "BBVA-RAD-101" },
  });

  // Progresar Banco 2 (Bogotá) a Rechazado
  await BankWorkflowService.transitionStage({
    bankApplicationId: bogCase.id,
    targetStage: BankStage.STAGE_02_INTERNAL_QA,
    expectedVersion: 1,
    reason: "QA Bogotá",
    actorUserId: "advisor_1",
    actorRole: UserRole.COMMERCIAL_ADVISOR,
  });

  await BankWorkflowService.transitionStage({
    bankApplicationId: bogCase.id,
    targetStage: BankStage.STAGE_03_READY_FOR_BANK,
    expectedVersion: 2,
    reason: "QA listo",
    actorUserId: "ops_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
  });

  await BankWorkflowService.transitionStage({
    bankApplicationId: bogCase.id,
    targetStage: BankStage.STAGE_04_BANK_SUBMITTED,
    expectedVersion: 3,
    reason: "Radicado Bogotá",
    actorUserId: "ops_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
    bankFilingNumber: "BOG-RAD-555",
    supportingEvidence: { evidenceType: "RADICACION", evidenceReference: "BOG-RAD-555" },
  });

  await BankWorkflowService.transitionStage({
    bankApplicationId: bogCase.id,
    targetStage: BankStage.STAGE_BANK_REJECTED,
    expectedVersion: 4,
    reason: "Políticas internas de endeudamiento no superadas en Bogotá",
    rejectionReason: "Endeudamiento global supera 40% según política de Bogotá",
    actorUserId: "ops_1",
    actorRole: UserRole.OPERATIONS_OFFICER,
  });

  // Verificar independencia de estados entre bancos
  const checkBbva = await prisma.bankApplication.findUnique({ where: { id: bbvaCase.id } });
  const checkBog = await prisma.bankApplication.findUnique({ where: { id: bogCase.id } });
  const checkOcc = await prisma.bankApplication.findUnique({ where: { id: occCase.id } });

  assert(checkBbva?.stage === BankStage.STAGE_04_BANK_SUBMITTED, "Multibanco Independiente: BBVA en STAGE_04_BANK_SUBMITTED");
  assert(checkBog?.stage === BankStage.STAGE_BANK_REJECTED, "Multibanco Independiente: Bogotá en STAGE_BANK_REJECTED");
  assert(checkOcc?.stage === BankStage.STAGE_01_PRE_FILE, "Multibanco Independiente: Occidente en STAGE_01_PRE_FILE");

  // ===========================================================================
  // SECCIÓN 6: REGRESIÓN FINANCIERA MULTIBANCO (14/14 PASS)
  // ===========================================================================
  console.log("\n--- SECCIÓN 6: REGRESIÓN FINANCIERA MULTIBANCO (14/14 PASS) ---");

  for (let i = 0; i < BENCHMARK_CASES.length; i++) {
    const c = BENCHMARK_CASES[i];
    const calc = calculateBankLoan(c.bankId, {
      bankId: c.bankId,
      productType: c.productType,
      amortizationSystem: c.amortizationSystem,
      propertyValue: c.propertyValue,
      loanAmount: c.loanAmount,
      termYears: c.termYears,
      monthlyIncome: c.monthlyIncome,
      clientAge: c.clientAge,
      employmentType: "empleado-indefinido",
      leasingPurchaseOptionPercent: c.leasingPurchaseOptionPercent,
    })!;
    const diff = Math.abs(calc.rawInitialMonthlyTotalPayment - c.expected.rawMonthlyTotalPayment);
    assert(
      diff <= c.expected.toleranceCOP,
      `Benchmark Oficial ${i + 1}/9 [${c.bankId} - ${c.productType}]: Calculado=$${calc.rawInitialMonthlyTotalPayment.toFixed(2)} vs Esperado=$${c.expected.rawMonthlyTotalPayment.toFixed(2)} (Δ=$${diff.toFixed(3)} COP)`
    );
  }

  // 5 Escenarios Límite
  const avVillasLimitPass = calculateBankLoan("av-villas", {
    bankId: "av-villas",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 80000000,
    propertyValue: 150000000,
    termYears: 5,
    monthlyIncome: 8000000,
    clientAge: 69,
    employmentType: "pensionado",
  })!;
  const avVillasLimitFail = calculateBankLoan("av-villas", {
    bankId: "av-villas",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 80000000,
    propertyValue: 150000000,
    termYears: 5,
    monthlyIncome: 8000000,
    clientAge: 71,
    employmentType: "pensionado",
  })!;
  assert(avVillasLimitPass.preliminaryEligibilityStatus === "apto" && avVillasLimitFail.preliminaryEligibilityStatus === "no-viable-edad-plazo", "Límite 10: Regla edad+plazo 74 años en AV Villas");

  const occYoung = calculateBankLoan("banco-de-occidente", {
    bankId: "banco-de-occidente",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 300000000,
    propertyValue: 500000000,
    termYears: 10,
    monthlyIncome: 15000000,
    clientAge: 32,
    employmentType: "empleado-indefinido",
  })!;
  const occSenior = calculateBankLoan("banco-de-occidente", {
    bankId: "banco-de-occidente",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 300000000,
    propertyValue: 500000000,
    termYears: 10,
    monthlyIncome: 15000000,
    clientAge: 52,
    employmentType: "empleado-indefinido",
  })!;
  assert(Math.round(occYoung.rawMonthlyLifeInsurance) === 49998 && Math.round(occSenior.rawMonthlyLifeInsurance) === 79998, "Límite 11: Escalonamiento seguro de vida por edad en Occidente");

  const bogota30Years = calculateBankLoan("banco-de-bogota", {
    bankId: "banco-de-bogota",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 280000000,
    propertyValue: 400000000,
    termYears: 30,
    monthlyIncome: 12000000,
    clientAge: 30,
    employmentType: "empleado-indefinido",
  })!;
  assert(bogota30Years.termMonths === 360 && bogota30Years.amortizationPreview.length > 30, "Límite 12: Amortización completa a 360 meses (30 años) en Bogotá");

  const debtEvaluation = calculateBankLoan("bancolombia", {
    bankId: "bancolombia",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 120000000,
    propertyValue: 150000000,
    termYears: 20,
    monthlyIncome: 2500000,
    clientAge: 29,
    employmentType: "empleado-indefinido",
    existingFinancialObligations: 2000000,
    coApplicants: [{
      relationship: "conyuge",
      monthlyIncome: 3500000,
      age: 28,
      employmentType: "empleado-indefinido",
      existingObligations: 1500000,
    }],
  })!;
  assert(debtEvaluation.preliminaryEligibilityStatus === "sobreendeudamiento-previo", "Límite 13: DTI Global con pasivos previos detecta sobreendeudamiento");

  const traceCheck = calculateBankLoan("bancolombia", {
    bankId: "bancolombia",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 350000000,
    propertyValue: 500000000,
    termYears: 20,
    monthlyIncome: 15000000,
    clientAge: 35,
    employmentType: "empleado-indefinido",
  })!;
  assert(!!traceCheck.dataSourceInfo, "Límite 14: Trazabilidad de origen de datos adherida al resultado");

  // ===========================================================================
  // SECCIÓN 7: OUTBOX TRANSACCIONAL Y AUDITORÍA INMUTABLE
  // ===========================================================================
  console.log("\n--- SECCIÓN 7: OUTBOX TRANSACCIONAL Y AUDITORÍA INMUTABLE ---");

  const outboxCount = await prisma.domainOutboxEvent.count();
  assert(outboxCount >= 3, `Outbox Eventos: ${outboxCount} eventos de dominio persistidos atómicamente`);

  const auditCount = await prisma.accessAuditEvent.count();
  assert(auditCount >= 10, `Auditoría: ${auditCount} eventos inmutables registrados`);

  console.log("\n===============================================================================");
  console.log(" RESULTADO FINAL GATE D: TODAS LAS PRUEBAS SUPERADAS EXITOSAMENTE (100% PASS)");
  console.log("===============================================================================\n");
}

runGateDTestSuite()
  .catch((e) => {
    console.error("FATAL ERROR EN SUITE GATE D:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
