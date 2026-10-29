import prisma from "../lib/prisma";

export interface ReconciliationReport {
  timestamp: string;
  isDryRun: boolean;
  legacyTables: {
    creditApplicationsCount: number;
    creditRequestsCount: number;
  };
  analysis: {
    uniqueDocuments: number;
    duplicateDocumentCandidates: Array<{
      documentNumber: string;
      occurrences: number;
      records: Array<{ source: string; id: string; name: string; email: string }>;
    }>;
    conflictingContacts: Array<{
      documentNumber: string;
      emails: string[];
      phones: string[];
    }>;
    orphanRecords: number;
  };
  backfillSummary: {
    clientsCreated: number;
    clientsExisting: number;
    applicationsCreated: number;
    applicantsCreated: number;
    bankApplicationsCreated: number;
    errors: string[];
  };
}

/**
 * FINTERA ENTERPRISE CRM — RECONCILIACIÓN Y MIGRACIÓN SEGURA DE DATOS LEGACY
 * Fase 6.1 (Gate B)
 *
 * Mapea registros existentes de 'credit_requests' y 'credit_applications' hacia el
 * modelo relacional canónico: Client -> CrmCreditApplication -> Applicant -> BankApplication.
 *
 * Modo de uso:
 * - npx tsx scripts/reconcile-legacy-data.ts            (Modo análisis / Dry Run)
 * - npx tsx scripts/reconcile-legacy-data.ts --execute (Modo aplicación idempotente)
 */
