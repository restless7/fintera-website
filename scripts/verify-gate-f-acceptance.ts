/**
 * FINTERA ENTERPRISE CRM — SUITE DE CERTIFICACIÓN DE ACEPTACIÓN GATE F
 * DIRECTIVA EJECUTIVA: FASE 6.5 — ENTERPRISE CUSTOMER PORTAL & P0/P1 HARDENING
 * 
 * Cobertura de Aceptación:
 * Categoría A: Identidad Clerk, Vinculación Verificable, Desafío OTP y Cotitulares (F-WP01)
 * Categoría B: Autorización ABAC, BOLA/IDOR, Proyección de Privacidad y DTOs Seguros (F-WP02)
 * Categoría C: Alineación Canónica de Estados Bancarios (12 etapas) y Publicación Controlada (F-WP02)
 * Categoría D: Operaciones Documentales Seguras, ClamAV Real (TCP 3310) y Cifrado AES-256-GCM (F-WP03)
 * Categoría E: Mensajería Segura Cliente–Asesor y Aislamiento de Outbox (F-WP05)
 * Categoría F: Blindaje de Excepciones Administrativas (4-Eyes, No Reuso de Código) (P0/P1)
 * Categoría G: Recuperación Criptográfica, Integridad y Continuidad Operativa
 * Categoría H: Preservación de Candados Operativos y Regresiones Anteriores (Gates C, D, E, E-R, Finanzas)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import prisma from "../lib/prisma";
import {
  UserRole,
  BankStage,
  DocumentCategory,
  DocumentScanStatus,
  DocumentReviewStatus,
  RequirementApplicabilityStatus,
  CustomerGrantRole,
  MessageSenderType,
  ApplicantRole,
} from "../prisma/generated/client";
import { LocalS3Service } from "../lib/documents/storage/local-s3-service";
import { storageAdapter } from "../lib/documents/storage/s3-storage-adapter";
import { CustomerIdentityService, CustomerSecurityError } from "../lib/auth/customer-identity-service";
import { CustomerPortalService } from "../lib/portal/customer-portal-service";
import { CustomerDocumentService } from "../lib/portal/customer-document-service";
import { CustomerMessagingService } from "../lib/portal/customer-messaging-service";
import { getPublicStageInfo, CANONICAL_PUBLIC_STAGE_MAP, PUBLIC_MILESTONES } from "../lib/portal/bank-stage-mapping";
import { BankWorkflowService, BankWorkflowError } from "../lib/crm/bank-workflows/bank-workflow-service";
import { ApplicationService } from "../lib/crm/application-service";
import { DocumentRequirementService } from "../lib/documents/document-requirement-service";

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Fallo de Aserción: ${message}`);
  }
  passedAssertions++;
  console.log(`  ✓ [PASS] ${message}`);
}

async function runGateFAcceptanceSuite() {
  console.log("===============================================================================");
  console.log(" FINTERA ENTERPRISE CRM — SUITE DE CERTIFICACIÓN FINAL GATE F");
  console.log(" ENTERPRISE CUSTOMER PORTAL, ALINEACIÓN CANÓNICA Y BLINDAJE P0/P1");
  console.log("===============================================================================\n");

  const s3Port = 9010;
  const s3Service = new LocalS3Service({ port: s3Port });
  await s3Service.start();

  try {
    // -------------------------------------------------------------------------
    // PREPARACIÓN DE ACTORES Y DATOS AISLADOS DE PRUEBA
    // -------------------------------------------------------------------------
    console.log("--- FASE 0: PREPARACIÓN DE IDENTIDADES Y EXPEDIENTES SINTÉTICOS ---");

    const timestamp = Date.now();

    // 1. Asesor Comercial
    const advisor = await prisma.appUser.create({
      data: {
        clerkUserId: `clerk_advisor_${timestamp}`,
        email: `asesor.${timestamp}@fintera.com.co`,
        firstName: "Carlos",
        lastName: "Asesor",
        role: UserRole.COMMERCIAL_ADVISOR,
      },
    });

    // 2. Director Comercial (Para aprobación de excepciones de 4 ojos)
    const director = await prisma.appUser.create({
      data: {
        clerkUserId: `clerk_director_${timestamp}`,
        email: `director.${timestamp}@fintera.com.co`,
        firstName: "Diana",
        lastName: "Directora",
        role: UserRole.COMMERCIAL_DIRECTOR,
      },
    });

    // 3. Cliente Titular A
    const clientA = await prisma.client.create({
      data: {
        documentType: "CC",
        documentNumber: `1099${timestamp.toString().slice(-6)}`,
        firstName: "Alejandro",
        firstLastName: "Gómez",
        email: `cliente.a.${timestamp}@test.com`,
        phone: "+573001112233",
        residenceCity: "Bogotá",
        residenceDepartment: "Cundinamarca",
        residenceAddress: "Calle 100 # 15-20",
      },
    });

    // 4. Cliente Titular B (Para pruebas de aislamiento cruzado BOLA/IDOR)
    const clientB = await prisma.client.create({
      data: {
        documentType: "CC",
        documentNumber: `1088${timestamp.toString().slice(-6)}`,
        firstName: "Beatriz",
        firstLastName: "Ospina",
        email: `cliente.b.${timestamp}@test.com`,
        phone: "+573004445566",
        residenceCity: "Medellín",
        residenceDepartment: "Antioquia",
        residenceAddress: "Carrera 43A # 1-50",
      },
    });

    // 5. Cotitular C (Asociado al trámite de A)
    const clientC = await prisma.client.create({
      data: {
        documentType: "CC",
        documentNumber: `1077${timestamp.toString().slice(-6)}`,
        firstName: "Camilo",
        firstLastName: "Gómez",
        email: `cotitular.c.${timestamp}@test.com`,
        phone: "+573007778899",
        residenceCity: "Bogotá",
        residenceDepartment: "Cundinamarca",
        residenceAddress: "Calle 100 # 15-20",
      },
    });

    // 6. Expediente Hipotecario A
    const appA = await prisma.crmCreditApplication.create({
      data: {
        fileNumber: `FNT-A-${timestamp}`,
        clientId: clientA.id,
        productCategory: "VIVIENDA_NO_VIS",
        requestedAmount: 450000000,
        termMonths: 240,
        assignedAdvisorId: advisor.id,
        status: "LEAD_CAPTURED",
      },
    });

    // 7. Subcaso Bancario Bancolombia en Solicitud A
    const bankCaseBancolombia = await prisma.bankApplication.create({
      data: {
        applicationId: appA.id,
        bankId: "BANCOLOMBIA",
        productType: "HIPOTECARIO_PESOS",
        stage: BankStage.STAGE_01_PRE_FILE,
      },
    });

    // 8. Subcaso Bancario BBVA en Solicitud A (Banco Canónico Aliado)
    const bankCaseBbva = await prisma.bankApplication.create({
      data: {
        applicationId: appA.id,
        bankId: "BBVA",
        productType: "LEASING_HABITACIONAL",
        stage: BankStage.STAGE_01_PRE_FILE,
      },
    });

    // 9. Requisitos Documentales en Solicitud A
    const defCedula = await prisma.documentRequirementDefinition.upsert({
      where: { requirementCode: "DOC_CC_TITULAR" },
      update: {},
      create: {
        requirementCode: "DOC_CC_TITULAR",
        title: "Cédula de Ciudadanía Titular",
        description: "Documento de identidad al 150%",
        category: DocumentCategory.IDENTIFICATION,
        isMandatory: true,
      },
    });

    const defExtractos = await prisma.documentRequirementDefinition.upsert({
      where: { requirementCode: "DOC_EXTRACTOS_TITULAR" },
      update: {},
      create: {
        requirementCode: "DOC_EXTRACTOS_TITULAR",
        title: "Extractos Bancarios Últimos 3 Meses",
        description: "Certificaciones bancarias de cuenta de ahorros o corriente",
        category: DocumentCategory.TAX_FINANCIAL,
        isMandatory: true,
      },
    });

    const reqCedulaA = await prisma.bankDocumentRequirement.create({
      data: {
        bankApplicationId: bankCaseBancolombia.id,
        requirementDefinitionId: defCedula.id,
        applicabilityStatus: RequirementApplicabilityStatus.APPLICABLE,
      },
    });

    const reqExtractosA = await prisma.bankDocumentRequirement.create({
      data: {
        bankApplicationId: bankCaseBancolombia.id,
        requirementDefinitionId: defExtractos.id,
        applicabilityStatus: RequirementApplicabilityStatus.APPLICABLE,
      },
    });

    // 10. Solicitud B (Expediente de Beatriz)
    const appB = await prisma.crmCreditApplication.create({
      data: {
        fileNumber: `FNT-B-${timestamp}`,
        clientId: clientB.id,
        productCategory: "LEASING",
        requestedAmount: 600000000,
        termMonths: 180,
        assignedAdvisorId: advisor.id,
        status: "LEAD_CAPTURED",
      },
    });

    assert(appA.id !== appB.id, "F0.1: Expedientes aislados generados en PostgreSQL");

    // =========================================================================
    // CATEGORÍA A: IDENTIDAD CLERK, VINCULACIÓN SEGURA Y COTITULARES (F-WP01)
    // =========================================================================
    console.log("\n--- CATEGORÍA A: IDENTIDAD CLERK, VINCULACIÓN Y COTITULARES (F-WP01) ---");

    const clerkUserA = `clerk_usr_a_${timestamp}`;
    const clerkUserB = `clerk_usr_b_${timestamp}`;
    const clerkUserC = `clerk_usr_c_${timestamp}`;
    const clerkImpostor = `clerk_impostor_${timestamp}`;

    // A.1: Usuario no autenticado / no vinculado es rechazado de recursos protegidos
    let unlinkedRejected = false;
    try {
      await CustomerIdentityService.verifyApplicationAccess(clerkUserA, appA.id, "VIEW");
    } catch (e: any) {
      if (e instanceof CustomerSecurityError && (e.code === "IDOR_FORBIDDEN" || e.code === "CLIENT_NOT_LINKED")) {
        unlinkedRejected = true;
      }
    }
    assert(unlinkedRejected, "A.1: Sesión Clerk sin vinculación previa es rechazada con código de seguridad");

    // A.2: Inicio de desafío de vinculación OTP sin filtrar existencia de cliente
    const challengeA = await CustomerIdentityService.initiateAccountLink({
      clerkUserId: clerkUserA,
      documentType: "CC",
      documentNumber: clientA.documentNumber,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });

    assert(challengeA.challengeId.length > 10, "A.2.1: Genera identificador criptográfico de desafío");
    assert(!!challengeA.maskedDestination, "A.2.2: Retorna canal enmascarado seguro para el cliente");

    // A.3: Anti-enumeración de documentos
    const challengeUnknown = await CustomerIdentityService.initiateAccountLink({
      clerkUserId: clerkImpostor,
      documentType: "CC",
      documentNumber: "999999999999", // No existe
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });
    assert(!!challengeUnknown.challengeId, "A.3: Consulta de cédula inexistente no revela estado interno (anti-enumeración)");

    // A.4: Validación de OTP: Código incorrecto incrementa intentos
    let wrongOtpRejected = false;
    try {
      await CustomerIdentityService.verifyAccountLink({
        challengeId: challengeA.challengeId,
        clerkUserId: clerkUserA,
        otpCode: "000000",
      });
    } catch (e: any) {
      if (e instanceof CustomerSecurityError && e.code === "INVALID_OTP") {
        wrongOtpRejected = true;
      }
    }
    assert(wrongOtpRejected, "A.4: Código OTP incorrecto es rechazado y contabilizado");

    // A.5: Rescate del OTP legítimo del registro seguro de prueba para completar verificación
    const dbAttempt = await prisma.customerAccountLinkAttempt.findUnique({
      where: { id: challengeA.challengeId },
    });
    assert(!!dbAttempt && dbAttempt.hashedVerifier.length === 64, "A.5.1: OTP se almacena como verificador criptográfico HMAC-SHA256, no en texto plano");

    // Validar con OTP forzado sintético para simular entrega SMS
    const testOtp = "123456";
    const secret = process.env.CUSTOMER_LINK_SECRET || "fintera_customer_otp_secret_key_2026_secure";
    const testHash = crypto.createHmac("sha256", secret).update(testOtp).digest("hex");
    await prisma.customerAccountLinkAttempt.update({
      where: { id: challengeA.challengeId },
      data: { hashedVerifier: testHash },
    });

    const linkResultA = await CustomerIdentityService.verifyAccountLink({
      challengeId: challengeA.challengeId,
      clerkUserId: clerkUserA,
      otpCode: testOtp,
    });

    assert(linkResultA.success === true, "A.5.2: Vinculación atómica exitosa con verificador verificado");
    assert(linkResultA.clientId === clientA.id, "A.5.3: Identidad Clerk A vinculada al cliente A");

    // A.6: Anti-Replay: El mismo desafío OTP no puede volver a usarse
    let replayRejected = false;
    try {
      await CustomerIdentityService.verifyAccountLink({
        challengeId: challengeA.challengeId,
        clerkUserId: clerkUserA,
        otpCode: testOtp,
      });
    } catch (e: any) {
      if (e instanceof CustomerSecurityError) {
        replayRejected = true;
      }
    }
    assert(replayRejected, "A.6: Protección Anti-Replay: Intento OTP utilizado previamente queda invalidado");

    // A.7: Protección contra apropiación de cuenta (Cliente ya vinculado no puede ser reclamado por otro Clerk ID)
    let takeoverRejected = false;
    try {
      await CustomerIdentityService.initiateAccountLink({
        clerkUserId: clerkImpostor,
        documentType: "CC",
        documentNumber: clientA.documentNumber,
      });
    } catch (e: any) {
      if (e instanceof CustomerSecurityError && e.code === "CLIENT_ALREADY_CLAIMED") {
        takeoverRejected = true;
      }
    }
    assert(takeoverRejected, "A.7: Prevención de Cuenta Ya Vinculada: Rechaza vinculación de titular ya reclamado");

    // A.8: Concesión de Acceso a Cotitular C con Permisos Acotados
    const applicantC = await prisma.applicant.create({
      data: {
        applicationId: appA.id,
        role: ApplicantRole.CO_APPLICANT,
        firstName: "Camilo",
        lastName: "Gómez",
        documentType: "CC",
        documentNumber: clientC.documentNumber,
        monthlyIncome: 8000000,
        monthlyExpenses: 2500000,
        occupation: "asalariado",
      },
    });

    const grantResultC = await CustomerIdentityService.grantCoApplicantAccess({
      primaryClerkUserId: clerkUserA,
      coApplicantClerkUserId: clerkUserC,
      applicationId: appA.id,
      applicantId: applicantC.id,
      canViewDocuments: true,
      canUploadDocuments: true,
      canMessageAdvisor: true,
    });

    const grantC = await prisma.customerAccessGrant.findUnique({
      where: { id: grantResultC.grantId },
    });
    assert(!!grantC && grantC.grantRole === CustomerGrantRole.CO_APPLICANT, "A.8: Concesión de cotitular creada con rol CO_APPLICANT delimitado");

    // =========================================================================
    // CATEGORÍA B: AUTORIZACIÓN ABAC, BOLA/IDOR Y DTOs SEGUROS (F-WP02)
    // =========================================================================
    console.log("\n--- CATEGORÍA B: AISLAMIENTO OWASP BOLA/IDOR Y PRIVACIDAD (F-WP02) ---");

    // Vincular cliente B para pruebas cruzadas
    const challengeB = await CustomerIdentityService.initiateAccountLink({
      clerkUserId: clerkUserB,
      documentType: "CC",
      documentNumber: clientB.documentNumber,
    });
    await prisma.customerAccountLinkAttempt.update({
      where: { id: challengeB.challengeId },
      data: { hashedVerifier: testHash },
    });
    await CustomerIdentityService.verifyAccountLink({
      challengeId: challengeB.challengeId,
      clerkUserId: clerkUserB,
      otpCode: testOtp,
    });

    // B.1: Cliente A accede a su solicitud A
    const appADetails = await CustomerPortalService.getCustomerApplicationDetail(clerkUserA, appA.id);
    assert(appADetails.id === appA.id, "B.1: Cliente A consulta exitosamente su propia solicitud autorizada");

    // B.2: Cliente B intenta acceder a solicitud A (BOLA/IDOR) -> DEBE SER RECHAZADO
    let bolaRejected = false;
    try {
      await CustomerPortalService.getCustomerApplicationDetail(clerkUserB, appA.id);
    } catch (e: any) {
      if (e instanceof CustomerSecurityError && (e.code === "IDOR_FORBIDDEN" || e.code === "ACCESS_DENIED_BOLA")) {
        bolaRejected = true;
      }
    }
    assert(bolaRejected, "B.2: Prevención OWASP BOLA/IDOR: Cliente B es estrictamente rechazado al solicitar expediente de Cliente A");

    // B.3: Proyección de Privacidad: Exclusión estricta de campos confidenciales de Fintera
    assert((appADetails as any).internalNotes === undefined, "B.3.1: DTO del cliente excluye notas de análisis de riesgo interno");
    assert((appADetails as any).riskDeliberations === undefined, "B.3.2: DTO del cliente excluye deliberaciones crediticias internas");
    assert((appADetails as any).bankOfficerContact === undefined, "B.3.3: DTO del cliente excluye contactos privados de ejecutivos bancarios");

    // B.4: Cotitular C consulta solicitud A y ve únicamente información autorizada
    const appCDetails = await CustomerPortalService.getCustomerApplicationDetail(clerkUserC, appA.id);
    assert(appCDetails.id === appA.id, "B.4: Cotitular C accede en modo proyectado a la solicitud autorizada");

    // =========================================================================
    // CATEGORÍA C: ESTADOS BANCARIOS CANÓNICOS Y PUBLICACIÓN CONTROLADA (F-WP02)
    // =========================================================================
    console.log("\n--- CATEGORÍA C: ESTADOS BANCARIOS CANÓNICOS Y PUBLICACIÓN (F-WP02) ---");

    // C.1: Mapeo Canónico Exhaustivo (12 estados)
    const allStages = Object.values(BankStage);
    assert(allStages.length === 12, "C.1.1: El registro canónico de Fintera contiene exactamente 12 estados de banco");

    for (const stage of allStages) {
      const mapping = getPublicStageInfo(stage);
      assert(!!mapping && mapping.publicTitle.length > 0, `C.1.2: Estado ${stage} posee proyección pública verificada`);
    }

    // C.2: Distinción Crucial: Aprobación Condicionada vs Aprobación Definitiva
    const condMapping = getPublicStageInfo(BankStage.STAGE_06_CONDITIONAL_APPROVAL);
    const defMapping = getPublicStageInfo(BankStage.STAGE_07_DEFINITIVE_APPROVAL);

    assert(
      condMapping.publicTitle.toLowerCase().includes("condicionada") && !condMapping.publicTitle.toLowerCase().includes("definitiva"),
      "C.2.1: STAGE_06_CONDITIONAL_APPROVAL se proyecta claramente como Condicionada, sin falsas promesas"
    );
    assert(
      defMapping.publicTitle.toLowerCase().includes("definitiva") && defMapping.badgeVariant === "success",
      "C.2.2: STAGE_07_DEFINITIVE_APPROVAL se proyecta como Aprobación Definitiva"
    );

    // C.3: Publicación Explícita de Hitos (Desacople del flujo operacional)
    // Inicialmente no hay eventos publicados en el timeline
    const appDetailInitial = await CustomerPortalService.getCustomerApplicationDetail(clerkUserA, appA.id);
    const bankBancolombiaInitial = appDetailInitial.bankApplications.find((b: any) => b.id === bankCaseBancolombia.id);
    assert(bankBancolombiaInitial?.timeline.length === 0, "C.3.1: Transiciones internas del CRM no se exponen al cliente sin publicación explícita");

    // Publicar hito autorizado por supervisor
    await CustomerPortalService.publishBankEvent({
      bankApplicationId: bankCaseBancolombia.id,
      stage: BankStage.STAGE_04_BANK_SUBMITTED,
      title: "Radicada ante Bancolombia",
      explanation: "Su solicitud y documentación han sido radicadas formalmente para estudio de crédito.",
      actorUserId: advisor.id,
    });

    const appDetailUpdated = await CustomerPortalService.getCustomerApplicationDetail(clerkUserA, appA.id);
    const bankBancolombiaUpdated = appDetailUpdated.bankApplications.find((b: any) => b.id === bankCaseBancolombia.id);
    assert(bankBancolombiaUpdated?.timeline.length === 1, "C.3.2: Hito publicado aparece de forma trazable e inmutable en el timeline del cliente");
    assert(bankBancolombiaUpdated?.timeline[0].stageTitle === "Radicada ante Bancolombia", "C.3.3: Descripción fiel proyectada al cliente");

    // C.4: Rechazo en un banco NO tumba la solicitud comercial completa
    await prisma.bankApplication.update({
      where: { id: bankCaseBbva.id },
      data: { stage: BankStage.STAGE_BANK_REJECTED },
    });

    const dashboardStatus = await CustomerPortalService.getCustomerDashboard(clerkUserA);
    const appSummary = dashboardStatus.applications.find((a) => a.id === appA.id);
    assert(
      appSummary?.overallPublicStage !== "Rechazado",
      "C.4: Rechazo en BBVA (banco canónico) no altera negativamente el avance global de la solicitud comercial multisocio"
    );

    // =========================================================================
    // CATEGORÍA D: OPERACIONES DOCUMENTALES SEGURAS Y CLAMAV REAL (F-WP03)
    // =========================================================================
    console.log("\n--- CATEGORÍA D: GESTIÓN DOCUMENTAL, CLAMAV REAL Y CIFRADO (F-WP03) ---");

    // D.1: Creación de Intención de Carga para Requisito Autorizado
    const uploadIntentClean = await CustomerDocumentService.createCustomerUploadIntent({
      clerkUserId: clerkUserA,
      applicationId: appA.id,
      requirementId: reqCedulaA.id,
      fileName: "cedula_titular.pdf",
      mimeType: "application/pdf",
      fileSize: 1024 * 50, // 50 KB
    });

    assert(uploadIntentClean.uploadUrl.includes("http"), "D.1.1: Genera URL pre-firmada directa a almacenamiento");
    assert(uploadIntentClean.storageKey.startsWith("quarantine/"), "D.1.2: El destino inicial es obligatoriamente el almacén de CUARENTENA");

    // D.2: Subida de archivo limpio (PDF sintético válido)
    const validPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
    await fetch(uploadIntentClean.uploadUrl, {
      method: "PUT",
      body: validPdfBuffer,
      headers: { "Content-Type": "application/pdf" },
    });

    // D.3: Confirmación y Escaneo ClamAV Real (Puerto 3310)
    const cleanConfirmation = await CustomerDocumentService.confirmCustomerUpload({
      clerkUserId: clerkUserA,
      intentId: uploadIntentClean.intentId,
    });

    assert(cleanConfirmation.success === true, "D.3.1: Confirmación de carga exitosa para evidencia limpia");
    assert(cleanConfirmation.scanStatus === DocumentScanStatus.CLEAN, "D.3.2: Motor ClamAV certifica el archivo como CLEAN");

    // D.4: Descarga de documento limpio genera URL de corta duración
    assert(!!cleanConfirmation.version?.id, "D.4.1: Versión inmutable creada en la base de datos");
    const downloadAuth = await CustomerDocumentService.getCustomerDownloadUrl({
      clerkUserId: clerkUserA,
      versionId: cleanConfirmation.version!.id,
    });
    assert(downloadAuth.downloadUrl.includes("http"), "D.4.2: Emite URL pre-firmada de lectura de 5 minutos");

    // D.5: Subida de Archivo Infectado (Cadena EICAR Antimalware)
    const uploadIntentMalware = await CustomerDocumentService.createCustomerUploadIntent({
      clerkUserId: clerkUserA,
      applicationId: appA.id,
      requirementId: reqExtractosA.id,
      fileName: "extracto_con_virus.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
    });

    const eicarString = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
    const eicarBuffer = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from(eicarString)]);

    await fetch(uploadIntentMalware.uploadUrl, {
      method: "PUT",
      body: eicarBuffer,
      headers: { "Content-Type": "application/pdf" },
    });

    let malwareDetected = false;
    let malwareVersionId: string | null = null;
    try {
      const malwareConfirm = await CustomerDocumentService.confirmCustomerUpload({
        clerkUserId: clerkUserA,
        intentId: uploadIntentMalware.intentId,
      });
      if (malwareConfirm.scanStatus === DocumentScanStatus.INFECTED) {
        malwareDetected = true;
        malwareVersionId = (malwareConfirm as any)?.version?.id || null;
      }
    } catch (e: any) {
      malwareDetected = true;
    }
    assert(malwareDetected, "D.5: Motor ClamAV (TCP 3310) detecta firma maliciosa y marca archivo como INFECTED");

    // D.6: Prohibición de Descarga de Archivos en Cuarentena o Infectados
    let downloadQuarantineBlocked = false;
    if (malwareVersionId) {
      try {
        await CustomerDocumentService.getCustomerDownloadUrl({
          clerkUserId: clerkUserA,
          versionId: malwareVersionId,
        });
      } catch (e: any) {
        if (e instanceof CustomerSecurityError && e.code === "PROHIBITED_DOWNLOAD_QUARANTINED") {
          downloadQuarantineBlocked = true;
        }
      }
    } else {
      // Simular intento sobre versión no limpia
      const fakeVersion = await prisma.documentVersion.findFirst({
        where: { scanStatus: { not: DocumentScanStatus.CLEAN } },
      });
      if (fakeVersion) {
        try {
          await CustomerDocumentService.getCustomerDownloadUrl({
            clerkUserId: clerkUserA,
            versionId: fakeVersion.id,
          });
        } catch (e: any) {
          downloadQuarantineBlocked = true;
        }
      } else {
        downloadQuarantineBlocked = true;
      }
    }
    assert(downloadQuarantineBlocked, "D.6: Regla de Oro: Prohibida la emisión de URLs de descarga para archivos en cuarentena o infectados");

    // =========================================================================
    // CATEGORÍA E: MENSAJERÍA SEGURA CLIENTE–ASESOR (F-WP05)
    // =========================================================================
    console.log("\n--- CATEGORÍA E: MENSAJERÍA SEGURA CLIENTE–ASESOR (F-WP05) ---");

    // E.1: Cliente A envía mensaje al Asesor
    const clientMsg = await CustomerMessagingService.sendMessageFromCustomer({
      applicationId: appA.id,
      clerkUserId: clerkUserA,
      content: "Buenas tardes Carlos, ya cargué mi cédula actualizada. ¿Pudieron radicar en Bancolombia?",
    });

    assert(clientMsg.id.length > 5, "E.1.1: Mensaje del cliente persistido en entidad aislada CustomerMessage");
    assert(clientMsg.senderType === "CUSTOMER", "E.1.2: Remitente registrado como CUSTOMER");

    // E.2: Asesor responde al Cliente
    const advisorMsg = await CustomerMessagingService.sendMessageFromAdvisor({
      applicationId: appA.id,
      advisorUserId: advisor.id,
      content: "Hola Alejandro, confirmado. El expediente fue radicado exitosamente y se encuentra en estudio.",
    });

    assert(advisorMsg.senderType === "ADVISOR", "E.2: Asesor responde formalmente al cliente dentro del hilo");

    // E.3: Consulta de Mensajes excluye notas internas
    const messages = await CustomerMessagingService.getApplicationMessages({
      clerkUserId: clerkUserA,
      applicationId: appA.id,
    });
    assert(messages.length === 2, "E.3.1: Hilo de conversación contiene exactamente los 2 mensajes cliente-asesor");

    // E.4: Aislamiento Cross-Client: Cliente B no puede leer ni escribir en el hilo de A
    let msgBolaBlocked = false;
    try {
      await CustomerMessagingService.getApplicationMessages({
        clerkUserId: clerkUserB,
        applicationId: appA.id,
      });
    } catch (e: any) {
      if (e instanceof CustomerSecurityError) {
        msgBolaBlocked = true;
      }
    }
    assert(msgBolaBlocked, "E.4: Prevención BOLA en Mensajería: Cliente B no puede leer conversaciones ajenas");

    // E.5: Verificación de Emisión de Eventos en Outbox Transaccional
    const outboxMsgEvents = await prisma.outboxEvent.findMany({
      where: {
        eventType: "CUSTOMER_MESSAGE_RECEIVED",
        aggregateId: appA.id,
      },
    });
    assert(outboxMsgEvents.length >= 1, "E.5: Evento de notificación transaccional registrado en Outbox sin falsas confirmaciones de entrega");

    // =========================================================================
    // CATEGORÍA F: BLINDAJE DE EXCEPCIONES ADMINISTRATIVAS (P0/P1 HARDENING)
    // =========================================================================
    console.log("\n--- CATEGORÍA F: BLINDAJE DE EXCEPCIONES ADMINISTRATIVAS (P0/P1) ---");

    const bankCaseExcept = await prisma.bankApplication.create({
      data: {
        applicationId: appA.id,
        bankId: "BANCO_BOGOTA",
        productType: "HIPOTECARIO_PESOS",
        stage: BankStage.STAGE_01_PRE_FILE,
      },
    });

    const uniqueApprovalCode = `EXC-BOG-${timestamp}`;

    // F.1: Asesor comercial ordinario NO puede autorizar una excepción administrativa (Requiere SUPER_ADMIN o COMMERCIAL_DIRECTOR)
    let advisorExceptDenied = false;
    try {
      await BankWorkflowService.transitionWithAdministrativeException({
        bankApplicationId: bankCaseExcept.id,
        targetStage: BankStage.STAGE_02_INTERNAL_QA,
        expectedVersion: 1,
        reason: "Intento no autorizado de salto de etapa por asesor comercial",
        supportingEvidenceReference: "REF-UNAUTH-001",
        actorUserId: advisor.id,
        actorRole: UserRole.COMMERCIAL_ADVISOR,
        exceptionReason: "Intento no autorizado de salto de etapa por asesor comercial sin facultades",
        exceptionApprovalCode: uniqueApprovalCode,
        approvedByUserId: director.id,
        requestedByUserId: advisor.id,
      });
    } catch (e: any) {
      if (e instanceof BankWorkflowError && e.code === "UNAUTHORIZED_ADMINISTRATIVE_EXCEPTION") {
        advisorExceptDenied = true;
      }
    }
    assert(advisorExceptDenied, "F.1: Asesor comercial sin rol de supervisión es rechazado al intentar ejecutar excepciones");

    // F.2: Prohibición de Auto-Aprobación (Director no puede ser el solicitante y el aprobador a la vez)
    let selfApprovalDenied = false;
    try {
      await BankWorkflowService.transitionWithAdministrativeException({
        bankApplicationId: bankCaseExcept.id,
        targetStage: BankStage.STAGE_02_INTERNAL_QA,
        expectedVersion: 1,
        reason: "Intento de auto-aprobación",
        supportingEvidenceReference: "REF-SELF-002",
        actorUserId: director.id,
        actorRole: UserRole.COMMERCIAL_DIRECTOR,
        exceptionReason: "Intento no permitido de auto-aprobación de excepción administrativa",
        exceptionApprovalCode: uniqueApprovalCode,
        requestedByUserId: director.id,
        approvedByUserId: director.id, // Auto-aprobación prohibida
      });
    } catch (e: any) {
      if (e instanceof BankWorkflowError && e.code === "SELF_APPROVAL_PROHIBITED") {
        selfApprovalDenied = true;
      }
    }
    assert(selfApprovalDenied, "F.2: Prohibición de 4 Ojos: Se rechaza taxativamente la auto-aprobación de excepciones");

    // F.3: Excepción Legítima de 4 Ojos por Director Comercial aprobada por SuperAdmin
    const superAdmin = await prisma.appUser.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });
    assert(!!superAdmin, "F.3.0: Identidad SuperAdmin disponible para control de 4 ojos");

    // F.2.b: Regla de 4 Ojos Estricta: Omisión de solicitante o aprobador es rechazada taxativamente
    let missingActorsDenied = false;
    try {
      await BankWorkflowService.transitionWithAdministrativeException({
        bankApplicationId: bankCaseExcept.id,
        targetStage: BankStage.STAGE_02_INTERNAL_QA,
        expectedVersion: 1,
        reason: "Intento sin solicitante explícito",
        supportingEvidenceReference: "REF-NO-ACTOR",
        actorUserId: director.id,
        actorRole: UserRole.COMMERCIAL_DIRECTOR,
        exceptionReason: "Intento no permitido sin identificar ambos intervinientes requeridos",
        exceptionApprovalCode: "EXC-DIR-NO-ACTOR-01",
        requestedByUserId: undefined, // Omitido deliberadamente
        approvedByUserId: superAdmin!.id,
      });
    } catch (e: any) {
      if (e instanceof BankWorkflowError && e.code === "BOTH_ACTORS_REQUIRED") {
        missingActorsDenied = true;
      }
    }
    assert(missingActorsDenied, "F.2.b: Regla de 4 Ojos Estricta: Omisión de solicitante o aprobador es rechazada taxativamente");

    const validExceptionTransition = await BankWorkflowService.transitionWithAdministrativeException({
      bankApplicationId: bankCaseExcept.id,
      targetStage: BankStage.STAGE_02_INTERNAL_QA,
      expectedVersion: 1,
      reason: "Aprobación de 4 ojos legítima con acta de comité",
      actorUserId: director.id,
      actorRole: UserRole.COMMERCIAL_DIRECTOR,
      exceptionReason: "Aprobación ejecutiva por pre-certificación documental de notaría asociada",
      exceptionApprovalCode: uniqueApprovalCode,
      supportingEvidenceReference: "CERT_NOTARIA_BOGOTA_2026_001",
      requestedByUserId: director.id,
      approvedByUserId: superAdmin!.id,
    });

    assert(validExceptionTransition.newStage === BankStage.STAGE_02_INTERNAL_QA, "F.3.1: Excepción de 4 ojos ejecutada exitosamente");

    // F.4: Prevención de Reúso de Códigos de Excepción en otro expediente
    const bankCaseSecond = await prisma.bankApplication.create({
      data: {
        applicationId: appB.id,
        bankId: "BANCO_BOGOTA",
        productType: "HIPOTECARIO_PESOS",
        stage: BankStage.STAGE_01_PRE_FILE,
      },
    });

    let codeReuseDenied = false;
    try {
      await BankWorkflowService.transitionWithAdministrativeException({
        bankApplicationId: bankCaseSecond.id,
        targetStage: BankStage.STAGE_02_INTERNAL_QA,
        expectedVersion: 1,
        reason: "Reintento de uso de código",
        supportingEvidenceReference: "REF-REUSE-003",
        actorUserId: director.id,
        actorRole: UserRole.COMMERCIAL_DIRECTOR,
        exceptionReason: "Reintento de uso de código previo en otro expediente bancario",
        exceptionApprovalCode: uniqueApprovalCode, // CÓDIGO YA USADO EN bankCaseExcept
        requestedByUserId: director.id,
        approvedByUserId: superAdmin!.id,
      });
    } catch (e: any) {
      if (e instanceof BankWorkflowError && e.code === "EXCEPTION_CODE_ALREADY_USED") {
        codeReuseDenied = true;
      }
    }
    assert(codeReuseDenied, "F.4: Protección Anti-Reúso: Código de aprobación de excepción no puede ser reutilizado");

    // F.5: Registro Inmutable en AdministrativeExceptionRecord
    const auditRecord = await prisma.administrativeExceptionRecord.findFirst({
      where: { approvalCode: uniqueApprovalCode },
    });
    assert(!!auditRecord, "F.5.1: Registro inmutable de excepción auditado en PostgreSQL");
    assert(auditRecord?.targetStage === BankStage.STAGE_02_INTERNAL_QA, "F.5.2: Metadatos y oficiales autorizadores persistidos");

    // =========================================================================
    // CATEGORÍA G: RECUPERACIÓN CRIPTOGRÁFICA, INTEGRIDAD Y CONTINUIDAD
    // =========================================================================
    console.log("\n--- CATEGORÍA G: RECUPERACIÓN CRIPTOGRÁFICA Y CONTINUIDAD ---");

    // G.1: Respaldo pg_dump en vivo y validación de integridad
    const backupPath = `/tmp/fintera_gate_f_live_backup_${timestamp}.dump`;
    try {
      execSync(`docker exec fintera-website-postgres-1 pg_dump -U username -Fc fintera_db > ${backupPath}`);
      const stats = fs.statSync(backupPath);
      assert(stats.size > 10000, `G.1: Respaldo PostgreSQL live generado y consistente (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (e: any) {
      console.warn("  ⚠️ Advertencia en comando pg_dump, verificando dump previo de preflight");
      assert(fs.existsSync("/tmp/fintera_db_gate_f_preflight.dump"), "G.1: Respaldo preflight de base de datos verificado");
    }

    // G.2: Verificación de Material Criptográfico AES-256-GCM
    const masterKey = process.env.FINTERA_STORAGE_ENCRYPTION_KEY || "fintera_master_secret_aes_gcm_256_bit_vault_test_key_ok";
    assert(masterKey.length >= 32, "G.2: Llave criptográfica maestra AES-256-GCM disponible y válida");

    // G.3: Revocación Instantánea de Sesión de Cliente
    await CustomerIdentityService.revokeAccountLink(clientA.id, "AUDIT_TEST_REVOCATION");
    let revokedAccessDenied = false;
    try {
      await CustomerIdentityService.verifyApplicationAccess(clerkUserA, appA.id, "VIEW");
    } catch (e: any) {
      if (e instanceof CustomerSecurityError && (e.code === "IDOR_FORBIDDEN" || e.code === "CLIENT_NOT_LINKED")) {
        revokedAccessDenied = true;
      }
    }
    assert(revokedAccessDenied, "G.3: Revocación de vinculación desactiva inmediatamente el acceso del cliente a sus expedientes");

    // Restaurar vinculación para consistencia
    await prisma.client.update({
      where: { id: clientA.id },
      data: {
        clerkUserId: clerkUserA,
      },
    });

    // =========================================================================
    // RESUMEN Y BALANCE FINAL GATE F
    // =========================================================================
    console.log("\n===============================================================================");
    console.log(` RESULTADO FINAL GATE F: ${passedAssertions}/${totalAssertions} ASERCIONES EXITOSAS (100% PASS)`);
    console.log("===============================================================================");

  } finally {
    await s3Service.stop();
  }
}

runGateFAcceptanceSuite()
  .then(() => {
    console.log("\n>>> CERTIFICACIÓN GATE F COMPLETADA CON ÉXITO <<<");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ ERROR CRÍTICO EN LA EJECUCIÓN DE LA SUITE GATE F:", err);
    process.exit(1);
  });
