/**
 * REGISTRO VERSIONADO DE WORKFLOWS BANCARIOS (VERSIONED BANK WORKFLOW REGISTRY)
 * FASE 6.3: GATE D — D02 & D05
 * 
 * Configuración de las ocho entidades financieras aliadas:
 * 1. Bancolombia
 * 2. Banco de Bogotá
 * 3. Banco AV Villas
 * 4. BBVA Colombia
 * 5. Banco de Occidente
 * 6. Banco Caja Social
 * 7. Credifamilia
 * 8. Banco Unión / COLEX
 */

import { BankStage } from "@/prisma/generated/client";
import { UserRole } from "@/lib/auth/types";
import { BankWorkflowDefinition, StageTransitionRule } from "./types";
import { DEFAULT_CUSTOMER_STAGE_MAP } from "./customer-stage-map";

/**
 * Matriz canónica de transiciones permitidas para un flujo hipotecario estándar
 */
const STANDARD_PERMITTED_TRANSITIONS: Record<BankStage, BankStage[]> = {
  STAGE_01_PRE_FILE: [
    BankStage.STAGE_02_INTERNAL_QA,
    BankStage.STAGE_BANK_SUSPENDED,
    BankStage.STAGE_BANK_TRANSFERRED,
  ],
  STAGE_02_INTERNAL_QA: [
    BankStage.STAGE_01_PRE_FILE, // Devolución a subsanación
    BankStage.STAGE_03_READY_FOR_BANK,
    BankStage.STAGE_BANK_SUSPENDED,
    BankStage.STAGE_BANK_TRANSFERRED,
  ],
  STAGE_03_READY_FOR_BANK: [
    BankStage.STAGE_02_INTERNAL_QA, // Re-auditoría
    BankStage.STAGE_04_BANK_SUBMITTED,
    BankStage.STAGE_BANK_SUSPENDED,
    BankStage.STAGE_BANK_TRANSFERRED,
  ],
  STAGE_04_BANK_SUBMITTED: [
    BankStage.STAGE_05_RISK_EVALUATION,
    BankStage.STAGE_BANK_REJECTED,
    BankStage.STAGE_BANK_SUSPENDED,
  ],
  STAGE_05_RISK_EVALUATION: [
    BankStage.STAGE_06_CONDITIONAL_APPROVAL,
    BankStage.STAGE_07_DEFINITIVE_APPROVAL,
    BankStage.STAGE_BANK_REJECTED,
    BankStage.STAGE_BANK_SUSPENDED,
  ],
  STAGE_06_CONDITIONAL_APPROVAL: [
    BankStage.STAGE_07_DEFINITIVE_APPROVAL,
    BankStage.STAGE_05_RISK_EVALUATION, // Re-estudio por condiciones
    BankStage.STAGE_BANK_REJECTED,
    BankStage.STAGE_BANK_SUSPENDED,
  ],
  STAGE_07_DEFINITIVE_APPROVAL: [
    BankStage.STAGE_08_APPRAISAL_LEGAL,
    BankStage.STAGE_BANK_SUSPENDED,
  ],
  STAGE_08_APPRAISAL_LEGAL: [
    BankStage.STAGE_09_DISBURSED,
    BankStage.STAGE_BANK_SUSPENDED,
  ],
  // Terminales e Inmutables
  STAGE_09_DISBURSED: [], // Terminal: desembolsado no admite transiciones ordinarias
  STAGE_BANK_REJECTED: [], // Terminal por banco
  STAGE_BANK_SUSPENDED: [
    BankStage.STAGE_01_PRE_FILE,
    BankStage.STAGE_02_INTERNAL_QA,
    BankStage.STAGE_03_READY_FOR_BANK,
    BankStage.STAGE_04_BANK_SUBMITTED,
  ],
  STAGE_BANK_TRANSFERRED: [], // Terminal
};

/**
 * Generador de reglas de transición con verificación de roles y prerrequisitos
 */
