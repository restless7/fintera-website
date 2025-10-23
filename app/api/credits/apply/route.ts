import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { CompleteApplicationSchema, CompleteApplicationForm } from "@/app/credits/apply/schema";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    
    // Validate the complete application data
    const validationResult = CompleteApplicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Datos de solicitud inválidos",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const applicationData: CompleteApplicationForm = validationResult.data;

    // Transform dates from strings to Date objects
    const documentIssueDate = new Date(applicationData.personalInfo.documentIssueDate);
    const birthDate = new Date(applicationData.personalInfo.birthDate);

    // Check for existing application with same document number
    const existingApplication = await prisma.creditApplication.findUnique({
      where: {
        documentNumber: applicationData.personalInfo.documentNumber,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Ya existe una solicitud con este número de documento" },
        { status: 409 }
      );
    }

    // Create the credit application in the database
    const creditApplication = await prisma.creditApplication.create({
      data: {
        // Credit Details
        creditType: applicationData.creditDetails.creditType,
        requestedAmount: applicationData.creditDetails.requestedAmount,
        termMonths: applicationData.creditDetails.termMonths,

        // Personal Information
        firstName: applicationData.personalInfo.firstName,
        secondName: applicationData.personalInfo.secondName || null,
        firstLastName: applicationData.personalInfo.firstLastName,
        secondLastName: applicationData.personalInfo.secondLastName || null,
        documentType: applicationData.personalInfo.documentType,
        documentNumber: applicationData.personalInfo.documentNumber,
        documentIssueCity: applicationData.personalInfo.documentIssueCity,
        documentIssueDate: documentIssueDate,
        birthDate: birthDate,
        nationality: applicationData.personalInfo.nationality,
        residenceCity: applicationData.personalInfo.residenceCity,
        residenceAddress: applicationData.personalInfo.residenceAddress,
        email: applicationData.personalInfo.email,
        phoneNumber: applicationData.personalInfo.phoneNumber,
        preferredContactMethod: applicationData.personalInfo.preferredContactMethod,
        gender: applicationData.personalInfo.gender,
        ethnicGroup: applicationData.personalInfo.ethnicGroup || null,

        // Employment/Economic Activity
        occupation: applicationData.employmentInfo.occupation,
        mainActivityDescription: applicationData.employmentInfo.mainActivityDescription || null,
        ciiuCode: applicationData.employmentInfo.ciiuCode || null,
        monthlyIncome: applicationData.employmentInfo.monthlyIncome,
        monthlyExpenses: applicationData.employmentInfo.monthlyExpenses,
        otherIncome: applicationData.employmentInfo.otherIncome || null,
        totalAssets: applicationData.employmentInfo.totalAssets,
        totalLiabilities: applicationData.employmentInfo.totalLiabilities,
        taxDeclarationStatus: applicationData.employmentInfo.taxDeclarationStatus,
        foreignTaxResidency: applicationData.employmentInfo.foreignTaxResidency,
        foreignCountry: applicationData.employmentInfo.foreignCountry || null,
        tinNumber: applicationData.employmentInfo.tinNumber || null,

        // References
        personalReferenceName: applicationData.references.personalReferenceName,
        personalReferencePhone: applicationData.references.personalReferencePhone,
        personalReferenceCity: applicationData.references.personalReferenceCity,
        familyReferenceName: applicationData.references.familyReferenceName,
        familyReferencePhone: applicationData.references.familyReferencePhone,
        familyReferenceCity: applicationData.references.familyReferenceCity,
        commercialReferenceName: applicationData.references.commercialReferenceName || null,
        commercialReferencePhone: applicationData.references.commercialReferencePhone || null,
        commercialReferenceCity: applicationData.references.commercialReferenceCity || null,

        // Consent
        dataProcessingConsent: applicationData.consent.dataProcessingConsent,
        informationVeracityConsent: applicationData.consent.informationVeracityConsent,

        // Application status
        status: "submitted",
      },
    });

    // Log the successful submission (for monitoring/analytics)
    console.log(`New credit application submitted: ${creditApplication.id}`);

    // TODO: Here you could add additional functionality such as:
    // - Send confirmation email to applicant
    // - Send notification to credit team
    // - Trigger credit scoring process
    // - Integration with external credit bureaus

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Solicitud de crédito enviada exitosamente",
        id: creditApplication.id,
        submittedAt: creditApplication.createdAt,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error processing credit application:", error);

    // Handle Prisma specific errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ya existe una solicitud con este número de documento" },
        { status: 409 }
      );
    }

    // Handle other database errors
    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        { error: "Error de base de datos. Por favor, inténtelo más tarde" },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: "Error interno del servidor. Por favor, inténtelo más tarde",
        details: process.env.NODE_ENV === "development" ? error : undefined 
      },
      { status: 500 }
    );

  } finally {
    // Clean up Prisma connection
    await prisma.$disconnect();
  }
}

// Handle method not allowed
export async function GET() {
  return NextResponse.json(
    { error: "Método no permitido" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Método no permitido" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Método no permitido" },
    { status: 405 }
  );
}