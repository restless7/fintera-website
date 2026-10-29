import { NextRequest, NextResponse } from "next/server";
import { adminJson, authorizeAdminApi, verifyDocumentReferences } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { DocumentCategory } from "@/prisma/generated/client";
import { DocumentIngestionService } from "@/lib/documents/document-ingestion-service";
import { DocumentRequirementService } from "@/lib/documents/document-requirement-service";
import { DocumentMultibankService } from "@/lib/documents/document-multibank-service";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/crm/applications/[id]/documents
 * Retorna todos los activos documentales, versiones, requisitos materializados y estado de readiness
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;
    const authorization = await authorizeAdminApi("crm:document:read", applicationId);
    if (authorization.response) return authorization.response;
    const { userId: actorUserId, role: effectiveRole } = authorization.context;

    const application = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: {
        client: true,
        applicants: { orderBy: { role: "asc" } },
        bankApplications: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    // 1. Obtener los activos documentales y sus versiones
    const assets = await prisma.documentAsset.findMany({
      where: { applicationId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            evidenceLinks: {
              include: {
                requirement: {
                  include: {
                    requirementDefinition: true,
                    bankApplication: true,
                  },
                },
              },
            },
            bankReviews: {
              include: {
                reviewerUser: {
                  select: { id: true, firstName: true, lastName: true, role: true },
                },
              },
            },
          },
        },
        applicant: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Obtener requisitos materializados de todas las BankApplications del expediente
    const requirements = await prisma.bankDocumentRequirement.findMany({
      where: {
        bankApplication: { applicationId },
      },
      include: {
        requirementDefinition: true,
        applicant: true,
        bankApplication: true,
        evidenceLinks: {
          include: {
            documentVersion: {
              include: {
                asset: true,
              },
            },
          },
        },
        reviews: {
          orderBy: { reviewVersion: "desc" },
          include: {
            reviewerUser: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
            documentVersion: true,
          },
        },
      },
      orderBy: [
        { bankApplicationId: "asc" },
        { isMandatory: "desc" },
        { createdAt: "asc" },
      ],
    });

    // 3. Evaluar readiness documental para cada subexpediente bancario
    const bankReadiness: Record<string, any> = {};
    for (const bankApp of application.bankApplications) {
      const readiness = await DocumentRequirementService.evaluateBankReadiness(bankApp.id);
      bankReadiness[bankApp.id] = readiness;
    }

    return adminJson({
      success: true,
      applicationId,
      fileNumber: application.fileNumber,
      client: application.client,
      applicants: application.applicants,
      bankApplications: application.bankApplications,
      assets,
      requirements,
      bankReadiness,
    });
  } catch (error: any) {
    console.error("[CRM Documents API] Error GET:", error);
    return NextResponse.json(
      { error: "Error al consultar documentos del expediente", detail: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/crm/applications/[id]/documents
 * Multipropósito: materialización de requisitos, creación de intención de carga, confirmación y revisión humana
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;
    const authorization = await authorizeAdminApi("crm:document:read", applicationId);
    if (authorization.response) return authorization.response;
    let { userId: actorUserId, role: effectiveRole } = authorization.context;

    const application = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action;
    const validActions = ["MATERIALIZE_REQUIREMENTS", "CREATE_UPLOAD_INTENT", "CONFIRM_UPLOAD", "ATTACH_TO_REQUIREMENT", "REVIEW"];
    if (validActions.includes(action)) {
      const operation = await authorizeAdminApi(action === "REVIEW" ? "crm:document:review" : "crm:document:upload", applicationId);
      if (operation.response) return operation.response;
      actorUserId = operation.context.userId;
      effectiveRole = operation.context.role;
    }

    switch (action) {
      case "MATERIALIZE_REQUIREMENTS": {
        if (!body.bankApplicationId) {
          return NextResponse.json({ error: "bankApplicationId es obligatorio" }, { status: 400 });
        }
        const referenceError = await verifyDocumentReferences(applicationId, { bankApplicationId: body.bankApplicationId });
        if (referenceError) return referenceError;
        const count = await DocumentRequirementService.materializeRequirementsForBankApplication(
          body.bankApplicationId,
          actorUserId
        );
        return NextResponse.json({
          success: true,
          count,
          message: `Requisitos materializados exitosamente (${count} obligaciones registradas).`,
        });
      }

      case "CREATE_UPLOAD_INTENT": {
        if (!body.declaredMimeType || !body.category) {
          return NextResponse.json(
            { error: "category y declaredMimeType son obligatorios" },
            { status: 400 }
          );
        }
        const referenceError = await verifyDocumentReferences(applicationId, { applicantId: body.applicantId, assetId: body.assetId, requirementId: body.requirementId });
        if (referenceError) return referenceError;
        const intentResult = await DocumentIngestionService.createUploadIntent({
          applicationId,
          category: body.category as DocumentCategory,
          title: body.title || body.declaredFileName || "Documento de soporte",
          declaredFileName: body.declaredFileName || "documento.bin",
          declaredMimeType: body.declaredMimeType,
          maxAllowedBytes: body.maxAllowedBytes,
          applicantId: body.applicantId,
          assetId: body.assetId,
          requirementId: body.requirementId,
          actorUserId,
          actorRole: effectiveRole,
        });

        return NextResponse.json({
          success: true,
          ...intentResult,
        });
      }

      case "CONFIRM_UPLOAD": {
        if (!body.intentId) {
          return NextResponse.json({ error: "intentId es obligatorio" }, { status: 400 });
        }
        const referenceError = await verifyDocumentReferences(applicationId, { intentId: body.intentId });
        if (referenceError) return referenceError;
        const confirmResult = await DocumentIngestionService.confirmAndProcessUpload({
          intentId: body.intentId,
          actorUserId,
          actorRole: effectiveRole,
        });

        if (!confirmResult.success) {
          return NextResponse.json(confirmResult, { status: 422 });
        }

        return NextResponse.json(confirmResult, { status: 200 });
      }

      case "ATTACH_TO_REQUIREMENT": {
        if (!body.requirementId || !body.documentVersionId) {
          return NextResponse.json(
            { error: "requirementId y documentVersionId son obligatorios" },
            { status: 400 }
          );
        }
        const referenceError = await verifyDocumentReferences(applicationId, { requirementId: body.requirementId, documentVersionId: body.documentVersionId });
        if (referenceError) return referenceError;
        const evidence = await DocumentMultibankService.attachVersionToRequirement({
          requirementId: body.requirementId,
          documentVersionId: body.documentVersionId,
          actorUserId,
          actorRole: effectiveRole,
        });
        return NextResponse.json({
          success: true,
          evidence,
          message: "Evidencia vinculada al requisito bancario exitosamente.",
        });
      }

      case "REVIEW": {
        if (!body.bankApplicationId || !body.requirementId || !body.documentVersionId || !body.status) {
          return NextResponse.json(
            { error: "bankApplicationId, requirementId, documentVersionId y status son obligatorios" },
            { status: 400 }
          );
        }
        const referenceError = await verifyDocumentReferences(applicationId, { bankApplicationId: body.bankApplicationId, requirementId: body.requirementId, documentVersionId: body.documentVersionId });
        if (referenceError) return referenceError;
        const review = await DocumentMultibankService.reviewDocumentForBank({
          bankApplicationId: body.bankApplicationId,
          requirementId: body.requirementId,
          documentVersionId: body.documentVersionId,
          actorUserId,
          actorRole: effectiveRole,
          status: body.status,
          rejectionReasonDescription: body.rejectionReason,
          internalNotes: body.internalNotes,
          customerVisibleNotes: body.customerVisibleNotes,
          validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        });
        return NextResponse.json({
          success: true,
          review,
          message: `Revisión bancaria registrada con estado '${body.status}'.`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Acción '${action}' no reconocida. Acciones válidas: MATERIALIZE_REQUIREMENTS, CREATE_UPLOAD_INTENT, CONFIRM_UPLOAD, ATTACH_TO_REQUIREMENT, REVIEW.` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[CRM Documents API] Error POST:", error);
    return NextResponse.json(
      { error: "Error en la operación documental", detail: error.message },
      { status: 500 }
    );
  }
}