function createStandardRules(bankId: string): StageTransitionRule[] {
  return [
    {
      fromStage: BankStage.STAGE_01_PRE_FILE,
      toStage: BankStage.STAGE_02_INTERNAL_QA,
      allowedRoles: [UserRole.COMMERCIAL_ADVISOR, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: false,
      requiresEvidence: false,
      prerequisites: [
        {
          code: "DOC_INCOME_CHECK",
          name: "Soportes de Ingresos Básicos",
          description: "Certificado laboral o extractos adjuntos para análisis preliminar",
          source: "FINTERA_INTERNAL_POLICY",
          isMandatory: true,
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_02_INTERNAL_QA,
      toStage: BankStage.STAGE_03_READY_FOR_BANK,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.DOCUMENT_ANALYST, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      prerequisites: [
        {
          code: "QA_CHECKLIST_VERIFIED",
          name: "Auditoría Interna Fintera Conforme",
          description: "Revisión documental aprobada por el analista de calidad",
          source: "FINTERA_INTERNAL_POLICY",
          isMandatory: true,
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_03_READY_FOR_BANK,
      toStage: BankStage.STAGE_04_BANK_SUBMITTED,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: true,
      prerequisites: [
        {
          code: "BANK_FILING_NUMBER_REQUIRED",
          name: "Número de Radicado Bancario",
          description: "Se debe contar con el radicado oficial o constancia de entrega al ejecutivo bancario",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
          validationFn: (ctx) => Boolean(ctx.bankFilingNumber && ctx.bankFilingNumber.trim().length > 2),
        },
        {
          code: "DOCUMENTARY_EVIDENCE_COMPLETE",
          name: "Soportes Documentales Conformes y Aprobados",
          description: "Todos los requisitos documentales obligatorios deben estar materializados, limpios de amenazas y aprobados conforme",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
          validationFn: async (ctx) => {
            const { DocumentRequirementService } = await import("@/lib/documents/document-requirement-service");
            const readiness = await DocumentRequirementService.evaluateBankReadiness(ctx.bankApplicationId);
            return readiness.isReady;
          },
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_04_BANK_SUBMITTED,
      toStage: BankStage.STAGE_05_RISK_EVALUATION,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: false,
      requiresEvidence: false,
      prerequisites: [],
    },
    {
      fromStage: BankStage.STAGE_05_RISK_EVALUATION,
      toStage: BankStage.STAGE_06_CONDITIONAL_APPROVAL,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      prerequisites: [],
    },
    {
      fromStage: BankStage.STAGE_05_RISK_EVALUATION,
      toStage: BankStage.STAGE_07_DEFINITIVE_APPROVAL,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: true,
      prerequisites: [
        {
          code: "APPROVED_FINANCIAL_PARAMS",
          name: "Parámetros Financieros Aprobados",
          description: "Monto y tasa aprobada por la entidad deben estar registrados",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
          validationFn: (ctx) => Boolean(ctx.approvedAmount && ctx.approvedAmount > 0 && ctx.approvedRateEA && ctx.approvedRateEA > 0),
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_06_CONDITIONAL_APPROVAL,
      toStage: BankStage.STAGE_07_DEFINITIVE_APPROVAL,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: true,
      prerequisites: [
        {
          code: "CONDITIONS_RESOLVED",
          name: "Condiciones de Aprobación Resueltas",
          description: "Constancia de cumplimiento de las observaciones del banco",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_07_DEFINITIVE_APPROVAL,
      toStage: BankStage.STAGE_08_APPRAISAL_LEGAL,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      prerequisites: [],
    },
    {
      fromStage: BankStage.STAGE_08_APPRAISAL_LEGAL,
      toStage: BankStage.STAGE_09_DISBURSED,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: true,
      prerequisites: [
        {
          code: "DISBURSEMENT_PROOF",
          name: "Constancia o Acta de Desembolso",
          description: "Confirmación del giro emitido por la entidad bancaria",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_04_BANK_SUBMITTED,
      toStage: BankStage.STAGE_BANK_REJECTED,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      prerequisites: [
        {
          code: "REJECTION_REASON_REQUIRED",
          name: "Causal de Rechazo Tipificada",
          description: "El banco debe haber notificado la causal del rechazo",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
          validationFn: (ctx) => Boolean(ctx.rejectionReason && ctx.rejectionReason.trim().length > 3),
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_05_RISK_EVALUATION,
      toStage: BankStage.STAGE_BANK_REJECTED,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      prerequisites: [
        {
          code: "REJECTION_REASON_REQUIRED",
          name: "Causal de Rechazo Tipificada",
          description: "Causal de rechazo suministrada por fábrica de crédito",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
          validationFn: (ctx) => Boolean(ctx.rejectionReason && ctx.rejectionReason.trim().length > 3),
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_06_CONDITIONAL_APPROVAL,
      toStage: BankStage.STAGE_BANK_REJECTED,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      prerequisites: [
        {
          code: "REJECTION_REASON_REQUIRED",
          name: "Causal de Rechazo Tipificada",
          description: "Causal de rechazo por condiciones no subsanadas o desistimiento",
          source: "OFFICIAL_DOCUMENTED",
          isMandatory: true,
          validationFn: (ctx) => Boolean(ctx.rejectionReason && ctx.rejectionReason.trim().length > 3),
        },
      ],
    },
    // Reglas para Retrocesos Controlados y Subsanaciones (Ciclos Auditables)
    {
      fromStage: BankStage.STAGE_02_INTERNAL_QA,
      toStage: BankStage.STAGE_01_PRE_FILE,
      allowedRoles: [UserRole.DOCUMENT_ANALYST, UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      isExceptionalOrCompensating: true,
      prerequisites: [
        {
          code: "DOC_SUBSANACION_REASON",
          name: "Motivo de Devolución a Subsanación",
          description: "Se debe especificar qué documento requiere corrección o actualización",
          source: "FINTERA_INTERNAL_POLICY",
          isMandatory: true,
        },
      ],
    },
    {
      fromStage: BankStage.STAGE_03_READY_FOR_BANK,
      toStage: BankStage.STAGE_02_INTERNAL_QA,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      isExceptionalOrCompensating: true,
      prerequisites: [],
    },
    {
      fromStage: BankStage.STAGE_06_CONDITIONAL_APPROVAL,
      toStage: BankStage.STAGE_05_RISK_EVALUATION,
      allowedRoles: [UserRole.OPERATIONS_OFFICER, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      isExceptionalOrCompensating: true,
      prerequisites: [],
    },
    // Reglas para Suspensión de Expediente
    ...[
      BankStage.STAGE_01_PRE_FILE,
      BankStage.STAGE_02_INTERNAL_QA,
      BankStage.STAGE_03_READY_FOR_BANK,
      BankStage.STAGE_04_BANK_SUBMITTED,
      BankStage.STAGE_05_RISK_EVALUATION,
      BankStage.STAGE_06_CONDITIONAL_APPROVAL,
      BankStage.STAGE_07_DEFINITIVE_APPROVAL,
      BankStage.STAGE_08_APPRAISAL_LEGAL,
    ].map((stage) => ({
      fromStage: stage,
      toStage: BankStage.STAGE_BANK_SUSPENDED,
      allowedRoles: [UserRole.COMMERCIAL_ADVISOR, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: true,
      prerequisites: [],
    })),
    // Reglas para Reactivación / Reapertura desde Suspensión
    ...[
      BankStage.STAGE_01_PRE_FILE,
      BankStage.STAGE_02_INTERNAL_QA,
      BankStage.STAGE_03_READY_FOR_BANK,
      BankStage.STAGE_04_BANK_SUBMITTED,
    ].map((targetStage) => ({
      fromStage: BankStage.STAGE_BANK_SUSPENDED,
      toStage: targetStage,
      allowedRoles: [UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      isExceptionalOrCompensating: true,
      prerequisites: [],
    })),
    // Reglas para Traslado de Banco
    ...[
      BankStage.STAGE_01_PRE_FILE,
      BankStage.STAGE_02_INTERNAL_QA,
      BankStage.STAGE_03_READY_FOR_BANK,
    ].map((stage) => ({
      fromStage: stage,
      toStage: BankStage.STAGE_BANK_TRANSFERRED,
      allowedRoles: [UserRole.COMMERCIAL_ADVISOR, UserRole.SUPERVISOR, UserRole.COMMERCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      requiresReason: true,
      requiresEvidence: false,
      isExceptionalOrCompensating: true,
      prerequisites: [],
    })),
  ];
}

/**
 * Catálogo canónico de workflows para las 8 entidades financieras aliadas
 */
export const BANK_WORKFLOW_DEFINITIONS: Record<string, BankWorkflowDefinition> = {
  // 1. Bancolombia
  "bancolombia": {
    workflowId: "wf_bancolombia_v1",
    bankId: "bancolombia",
    productType: "hipotecario-novis",
    version: "BCOL-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "Bancolombia — Workflow Hipotecario Oficial",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("bancolombia"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },

  // 2. Banco de Bogotá
  "banco-de-bogota": {
    workflowId: "wf_banco_de_bogota_v1",
    bankId: "banco-de-bogota",
    productType: "hipotecario-novis",
    version: "BOG-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "Banco de Bogotá — Workflow Hipotecario Oficial",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("banco-de-bogota"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },

  // 3. Banco AV Villas
  "av-villas": {
    workflowId: "wf_av_villas_v1",
    bankId: "av-villas",
    productType: "hipotecario-vis",
    version: "AVV-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "Banco AV Villas — Workflow VIS & No VIS",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("av-villas"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },

  // 4. BBVA Colombia
  "bbva": {
    workflowId: "wf_bbva_v1",
    bankId: "bbva",
    productType: "hipotecario-novis",
    version: "BBVA-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "BBVA Colombia — Workflow Digital Hipotecario",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("bbva"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },

  // 5. Banco de Occidente
  "banco-de-occidente": {
    workflowId: "wf_banco_de_occidente_v1",
    bankId: "banco-de-occidente",
    productType: "leasing-habitacional",
    version: "OCC-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "Banco de Occidente — Workflow Leasing & Crédito",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("banco-de-occidente"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },

  // 6. Banco Caja Social
  "caja-social": {
    workflowId: "wf_caja_social_v1",
    bankId: "caja-social",
    productType: "hipotecario-vis",
    version: "BCS-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "Banco Caja Social — Workflow VIS & Amigo",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("caja-social"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },

  // 7. Credifamilia
  "credifamilia": {
    workflowId: "wf_credifamilia_v1",
    bankId: "credifamilia",
    productType: "consumo-acabados",
    version: "CFAM-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "Credifamilia — Workflow Acabados & Vivienda",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("credifamilia"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },

  // 8. Banco Unión / COLEX
  "banco-union-colex": {
    workflowId: "wf_banco_union_colex_v1",
    bankId: "banco-union-colex",
    productType: "colex-exterior",
    version: "UNION-2026.1",
    effectiveDate: "2026-01-01",
    displayName: "Banco Unión — Workflow Colombianos en el Exterior (COLEX)",
    initialStage: BankStage.STAGE_01_PRE_FILE,
    terminalStages: [BankStage.STAGE_09_DISBURSED, BankStage.STAGE_BANK_REJECTED, BankStage.STAGE_BANK_TRANSFERRED],
    permittedTransitions: STANDARD_PERMITTED_TRANSITIONS,
    transitionRules: createStandardRules("banco-union-colex"),
    customerStageMap: DEFAULT_CUSTOMER_STAGE_MAP,
  },
};

export class BankWorkflowRegistry {
  /**
   * Obtiene la definición de workflow para un banco y versión
   */
  static getWorkflow(bankId: string, version?: string): BankWorkflowDefinition {
    const wf = BANK_WORKFLOW_DEFINITIONS[bankId];
    if (!wf) {
      // Fallback a Bancolombia como esquema canónico seguro
      return BANK_WORKFLOW_DEFINITIONS["bancolombia"];
    }
    return wf;
  }

  /**
   * Valida la consistencia e integridad de todas las definiciones registradas
   * Criterio D02: All supported banking workflows load, validate and resolve deterministically.
   */
  static validateAll(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const keys = Object.keys(BANK_WORKFLOW_DEFINITIONS);

    if (keys.length < 8) {
      errors.push(`Se esperaban al menos 8 configuraciones bancarias aliadas, encontradas: ${keys.length}`);
    }

    for (const [bankId, wf] of Object.entries(BANK_WORKFLOW_DEFINITIONS)) {
      if (!wf.version) {
        errors.push(`[${bankId}] El workflow carece de versionamiento`);
      }
      if (!wf.initialStage) {
        errors.push(`[${bankId}] El workflow carece de initialStage`);
      }
      if (!wf.terminalStages || wf.terminalStages.length === 0) {
        errors.push(`[${bankId}] El workflow carece de terminalStages`);
      }
      // Verificar que los estados terminales no permitan transiciones ordinarias
      for (const termStage of wf.terminalStages) {
        if (termStage === BankStage.STAGE_09_DISBURSED && wf.permittedTransitions[termStage]?.length > 0) {
          errors.push(`[${bankId}] STAGE_09_DISBURSED no debe admitir transiciones ordinarias de salida`);
        }
      }

      // Verificar que toda transición permitida tenga una regla de autorización asociada
      for (const [fromStageStr, toStages] of Object.entries(wf.permittedTransitions)) {
        const fromStage = fromStageStr as BankStage;
        for (const toStage of toStages) {
          const ruleExists = wf.transitionRules.some((r) => r.fromStage === fromStage && r.toStage === toStage);
          if (!ruleExists) {
            errors.push(`[${bankId}] Transición sin regla de autorización definida: de ${fromStage} a ${toStage}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
