import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup } from "pdf-lib";
import { mapFormDataToPdfFields } from "@/app/lib/pdf/fieldMapping";
import { mapFormDataToAuthorizationFields } from "@/app/lib/pdf/authorizationMapping";

// Force Node.js runtime (required for pdf-lib)
export const runtime = 'nodejs';

// Increase max duration for Vercel (if on Pro plan)
export const maxDuration = 60; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { formType = 'credit', ...formData } = body;

    console.log("[PDF Generation] Starting PDF generation for:", {
      formType,
      firstName: formData.firstName,
      documentNumber: formData.documentNumber
    });

    let templateName = "SSF-vigente-marzo-2025.pdf";
    let fieldMapping: Record<string, string> = {};

    if (formType === 'authorization') {
      templateName = "Autorización Well.pdf";
      fieldMapping = mapFormDataToAuthorizationFields(formData);
    } else {
      fieldMapping = mapFormDataToPdfFields(formData);
    }

    // Get the base URL from request headers or environment
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3004';
    const baseUrl = `${protocol}://${host}`;

    // Construct the full URL to the PDF template
    const templateUrl = `${baseUrl}/forms/${encodeURIComponent(templateName)}`;

    console.log("[PDF Generation] Fetching template from:", templateUrl);

    // Fetch the PDF template via HTTP (works on both local and Vercel)
    const pdfResponse = await fetch(templateUrl);

    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF template: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }

    const pdfBytes = await pdfResponse.arrayBuffer();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the form
    const form = pdfDoc.getForm();

    // Fill the PDF fields
    Object.entries(fieldMapping).forEach(([fieldName, fieldValue]) => {
      try {
        const field = form.getField(fieldName);

        if (field instanceof PDFTextField) {
          // Text field - clear first then set new value to remove placeholder text
          field.setText(''); // Clear any existing/placeholder text
          if (fieldValue) {
            field.setText(String(fieldValue));
          }
        } else if (field instanceof PDFCheckBox) {
          // Checkbox field
          if (fieldValue === "Yes") {
            field.check();
          } else {
            field.uncheck();
          }
        } else if (field instanceof PDFRadioGroup) {
          // Radio button field
          try {
            field.select(String(fieldValue));
          } catch (e) {
            // If the value doesn't match any option, log and skip
            console.warn(`Could not select radio option "${fieldValue}" for field "${fieldName}"`);
          }
        }
      } catch (error) {
        // Field not found or error setting value - log and continue
        console.warn(`Could not set field "${fieldName}":`, error);
      }
    });

    // FIX: The "Declaración de Residencia Fiscal" checkboxes (Check Box2 to Check Box5) 
    // are unmapped and cause large white boxes when flattened by pdf-lib due to default appearances.
    // Removing them before flattening keeps the original PDF graphics intact and avoids the white boxes,
    // while perfectly satisfying the requirement that the document cannot be edited.
    if (formType !== 'authorization') {
      const problematicFields = ['Check Box2', 'Check Box3', 'Check Box4', 'Check Box5'];
      problematicFields.forEach(name => {
        try {
          const field = form.getField(name);
          form.removeField(field);
        } catch (e) {
          console.warn(`Could not remove troublesome field "${name}":`, e);
        }
      });
    }

    // Flatten the form (make it non-editable)
    form.flatten();

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();

    // Generate filename
    const fileName = generateFileName(formData, formType);

    // Return the PDF as a downloadable file
    return new NextResponse(Buffer.from(filledPdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": filledPdfBytes.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al generar el PDF. Por favor, inténtelo de nuevo.",
        error: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a filename for the PDF based on user data
 */
function generateFileName(data: any, formType: string): string {
  const firstName = data.firstName || "Usuario";
  const lastName = data.firstLastName || "";
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Sanitize name (remove special characters)
  const sanitizedName = `${firstName}_${lastName}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50); // Limit length

  const prefix = formType === 'authorization' ? 'Autorizacion_Well' : 'Solicitud_Fintera';

  return `${prefix}_${sanitizedName}_${date}.pdf`;
}
