import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { creditRequestSchema } from "@/app/lib/validation/creditRequestSchema";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("[Credit Request] Starting request processing");
    
    const body = await request.json();
    
    console.log("[Credit Request] Body received, validating...");

    // Validate the request body
    const validatedData = creditRequestSchema.parse(body);
    
    console.log("[Credit Request] Validation passed, saving to database...");

    // Create the credit request in the database
    const creditRequest = await prisma.creditRequest.create({
      data: {
        // 1. Solicitud de crédito
        requestDate: validatedData.requestDate || new Date(),
        officeCode: validatedData.officeCode,
        creditTypes: validatedData.creditTypes,
        requestedAmount: validatedData.requestedAmount,
        termMonths: validatedData.termMonths,

        // 2. Datos personales
        firstName: validatedData.firstName,
        secondName: validatedData.secondName,
        firstLastName: validatedData.firstLastName,
        secondLastName: validatedData.secondLastName,
        documentType: validatedData.documentType,
        documentNumber: validatedData.documentNumber,
        documentIssuePlace: validatedData.documentIssuePlace,
        documentIssueDate: validatedData.documentIssueDate,
        nationality: validatedData.nationality,
        birthCity: validatedData.birthCity,
        birthDepartment: validatedData.birthDepartment,
        birthCountry: validatedData.birthCountry,
        birthDate: validatedData.birthDate,
        residenceCity: validatedData.residenceCity,
        residenceDepartment: validatedData.residenceDepartment,
        residenceCountry: validatedData.residenceCountry,
        residenceAddress: validatedData.residenceAddress,
        email: validatedData.email,
        mobileNumber: validatedData.mobileNumber,
        preferredContactMethods: validatedData.preferredContactMethods,
        gender: validatedData.gender,
        ethnicGroup: validatedData.ethnicGroup,
        isPEP: validatedData.isPEP,
        hasFamilyInBank: validatedData.hasFamilyInBank,
        familyNameInBank: validatedData.familyNameInBank,

        // 3. Datos laborales
        occupation: validatedData.occupation,
        companyName: validatedData.companyName,
        otherOccupationDetail: validatedData.otherOccupationDetail,
        mainEconomicActivity: validatedData.mainEconomicActivity,
        ciiuCode: validatedData.ciiuCode,

        // 4. Referencias
        personalReferenceName: validatedData.personalReferenceName,
        personalReferenceCity: validatedData.personalReferenceCity,
        personalReferenceDept: validatedData.personalReferenceDept,
        personalReferencePhone: validatedData.personalReferencePhone,
        familyReferenceName: validatedData.familyReferenceName,
        familyReferenceCity: validatedData.familyReferenceCity,
        familyReferenceDept: validatedData.familyReferenceDept,
        familyReferencePhone: validatedData.familyReferencePhone,
        commercialReferenceName: validatedData.commercialReferenceName,
        commercialReferenceCity: validatedData.commercialReferenceCity,
        commercialReferenceDept: validatedData.commercialReferenceDept,
        commercialReferencePhone: validatedData.commercialReferencePhone,

        // 5. Información financiera
        declaresTaxes: validatedData.declaresTaxes,
        monthlyIncome: validatedData.monthlyIncome,
        monthlyExpenses: validatedData.monthlyExpenses,
        otherIncome: validatedData.otherIncome,
        totalAssets: validatedData.totalAssets,
        totalLiabilities: validatedData.totalLiabilities,
        paysTaxesAbroad: validatedData.paysTaxesAbroad,
        foreignTaxCountry: validatedData.foreignTaxCountry,
        tin: validatedData.tin,

        status: "submitted"
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Solicitud de crédito recibida exitosamente",
        id: creditRequest.id
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

    // Handle Zod validation errors
    if (error.name === "ZodError") {
      console.log("[Credit Request] Validation error");
      return NextResponse.json(
        {
          success: false,
          message: "Error de validación",
          errors: error.errors
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violations (duplicate document number)
    if (error.code === "P2002") {
      console.log("[Credit Request] Duplicate document number");
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe una solicitud con este número de documento"
        },
        { status: 409 }
      );
    }
    
    // Handle Prisma connection errors
    if (error.code === "P1001" || error.message?.includes("Can't reach database")) {
      console.error("[Credit Request] Database connection error");
      return NextResponse.json(
        {
          success: false,
          message: "Error de conexión a la base de datos. Por favor, contacte al soporte.",
          debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
    // Handle other Prisma errors
    if (error.code?.startsWith('P')) {
      console.error("[Credit Request] Prisma error:", error.code);
      return NextResponse.json(
        {
          success: false,
          message: "Error en la base de datos. Por favor, inténtelo de nuevo.",
          debug: process.env.NODE_ENV === 'development' ? { code: error.code, message: error.message } : undefined
        },
        { status: 500 }
      );
    }

    // Generic error handler
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la solicitud. Por favor, inténtelo de nuevo.",
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
