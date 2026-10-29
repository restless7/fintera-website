import { calculateBankLoan } from "../lib/simulators/financial-engine";
import { ALLIED_BANKS } from "../lib/simulators/bank-configs";
import { BankId, CreditProductType, AmortizationSystem, SimulationParams } from "../lib/simulators/types";

export interface BenchmarkCase {
  bankId: BankId;
  productType: CreditProductType;
  amortizationSystem: AmortizationSystem;
  propertyValue: number;
  loanAmount: number;
  termYears: number;
  monthlyIncome: number;
  clientAge: number;
  leasingPurchaseOptionPercent?: number;
  expected: {
    rateMV: number;
    rawMonthlyPrincipalInterest: number;
    rawMonthlyLifeInsurance: number;
    rawMonthlyFireInsurance: number;
    rawMonthlyTotalPayment: number;
    rawMonthlyFngCommission?: number;
    toleranceCOP: number;
  };
  sourceFile: string;
  notes: string;
}

export const BENCHMARK_CASES: BenchmarkCase[] = [
  // 1. BANCO DE OCCIDENTE - HIPOTECARIO NO VIS
  {
    bankId: "banco-de-occidente",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 846000000,
    loanAmount: 580000000,
    termYears: 10, // 120 meses
    monthlyIncome: 25000000,
    clientAge: 35, // 18-40 rango
    expected: {
      rateMV: 0.008885930537,
      rawMonthlyPrincipalInterest: 7879299.092,
      rawMonthlyLifeInsurance: 96662.8,
      rawMonthlyFireInsurance: 115614.36,
      rawMonthlyTotalPayment: 8091576.252,
      toleranceCOP: 0.05,
    },
    sourceFile: "Simulador Crédito Hipotecario 4 Agosto.xlsx (Celdas H12, I19, H20, H16)",
    notes: "Tasa MV 0.888593% sobre saldo. Seguro terremoto sobre valor comercial total.",
  },
  // 2. BANCO DE OCCIDENTE - LEASING HABITACIONAL (FV)
  {
    bankId: "banco-de-occidente",
    productType: "leasing-habitacional",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 2166821000,
    loanAmount: 1500000000,
    termYears: 20, // 240 meses
    monthlyIncome: 50000000,
    clientAge: 50, // 41-69 rango
    leasingPurchaseOptionPercent: 1.0, // 1% de opción de compra
    expected: {
      rateMV: 0.006744131841185608,
      rawMonthlyPrincipalInterest: 12608346.173858289,
      rawMonthlyLifeInsurance: 399990.0,
      rawMonthlyFireInsurance: 296117.75786,
      rawMonthlyTotalPayment: 13304453.931718288,
      toleranceCOP: 0.05,
    },
    sourceFile: "Simulador Leasing Habitacional 4 Agosto .xlsx (Celdas H11, I20, H21, H15)",
    notes: "Opción de compra 1% ($15M FV no amortizable). Tasa MV 0.674413%.",
  },
  // 3. BANCO AV VILLAS - HIPOTECARIO VIS
  {
    bankId: "av-villas",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 150000000,
    loanAmount: 100000000,
    termYears: 20, // 240 meses
    monthlyIncome: 4500000,
    clientAge: 30,
    expected: {
      rateMV: 0.00903702,
      rawMonthlyPrincipalInterest: 1021621.45,
      rawMonthlyLifeInsurance: 24000.0, // $240 por millón sobre $100M
      rawMonthlyFireInsurance: 17100.0, // $120 por millón sobre $150M * 0.95
      rawMonthlyTotalPayment: 1062721.45,
      toleranceCOP: 0.1,
    },
    sourceFile: "SIMULADOR- UNICO 2026 + Seguros voluntarios (Hoja SEGUROS y SIMULACION)",
    notes: "Factores por millón: $240 vida saldo, $120 terremoto sobre 95% destructible.",
  },
  // 4. CREDIFAMILIA - CONSUMO ACABADOS / REMODELACIÓN
  {
    bankId: "credifamilia",
    productType: "consumo-acabados",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 5000000,
    loanAmount: 5000000,
    termYears: 5, // 60 meses
    monthlyIncome: 3000000,
    clientAge: 28,
    expected: {
      rateMV: 0.01746974569669346,
      rawMonthlyPrincipalInterest: 135164.71,
      rawMonthlyLifeInsurance: 6950.0,
      rawMonthlyFireInsurance: 0.0,
      rawMonthlyFngCommission: 12395.83,
      rawMonthlyTotalPayment: 154510.54,
      toleranceCOP: 0.1,
    },
    sourceFile: "Simulador Actualizado Credito Consumo Acabados -JULIO.xlsx (Celdas B9, B11, B12, B13)",
    notes: "Sin garantía hipotecaria. Seguro de vida 0.139% y comisión FNG 2.5% + IVA mensual.",
  },
  // 5. BANCO BBVA - HIPOTECARIO NO VIS (CONVENIO)
  {
    bankId: "bbva",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 300000000,
    loanAmount: 200000000,
    termYears: 20, // 240 meses
    monthlyIncome: 12000000,
    clientAge: 35,
    expected: {
      rateMV: 0.009300823619,
      rawMonthlyPrincipalInterest: 2086333.76,
      rawMonthlyLifeInsurance: 42000.0, // 0.00021 sobre saldo insoluto
      rawMonthlyFireInsurance: 35100.0, // 0.000135 sobre 90% destructible ($270M)
      rawMonthlyTotalPayment: 2163433.76,
      toleranceCOP: 0.1,
    },
    sourceFile: "Simulador_Portafolio.xlsx / SIMULADOR-VIVIENDA_28082026.xlsm",
    notes: "Tasa EA 11.75% con seguro de vida proporcional.",
  },
  // 6. BANCO DE BOGOTÁ - HIPOTECARIO NO VIS (PCV_FOR_006 V02)
  {
    bankId: "banco-de-bogota",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 450000000,
    loanAmount: 300000000,
    termYears: 15, // 180 meses
    monthlyIncome: 15000000,
    clientAge: 40,
    expected: {
      rateMV: 0.009263183505,
      rawMonthlyPrincipalInterest: 3431640.98,
      rawMonthlyLifeInsurance: 60000.0, // 0.00020 sobre saldo
      rawMonthlyFireInsurance: 51637.5, // 0.000135 sobre 85% destructible ($382.5M)
      rawMonthlyTotalPayment: 3543278.48,
      toleranceCOP: 0.1,
    },
    sourceFile: "Simulador Portafolio de Vivienda septiembre.xlsx (Formato PCV_FOR_006 V02)",
    notes: "DTI evaluado sobre K+I. Tasa EA 11.70%.",
  },
  // 7. BANCOLOMBIA - HIPOTECARIO NO VIS
  {
    bankId: "bancolombia",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 500000000,
    loanAmount: 350000000,
    termYears: 20, // 240 meses
    monthlyIncome: 18000000,
    clientAge: 32,
    expected: {
      rateMV: 0.009338448298,
      rawMonthlyPrincipalInterest: 3661888.31,
      rawMonthlyLifeInsurance: 66500.0, // 0.00019 sobre saldo
      rawMonthlyFireInsurance: 63000.0, // 0.00014 sobre 90% destructible ($450M)
      rawMonthlyTotalPayment: 3791388.31,
      toleranceCOP: 0.1,
    },
    sourceFile: "Tasas Bancolombia - Actualización Junio 2026.docx / MATRIZ COMPARATIVA BANCOS .xlsx",
    notes: "Tasa EA 11.80%. Plazo 20 años. Anualidad francesa según Circular Bancolombia.",
  },
  // 8. BANCO CAJA SOCIAL - HIPOTECARIO VIS AMIGO
  {
    bankId: "caja-social",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 130000000,
    loanAmount: 90000000,
    termYears: 20, // 240 meses
    monthlyIncome: 4000000,
    clientAge: 30,
    expected: {
      rateMV: 0.010941887,
      rawMonthlyPrincipalInterest: 1062781.71,
      rawMonthlyLifeInsurance: 19800.0, // 0.00022 sobre saldo insoluto
      rawMonthlyFireInsurance: 15795.0, // 0.000135 sobre 90% destructible
      rawMonthlyTotalPayment: 1098376.71,
      toleranceCOP: 0.1,
    },
    sourceFile: "HERRAMIENTA LIVIANA.xls / SIMULADOR BCO CAJA SOCIAL.pptx",
    notes: "Tasa VIS 13.95% EA. DTI estricto 30% Ley 546.",
  },
  // 9. BANCO UNIÓN (COLEX) - COLOMBIANOS EN EL EXTERIOR
  {
    bankId: "banco-union-colex",
    productType: "colex-exterior",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 260000000,
    loanAmount: 180000000,
    termYears: 15, // 180 meses
    monthlyIncome: 12000000,
    clientAge: 42,
    expected: {
      rateMV: 0.009788753,
      rawMonthlyPrincipalInterest: 2131032.89,
      rawMonthlyLifeInsurance: 45000.0, // 0.00025 sobre saldo insoluto
      rawMonthlyFireInsurance: 32760.0, // 0.00014 sobre 90% destructible
      rawMonthlyTotalPayment: 2208792.89,
      toleranceCOP: 0.1,
    },
    sourceFile: "CHECK LIST DE DOCUMENTOS POR ACTIVIDAD Y BANCO COLEX.pdf / Colex Banco Unión",
    notes: "Canal especializado remesas y colombianos no residentes.",
  },
];

