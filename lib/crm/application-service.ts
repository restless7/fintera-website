import prisma from "../prisma";
import { ApplicationStatus, BankStage, ApplicantRole, ConsentType } from "../../prisma/generated/client";
import { IdempotencyService } from "./idempotency-service";

export interface IntakeCoApplicantPayload {
  relationship: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  monthlyIncome: number;
  existingObligations?: number;
  occupation?: string;
  email?: string;
  phone?: string;
}

export interface CreditRequestIntakePayload {
  // Datos personales del titular
  documentType: string;
  documentNumber: string;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  residenceCity?: string;
  residenceDepartment?: string;
  residenceAddress?: string;
  birthDate?: string;
  monthlyIncome: number;
  monthlyExpenses?: number;
  existingFinancialObligations?: number;
  occupation?: string;
  companyName?: string;
  
  // Parámetros de crédito
  requestedAmount: number;
  termMonths: number;
  productCategory?: string; // "VIVIENDA_VIS" | "VIVIENDA_NO_VIS" | "LEASING" | "CONSUMO_ACABADOS" | "COLEX"
  propertyValue?: number;
  
  // Datos del simulador (si provienen del handoff)
  simulatedBankId?: string;
  simulatedProductType?: string;
  simulatedRateEA?: number;
  simulatedRateMV?: number;
  simulatedMonthlyPayment?: number;
  simulatedLifeInsurance?: number;
  simulatedFireInsurance?: number;
  simulatedDtiRatio?: number;
  simulatedGlobalDtiRatio?: number;
  policyVersion?: string;
  sourceDocument?: string;
  
  // Multisolicitante
  coApplicants?: IntakeCoApplicantPayload[];
  
  // Idempotencia transaccional (Remediation A)
  idempotencyKey?: string;

  // Metadatos de auditoría
  ipAddress?: string;
  userAgent?: string;
  consentHabeasData?: boolean;
}

export interface IntakeResult {
  success: boolean;
  applicationId: string;
  fileNumber: string;
  clientId: string;
  isExistingClient: boolean;
  isDuplicateRetry: boolean;
  status: ApplicationStatus;
  message: string;
}