export async function runLegacyReconciliation(execute: boolean = false): Promise<ReconciliationReport> {
  console.log("===============================================================================");
  console.log(` FINTERA - RECONCILIACIÓN DE DATOS LEGACY [MODO: ${execute ? "EJECUCIÓN IDEMPOTENTE" : "DRY-RUN (ANÁLISIS)"}]`);
  console.log("===============================================================================\n");

  const report: ReconciliationReport = {
    timestamp: new Date().toISOString(),
    isDryRun: !execute,
    legacyTables: {
      creditApplicationsCount: 0,
      creditRequestsCount: 0,
    },
    analysis: {
      uniqueDocuments: 0,
      duplicateDocumentCandidates: [],
      conflictingContacts: [],
      orphanRecords: 0,
    },
    backfillSummary: {
      clientsCreated: 0,
      clientsExisting: 0,
      applicationsCreated: 0,
      applicantsCreated: 0,
      bankApplicationsCreated: 0,
      errors: [],
    },
  };

  try {
    // 1. Lectura de tablas legacy
    const legacyRequests = await prisma.creditRequest.findMany();
    const legacyApps = await prisma.legacyCreditApplication.findMany();

    report.legacyTables.creditRequestsCount = legacyRequests.length;
    report.legacyTables.creditApplicationsCount = legacyApps.length;

    console.log(`📊 Registros encontrados:`);
    console.log(`   - credit_requests: ${legacyRequests.length}`);
    console.log(`   - credit_applications: ${legacyApps.length}\n`);

interface LegacyRecordEntry {
  source: "credit_requests" | "credit_applications";
  id: string;
  docType: string;
  docNum: string;
  fullName: string;
  email: string;
  phone: string;
  raw: any;
}

    // 2. Mapa de agrupación por Documento
    const docMap = new Map<string, LegacyRecordEntry[]>();

    // Procesar credit_requests
    for (const req of legacyRequests) {
      const key = `${req.documentType}_${req.documentNumber}`;
      const entry: LegacyRecordEntry = {
        source: "credit_requests" as const,
        id: req.id,
        docType: req.documentType,
        docNum: req.documentNumber,
        fullName: `${req.firstName} ${req.secondName || ""} ${req.firstLastName} ${req.secondLastName || ""}`.replace(/\s+/g, " ").trim(),
        email: req.email.toLowerCase().trim(),
        phone: req.mobileNumber.trim(),
        raw: req,
      };

      if (!docMap.has(key)) {
        docMap.set(key, []);
      }
      docMap.get(key)!.push(entry);
    }

    // Procesar legacy credit_applications
    for (const app of legacyApps) {
      const key = `${app.documentType}_${app.documentNumber}`;
      const entry: LegacyRecordEntry = {
        source: "credit_applications" as const,
        id: app.id,
        docType: app.documentType,
        docNum: app.documentNumber,
        fullName: `${app.firstName} ${app.secondName || ""} ${app.firstLastName} ${app.secondLastName || ""}`.replace(/\s+/g, " ").trim(),
        email: app.email.toLowerCase().trim(),
        phone: app.phoneNumber.trim(),
        raw: app,
      };

      if (!docMap.has(key)) {
        docMap.set(key, []);
      }
      docMap.get(key)!.push(entry);
    }

    report.analysis.uniqueDocuments = docMap.size;

    // 3. Análisis de duplicados y conflictos de contacto
    for (const [key, records] of Array.from(docMap.entries())) {
      if (records.length > 1) {
        report.analysis.duplicateDocumentCandidates.push({
          documentNumber: key,
          occurrences: records.length,
          records: records.map((r: LegacyRecordEntry) => ({
            source: r.source,
            id: r.id,
            name: r.fullName,
            email: r.email,
          })),
        });

        const uniqueEmails: string[] = Array.from(new Set(records.map((r: LegacyRecordEntry) => r.email)));
        const uniquePhones: string[] = Array.from(new Set(records.map((r: LegacyRecordEntry) => r.phone)));

        if (uniqueEmails.length > 1 || uniquePhones.length > 1) {
          report.analysis.conflictingContacts.push({
            documentNumber: key,
            emails: uniqueEmails,
            phones: uniquePhones,
          });
        }
      }
    }

    console.log(`🔍 Análisis de Integridad:`);
    console.log(`   - Documentos únicos identificados: ${report.analysis.uniqueDocuments}`);
    console.log(`   - Candidatos con múltiples solicitudes: ${report.analysis.duplicateDocumentCandidates.length}`);
    console.log(`   - Conflictos de datos de contacto: ${report.analysis.conflictingContacts.length}\n`);

    // 4. Migración e Inserción Idempotente (Si execute === true)
    if (execute) {
      console.log(`⚙️  Iniciando migración relacional hacia CrmCreditApplication...`);

      for (const [key, records] of Array.from(docMap.entries())) {
        const primaryRecord = records[0]; // Registro base más reciente o prioritario
        const raw = primaryRecord.raw;

        // Upsert Client
        let client = await prisma.client.findUnique({
          where: {
            documentType_documentNumber: {
              documentType: primaryRecord.docType,
              documentNumber: primaryRecord.docNum,
            },
          },
        });

        if (!client) {
          client = await prisma.client.create({
            data: {
              documentType: primaryRecord.docType,
              documentNumber: primaryRecord.docNum,
              firstName: raw.firstName,
              secondName: raw.secondName || null,
              firstLastName: raw.firstLastName,
              secondLastName: raw.secondLastName || null,
              email: primaryRecord.email,
              phone: primaryRecord.phone,
              preferredContactMethods: raw.preferredContactMethods || ["whatsapp"],
              residenceCity: raw.residenceCity || "Bogotá",
              residenceDepartment: raw.residenceDepartment || "Cundinamarca",
              residenceAddress: raw.residenceAddress || "No registrada",
              isPEP: raw.isPEP || false,
            },
          });
          report.backfillSummary.clientsCreated++;
        } else {
          report.backfillSummary.clientsExisting++;
        }

        // Crear expediente CrmCreditApplication por cada registro histórico
        for (const rec of records) {
          const fileNumber = `FNT-LEGACY-${rec.raw.requestNumber || rec.id.slice(-6).toUpperCase()}`;

          // Validar si ya existe
          const existingApp = await prisma.crmCreditApplication.findUnique({
            where: { fileNumber },
          });

          if (!existingApp) {
            const requestedAmount = rec.raw.requestedAmount || 50000000;
            const termMonths = rec.raw.termMonths || 240;
            const category = Array.isArray(rec.raw.creditTypes) && rec.raw.creditTypes[0]?.toLowerCase().includes("leasing")
              ? "LEASING"
              : "VIVIENDA_NO_VIS";

            const newApp = await prisma.crmCreditApplication.create({
              data: {
                fileNumber,
                clientId: client.id,
                status: "LEAD_CAPTURED",
                productCategory: category,
                requestedAmount,
                termMonths,
                internalNotes: `Migrado automáticamente desde ${rec.source} (ID original: ${rec.id})`,
                customerVisibleNotes: "Solicitud registrada en plataforma previa.",
              },
            });
            report.backfillSummary.applicationsCreated++;

            // Crear Applicant principal
            await prisma.applicant.create({
              data: {
                applicationId: newApp.id,
                role: "PRIMARY_HOLDER",
                firstName: rec.raw.firstName,
                lastName: rec.raw.firstLastName,
                documentType: rec.docType,
                documentNumber: rec.docNum,
                email: rec.email,
                phone: rec.phone,
                monthlyIncome: rec.raw.monthlyIncome || 0,
                monthlyExpenses: rec.raw.monthlyExpenses || 0,
                totalAssets: rec.raw.totalAssets || 0,
                totalLiabilities: rec.raw.totalLiabilities || 0,
                occupation: rec.raw.occupation || "asalariado",
                companyName: rec.raw.companyName || null,
              },
            });
            report.backfillSummary.applicantsCreated++;

            // Crear BankApplication inicial
            await prisma.bankApplication.create({
              data: {
                applicationId: newApp.id,
                bankId: "banco-de-bogota", // Entidad aliada por defecto en legacy
                productType: "hipotecario-novis",
                stage: "STAGE_01_PRE_FILE",
                customerVisibleStage: "Expediente histórico transferido",
                customerVisible: true,
              },
            });
            report.backfillSummary.bankApplicationsCreated++;
          }
        }
      }

      console.log(`\n✅ MIGRACIÓN COMPLETADA SATISFACTORIAMENTE:`);
      console.log(`   - Clientes creados: ${report.backfillSummary.clientsCreated}`);
      console.log(`   - Clientes existentes preservados: ${report.backfillSummary.clientsExisting}`);
      console.log(`   - Expedientes canónicos creados: ${report.backfillSummary.applicationsCreated}`);
      console.log(`   - Titulares (Applicants) vinculados: ${report.backfillSummary.applicantsCreated}`);
      console.log(`   - Procesos bancarios creados: ${report.backfillSummary.bankApplicationsCreated}\n`);
    } else {
      console.log(`ℹ️  Modo Dry-Run: Base de datos no modificada. Para ejecutar, use --execute.\n`);
    }

    return report;
  } catch (error: any) {
    console.error("❌ Error en reconciliación:", error);
    report.backfillSummary.errors.push(error.message);
    return report;
  }
}

// Ejecución directa si se invoca desde CLI
if (require.main === module) {
  const isExecute = process.argv.includes("--execute");
  runLegacyReconciliation(isExecute)
    .then((rep) => {
      console.log("Resumen JSON:", JSON.stringify(rep, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