export function runFidelityAudit() {
  console.log("===============================================================================");
  console.log(" FINTERA - SUITE PERMANENTE DE REGRESIÓN FINANCIERA (MATRIZ COMPLETA 8 BANCOS)");
  console.log("===============================================================================\n");

  let allPassed = true;

  // 1. Regresión Principal (9 Casos Oficiales de Referencia)
  console.log("--- SECCIÓN 1: BENCHMARKS DE REFERENCIA OFICIAL BANCO POR BANCO ---");
  for (let i = 0; i < BENCHMARK_CASES.length; i++) {
    const test = BENCHMARK_CASES[i];
    console.log(`[CASO ${i + 1}] Banco: ${ALLIED_BANKS[test.bankId].name} - ${test.productType}`);
    console.log(`  Fuente oficial: ${test.sourceFile}`);
    console.log(`  Monto: $${test.loanAmount.toLocaleString("es-CO")} | Inmueble: $${test.propertyValue.toLocaleString("es-CO")} | Plazo: ${test.termYears * 12} meses`);

    const calc = calculateBankLoan(test.bankId, {
      bankId: test.bankId,
      productType: test.productType,
      amortizationSystem: test.amortizationSystem,
      propertyValue: test.propertyValue,
      loanAmount: test.loanAmount,
      termYears: test.termYears,
      monthlyIncome: test.monthlyIncome,
      clientAge: test.clientAge,
      employmentType: "empleado-indefinido",
      leasingPurchaseOptionPercent: test.leasingPurchaseOptionPercent,
    });

    if (!calc) {
      console.error(`  ❌ ERROR: calculateBankLoan devolvió null para ${test.bankId}`);
      allPassed = false;
      continue;
    }

    const deltaRate = Math.abs(calc.rateMV - test.expected.rateMV);
    const ratePassed = deltaRate < 0.0001;
    const deltaPMT = Math.abs(calc.rawMonthlyPrincipalInterestPayment - test.expected.rawMonthlyPrincipalInterest);
    const pmtPassed = deltaPMT <= test.expected.toleranceCOP;
    const deltaLife = Math.abs(calc.rawMonthlyLifeInsurance - test.expected.rawMonthlyLifeInsurance);
    const deltaFire = Math.abs(calc.rawMonthlyFireInsurance - test.expected.rawMonthlyFireInsurance);
    const lifePassed = deltaLife <= test.expected.toleranceCOP;
    const firePassed = deltaFire <= test.expected.toleranceCOP;
    const deltaTotal = Math.abs(calc.rawInitialMonthlyTotalPayment - test.expected.rawMonthlyTotalPayment);
    const totalPassed = deltaTotal <= test.expected.toleranceCOP;

    console.log(`  • Tasa M.V.: Calculada=${(calc.rateMV * 100).toFixed(6)}% | Esperada=${(test.expected.rateMV * 100).toFixed(6)}% | Δ=${deltaRate.toFixed(8)} [${ratePassed ? "PASS" : "FAIL"}]`);
    console.log(`  • Cuota Base: Calculada=$${calc.rawMonthlyPrincipalInterestPayment.toFixed(2)} | Esperada=$${test.expected.rawMonthlyPrincipalInterest.toFixed(2)} | Δ=$${deltaPMT.toFixed(3)} COP [${pmtPassed ? "PASS" : "FAIL"}]`);
    console.log(`  • Seguro Vida: Calculado=$${calc.rawMonthlyLifeInsurance.toFixed(2)} | Esperado=$${test.expected.rawMonthlyLifeInsurance.toFixed(2)} | Δ=$${deltaLife.toFixed(3)} COP [${lifePassed ? "PASS" : "FAIL"}]`);
    console.log(`  • Seguro Terremoto: Calculado=$${calc.rawMonthlyFireInsurance.toFixed(2)} | Esperado=$${test.expected.rawMonthlyFireInsurance.toFixed(2)} | Δ=$${deltaFire.toFixed(3)} COP [${firePassed ? "PASS" : "FAIL"}]`);
    console.log(`  • Cuota Total: Calculada=$${calc.rawInitialMonthlyTotalPayment.toFixed(2)} | Esperada=$${test.expected.rawMonthlyTotalPayment.toFixed(2)} | Δ=$${deltaTotal.toFixed(3)} COP [${totalPassed ? "PASS" : "FAIL"}]`);

    const casePassed = ratePassed && pmtPassed && lifePassed && firePassed && totalPassed;
    if (casePassed) {
      console.log(`  ✅ RESULTADO: EQUIVALENCIA EXACTA CERTIFICADA (Δ ≤ $${test.expected.toleranceCOP} COP)\n`);
    } else {
      console.log(`  ❌ RESULTADO: DISCREPANCIA DETECTADA (Δ_Total = $${deltaTotal.toFixed(3)})\n`);
      allPassed = false;
    }
  }

  // 2. Pruebas de Escenarios Límite (Edge Cases)
  console.log("--- SECCIÓN 2: ESCENARIOS LÍMITE (EDAD, PLAZOS EXTREMOS, SEGUROS Y SOBREENDEUDAMIENTO) ---");

  // A. Límite de Edad en AV Villas: Máximo Edad + Plazo = 74 años
  console.log("[LÍMITE 1] Regla Edad + Plazo (Banco AV Villas: Máx 74 años)");
  const avLimitOk = calculateBankLoan("av-villas", {
    bankId: "av-villas",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 150000000,
    loanAmount: 80000000,
    termYears: 5,
    monthlyIncome: 8000000, // DTI < 25%, holgado
    clientAge: 69, // 69 + 5 = 74 (Límite exacto permitido)
    employmentType: "pensionado",
  });

  const avLimitExceeded = calculateBankLoan("av-villas", {
    bankId: "av-villas",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 150000000,
    loanAmount: 80000000,
    termYears: 5,
    monthlyIncome: 8000000,
    clientAge: 71, // 71 + 5 = 76 (Excede 74)
    employmentType: "pensionado",
  });

  const ageRulePassed = avLimitOk?.preliminaryEligibilityStatus === "apto" &&
                        avLimitExceeded?.preliminaryEligibilityStatus === "no-viable-edad-plazo";
  console.log(`  • Edad 69 + 5 años: Estado=${avLimitOk?.preliminaryEligibilityStatus} (Esperado: apto)`);
  console.log(`  • Edad 71 + 5 años: Estado=${avLimitExceeded?.preliminaryEligibilityStatus} (Esperado: no-viable-edad-plazo)`);
  console.log(`  ${ageRulePassed ? "✅ PASS" : "❌ FAIL"}: Regla de edad máxima verificada.\n`);
  if (!ageRulePassed) allPassed = false;

  // B. Tramo de Seguro de Vida por Edad (Banco de Occidente)
  console.log("[LÍMITE 2] Escalonamiento de Seguros de Vida por Edad (Banco de Occidente)");
  const occYoung = calculateBankLoan("banco-de-occidente", {
    bankId: "banco-de-occidente",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 500000000,
    loanAmount: 300000000,
    termYears: 10,
    monthlyIncome: 15000000,
    clientAge: 32, // < 40 años: tasa 0.00016666 -> $49.998 COP
    employmentType: "empleado-indefinido",
  });

  const occSenior = calculateBankLoan("banco-de-occidente", {
    bankId: "banco-de-occidente",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 500000000,
    loanAmount: 300000000,
    termYears: 10,
    monthlyIncome: 15000000,
    clientAge: 52, // 41-69 años: tasa 0.00026666 -> $79.998 COP
    employmentType: "empleado-indefinido",
  });

  const insuranceTierPassed = Math.round(occYoung?.rawMonthlyLifeInsurance || 0) === 49998 &&
                              Math.round(occSenior?.rawMonthlyLifeInsurance || 0) === 79998;
  console.log(`  • Titular 32 años: Seguro Vida=$${occYoung?.monthlyLifeInsurance} COP (Esperado: $49.998 COP)`);
  console.log(`  • Titular 52 años: Seguro Vida=$${occSenior?.monthlyLifeInsurance} COP (Esperado: $79.998 COP)`);
  console.log(`  ${insuranceTierPassed ? "✅ PASS" : "❌ FAIL"}: Escalonamiento de póliza deudores validado.\n`);
  if (!insuranceTierPassed) allPassed = false;

  // C. Plazo Máximo Extremo (Banco de Bogotá: 30 años en UVR / Pesos)
  console.log("[LÍMITE 3] Plazo Máximo Extremo (Banco de Bogotá: 360 Meses)");
  const bogota30y = calculateBankLoan("banco-de-bogota", {
    bankId: "banco-de-bogota",
    productType: "hipotecario-novis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 400000000,
    loanAmount: 280000000,
    termYears: 30, // 360 meses
    monthlyIncome: 12000000,
    clientAge: 30,
    employmentType: "empleado-indefinido",
  });

  const term30yPassed = bogota30y !== null && bogota30y.termMonths === 360 && bogota30y.amortizationPreview.length > 30;
  console.log(`  • Plazo 30 años liquidado: ${bogota30y?.termMonths} meses | Cuota Inicial=$${bogota30y?.initialMonthlyTotalPayment.toLocaleString("es-CO")} COP`);
  console.log(`  ${term30yPassed ? "✅ PASS" : "❌ FAIL"}: Amortización a 30 años verificada.\n`);
  if (!term30yPassed) allPassed = false;

  // D. Multisolicitante y Pasivos Previos (Endeudamiento Global)
  console.log("[LÍMITE 4] Capacidad Multisolicitante y Pasivos Previos en Centrales");
  const soloRejected = calculateBankLoan("bancolombia", {
    bankId: "bancolombia",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 150000000,
    loanAmount: 120000000,
    termYears: 20,
    monthlyIncome: 2500000, // Cuota ~$1.3M representa 52% > 30% Ley 546
    clientAge: 29,
    employmentType: "empleado-indefinido",
  });

  const coApplicantViable = calculateBankLoan("bancolombia", {
    bankId: "bancolombia",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 150000000,
    loanAmount: 120000000,
    termYears: 20,
    monthlyIncome: 2500000,
    clientAge: 29,
    employmentType: "empleado-indefinido",
    coApplicants: [{
      relationship: "conyuge",
      monthlyIncome: 3500000, // Total $6.0M -> Cuota ~$1.3M representa 21.6% <= 30%
      age: 28,
      employmentType: "empleado-indefinido",
    }],
  });

  const overIndebted = calculateBankLoan("bancolombia", {
    bankId: "bancolombia",
    productType: "hipotecario-vis",
    amortizationSystem: "pesos-cuota-fija",
    propertyValue: 150000000,
    loanAmount: 120000000,
    termYears: 20,
    monthlyIncome: 2500000,
    clientAge: 29,
    employmentType: "empleado-indefinido",
    existingFinancialObligations: 2000000, // $2.0M de pasivos previos en tarjetas/vehículo
    coApplicants: [{
      relationship: "conyuge",
      monthlyIncome: 3500000,
      age: 28,
      employmentType: "empleado-indefinido",
      existingObligations: 1500000, // $1.5M del cónyuge -> Total pasivos $3.5M + cuota $1.3M = $4.8M / $6M = 80% > 50%
    }],
  });

  const multiApplicantLogicPassed =
    soloRejected?.preliminaryEligibilityStatus === "requiere-codeudor-adicional" &&
    coApplicantViable?.preliminaryEligibilityStatus === "apto" &&
    overIndebted?.preliminaryEligibilityStatus === "sobreendeudamiento-previo";

  console.log(`  • Titular solo (DTI 52%): Estado=${soloRejected?.preliminaryEligibilityStatus}`);
  console.log(`  • Con cónyuge (DTI 21.6%): Estado=${coApplicantViable?.preliminaryEligibilityStatus}`);
  console.log(`  • Con pasivos previos $3.5M (DTI Global 80%): Estado=${overIndebted?.preliminaryEligibilityStatus}`);
  console.log(`  ${multiApplicantLogicPassed ? "✅ PASS" : "❌ FAIL"}: Evaluación integral de endeudamiento global certificada.\n`);
  if (!multiApplicantLogicPassed) allPassed = false;

  // E. Transparencia de Fuente de Datos (Fallback vs Live DB)
  console.log("[LÍMITE 5] Trazabilidad y Transparencia de Fuente de Datos");
  const dataSource = coApplicantViable?.dataSourceInfo;
  console.log(`  • Tipo de Fuente: ${dataSource?.dataSource}`);
  console.log(`  • Indicador de Fallback: ${dataSource?.isFallback ? "ACTIVO (Biblioteca Certificada)" : "BD EN VIVO"}`);
  console.log(`  • Versión Activa: ${dataSource?.activeVersion}`);
  const dataSourcePassed = dataSource?.isFallback === true && dataSource?.dataSource === "certified-baseline-cache";
  console.log(`  ${dataSourcePassed ? "✅ PASS" : "❌ FAIL"}: Trazabilidad de contingencia debidamente rotulada.\n`);
  if (!dataSourcePassed) allPassed = false;

  if (allPassed) {
    console.log("===============================================================================");
    console.log(" CERTIFICACIÓN INTEGRAL SATISFACTORIA: TODOS LOS BENCHMARKS Y LÍMITES SUPERADOS");
    console.log("===============================================================================");
    process.exit(0);
  } else {
    console.error("===============================================================================");
    console.error(" FALLO EN AUDITORÍA: Uno o más casos o límites presentaron desviaciones.");
    console.error("===============================================================================");
  }
}

if (typeof process !== "undefined" && process.argv[1]?.includes("verify-financial-fidelity")) {
  runFidelityAudit();
}
