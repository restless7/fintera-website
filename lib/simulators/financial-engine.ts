import {
  BankId,
  CreditProductType,
  AmortizationSystem,
  SimulationParams,
  SimulationCalculation,
  AmortizationRow,
  MultiBankComparisonResult,
  BankDataSourceInfo,
} from "./types";
import { ALLIED_BANKS } from "./bank-configs";

/**
 * Converts Effective Annual rate (E.A.) to Monthly Effective rate (M.V.)
 * i_mv = (1 + EA)^(1/12) - 1
 */
export function convertEAToMV(ea: number): number {
  return Math.pow(1 + ea, 1 / 12) - 1;
}

/**
 * Converts Monthly Effective rate (M.V.) to Effective Annual rate (E.A.)
 * EA = (1 + i_mv)^12 - 1
 */
export function convertMVToEA(mv: number): number {
  return Math.pow(1 + mv, 12) - 1;
}

/**
 * Estimates appraisal (avalúo) cost based on Colombian bank fee schedules (2026)
 */
export function estimateAppraisalCost(propertyValue: number): number {
  if (propertyValue <= 150000000) return 380000;
  if (propertyValue <= 300000000) return 580000;
  if (propertyValue <= 600000000) return 920000;
  if (propertyValue <= 1200000000) return 1450000;
  return Math.min(3500000, Math.round(propertyValue * 0.0012));
}

/**
 * Estimates title search (estudio de títulos) cost
 */
export function estimateTitleSearchCost(loanAmount: number): number {
  const calculated = Math.round(loanAmount * 0.0012);
  return Math.max(300000, Math.min(calculated, 1200000));
}

/**
 * Simulates a single bank loan calculation reproducing official bank Excel formulas
 */