export class ApplicationService {
  /**
   * Genera el siguiente identificador de radicado institucional (e.g. FNT-2026-00003)
   */
  static async generateFileNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await prisma.crmCreditApplication.count();
    const sequential = (count + 1).toString().padStart(5, "0");
    return `FNT-${currentYear}-${sequential}`;
  }

  /**
   * Ingesta y normaliza una solicitud de crédito desde el formulario o simulador público
   */
  static async intakeCreditRequest(payload: CreditRequestIntakePayload): Promise<IntakeResult> {
    // Normalizaciones básicas
    const docType = payload.documentType.trim().toUpperCase();
    const docNum = payload.documentNumber.trim();
    const email = payload.email.trim().toLowerCase();
    const phone = payload.phone.trim();
    const firstName = payload.firstName.trim();
    const firstLastName = payload.firstLastName.trim();
    const secondName = payload.secondName?.trim() || null;
    const secondLastName = payload.secondLastName?.trim() || null;
    const requestedAmount = Math.max(1000000, Number(payload.requestedAmount) || 50000000);
    const termMonths = Math.max(12, Number(payload.termMonths) || 240);
    const monthlyIncome = Math.max(100000, Number(payload.monthlyIncome) || 3000000);
    const obligations = Number(payload.existingFinancialObligations) || 0;

    // 1. Verificación de Idempotencia Robusta (Remediation A)
    const effectiveIdempotencyKey = payload.idempotencyKey || 
      `intent_${docType}_${docNum}_${requestedAmount}_${termMonths}_${Math.floor(Date.now() / (10 * 60 * 1000))}`;

    const idempotencyPayload: Record<string, unknown> = {
      docType,
      docNum,
      requestedAmount,
      termMonths,
      productCategory: payload.productCategory || "VIVIENDA_NO_VIS",
    };

    const idempotencyCheck = await IdempotencyService.checkOrAcquireKey({
      key: effectiveIdempotencyKey,
      payload: idempotencyPayload,
    });

    if (idempotencyCheck.isDuplicate && idempotencyCheck.cachedResponse) {
      return {
        ...(idempotencyCheck.cachedResponse as IntakeResult),
        isDuplicateRetry: true,
        message: "Solicitud idéntica detectada y enlazada al radicado existente (reintento idempotente)",
      };
    }

    // Detección de reintentos rápidos en ventana de 10 min si no se envía clave explícita
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingRecentApp = await prisma.crmCreditApplication.findFirst({
      where: {
        client: {
          documentType: docType,
          documentNumber: docNum,
        },
        requestedAmount,
        termMonths,
        createdAt: { gte: tenMinutesAgo },
      },
      include: { client: true },
    });

    if (existingRecentApp && !payload.idempotencyKey) {
      const duplicateRes: IntakeResult = {
        success: true,
        applicationId: existingRecentApp.id,
        fileNumber: existingRecentApp.fileNumber,
        clientId: existingRecentApp.clientId,
        isExistingClient: true,
        isDuplicateRetry: true,
        status: existingRecentApp.status,
        message: "Solicitud idéntica detectada y enlazada al radicado existente (reintento idempotente)",
      };
      await IdempotencyService.completeKey({
        key: effectiveIdempotencyKey,
        applicationId: existingRecentApp.id,
        responsePayload: duplicateRes as any,
      });
      return duplicateRes;
    }

    // 2. Transacción Atómica de Ingesta Canónica
    const result = await prisma.$transaction(async (tx) => {
      // 2.1 Upsert de Cliente Canónico
      let client = await tx.client.findUnique({
        where: {
          documentType_documentNumber: {
            documentType: docType,
            documentNumber: docNum,
          },
        },
      });

      const isExistingClient = !!client;

      if (!client) {
        client = await tx.client.create({
          data: {
            documentType: docType,
            documentNumber: docNum,
            firstName,
            secondName,
            firstLastName,
            secondLastName,
            email,
            phone,
            residenceCity: payload.residenceCity || "Bogotá D.C.",
            residenceDepartment: payload.residenceDepartment || "Cundinamarca",
            residenceAddress: payload.residenceAddress || "No suministrada",
            preferredContactMethods: ["WHATSAPP", "EMAIL", "PHONE"],
          },
        });
      } else {
        // Actualizar datos de contacto si cambiaron
        client = await tx.client.update({
          where: { id: client.id },
          data: {
            email,
            phone,
            residenceCity: payload.residenceCity || client.residenceCity,
          },
        });
      }

      // 2.2 Consentimiento Ley 1581 (Habeas Data)
      await tx.clientConsentRecord.create({
        data: {
          clientId: client.id,
          consentType: ConsentType.HABEAS_DATA_LEY_1581,
          ipAddress: payload.ipAddress || "127.0.0.1",
          userAgent: payload.userAgent || "Web Browser",
          version: "2026.V2",
        },
      });

      // 2.3 Generar File Number y Expediente Canónico
      const count = await tx.crmCreditApplication.count();
      const fileNumber = `FNT-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, "0")}`;

      const application = await tx.crmCreditApplication.create({
        data: {
          fileNumber,
          clientId: client.id,
          status: ApplicationStatus.LEAD_CAPTURED,
          productCategory: payload.productCategory || "VIVIENDA_NO_VIS",
          requestedAmount,
          termMonths,
          leadSource: "SIMULATOR_WEB",
          nextActionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Contacto inicial en 24h
          nextActionNote: "Contacto inicial de validación financiera por asesor comercial",
          internalNotes: `Lead capturado automáticamente desde simulador web. Banco prioritario sugerido: ${payload.simulatedBankId || "General"}.`,
        },
      });

      // 2.4 Crear Titular Principal (Applicant)
      await tx.applicant.create({
        data: {
          applicationId: application.id,
          role: ApplicantRole.PRIMARY_HOLDER,
          firstName,
          lastName: `${firstLastName} ${secondLastName || ""}`.trim(),
          documentType: docType,
          documentNumber: docNum,
          email,
          phone,
          monthlyIncome,
          monthlyExpenses: payload.monthlyExpenses || Math.round(monthlyIncome * 0.4),
          existingObligations: obligations,
          occupation: payload.occupation || "asalariado",
          companyName: payload.companyName || null,
        },
      });

      // 2.5 Crear Co-solicitantes si existen
      if (payload.coApplicants && payload.coApplicants.length > 0) {
        for (const co of payload.coApplicants) {
          await tx.applicant.create({
            data: {
              applicationId: application.id,
              role: ApplicantRole.CO_APPLICANT,
              firstName: co.firstName,
              lastName: co.lastName,
              documentType: co.documentType,
              documentNumber: co.documentNumber,
              email: co.email,
              phone: co.phone,
              monthlyIncome: co.monthlyIncome,
              monthlyExpenses: Math.round(co.monthlyIncome * 0.4),
              existingObligations: co.existingObligations || 0,
              occupation: co.occupation || "asalariado",
            },
          });
        }
      }

      // 2.6 Crear Sub-expediente bancario (BankApplication)
      const primaryBankId = payload.simulatedBankId || "bancolombia";
      await tx.bankApplication.create({
        data: {
          applicationId: application.id,
          bankId: primaryBankId,
          productType: payload.simulatedProductType || "hipotecario-novis",
          stage: BankStage.STAGE_01_PRE_FILE,
          version: 1,
          workflowVersion: primaryBankId === "bancolombia" ? "BCOL-2026.1" : `${primaryBankId.toUpperCase()}-2026.1`,
          customerVisibleStage: "En integración de documentos",
          customerVisible: true,
          notes: "Subexpediente preseleccionado por el usuario en simulador",
        },
      });

      // 2.7 Snapshot Inmutable de Simulación
      await tx.simulationSnapshot.create({
        data: {
          applicationId: application.id,
          simulatedBankId: primaryBankId,
          productType: payload.simulatedProductType || "hipotecario-novis",
          requestedAmount,
          propertyValue: payload.propertyValue || Math.round(requestedAmount / 0.7),
          termMonths,
          rateEA: payload.simulatedRateEA || 0.118,
          rateMV: payload.simulatedRateMV || 0.00933845,
          initialMonthlyBasePayment: Math.round(payload.simulatedMonthlyPayment ? payload.simulatedMonthlyPayment * 0.95 : requestedAmount * 0.0105),
          lifeInsuranceMonthly: payload.simulatedLifeInsurance || Math.round(requestedAmount * 0.0002),
          fireInsuranceMonthly: payload.simulatedFireInsurance || Math.round(requestedAmount * 0.00015),
          initialMonthlyTotalPayment: payload.simulatedMonthlyPayment || Math.round(requestedAmount * 0.011),
          dtiRatio: payload.simulatedDtiRatio || 0.25,
          globalDtiRatio: payload.simulatedGlobalDtiRatio || 0.35,
          existingObligations: obligations,
          policyVersion: payload.policyVersion || "2026.09.v1",
          sourceDocument: payload.sourceDocument || "Simulador Multibanco Fintera",
          effectiveDate: "2026-09-01",
        },
      });

      // 2.8 Actividad Inicial en Bitácora
      await tx.crmActivity.create({
        data: {
          applicationId: application.id,
          type: "STATUS_CHANGE",
          title: "Expediente Creado (LEAD_CAPTURED)",
          description: `Radicado institucional ${fileNumber} generado desde la web con monto $${requestedAmount.toLocaleString("es-CO")}.`,
          isInternalOnly: true,
          nextActionDate: application.nextActionDate,
        },
      });

      // 2.9 Registro Legacy en credit_requests para compatibilidad y auditoría
      try {
        await tx.creditRequest.create({
          data: {
            firstName,
            secondName,
            firstLastName,
            secondLastName,
            documentType: docType,
            documentNumber: docNum,
            documentIssuePlace: "Bogotá D.C.",
            documentIssueDate: new Date(),
            nationality: "Colombiana",
            birthCity: "Bogotá D.C.",
            birthDepartment: "Cundinamarca",
            birthDate: payload.birthDate ? new Date(payload.birthDate) : new Date("1990-01-01"),
            residenceCity: payload.residenceCity || "Bogotá D.C.",
            residenceDepartment: payload.residenceDepartment || "Cundinamarca",
            residenceAddress: payload.residenceAddress || "No suministrada",
            email,
            mobileNumber: phone,
            preferredContactMethods: ["WHATSAPP", "EMAIL"],
            gender: "M",
            occupation: payload.occupation || "Empleado",
            personalReferenceName: "Referencia Personal",
            personalReferenceCity: "Bogotá D.C.",
            personalReferenceDept: "Cundinamarca",
            personalReferencePhone: phone,
            familyReferenceName: "Referencia Familiar",
            familyReferenceCity: "Bogotá D.C.",
            familyReferenceDept: "Cundinamarca",
            familyReferencePhone: phone,
            declaresTaxes: true,
            monthlyIncome,
            monthlyExpenses: payload.monthlyExpenses || Math.round(monthlyIncome * 0.4),
            totalAssets: 0,
            totalLiabilities: obligations,
            paysTaxesAbroad: false,
            creditTypes: [payload.productCategory || "hipotecario-novis"],
            requestedAmount,
            termMonths,
            status: "submitted",
          },
        });
      } catch (legacyErr: any) {
        // Remediation B: Registrar necesidad de reconciliación en lugar de silenciar
        console.warn("[CRM Intake] Inserción legacy tolerada; registrando evento de reconciliación:", legacyErr.message);
        await tx.accessAuditEvent.create({
          data: {
            action: "LEGACY_PERSISTENCE_RECONCILIATION_REQUIRED",
            resourceType: "CreditRequest",
            applicationId: application.id,
            decision: "GRANTED",
            reason: `Falla en persistencia secundaria legacy: ${legacyErr.message}. SSOT Canónico asegurado.`,
            metadata: { error: legacyErr.message, fileNumber },
          },
        });
      }

      return {
        applicationId: application.id,
        fileNumber,
        clientId: client.id,
        isExistingClient,
        status: application.status,
      };
    });

    const finalResult: IntakeResult = {
      success: true,
      applicationId: result.applicationId,
      fileNumber: result.fileNumber,
      clientId: result.clientId,
      isExistingClient: result.isExistingClient,
      isDuplicateRetry: false,
      status: result.status,
      message: `Expediente ${result.fileNumber} creado exitosamente en el CRM operativo.`,
    };

    // Completar registro de idempotencia con respuesta definitiva
    await IdempotencyService.completeKey({
      key: effectiveIdempotencyKey,
      applicationId: result.applicationId,
      responsePayload: finalResult as any,
    });

    return finalResult;
  }
}
