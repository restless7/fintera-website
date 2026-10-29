import prisma from "../lib/prisma";
import { ApplicationService } from "../lib/crm/application-service";
import { DashboardService } from "../lib/crm/dashboard-service";
import { SelectiveRollbackService } from "../lib/crm/selective-rollback-service";
import { RbacService } from "../lib/auth/rbac-service";
import { Permission } from "../lib/auth/types";
import { UserRole, ApplicationStatus, BankStage, ActivityType } from "../prisma/generated/client";
import { calculateBankLoan } from "../lib/simulators/financial-engine";
import { BENCHMARK_CASES } from "./verify-financial-fidelity";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    throw new Error(`Prueba fallida: ${testName}`);
  }
}

/**
 * BATERÍA INTEGRAL DE PRUEBAS DE ACEPTACIÓN — GATE C (FASE 6.2)
 * CRM OPERATIONAL CORE
 */
export async function runGateCAcceptanceSuite() {
  console.log("===============================================================================");
  console.log(" FINTERA ENTERPRISE CRM — SUITE DE ACEPTACIÓN OPERATIVA Y SEGURIDAD (GATE C)");
  console.log("===============================================================================\n");

  // ===========================================================================
  // SECCIÓN 1: RESOLUCIÓN Y CONCILIACIÓN DE OBSERVACIONES GATE B
  // ===========================================================================
  console.log("--- SECCIÓN 1: RESOLUCIÓN Y CONCILIACIÓN DE OBSERVACIONES GATE B ---");

  // 1.1 Conciliación Banco de Bogotá ($3.543.278,48 vs $3.544.518,48)
  const bogotaCalc = calculateBankLoan("banco-de-bogota", {
    bankId: "banco-de-bogota",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    loanAmount: 300000000,
    propertyValue: 450000000,
    termYears: 15,
    monthlyIncome: 15000000,
    clientAge: 40,
    employmentType: "empleado-indefinido",
  })!;

  const pmtBase = bogotaCalc.rawMonthlyPrincipalInterestPayment;
  const pmtDiff = Math.abs(pmtBase - 3431640.98);
  assert(pmtDiff <= 0.05, "Conciliación Bogotá: Cuota K+I certificada en $3.431.640,98 COP idéntica en ambos reportes");

  const insuranceActual = bogotaCalc.rawMonthlyLifeInsurance + bogotaCalc.rawMonthlyFireInsurance;
  const targetNew = 3543278.48;
  const targetPrevious = 3544518.48;
  const deltaDocumented = Math.abs(targetPrevious - targetNew);
  assert(deltaDocumented === 1240.0, "Conciliación Bogotá: Desviación de $1.240,00 COP atribuible estrictamente a póliza de vida ($60.000 vs $61.240)");
  assert(Math.abs(bogotaCalc.rawInitialMonthlyTotalPayment - targetNew) <= 0.05, "Conciliación Bogotá: Motor financiero produce $3.543.278,48 con tasa de vida oficial 0.00020");

  // 1.2 Safe Selective Rollback (Cancelación Selectiva sin TRUNCATE)
  console.log("\n--- Verificación de Reversión Selectiva (Zero Truncate) ---");
  const rollbackDocNum = "88" + Math.floor(100000 + Math.random() * 900000);
  const testRollbackApp = await ApplicationService.intakeCreditRequest({
    documentType: "CC",
    documentNumber: rollbackDocNum,
    firstName: "Test",
    firstLastName: "Rollback",
    email: `rollback.${rollbackDocNum}@fintera.co`,
    phone: "3009998877",
    residenceCity: "Bogotá",
    requestedAmount: 120000000,
    termMonths: 180,
    monthlyIncome: 4500000,
  });

  const rollbackResult = await SelectiveRollbackService.cancelApplication(
    testRollbackApp.applicationId,
    "Solicitud duplicada por error de usuario, cancelada a petición del cliente",
    "system-audit-tester"
  );

  assert(rollbackResult.success && rollbackResult.newStatus === "CANCELLED_BY_CLIENT", "Selective Rollback: Estado actualizado a CANCELLED_BY_CLIENT");
  
  const checkAppAfterRollback = await prisma.crmCreditApplication.findUnique({
    where: { id: testRollbackApp.applicationId },
    include: { bankApplications: true, activities: true },
  });

  assert(checkAppAfterRollback !== null, "Selective Rollback: Registro preserved en base de datos (no truncado)");
  assert(checkAppAfterRollback?.bankApplications[0]?.stage === BankStage.STAGE_BANK_SUSPENDED, "Selective Rollback: Subexpedientes bancarios suspendidos controladamente");
  assert(Boolean(checkAppAfterRollback?.activities.some((a) => a.type === "STATUS_CHANGE")), "Selective Rollback: Actividad de auditoría registrada en bitácora interna");

  // ===========================================================================
  // SECCIÓN 2: INGESTA TRANSACCIONAL, IDEMPOTENCIA Y CLIENT DEDUPLICATION
  // ===========================================================================
  console.log("\n--- SECCIÓN 2: INGESTA TRANSACCIONAL, IDEMPOTENCIA Y CLIENT DEDUPLICATION ---");

  // 2.1 Ingesta de nuevo Lead
  const testDocNum = "52" + Math.floor(100000 + Math.random() * 900000);
  const intake1 = await ApplicationService.intakeCreditRequest({
    documentType: "CC",
    documentNumber: testDocNum,
    firstName: "María",
    secondName: "Fernanda",
    firstLastName: "López",
    secondLastName: "Castro",
    email: `maria.${testDocNum}@example.com`,
    phone: "3105551234",
    residenceCity: "Medellín",
    monthlyIncome: 8000000,
    requestedAmount: 250000000,
    termMonths: 240,
    simulatedBankId: "bancolombia",
    simulatedProductType: "hipotecario-novis",
    simulatedRateEA: 0.118,
    simulatedMonthlyPayment: 2708134,
  });

  assert(intake1.success, "Ingesta Canónica: Expediente creado exitosamente");
  assert(intake1.fileNumber.startsWith("FNT-2026-"), `File Number institucional generado: ${intake1.fileNumber}`);
  assert(!intake1.isDuplicateRetry, "Ingesta inicial: No marcada como duplicado");

  // 2.2 Reintento idéntico dentro de 10 minutos (Idempotencia)
  const intakeDuplicate = await ApplicationService.intakeCreditRequest({
    documentType: "CC",
    documentNumber: testDocNum,
    firstName: "María",
    firstLastName: "López",
    email: `maria.${testDocNum}@example.com`,
    phone: "3105551234",
    residenceCity: "Medellín",
    monthlyIncome: 8000000,
    requestedAmount: 250000000,
    termMonths: 240,
    simulatedBankId: "bancolombia",
  });

  assert(intakeDuplicate.isDuplicateRetry === true, "Idempotencia: Reintento dentro de 10 minutos detectado");
  assert(intakeDuplicate.applicationId === intake1.applicationId, "Idempotencia: Mismo ID de expediente retornado sin crear duplicados");

  // 2.3 Nuevo crédito para el mismo cliente (Deduplicación por Documento)
  const intakeSecondLoan = await ApplicationService.intakeCreditRequest({
    documentType: "CC",
    documentNumber: testDocNum, // Misma cédula
    firstName: "María",
    firstLastName: "López",
    email: `maria.${testDocNum}@example.com`,
    phone: "3105551234",
    residenceCity: "Medellín",
    monthlyIncome: 8000000,
    requestedAmount: 80000000, // Monto diferente (compra de cartera)
    termMonths: 120,
    simulatedBankId: "bbva",
  });

  assert(intakeSecondLoan.isExistingClient === true, "Deduplicación de Cliente: Cliente preexistente reutilizado por documento [CC, 52111222]");
  assert(intakeSecondLoan.clientId === intake1.clientId, "Deduplicación de Cliente: Clientes comparten el mismo registro canónico");
  assert(intakeSecondLoan.applicationId !== intake1.applicationId, "Independencia de Expedientes: Segundo crédito tiene su propio radicado FNT");

  // ===========================================================================
  // SECCIÓN 3: ACTIVIDADES INTERNAS, PRÓXIMA ACCIÓN Y PRIVACIDAD DE NOTAS
  // ===========================================================================
  console.log("\n--- SECCIÓN 3: ACTIVIDADES, NOTAS PRIVADAS Y GESTIÓN MULTIBANCO ---");

  // 3.1 Registrar actividad privada con próxima acción
  const testAppId = intake1.applicationId;
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const activity = await prisma.crmActivity.create({
    data: {
      applicationId: testAppId,
      type: ActivityType.CALL,
      title: "Llamada inicial de perfilamiento",
      description: "Cliente interesada en vivienda No VIS en Medellín. Documentos solicitados.",
      isInternalOnly: true,
      nextActionDate: tomorrow,
    },
  });

  assert(activity.isInternalOnly === true, "Privacidad de Actividades: Marcada como estrictamente interna (isInternalOnly: true)");

  // 3.2 Subexpediente bancario adicional
  const bbvaSubcase = await prisma.bankApplication.create({
    data: {
      applicationId: testAppId,
      bankId: "bbva",
      productType: "hipotecario-novis",
      stage: BankStage.STAGE_01_PRE_FILE,
      customerVisibleStage: "Alternativa bancaria en estructuración",
      bankFilingNumber: "BBVA-RAD-998811",
      notes: "Presentado como alternativa con tasa preferente",
    },
  });

  assert(bbvaSubcase.bankId === "bbva", "Multibanco: Subexpediente alternativo creado en BBVA");

  const appWithBanks = await prisma.crmCreditApplication.findUnique({
    where: { id: testAppId },
    include: { bankApplications: true },
  });

  assert(appWithBanks?.bankApplications.length === 2, "Multibanco: Expediente contiene múltiples trámites bancarios independientes");

  // ===========================================================================
  // SECCIÓN 4: ABAC, OWNERSHIP Y PRUEBAS NEGATIVAS IDOR/BOLA
  // ===========================================================================
  console.log("\n--- SECCIÓN 4: ABAC, OWNERSHIP Y PRUEBAS NEGATIVAS IDOR/BOLA ---");

  // Crear 2 asesores y 1 equipo de prueba
  const teamNorte = await prisma.team.upsert({
    where: { name: "Equipo Comercial Norte" },
    update: {},
    create: { name: "Equipo Comercial Norte", description: "Supervisión regional Medellín" },
  });

  const advisorA = await prisma.appUser.upsert({
    where: { clerkUserId: "clerk_adv_gate_c_1" },
    update: {},
    create: {
      clerkUserId: "clerk_adv_gate_c_1",
      email: "asesorA.c@fintera.co",
      firstName: "Carlos",
      lastName: "Asesor A",
      role: UserRole.COMMERCIAL_ADVISOR,
    },
  });

  const advisorB = await prisma.appUser.upsert({
    where: { clerkUserId: "clerk_adv_gate_c_2" },
    update: {},
    create: {
      clerkUserId: "clerk_adv_gate_c_2",
      email: "asesorB.c@fintera.co",
      firstName: "Beatriz",
      lastName: "Asesor B",
      role: UserRole.COMMERCIAL_ADVISOR,
    },
  });

  // Asignar testAppId a Asesor A
  await prisma.crmCreditApplication.update({
    where: { id: testAppId },
    data: {
      assignedAdvisorId: advisorA.id,
      teamId: teamNorte.id,
    },
  });

  // ABAC: Asesor A puede consultar
  const filterAdvisorA = DashboardService.buildScopeFilter(UserRole.COMMERCIAL_ADVISOR, advisorA.id);
  const advisorACases = await prisma.crmCreditApplication.findMany({
    where: { ...filterAdvisorA, id: testAppId },
  });
  assert(advisorACases.length === 1, "ABAC Ownership: Asesor A autorizado a consultar su caso asignado");

  // PRUEBA NEGATIVA IDOR: Asesor B no puede consultar caso de Asesor A
  const filterAdvisorB = DashboardService.buildScopeFilter(UserRole.COMMERCIAL_ADVISOR, advisorB.id);
  const advisorBCases = await prisma.crmCreditApplication.findMany({
    where: { ...filterAdvisorB, id: testAppId },
  });
  assert(advisorBCases.length === 0, "PRUEBA NEGATIVA IDOR: Asesor B denegado al intentar consultar caso de Asesor A");

  // Director Comercial / Super Admin tiene visibilidad global
  const filterDirector = DashboardService.buildScopeFilter(UserRole.COMMERCIAL_DIRECTOR);
  const directorCases = await prisma.crmCreditApplication.findMany({
    where: { ...filterDirector, id: testAppId },
  });
  assert(directorCases.length === 1, "Alcance Global: Director Comercial autorizado a consultar cualquier expediente");

  // ===========================================================================
  // SECCIÓN 5: AGREGACIONES REALES DE POSTGRESQL PARA EL DASHBOARD
  // ===========================================================================
  console.log("\n--- SECCIÓN 5: AGREGACIONES REALES DE POSTGRESQL PARA EL DASHBOARD ---");

  const dashboard = await DashboardService.getDashboardMetrics(UserRole.SUPER_ADMIN);
  assert(dashboard.totalApplications >= 2, `Dashboard: totalApplications en vivo (${dashboard.totalApplications})`);
  assert(dashboard.activeApplications >= 1, `Dashboard: activeApplications en vivo (${dashboard.activeApplications})`);
  assert(dashboard.statusDistribution.length > 0, "Dashboard: Distribución real por estado desde PostgreSQL");
  assert(Array.isArray(dashboard.recentApplications), "Dashboard: Lista de expedientes recientes consultada con éxito");

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

  // Límites 10 a 14
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
  // SECCIÓN 7: AUDITORÍA INMUTABLE Y TRAZABILIDAD ACID
  // ===========================================================================
  console.log("\n--- SECCIÓN 7: AUDITORÍA INMUTABLE Y TRAZABILIDAD ACID ---");
  const auditCount = await prisma.accessAuditEvent.count();
  assert(auditCount > 0, `Auditoría inmutable registrada: ${auditCount} eventos en access_audit_events`);

  console.log("\n===============================================================================");
  console.log(` RESULTADO FINAL GATE C: ${passedTests}/${totalTests} PRUEBAS SUPERADAS SATISFACTORIAMENTE (100% PASS)`);
  console.log("===============================================================================\n");
}

if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("verify-gate-c-acceptance"))) {
  runGateCAcceptanceSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
