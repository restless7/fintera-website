import { NextRequest, NextResponse } from "next/server";
import { creditRequestSchema } from "@/app/lib/validation/creditRequestSchema";
import { ApplicationService } from "@/lib/crm/application-service";
import { IdempotencyConflictError } from "@/lib/crm/idempotency-service";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

export async function POST(request: NextRequest) {
  try {
    console.log("[Credit Request] Starting request processing via Canonical CRM Intake");

    const body = await request.json();

    console.log("[Credit Request] Body received, validating schema...");

    // Validate the request body
    const validatedData = creditRequestSchema.parse(body);

    console.log("[Credit Request] Validation passed, ingesting to Canonical CRM & Legacy Store...");

    // Clave de idempotencia explícita (Remediation A)
    const idempotencyKey = request.headers.get("x-idempotency-key") || body.idempotencyKey || undefined;

    // Obtener IP y User-Agent para trazabilidad legal Ley 1581
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown Browser";

    // Ingesta transaccional e idempotente en el CRM Canónico
    const intakeResult = await ApplicationService.intakeCreditRequest({
      idempotencyKey,
      documentType: validatedData.documentType,
      documentNumber: validatedData.documentNumber,
      firstName: validatedData.firstName,
      secondName: validatedData.secondName || undefined,
      firstLastName: validatedData.firstLastName,
      secondLastName: validatedData.secondLastName || undefined,
      email: validatedData.email,
      phone: validatedData.mobileNumber,
      residenceCity: validatedData.residenceCity,
      residenceDepartment: validatedData.residenceDepartment,
      residenceAddress: validatedData.residenceAddress,
      birthDate: validatedData.birthDate ? validatedData.birthDate.toISOString() : undefined,
      monthlyIncome: validatedData.monthlyIncome,
      monthlyExpenses: validatedData.monthlyExpenses,
      existingFinancialObligations: 0,
      occupation: validatedData.occupation,
      companyName: validatedData.companyName,
      requestedAmount: validatedData.requestedAmount || Number(body.requestedAmount || body.simulatedAmount || 0),
      termMonths: validatedData.termMonths || (body.termYears ? Number(body.termYears) * 12 : (body.termMonths ? Number(body.termMonths) : 240)),
      productCategory: validatedData.creditTypes?.[0] || "VIVIENDA_NO_VIS",
      ipAddress,
      userAgent,
      consentHabeasData: true,
      // Metadatos de simulación si se envían en el body
      simulatedBankId: body.simulatedBankId,
      simulatedProductType: body.simulatedProductType,
      simulatedRateEA: body.simulatedRateEA,
      simulatedRateMV: body.simulatedRateMV,
      simulatedMonthlyPayment: body.simulatedMonthlyPayment,
      simulatedLifeInsurance: body.simulatedLifeInsurance,
      simulatedFireInsurance: body.simulatedFireInsurance,
      simulatedDtiRatio: body.simulatedDtiRatio,
      simulatedGlobalDtiRatio: body.simulatedGlobalDtiRatio,
      propertyValue: body.propertyValue,
    });

    return NextResponse.json(
      {
        success: true,
        message: intakeResult.message,
        id: intakeResult.applicationId,
        fileNumber: intakeResult.fileNumber,
        requestNumber: intakeResult.fileNumber,
        isExistingClient: intakeResult.isExistingClient,
        isDuplicateRetry: intakeResult.isDuplicateRetry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Credit Request] Error:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });

    // Handle Idempotency Conflict (Remediation A)
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json(
        {
          success: false,
          error: "Idempotency Conflict",
          message: error.message,
        },
        { status: 409 }
      );
    }

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Error de validación en formulario",
          errors: error.errors
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un registro activo con estos datos identificadores"
        },
        { status: 409 }
      );
    }

    // Handle Prisma connection errors
    if (error.code === "P1001" || error.message?.includes("Can't reach database")) {
      return NextResponse.json(
        {
          success: false,
          message: "Error de conexión a la base de datos de persistencia.",
          debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }

    // Generic error handler
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la solicitud en el CRM. Por favor, inténtelo de nuevo.",
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