export function calculateBankLoan(
  bankId: BankId,
  params: SimulationParams
): SimulationCalculation | null {
  const bank = ALLIED_BANKS[bankId];
  if (!bank) return null;

  const policy = bank.products[params.productType];
  if (!policy) return null;

  const termMonths = Math.max(
    policy.minTermYears * 12,
    Math.min(params.termYears * 12, policy.maxTermYears * 12)
  );

  const loanAmount = Math.max(
    policy.minAmount,
    policy.maxAmount ? Math.min(params.loanAmount, policy.maxAmount) : params.loanAmount
  );

  const ltvRatio = params.propertyValue > 0 ? loanAmount / params.propertyValue : 0;

  // Rate calculation
  let effectiveEA = policy.interestRateEA;

  // If UVR selected and bank supports it
  if (params.amortizationSystem === "uvr-cuota-constante" && policy.allowsUVR && policy.uvrSpreadEA) {
    // Expected annualized UVR inflation ~ 5.5% + spread
    const estimatedInflation = 0.055;
    effectiveEA = (1 + estimatedInflation) * (1 + policy.uvrSpreadEA) - 1;
  }

  const rateMV = convertEAToMV(effectiveEA);

  // Life insurance rate (age bracket check, and special rate for consumo acabados)
  let lifeRate = bank.insurance.lifeRatePerMonth;
  if (params.productType === "consumo-acabados") {
    // Official Credifamilia finishes rate: 0.00139
    lifeRate = 0.00139;
  } else if (params.clientAge > 40 && bank.insurance.lifeRateOver40) {
    lifeRate = bank.insurance.lifeRateOver40;
  }

  // Fire/Earthquake monthly insurance base determination
  // Unmortgaged consumption/finishes credit does not carry fire/earthquake insurance
  let rawMonthlyFireInsurance = 0;
  if (params.productType !== "consumo-acabados") {
    const fireBaseValue =
      bank.insurance.fireInsuranceBase === "propertyValue"
        ? params.propertyValue
        : params.propertyValue * bank.insurance.defaultDestructibilityRatio;
    rawMonthlyFireInsurance = fireBaseValue * bank.insurance.fireEarthquakeRatePerMonth;
  }

  const rawMonthlyLifeInsurance = loanAmount * lifeRate;

  // Optional FNG commission (e.g. Credifamilia Acabados: 2.5% anual + 19% IVA)
  let rawMonthlyFngCommission: number | undefined = undefined;
  if (params.productType === "consumo-acabados" && bank.insurance.fngAnnualRate) {
    rawMonthlyFngCommission = (loanAmount * bank.insurance.fngAnnualRate / 12) * 1.19;
  }

  // Base PMT calculation
  let rawMonthlyPrincipalInterestPayment = 0;
  let leasingResidualValue: number | undefined = undefined;

  if (params.productType === "leasing-habitacional" && policy.allowsLeasingPurchaseOption) {
    const purchaseOptionPct =
      params.leasingPurchaseOptionPercent ?? policy.defaultPurchaseOptionPercent ?? 1.0;
    leasingResidualValue = loanAmount * (purchaseOptionPct / 100);

    // PMT with future value (residual option to purchase)
    // Formula identical to Excel PMT(rate, nper, -pv, fv)
    const discountedFV = leasingResidualValue / Math.pow(1 + rateMV, termMonths);
    const netPV = loanAmount - discountedFV;
    rawMonthlyPrincipalInterestPayment =
      (netPV * rateMV) / (1 - Math.pow(1 + rateMV, -termMonths));
  } else if (params.amortizationSystem === "pesos-abono-constante") {
    // German system: first month payment
    const fixedPrincipal = loanAmount / termMonths;
    const initialInterest = loanAmount * rateMV;
    rawMonthlyPrincipalInterestPayment = fixedPrincipal + initialInterest;
  } else {
    // Standard French system PMT
    rawMonthlyPrincipalInterestPayment =
      (loanAmount * rateMV) / (1 - Math.pow(1 + rateMV, -termMonths));
  }

  const rawInitialMonthlyTotalPayment =
    rawMonthlyPrincipalInterestPayment +
    rawMonthlyLifeInsurance +
    rawMonthlyFireInsurance +
    (rawMonthlyFngCommission || 0);

  // Rounded values for UI displays
  const monthlyPrincipalInterestPayment = Math.round(rawMonthlyPrincipalInterestPayment);
  const monthlyLifeInsurance = Math.round(rawMonthlyLifeInsurance);
  const monthlyFireInsurance = Math.round(rawMonthlyFireInsurance);
  const monthlyFngCommission = rawMonthlyFngCommission !== undefined ? Math.round(rawMonthlyFngCommission) : undefined;
  const initialMonthlyTotalPayment = Math.round(rawInitialMonthlyTotalPayment);

  // DTI calculation
  // Some banks (e.g. Banco de Bogota) evaluate DTI on cuota capital+interes, others on total payment
  const dtiEvaluationQuota =
    policy.dtiBasis === "cuota-capital-interes"
      ? rawMonthlyPrincipalInterestPayment
      : rawInitialMonthlyTotalPayment;

  const dtiLimit = policy.maxDtiLimit;
  const minRequiredIncome = Math.round(dtiEvaluationQuota / dtiLimit);
  const actualDtiRatio =
    params.monthlyIncome > 0 ? dtiEvaluationQuota / params.monthlyIncome : 1.0;
  const isDtiViable = actualDtiRatio <= dtiLimit;

  let dtiOriginDescription = "";
  if (policy.dtiOrigin === "ley-546-vis-estricto-30") {
    dtiOriginDescription = "Límite imperativo Ley 546/1999 (máx 30% cuota/ingreso en vivienda VIS)";
  } else if (policy.dtiOrigin === "politica-riesgo-banco-novis-40") {
    dtiOriginDescription = `Política de riesgo autorizada por ${bank.name} (máx 40% endeudamiento en NO VIS / Leasing)`;
  } else {
    dtiOriginDescription = `Política de riesgo interno para crédito de consumo (${(dtiLimit * 100).toFixed(0)}% de afectación)`;
  }

  // Generate Amortization Preview
  const amortizationPreview: AmortizationRow[] = [];
  let remainingBalance = loanAmount;
  let totalInterestPaid = 0;
  let totalInsurancesPaid = 0;

  const isGerman = params.amortizationSystem === "pesos-abono-constante";
  const fixedPrincipalGerman = isGerman ? loanAmount / termMonths : 0;

  for (let m = 1; m <= termMonths; m++) {
    const interestPart = Math.round(remainingBalance * rateMV);
    let principalPart = 0;

    if (isGerman) {
      principalPart = Math.min(remainingBalance, Math.round(fixedPrincipalGerman));
    } else if (
      params.productType === "leasing-habitacional" &&
      leasingResidualValue !== undefined &&
      m === termMonths
    ) {
      // In final month of leasing, payment covers remaining amortized balance plus option of purchase
      principalPart = Math.round(remainingBalance - leasingResidualValue);
    } else {
      principalPart = Math.min(
        remainingBalance,
        monthlyPrincipalInterestPayment - interestPart
      );
    }

    const lifeIns = Math.round(remainingBalance * lifeRate);
    const fireIns = monthlyFireInsurance;
    const fngIns = monthlyFngCommission;

    const paymentTot = isGerman
      ? principalPart + interestPart + lifeIns + fireIns + (fngIns || 0)
      : monthlyPrincipalInterestPayment + lifeIns + fireIns + (fngIns || 0);

    totalInterestPaid += interestPart;
    totalInsurancesPaid += lifeIns + fireIns + (fngIns || 0);
    remainingBalance = Math.max(0, remainingBalance - principalPart);

    if (m <= 36 || m % 12 === 0 || m === termMonths) {
      amortizationPreview.push({
        month: m,
        paymentTotal: paymentTot,
        principalPayment: principalPart,
        interestPayment: interestPart,
        lifeInsurance: lifeIns,
        fireInsurance: fireIns,
        fngCommission: fngIns,
        remainingBalance: Math.round(remainingBalance),
      });
    }
  }

  // FASE 3: Evaluación Multisolicitante, Obligaciones Previas y Capacidad Global
  let consolidatedMonthlyIncome = params.monthlyIncome;
  let hasCoApplicants = false;
  let totalExistingObligations = params.existingFinancialObligations || 0;

  if (params.coApplicants && params.coApplicants.length > 0) {
    hasCoApplicants = true;
    for (const co of params.coApplicants) {
      if (co.monthlyIncome > 0) {
        consolidatedMonthlyIncome += co.monthlyIncome;
      }
      if (co.existingObligations) {
        totalExistingObligations += co.existingObligations;
      }
    }
  }

  const consolidatedDtiRatio =
    consolidatedMonthlyIncome > 0 ? dtiEvaluationQuota / consolidatedMonthlyIncome : 1.0;
  const isConsolidatedDtiViable = consolidatedDtiRatio <= dtiLimit;

  // Límite de Endeudamiento Global (DTI Total con pasivos existentes)
  // Banco AV Villas permite hasta 74% global; Bancolombia/Occidente 50%; otros 45% o 40%.
  let maxGlobalDtiLimit = 0.50;
  let bankAdmissionRuleApplied = `${bank.name}: Política general de endeudamiento global 50%.`;

  if (bankId === "av-villas") {
    maxGlobalDtiLimit = 0.74;
    bankAdmissionRuleApplied = "AV Villas: Política de endeudamiento global permisiva hasta el 74% de afectación de ingresos.";
  } else if (bankId === "caja-social") {
    maxGlobalDtiLimit = 0.40;
    bankAdmissionRuleApplied = "Banco Caja Social: Máximo 40% global. El titular principal debe justificar al menos el 50% del ingreso familiar.";
  } else if (bankId === "bancolombia") {
    maxGlobalDtiLimit = 0.50;
    bankAdmissionRuleApplied = "Bancolombia: Admite unificación de ingresos sin límite de consanguinidad. Endeudamiento global máx 50%.";
  } else if (bankId === "banco-de-bogota") {
    maxGlobalDtiLimit = 0.45;
    bankAdmissionRuleApplied = "Banco de Bogotá (PCV_FOR_006): Admite hasta 4 cotitulares. DTI cuota evaluada sobre capital+intereses.";
  } else if (bankId === "credifamilia") {
    maxGlobalDtiLimit = 0.40;
    bankAdmissionRuleApplied = "Credifamilia: Crédito sin garantía hipotecaria. Endeudamiento global estricto del 40% con aval FNG.";
  }

  const globalDtiRatio =
    consolidatedMonthlyIncome > 0
      ? (dtiEvaluationQuota + totalExistingObligations) / consolidatedMonthlyIncome
      : 1.0;
  const isGlobalDtiViable = globalDtiRatio <= maxGlobalDtiLimit;

  // Elegibilidad orientativa preliminar
  let preliminaryEligibilityStatus: SimulationCalculation["preliminaryEligibilityStatus"] = "apto";
  let preliminaryEligibilityMessage = "";

  const titularAgePlusTerm = params.clientAge + params.termYears;
  if (titularAgePlusTerm > bank.maxAgePlusTerm) {
    preliminaryEligibilityStatus = "no-viable-edad-plazo";
    preliminaryEligibilityMessage = `La suma de edad (${params.clientAge}) + plazo (${params.termYears} años) = ${titularAgePlusTerm} supera el límite de ${bank.maxAgePlusTerm} años de ${bank.name}. Conviene reducir el plazo.`;
  } else if (!isConsolidatedDtiViable) {
    preliminaryEligibilityStatus = "requiere-codeudor-adicional";
    preliminaryEligibilityMessage = `La cuota del crédito (${(consolidatedDtiRatio * 100).toFixed(1)}%) supera el tope permitido (${(dtiLimit * 100).toFixed(0)}%). Se requiere sumar un cotitular o codeudor para viabilizar la operación.`;
  } else if (!isGlobalDtiViable) {
    preliminaryEligibilityStatus = "sobreendeudamiento-previo";
    preliminaryEligibilityMessage = `Endeudamiento global excesivo (${(globalDtiRatio * 100).toFixed(1)}% vs máx ${(maxGlobalDtiLimit * 100).toFixed(0)}%). Tus obligaciones previas de $${totalExistingObligations.toLocaleString("es-CO")} copan la capacidad financiera.`;
  } else if (consolidatedDtiRatio > dtiLimit * 0.85 || globalDtiRatio > maxGlobalDtiLimit * 0.85) {
    preliminaryEligibilityStatus = "capacidad-ajustada";
    preliminaryEligibilityMessage = `Capacidad al límite (${(consolidatedDtiRatio * 100).toFixed(1)}% cuota / ${(globalDtiRatio * 100).toFixed(1)}% global). Aprobación orientativa sujeta a validación en centrales de riesgo.`;
  } else {
    preliminaryEligibilityStatus = "apto";
    preliminaryEligibilityMessage = `Capacidad financiera favorable (${(consolidatedDtiRatio * 100).toFixed(1)}% cuota / ${(globalDtiRatio * 100).toFixed(1)}% global). Cumple con las políticas paramétricas de ${bank.name}.`;
  }

  // FASE 2: Transparencia de Fuente de Datos
  const dataSourceInfo: BankDataSourceInfo = bank.dataSourceInfo || {
    dataSource: "certified-baseline-cache",
    isFallback: true,
    activeVersion: bank.traceability.versionIdentifier,
    effectiveDate: bank.traceability.effectiveDate,
    fallbackWarning: "Operando con tarifario base certificado de biblioteca bancaria (PostgreSQL no conectado).",
  };

  const totalCostOfCredit = loanAmount + totalInterestPaid + totalInsurancesPaid;

  return {
    bankId,
    bankName: bank.name,
    productType: params.productType,
    productName: policy.name,
    amortizationSystem: params.amortizationSystem,
    loanAmount,
    propertyValue: params.propertyValue,
    ltvRatio,
    termMonths,
    rateEA: effectiveEA,
    rateMV,
    initialMonthlyTotalPayment,
    monthlyPrincipalInterestPayment,
    monthlyLifeInsurance,
    monthlyFireInsurance,
    monthlyFngCommission,
    rawMonthlyPrincipalInterestPayment,
    rawMonthlyLifeInsurance,
    rawMonthlyFireInsurance,
    rawInitialMonthlyTotalPayment,
    totalInterestPaid,
    totalInsurancesPaid,
    totalCostOfCredit,
    minRequiredIncome,
    actualDtiRatio,
    isDtiViable,
    dtiOriginDescription,
    // FASE 3: Multisolicitante y Elegibilidad Orientativa
    consolidatedMonthlyIncome,
    consolidatedDtiRatio,
    isConsolidatedDtiViable,
    hasCoApplicants,
    existingFinancialObligations: totalExistingObligations,
    globalDtiRatio,
    maxGlobalDtiLimit,
    isGlobalDtiViable,
    bankAdmissionRuleApplied,
    preliminaryEligibilityStatus,
    preliminaryEligibilityMessage,
    // FASE 2: Transparencia de Fuente de Datos
    dataSourceInfo,
    estimatedAppraisalCost: estimateAppraisalCost(params.propertyValue),
    estimatedTitleSearchCost: estimateTitleSearchCost(loanAmount),
    leasingResidualValue,
    traceability: bank.traceability,
    amortizationPreview,
  };
}

