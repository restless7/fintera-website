import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import prisma from "@/lib/prisma";
import { storageAdapter } from "@/lib/documents/storage/s3-storage-adapter";
import { DocumentScanStatus } from "@/prisma/generated/client";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function sanitizeAscii(text: string): string {
  return (text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ");
}

/**
 * GET /api/admin/crm/applications/[id]/documents/dossier?bankApplicationId=...
 * Genera el Dossier Bancario Unificado listo para radicación (Hoja de Resumen + Tabla SHA-256 + Soportes Fusionados de Supabase Clean Vault)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: applicationId } = await params;
    const authorization = await authorizeAdminApi("crm:document:read", applicationId);
    if (authorization.response) return authorization.response;

    const { searchParams } = new URL(req.url);
    const bankApplicationId = searchParams.get("bankApplicationId");

    const application = await prisma.crmCreditApplication.findUnique({
      where: { id: applicationId },
      include: {
        client: true,
        applicants: { orderBy: { role: "asc" } },
        simulationSnapshot: true,
        bankApplications: {
          orderBy: { createdAt: "asc" },
          include: {
            documentRequirements: {
              include: {
                requirementDefinition: true,
                evidenceLinks: {
                  include: {
                    documentVersion: true,
                  },
                },
                reviews: {
                  orderBy: { reviewVersion: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });
    }

    const targetBankApp =
      (bankApplicationId
        ? application.bankApplications.find((b) => b.id === bankApplicationId)
        : application.bankApplications[0]) || null;

    const bankLabel = (targetBankApp?.bankId || "MULTIBANCO").toUpperCase();
    const requirements = targetBankApp?.documentRequirements || [];

    // Crear PDF Maestro con pdf-lib
    const masterPdf = await PDFDocument.create();
    const fontBold = await masterPdf.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await masterPdf.embedFont(StandardFonts.Helvetica);

    // Página 1: Portada Institucional y Resumen de Radicación
    const coverPage = masterPdf.addPage([612, 792]); // Letter
    const { width, height } = coverPage.getSize();

    // Header Institucional (#0B1F3A)
    coverPage.drawRectangle({
      x: 0,
      y: height - 115,
      width,
      height: 115,
      color: rgb(0.043, 0.122, 0.227),
    });

    coverPage.drawText("FINTERA | DOSSIER OFICIAL DE RADICACION BANCARIA", {
      x: 40,
      y: height - 45,
      size: 13,
      font: fontBold,
      color: rgb(0.063, 0.725, 0.506),
    });

    coverPage.drawText(
      sanitizeAscii(
        `EXPEDIENTE ${application.fileNumber} — ENTIDAD DESTINO: ${bankLabel}`
      ),
      {
        x: 40,
        y: height - 70,
        size: 16,
        font: fontBold,
        color: rgb(1, 1, 1),
      }
    );

    coverPage.drawText(
      sanitizeAscii(
        `Fecha de Emision: ${new Date().toISOString().slice(0, 10)} | Boveda Cifrada Supabase AES-256`
      ),
      {
        x: 40,
        y: height - 92,
        size: 9,
        font: fontRegular,
        color: rgb(0.75, 0.82, 0.9),
      }
    );

    let y = height - 145;

    // Bloque 1: Perfil del Titular y Condiciones Financieras
    coverPage.drawText("1. RESUMEN EJECUTIVO DEL SUJETO DE CREDITO Y OPERACION", {
      x: 40,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.043, 0.122, 0.227),
    });
    y -= 20;

    const summaryLines = [
      `Titular Principal: ${application.client.firstName} ${application.client.firstLastName} (${application.client.documentType} ${application.client.documentNumber})`,
      `Contacto Verificado: ${application.client.email} | Tel: ${application.client.phone}`,
      `Linea de Credito: ${application.productCategory.replace(/_/g, " ")} | Producto Banco: ${targetBankApp?.productType || "Hipotecario"}`,
      `Monto Solicitado: $${application.requestedAmount.toLocaleString("es-CO")} COP | Plazo: ${application.termMonths} meses (${Math.round(application.termMonths / 12)} anos)`,
    ];

    if (application.simulationSnapshot) {
      summaryLines.push(
        `Simulacion Vinculada: Tasa ${(application.simulationSnapshot.rateEA * 100).toFixed(2)}% E.A. | Cuota Est.: $${Math.round(application.simulationSnapshot.initialMonthlyTotalPayment).toLocaleString("es-CO")} | DTI: ${(application.simulationSnapshot.dtiRatio * 100).toFixed(1)}%`
      );
    }

    for (const line of summaryLines) {
      coverPage.drawText(sanitizeAscii(line), {
        x: 45,
        y,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.15, 0.2, 0.28),
      });
      y -= 15;
    }

    y -= 12;

    // Bloque 2: Índice Estandarizado de Soportes y Certificación SHA-256
    coverPage.drawText(
      "2. INDICE DE SOPORTES CERTIFICADOS Y NOMENCLATURA BANCARIA",
      {
        x: 40,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.043, 0.122, 0.227),
      }
    );
    y -= 18;

    if (requirements.length === 0) {
      coverPage.drawText(
        "No hay requisitos materializados para este subexpediente bancario.",
        {
          x: 45,
          y,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.4, 0.45, 0.5),
        }
      );
      y -= 16;
    } else {
      requirements.forEach((req, idx) => {
        if (y < 90) return;
        const ver = req.evidenceLinks?.[0]?.documentVersion;
        const review = req.reviews?.[0];
        const statusText = review?.status || (ver ? "CARGADO_LIMPIO" : "PENDIENTE");
        const stdFileName = `${String(idx + 1).padStart(2, "0")}_${bankLabel}_${application.client.documentNumber}_${req.requirementDefinition.requirementCode}.pdf`;

        coverPage.drawText(
          sanitizeAscii(
            `${idx + 1}. [${statusText}] ${req.requirementDefinition.title}`
          ),
          {
            x: 45,
            y,
            size: 9,
            font: fontBold,
            color: rgb(0.1, 0.15, 0.22),
          }
        );
        y -= 12;

        coverPage.drawText(
          sanitizeAscii(
            `   Nomenclatura: ${stdFileName} | SHA-256: ${ver ? ver.sha256.slice(0, 20) + "..." : "Sin archivo"}`
          ),
          {
            x: 45,
            y,
            size: 8,
            font: fontRegular,
            color: rgb(0.35, 0.4, 0.48),
          }
        );
        y -= 15;
      });
    }

    // Pie de página de la portada
    coverPage.drawText(
      sanitizeAscii(
        `Certificado por Motor Documental FINTERA · Auditoria Antimalware ClamAV + Pre-Auditoria IA · ${application.id}`
      ),
      {
        x: 40,
        y: 35,
        size: 8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.58),
      }
    );

    // 3. Incrustar los archivos limpios desde Supabase Storage (fintera-documents-clean)
    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];
      const ver = req.evidenceLinks?.[0]?.documentVersion;
      if (!ver || ver.scanStatus !== DocumentScanStatus.CLEAN) continue;

      try {
        const fileBuffer = await storageAdapter.getObjectBuffer(ver.storageKey, false);

        if (ver.detectedMimeType === "application/pdf") {
          const attachedPdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          const copiedPages = await masterPdf.copyPages(
            attachedPdf,
            attachedPdf.getPageIndices()
          );
          for (const p of copiedPages) {
            masterPdf.addPage(p);
          }
        } else if (
          ver.detectedMimeType === "image/jpeg" ||
          ver.detectedMimeType === "image/png"
        ) {
          const imgPage = masterPdf.addPage([612, 792]);
          imgPage.drawText(
            sanitizeAscii(
              `ANEXO ${i + 1}: ${req.requirementDefinition.title} (${ver.originalFileName})`
            ),
            {
              x: 40,
              y: 750,
              size: 11,
              font: fontBold,
              color: rgb(0.043, 0.122, 0.227),
            }
          );
          const embeddedImg =
            ver.detectedMimeType === "image/png"
              ? await masterPdf.embedPng(fileBuffer)
              : await masterPdf.embedJpg(fileBuffer);
          const dims = embeddedImg.scaleToFit(520, 660);
          imgPage.drawImage(embeddedImg, {
            x: (612 - dims.width) / 2,
            y: 720 - dims.height,
            width: dims.width,
            height: dims.height,
          });
        }
      } catch (embedErr) {
        console.warn(
          `[Dossier Generator] Advertencia incrustando soporte ${ver.storageKey}:`,
          embedErr
        );
      }
    }

    const pdfBytes = await masterPdf.save();
    const safeFileName = `DOSSIER_RADICACION_${application.fileNumber}_${bankLabel}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[API admin/crm/applications/[id]/documents/dossier] Error:", err);
    return NextResponse.json(
      { error: "Error generando el Dossier Bancario Unificado.", detail: err.message },
      { status: 500 }
    );
  }
}
