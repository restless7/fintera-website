import prisma from "@/lib/prisma";
import { ALLIED_BANKS } from "./bank-configs";
import { BankId, BankMetadata, CreditProductType, BankDataSourceInfo } from "./types";

export interface UpdateRateParams {
  bankId: BankId;
  productType: CreditProductType;
  newRateEA: number;
  minRateEA?: number;
  maxRateEA?: number;
  sourceDocument: string;
  effectiveDate: string;
  version: string;
  changeReason: string;
  performedBy: string;
  requireApproval?: boolean;
}

export interface RollbackParams {
  bankId: BankId;
  productType: CreditProductType;
  targetVersion: string;
  rollbackReason: string;
  performedBy: string;
}

export interface PolicyValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * FASE 2: Servicio de Administración Dinámica de Tarifarios y Políticas Bancarias
 * Permite versionar, auditar y actualizar las tasas de las 8 entidades bancarias aliadas
 * con persistencia relacional en PostgreSQL (Prisma), validación del lado del servidor,
 * flujo de aprobación de cambios y fallback transparente debidamente rotulado.
 */
export class BankPolicyService {
  /**
   * Validación estricta del lado del servidor para parámetros financieros y regulatorios
   */
  static validatePolicyParams(params: Partial<UpdateRateParams>): PolicyValidationResult {
    const errors: string[] = [];

    if (!params.bankId || !ALLIED_BANKS[params.bankId]) {
      errors.push(`Entidad bancaria inválida o no aliada: ${params.bankId}`);
    }

    if (!params.productType) {
      errors.push("Tipo de producto crediticio requerido.");
    }

    if (typeof params.newRateEA !== "number" || isNaN(params.newRateEA)) {
      errors.push("La tasa Efectiva Anual (E.A.) debe ser un valor numérico válido.");
    } else {
      // Regla SFC: Tasa no puede ser negativa ni superar la tasa de usura referencial (35%)
      if (params.newRateEA < 0.05 || params.newRateEA > 0.35) {
        errors.push(`La tasa E.A. (${(params.newRateEA * 100).toFixed(2)}%) está fuera de los límites regulatorios permitidos (5.0% a 35.0%).`);
      }

      if (params.minRateEA !== undefined && params.newRateEA < params.minRateEA) {
        errors.push(`La tasa por defecto (${params.newRateEA}) no puede ser menor a la tasa mínima (${params.minRateEA}).`);
      }

      if (params.maxRateEA !== undefined && params.newRateEA > params.maxRateEA) {
        errors.push(`La tasa por defecto (${params.newRateEA}) no puede superar la tasa máxima permitida (${params.maxRateEA}).`);
      }
    }

    if (!params.sourceDocument || params.sourceDocument.trim().length < 5) {
      errors.push("Debe especificarse el documento bancario oficial de respaldo (mínimo 5 caracteres).");
    }

    if (!params.version || params.version.trim().length < 3) {
      errors.push("Identificador de versión requerido (ejemplo: '2026.11-V1').");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verificación de credenciales de autorización administrativa
   */
  static verifyAdminAuth(authHeader?: string | null): boolean {
    const configuredSecret = process.env.ADMIN_API_SECRET || "fintera_sec_admin_2026";
    if (!authHeader) return false;

    // Soporta Bearer token o header directo x-fintera-admin-key
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    return token === configuredSecret;
  }

  /**
   * Obtiene la configuración activa de un banco, distinguiendo explícitamente si proviene
   * de la base de datos PostgreSQL en vivo o de la biblioteca base certificada en contingencia.
   */
  static async getActiveBankConfig(bankId: BankId): Promise<BankMetadata> {
    const baseConfig = ALLIED_BANKS[bankId];
    if (!baseConfig) {
      throw new Error(`Entidad bancaria no parametrizada: ${bankId}`);
    }

    try {
      // Intentar leer políticas activas desde Prisma
      const dbPolicies = await prisma.bankPolicy.findMany({
        where: {
          bankId: bankId,
          status: "active",
        },
      });

      if (!dbPolicies || dbPolicies.length === 0) {
        return {
          ...baseConfig,
          dataSourceInfo: {
            dataSource: "certified-baseline-cache",
            isFallback: true,
            activeVersion: baseConfig.traceability.versionIdentifier,
            effectiveDate: baseConfig.traceability.effectiveDate,
            fallbackWarning: "Aviso: Sin políticas dinámicas en BD; operando con tarifario base certificado de biblioteca bancaria.",
          },
        };
      }

      // Clonar y sobrescribir con las políticas activas de la BD
      const mergedProducts = { ...baseConfig.products };
      for (const policy of dbPolicies) {
        const pType = policy.productType as CreditProductType;
        const existing = mergedProducts[pType];
        if (existing) {
          mergedProducts[pType] = {
            ...existing,
            interestRateEA: policy.defaultRateEA,
            minRateEA: policy.minRateEA,
            maxRateEA: policy.maxRateEA,
            maxLTV: policy.maxLtvPercent,
            maxDtiLimit: policy.maxDtiPercent,
          };
        }
      }

      return {
        ...baseConfig,
        products: mergedProducts,
        dataSourceInfo: {
          dataSource: "live-database",
          isFallback: false,
          activeVersion: dbPolicies[0]?.version || "DB-LATEST",
          effectiveDate: dbPolicies[0]?.effectiveDate || baseConfig.traceability.effectiveDate,
        },
      };
    } catch {
      // Desconexión de BD: Retornar fallback rotulado con advertencia explícita
      return {
        ...baseConfig,
        dataSourceInfo: {
          dataSource: "certified-baseline-cache",
          isFallback: true,
          activeVersion: baseConfig.traceability.versionIdentifier,
          effectiveDate: baseConfig.traceability.effectiveDate,
          fallbackWarning: "Aviso de contingencia: Base de datos no conectada. Operando con tarifario certificado de biblioteca bancaria.",
        },
      };
    }
  }

  /**
   * Obtiene el catálogo completo de las 8 entidades con información de trazabilidad de datos.
   */
  static async getAllActiveConfigs(): Promise<Record<BankId, BankMetadata>> {
    const bankIds = Object.keys(ALLIED_BANKS) as BankId[];
    const result: Record<BankId, BankMetadata> = {} as any;

    for (const bId of bankIds) {
      result[bId] = await this.getActiveBankConfig(bId);
    }

    return result;
  }

  /**
   * Actualiza la tasa y condiciones de un producto bancario creando una nueva versión auditable.
   */
  static async updateProductRate(params: UpdateRateParams) {
    const validation = this.validatePolicyParams(params);
    if (!validation.isValid) {
      throw new Error(`Error de validación financiera: ${validation.errors.join(" | ")}`);
    }

    const {
      bankId,
      productType,
      newRateEA,
      minRateEA,
      maxRateEA,
      sourceDocument,
      effectiveDate,
      version,
      changeReason,
      performedBy,
      requireApproval = false,
    } = params;

    const baseBank = ALLIED_BANKS[bankId];
    const baseProduct = baseBank.products[productType];
    if (!baseProduct) {
      throw new Error(`Producto ${productType} no soportado para el banco ${bankId}`);
    }

    // Buscar si ya existe una política activa
    const currentPolicy = await prisma.bankPolicy.findFirst({
      where: {
        bankId,
        productType,
        status: "active",
      },
    });

    const finalMinRate = minRateEA ?? baseProduct.minRateEA;
    const finalMaxRate = maxRateEA ?? baseProduct.maxRateEA;
    const policyStatus = requireApproval ? "pending_approval" : "active";

    // Transacción atómica
    return await prisma.$transaction(async (tx) => {
      // 1. Si no requiere aprobación y hay versión previa activa, archivarla y guardar snapshot
      if (!requireApproval && currentPolicy) {
        await tx.bankPolicy.update({
          where: { id: currentPolicy.id },
          data: { status: "archived" },
        });

        await tx.bankPolicyVersionHistory.create({
          data: {
            policyId: currentPolicy.id,
            version: currentPolicy.version,
            snapshot: currentPolicy as any,
            changeReason: `Reemplazada por versión ${version}: ${changeReason}`,
            changedBy: performedBy,
          },
        });
      }

      // 2. Crear la nueva política
      const newPolicy = await tx.bankPolicy.create({
        data: {
          bankId,
          productType,
          name: baseProduct.name,
          defaultRateEA: newRateEA,
          minRateEA: finalMinRate,
          maxRateEA: finalMaxRate,
          minTermMonths: baseProduct.minTermYears * 12,
          maxTermMonths: baseProduct.maxTermYears * 12,
          minAmount: baseProduct.minAmount,
          maxAmount: 2000000000,
          maxLtvPercent: baseProduct.maxLTV,
          requiresMortgage: productType !== "consumo-acabados",
          fngCommissionPercent: productType === "consumo-acabados" ? 0.025 : null,
          lifeInsuranceRateMonthly: baseBank.insurance.lifeRatePerMonth,
          fireInsuranceRateMonthly: baseBank.insurance.fireEarthquakeRatePerMonth,
          fireInsuranceBase: baseBank.insurance.fireInsuranceBase,
          regulatoryDtiBasis: baseProduct.dtiOrigin,
          maxDtiPercent: baseProduct.maxDtiLimit,
          sourceDocument,
          effectiveDate,
          version,
          status: policyStatus,
          approvedBy: requireApproval ? null : performedBy,
          approvedAt: requireApproval ? null : new Date(),
        },
      });

      // 3. Registrar en bitácora de auditoría
      await tx.policyAuditLog.create({
        data: {
          entityType: "BankPolicy",
          entityId: newPolicy.id,
          action: requireApproval ? "CREATE_DRAFT" : "UPDATE_RATE",
          performedBy,
          details: {
            bankId,
            productType,
            previousRateEA: currentPolicy?.defaultRateEA ?? baseProduct.interestRateEA,
            newRateEA,
            version,
            effectiveDate,
            sourceDocument,
            changeReason,
            status: policyStatus,
          },
        },
      });

      return newPolicy;
    });
  }

  /**
   * Aprueba formalmente una propuesta de tarifa pendiente
   */
  static async approvePolicy(policyId: string, approverName: string) {
    const draft = await prisma.bankPolicy.findUnique({
      where: { id: policyId },
    });

    if (!draft) {
      throw new Error(`Propuesta de política ${policyId} no encontrada`);
    }

    if (draft.status !== "pending_approval" && draft.status !== "draft") {
      throw new Error(`La política no está en estado pendiente de aprobación (Estado actual: ${draft.status})`);
    }

    return await prisma.$transaction(async (tx) => {
      // Archivar política activa actual de ese banco y producto
      const currentActive = await tx.bankPolicy.findFirst({
        where: {
          bankId: draft.bankId,
          productType: draft.productType,
          status: "active",
        },
      });

      if (currentActive) {
        await tx.bankPolicy.update({
          where: { id: currentActive.id },
          data: { status: "archived" },
        });

        await tx.bankPolicyVersionHistory.create({
          data: {
            policyId: currentActive.id,
            version: currentActive.version,
            snapshot: currentActive as any,
            changeReason: `Reemplazada tras aprobación de versión ${draft.version}`,
            changedBy: approverName,
          },
        });
      }

      // Activar la propuesta aprobada
      const activated = await tx.bankPolicy.update({
        where: { id: policyId },
        data: {
          status: "active",
          approvedBy: approverName,
          approvedAt: new Date(),
        },
      });

      // Auditoría
      await tx.policyAuditLog.create({
        data: {
          entityType: "BankPolicy",
          entityId: policyId,
          action: "APPROVE",
          performedBy: approverName,
          details: {
            approvedPolicyId: policyId,
            version: draft.version,
            defaultRateEA: draft.defaultRateEA,
          },
        },
      });

      return activated;
    });
  }

  /**
   * Revierte la tasa a una versión anterior registrada en el historial.
   */
  static async rollbackToVersion(params: RollbackParams) {
    const { bankId, productType, targetVersion, rollbackReason, performedBy } = params;

    const historyEntry = await prisma.bankPolicyVersionHistory.findFirst({
      where: {
        version: targetVersion,
        policy: {
          bankId,
          productType,
        },
      },
      include: {
        policy: true,
      },
    });

    if (!historyEntry) {
      throw new Error(`No se encontró la versión histórica ${targetVersion} para ${bankId} - ${productType}`);
    }

    const snapshot = historyEntry.snapshot as any;

    return await prisma.$transaction(async (tx) => {
      await tx.bankPolicy.updateMany({
        where: {
          bankId,
          productType,
          status: "active",
        },
        data: {
          status: "archived",
        },
      });

      const restoredPolicy = await tx.bankPolicy.create({
        data: {
          bankId,
          productType,
          name: snapshot.name,
          defaultRateEA: snapshot.defaultRateEA,
          minRateEA: snapshot.minRateEA,
          maxRateEA: snapshot.maxRateEA,
          minTermMonths: snapshot.minTermMonths,
          maxTermMonths: snapshot.maxTermMonths,
          minAmount: snapshot.minAmount,
          maxAmount: snapshot.maxAmount,
          maxLtvPercent: snapshot.maxLtvPercent,
          requiresMortgage: snapshot.requiresMortgage,
          fngCommissionPercent: snapshot.fngCommissionPercent,
          lifeInsuranceRateMonthly: snapshot.lifeInsuranceRateMonthly,
          fireInsuranceRateMonthly: snapshot.fireInsuranceRateMonthly,
          fireInsuranceBase: snapshot.fireInsuranceBase,
          regulatoryDtiBasis: snapshot.regulatoryDtiBasis,
          maxDtiPercent: snapshot.maxDtiPercent,
          sourceDocument: snapshot.sourceDocument,
          effectiveDate: snapshot.effectiveDate,
          version: `${targetVersion}-RESTORED`,
          status: "active",
          approvedBy: performedBy,
          approvedAt: new Date(),
        },
      });

      await tx.bankPolicyVersionHistory.create({
        data: {
          policyId: restoredPolicy.id,
          version: `${targetVersion}-RESTORED`,
          snapshot: restoredPolicy as any,
          changeReason: `Rollback ejecutado hacia versión ${targetVersion}: ${rollbackReason}`,
          changedBy: performedBy,
          isRollback: true,
          rollbackFromVersion: snapshot.version,
        },
      });

      await tx.policyAuditLog.create({
        data: {
          entityType: "BankPolicy",
          entityId: restoredPolicy.id,
          action: "ROLLBACK",
          performedBy,
          details: {
            bankId,
            productType,
            restoredToVersion: targetVersion,
            restoredRateEA: snapshot.defaultRateEA,
            rollbackReason,
          },
        },
      });

      return restoredPolicy;
    });
  }

  static async getAuditTrail(limit = 50) {
    try {
      return await prisma.policyAuditLog.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
      });
    } catch {
      return [];
    }
  }

  static async getVersionHistory(bankId: string, productType: string) {
    try {
      return await prisma.bankPolicyVersionHistory.findMany({
        where: {
          policy: {
            bankId,
            productType,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      return [];
    }
  }
}
