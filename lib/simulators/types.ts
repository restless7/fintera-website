export type BankId =
  | "bancolombia"
  | "banco-de-bogota"
  | "av-villas"
  | "bbva"
  | "banco-de-occidente"
  | "caja-social"
  | "credifamilia"
  | "banco-union-colex";

export type CreditProductType =
  | "hipotecario-vis"
  | "hipotecario-novis"
  | "leasing-habitacional"
  | "compra-cartera"
  | "remodelacion"
  | "consumo-acabados"
  | "colex-exterior";

export type AmortizationSystem =
  | "pesos-cuota-fija"
  | "uvr-cuota-constante"
  | "pesos-abono-constante";

export type EmploymentType =
  | "empleado-indefinido"
  | "empleado-fijo-obra"
  | "independiente"
  | "pensionado";

export interface PolicyTraceability {
  /** Source file name in the official bank library */
  sourceDocument: string;
  /** Effective date of the rates and policies (e.g. 2026-08-04) */
  effectiveDate: string;
  /** Version or circular identifier */
  versionIdentifier: string;
  /** Primary source classification */
  officialStatus: "Herramienta Oficial Entidad Bancaria" | "Circular Tarifaria Oficial";
}

export interface BankInsuranceConfig {
  /** Monthly life insurance factor as decimal (e.g. 0.00024 = $240 per million debt) */
  lifeRatePerMonth: number;
  /** Life insurance age brackets if differentiated */
  lifeRateOver40?: number;
  /** Monthly fire and earthquake insurance rate (e.g. 0.00013666) */
  fireEarthquakeRatePerMonth: number;
  /** Whether bank calculates fire insurance on full property value or destructible value */
  fireInsuranceBase: "propertyValue" | "destructibleValue";
  /** Standard destructibility factor for property value (e.g. 0.85 to 0.95) */
  defaultDestructibilityRatio: number;
  /** Optional FNG (Fondo Nacional de Garantías) commission annual rate (e.g. 0.025 for Credifamilia Acabados) */
  fngAnnualRate?: number;
}

export interface BankProductPolicy {
  productType: CreditProductType;
  name: string;
  minAmount: number;
  maxAmount?: number;
  minTermYears: number;
  maxTermYears: number;
  maxLTV: number; // e.g. 0.70, 0.80, 0.85, 0.90
  defaultTermYears: number;
  interestRateEA: number; // Base reference EA rate (e.g. 0.112 = 11.2%)
  minRateEA: number;
  maxRateEA: number;
  uvrSpreadEA?: number; // e.g. 0.075 for UVR + 7.5%
  /** DTI limit according to policy */
  maxDtiLimit: number;
  /** Distinguishes legal mandate (Ley 546/1999) from internal bank risk threshold */
  dtiOrigin: "ley-546-vis-estricto-30" | "politica-riesgo-banco-novis-40" | "politica-consumo-libre-40";
  /** Whether DTI is computed over capital+interes or total payment with insurance */
  dtiBasis: "cuota-total-con-seguros" | "cuota-capital-interes";
  allowsUVR: boolean;
  allowsLeasingPurchaseOption: boolean;
  defaultPurchaseOptionPercent?: number; // 1% to 20%
}

export interface BankDataSourceInfo {
  dataSource: "live-database" | "certified-baseline-cache";
  isFallback: boolean;
  activeVersion: string;
  fallbackWarning?: string;
  effectiveDate: string;
}

export interface BankMetadata {
  id: BankId;
  name: string;
  tagline: string;
  shortCode: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  minIncomeSmmlv: number;
  minScore: number;
  maxAgePlusTerm: number; // Age + term limit (e.g. 74 years)
  approvalValidityPeriod: string;
  keyBenefits: string[];
  traceability: PolicyTraceability;
  insurance: BankInsuranceConfig;
  products: Record<CreditProductType, BankProductPolicy | undefined>;
  dataSourceInfo?: BankDataSourceInfo;
}

export interface CoApplicant {
  relationship: "conyuge" | "familiar-primer-grado" | "familiar-segundo-grado" | "tercero-codeudor";
  monthlyIncome: number;
  age: number;
  employmentType: EmploymentType;
  existingObligations?: number;
}

export interface SimulationParams {
  bankId: BankId | "all";
  productType: CreditProductType;
  amortizationSystem: AmortizationSystem;
  propertyValue: number;
  loanAmount: number;
  termYears: number;
  monthlyIncome: number;
  clientAge: number;
  employmentType: EmploymentType;
  existingFinancialObligations?: number; // Pasivos mensuales actuales (tarjetas, libre destino, créditos)
  coApplicants?: CoApplicant[];
  leasingPurchaseOptionPercent?: number; // 0 to 30
  propertyType?: "apartamento" | "casa" | "otro";
  isClientResidentAbroad?: boolean;
}

export interface AmortizationRow {
  month: number;
  paymentTotal: number;
  principalPayment: number;
  interestPayment: number;
  lifeInsurance: number;
  fireInsurance: number;
  fngCommission?: number;
  remainingBalance: number;
}

export interface SimulationCalculation {
  bankId: BankId;
  bankName: string;
  productType: CreditProductType;
  productName: string;
  amortizationSystem: AmortizationSystem;
  loanAmount: number;
  propertyValue: number;
  ltvRatio: number;
  termMonths: number;
  rateEA: number;
  rateMV: number;
  // Rounded integer values for UI rendering
  initialMonthlyTotalPayment: number;
  monthlyPrincipalInterestPayment: number;
  monthlyLifeInsurance: number;
  monthlyFireInsurance: number;
  monthlyFngCommission?: number;
  // Exact unrounded floating-point figures for mathematical audit & regression tests
  rawMonthlyPrincipalInterestPayment: number;
  rawMonthlyLifeInsurance: number;
  rawMonthlyFireInsurance: number;
  rawInitialMonthlyTotalPayment: number;
  totalInterestPaid: number;
  totalInsurancesPaid: number;
  totalCostOfCredit: number;
  minRequiredIncome: number;
  actualDtiRatio: number;
  isDtiViable: boolean;
  dtiOriginDescription: string;
  // FASE 3: Multisolicitante y Elegibilidad Orientativa Completa
  consolidatedMonthlyIncome: number;
  consolidatedDtiRatio: number;
  isConsolidatedDtiViable: boolean;
  hasCoApplicants: boolean;
  existingFinancialObligations: number;
  globalDtiRatio: number; // Cuota hipotecaria + pasivos vigentes / ingresos consolidados
  maxGlobalDtiLimit: number; // Límite global por banco (e.g. 74% en AV Villas, 50% mercado)
  isGlobalDtiViable: boolean;
  bankAdmissionRuleApplied: string;
  preliminaryEligibilityStatus: "apto" | "capacidad-ajustada" | "requiere-codeudor-adicional" | "no-viable-edad-plazo" | "sobreendeudamiento-previo";
  preliminaryEligibilityMessage: string;
  // FASE 2: Transparencia de Fuente de Datos (Live DB vs Certified Baseline Cache)
  dataSourceInfo: BankDataSourceInfo;
  estimatedAppraisalCost: number;
  estimatedTitleSearchCost: number;
  leasingResidualValue?: number;
  traceability: PolicyTraceability;
  amortizationPreview: AmortizationRow[];
}

export interface MultiBankComparisonResult {
  clientScenario: SimulationParams;
  calculations: SimulationCalculation[];
  bestRateBankId: BankId;
  lowestPaymentBankId: BankId;
  highestCapacityBankId: BankId;
  lowestInsuranceBankId: BankId;
}