/**
 * Runs a multi-bank comparative simulation across all allied banks that support the product
 */
export function runMultiBankComparison(
  params: SimulationParams
): MultiBankComparisonResult {
  const bankIds = Object.keys(ALLIED_BANKS) as BankId[];
  const calculations: SimulationCalculation[] = [];

  for (const bId of bankIds) {
    const calc = calculateBankLoan(bId, params);
    if (calc) {
      calculations.push(calc);
    }
  }

  if (calculations.length === 0) {
    throw new Error(
      `No allied bank offers product ${params.productType} under current parameters.`
    );
  }

  // Find optimal banks by categories
  let bestRateCalc = calculations[0];
  let lowestPaymentCalc = calculations[0];
  let highestCapacityCalc = calculations[0];
  let lowestInsuranceCalc = calculations[0];

  for (const c of calculations) {
    if (c.rateEA < bestRateCalc.rateEA) {
      bestRateCalc = c;
    }
    if (c.initialMonthlyTotalPayment < lowestPaymentCalc.initialMonthlyTotalPayment) {
      lowestPaymentCalc = c;
    }
    if (c.minRequiredIncome < highestCapacityCalc.minRequiredIncome) {
      highestCapacityCalc = c;
    }
    const currentIns = c.monthlyLifeInsurance + c.monthlyFireInsurance;
    const bestIns =
      lowestInsuranceCalc.monthlyLifeInsurance + lowestInsuranceCalc.monthlyFireInsurance;
    if (currentIns < bestIns) {
      lowestInsuranceCalc = c;
    }
  }

  return {
    clientScenario: params,
    calculations,
    bestRateBankId: bestRateCalc.bankId,
    lowestPaymentBankId: lowestPaymentCalc.bankId,
    highestCapacityBankId: highestCapacityCalc.bankId,
    lowestInsuranceBankId: lowestInsuranceCalc.bankId,
  };
}
