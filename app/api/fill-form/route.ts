import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { mapFormDataToPdfFields } from "@/app/lib/pdf/fieldMapping";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const formData = await request.json();
    
    // Read the PDF template
    const templatePath = path.join(process.cwd(), "public", "forms", "SSF-vigente-marzo-2025.pdf");
    const pdfBytes = fs.readFileSync(templatePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the form
    const form = pdfDoc.getForm();
    
    // Map form data to PDF fields
    const fieldMapping = mapFormDataToPdfFields(formData);
    
    // Fill the PDF fields
    Object.entries(fieldMapping).forEach(([fieldName, fieldValue]) => {
      try {
        const field = form.getField(fieldName);
        
        if (field instanceof PDFTextField) {
          // Text field
          field.setText(String(fieldValue));
        } else if (field instanceof PDFCheckBox) {
          // Checkbox field
          if (fieldValue === "Yes" || fieldValue === true) {
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
    
    // Flatten the form (make it non-editable)
    form.flatten();
    
    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    
    // Generate filename
    const fileName = generateFileName(formData);
    
    // Return the PDF as a downloadable file
    return new NextResponse(filledPdfBytes, {
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
function generateFileName(data: any): string {
  const firstName = data.firstName || "Usuario";
  const lastName = data.firstLastName || "";
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Sanitize name (remove special characters)
  const sanitizedName = `${firstName}_${lastName}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50); // Limit length
  
  return `Solicitud_Fintera_${sanitizedName}_${date}.pdf`;
}
