import { NextRequest, NextResponse } from "next/server";
import { adminJson, authorizeAdminApi, verifyDocumentReferences } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { BankStage } from "@/prisma/generated/client";
import { BankWorkflowService, BankWorkflowError } from "@/lib/crm/bank-workflows/bank-workflow-service";
import { BankWorkflowRegistry } from "@/lib/crm/bank-workflows/registry";
import { SlaService } from "@/lib/crm/sla/sla-service";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;

    const authorization = await authorizeAdminApi("crm:bank-case:manage", applicationId);
    if (authorization.response) return authorization.response;
    const body = await req.json();
    const actorUserId = authorization.context.userId;

    if (!body.bankId || !body.productType) {
      return NextResponse.json(
        { error: "Debe especificar la entidad bancaria (bankId) y el producto (productType)" },
        { status: 400 }
      );
    }

    // Obtener workflow oficial para el banco
    const workflow = BankWorkflowRegistry.getWorkflow(body.bankId);
    const initialStage = workflow.initialStage || BankStage.STAGE_01_PRE_FILE;
    const initialSla = SlaService.calculateInitialDeadline(initialStage, new Date());
    const customerProjection = workflow.customerStageMap[initialStage];

    // Creación controlada del subexpediente bancario
    const bankApp = await prisma.bankApplication.upsert({
      where: {
        applicationId_bankId_productType: {
          applicationId,
          bankId: body.bankId,
          productType: body.productType,
        },
      },
      update: {
        // En update de creación no se permite alterar stage arbitrariamente
        bankFilingNumber: body.bankFilingNumber || undefined,
        bankOfficialName: body.bankOfficialName || undefined,
        bankOfficialContact: body.bankOfficialContact || undefined,
        notes: body.notes || undefined,
      },
      create: {
        applicationId,
        bankId: body.bankId,
        productType: body.productType,
        stage: initialStage, // Siempre inicia en STAGE_01_PRE_FILE
        workflowVersion: workflow.version,
        version: 1,
        customerVisibleStage: customerProjection?.customerVisibleStage || "En integración de documentos",
        customerVisible: customerProjection?.isPubliclyVisible !== false,
        slaDeadline: initialSla,
        slaStatus: "ON_TRACK",
        bankFilingNumber: body.bankFilingNumber || null,
        bankOfficialName: body.bankOfficialName || null,
        bankOfficialContact: body.bankOfficialContact || null,
        notes: body.notes || null,
      },
    });

    // Registrar actividad en el expediente principal
    await prisma.crmActivity.create({
      data: {
        applicationId,
        authorId: actorUserId,
        type: "BANK_UPDATE",
        title: `Subexpediente bancario abierto: ${body.bankId.toUpperCase()}`,
        description: `Se abrió trámite para ${body.productType} bajo workflow ${workflow.version} en etapa ${initialStage}.`,
        isInternalOnly: true,
      },
    });

    return adminJson({
      success: true,
      bankApplication: bankApp,
      message: `Subexpediente bancario con ${body.bankId.toUpperCase()} registrado exitosamente`,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[CRM Bank Cases API] Error POST:", error);
    return NextResponse.json(
      { error: "Error al gestionar subexpediente bancario", detail: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;

    const authorization = await authorizeAdminApi("crm:bank-case:manage", applicationId);
    if (authorization.response) return authorization.response;
    const body = await req.json();
    if (!body.bankApplicationId) {
      return NextResponse.json({ error: "bankApplicationId es obligatorio" }, { status: 400 });
    }

    const { userId: actorUserId, role: effectiveRole } = authorization.context;
    const referenceError = await verifyDocumentReferences(applicationId, { bankApplicationId: body.bankApplicationId });
    if (referenceError) return referenceError;

    // SI SE SOLICITA CAMBIO DE ETAPA (stage), DEBE PASAR OBLIGATORIAMENTE POR BankWorkflowService
    if (body.stage) {
      // Requerir expectedVersion para control de concurrencia optimista
      const expectedVersion = typeof body.expectedVersion === "number"
        ? body.expectedVersion
        : (await prisma.bankApplication.findUnique({ where: { id: body.bankApplicationId } }))?.version || 1;

      try {
        const transitionResult = await BankWorkflowService.transitionStage({
          bankApplicationId: body.bankApplicationId,
          targetStage: body.stage,
          expectedVersion,
          reason: body.reason || body.notes || "Actualización de etapa operativa",
          supportingEvidence: {
            evidenceType: body.evidenceType,
            evidenceReference: body.evidenceReference || body.bankFilingNumber,
            metadata: body.evidenceMetadata,
          },
          actorUserId,
          actorRole: effectiveRole,
          approvedAmount: body.approvedAmount !== undefined ? Number(body.approvedAmount) : undefined,
          approvedRateEA: body.approvedRateEA !== undefined ? Number(body.approvedRateEA) : undefined,
          approvedTermMonths: body.approvedTermMonths !== undefined ? Number(body.approvedTermMonths) : undefined,
          bankFilingNumber: body.bankFilingNumber,
          rejectionReason: body.rejectionReason,
        });

        const updated = await prisma.bankApplication.findUnique({
          where: { id: body.bankApplicationId },
        });

        return adminJson({
          success: true,
          bankApplication: updated,
          transition: transitionResult,
          message: transitionResult.message,
        });
      } catch (err: any) {
        if (err instanceof BankWorkflowError) {
          return NextResponse.json(
            { error: err.message, code: err.code, details: err.details },
            { status: err.statusCode }
          );
        }
        throw err;
      }
    }

    // Actualización de campos que NO modifican etapa
    const updated = await prisma.bankApplication.update({
      where: { id: body.bankApplicationId },
      data: {
        bankFilingNumber: body.bankFilingNumber !== undefined ? body.bankFilingNumber : undefined,
        bankOfficialName: body.bankOfficialName !== undefined ? body.bankOfficialName : undefined,
        bankOfficialContact: body.bankOfficialContact !== undefined ? body.bankOfficialContact : undefined,
        approvedAmount: body.approvedAmount !== undefined ? Number(body.approvedAmount) : undefined,
        approvedRateEA: body.approvedRateEA !== undefined ? Number(body.approvedRateEA) : undefined,
        approvedTermMonths: body.approvedTermMonths !== undefined ? Number(body.approvedTermMonths) : undefined,
        rejectionReason: body.rejectionReason !== undefined ? body.rejectionReason : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return adminJson({
      success: true,
      bankApplication: updated,
      message: "Datos de contacto y notas del subexpediente actualizados correctamente",
    });
  } catch (error: any) {
    console.error("[CRM Bank Cases API] Error PATCH:", error);
    return NextResponse.json(
      { error: "Error al actualizar subexpediente bancario", detail: error.message },
      { status: 500 }
    );
  }
}
