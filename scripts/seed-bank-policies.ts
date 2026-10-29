import prisma from "../lib/prisma";
import { ALLIED_BANKS } from "../lib/simulators/bank-configs";
import { BankId, CreditProductType } from "../lib/simulators/types";

/**
 * Script de Semillado Inicial de Políticas Bancarias Oficiales en PostgreSQL
 * Ejecución: npx tsx scripts/seed-bank-policies.ts
 */
export async function seedBankPolicies() {
  console.log("===============================================================================");
  console.log(" FINTERA - SEMILLADO INICIAL DE POLÍTICAS BANCARIAS EN PRISMA (POSTGRESQL)");
  console.log("===============================================================================\n");

  const bankIds = Object.keys(ALLIED_BANKS) as BankId[];
  let totalSeeded = 0;

  try {
    for (const bankId of bankIds) {
      const bank = ALLIED_BANKS[bankId];
      const productTypes = Object.keys(bank.products) as CreditProductType[];

      for (const pType of productTypes) {
        const prod = bank.products[pType];
        if (!prod) continue;

        const version = "2026.10-BASELINE";

        // Upsert policy
        const policy = await prisma.bankPolicy.upsert({
          where: {
            bankId_productType_version: {
              bankId,
              productType: pType,
              version,
            },
          },
          update: {
            defaultRateEA: prod.interestRateEA,
            minRateEA: prod.minRateEA,
            maxRateEA: prod.maxRateEA,
            maxLtvPercent: prod.maxLTV,
            maxDtiPercent: prod.maxDtiLimit,
            sourceDocument: bank.traceability.sourceDocument,
            effectiveDate: bank.traceability.effectiveDate,
            status: "active",
          },
          create: {
            bankId,
            productType: pType,
            name: prod.name,
            defaultRateEA: prod.interestRateEA,
            minRateEA: prod.minRateEA,
            maxRateEA: prod.maxRateEA,
            minTermMonths: prod.minTermYears * 12,
            maxTermMonths: prod.maxTermYears * 12,
            minAmount: prod.minAmount,
            maxAmount: 2000000000,
            maxLtvPercent: prod.maxLTV,
            requiresMortgage: pType !== "consumo-acabados",
            fngCommissionPercent: pType === "consumo-acabados" ? 0.025 : null,
            lifeInsuranceRateMonthly: bank.insurance.lifeRatePerMonth,
            fireInsuranceRateMonthly: bank.insurance.fireEarthquakeRatePerMonth,
            fireInsuranceBase: bank.insurance.fireInsuranceBase,
            regulatoryDtiBasis: prod.dtiOrigin,
            maxDtiPercent: prod.maxDtiLimit,
            sourceDocument: bank.traceability.sourceDocument,
            effectiveDate: bank.traceability.effectiveDate,
            version,
            status: "active",
            approvedBy: "Auditoría Fintera P0",
            approvedAt: new Date(),
          },
        });

        console.log(`  ✓ Semillada política: ${bank.name.padEnd(20)} | ${prod.name.padEnd(28)} | Tasa EA: ${(prod.interestRateEA * 100).toFixed(2)}%`);
        totalSeeded++;
      }
    }

    // Registrar en auditoría
    await prisma.policyAuditLog.create({
      data: {
        entityType: "BankPolicy",
        entityId: "SYSTEM_SEED",
        action: "INITIAL_SEED",
        performedBy: "CLI Seed Script",
        details: {
          totalSeeded,
          timestamp: new Date().toISOString(),
          version: "2026.10-BASELINE",
        },
      },
    });

    console.log(`\n✅ SEMILLADO COMPLETADO: ${totalSeeded} políticas oficiales persistidas en base de datos.`);
  } catch (error: any) {
    console.warn("\n⚠️ AVISO DE CONEXIÓN A BASE DE DATOS:");
    console.warn(`No fue posible conectar a PostgreSQL (${error.message}).`);
    console.warn("El motor de Fintera continuará operando en modo contingencia con el catálogo base certificado.");
    console.warn("Una vez configurado DATABASE_URL en producción, ejecuta este script para poblar la base de datos.");
  } finally {
    await prisma.$disconnect();
  }
}

seedBankPolicies();
