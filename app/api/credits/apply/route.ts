import { NextRequest, NextResponse } from "next/server";
import { ApplicationService } from "@/lib/crm/application-service";
import {
  MAGIC_TRACK_COOKIE_NAME,
  signMagicTrackingToken,
} from "@/lib/auth/magic-tracking-token";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const creditDetails = body?.creditDetails || {};
    const personalInfo = body?.personalInfo || {};
    const employmentInfo = body?.employmentInfo || {};

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Web Browser";

    const intakeResult = await ApplicationService.intakeCreditRequest({
      documentType: personalInfo.documentType || "CC",
      documentNumber: String(personalInfo.documentNumber || "1020304050"),
      firstName: personalInfo.firstName || "Solicitante",
      secondName: personalInfo.secondName || undefined,
      firstLastName: personalInfo.firstLastName || personalInfo.lastName || "Fintera",
      secondLastName: personalInfo.secondLastName || undefined,
      email: personalInfo.email || "cliente@finterasoluciones.co",
      phone: personalInfo.phone || personalInfo.mobileNumber || "3000000000",
      residenceCity: personalInfo.city || "Bogotá D.C.",
      residenceDepartment: personalInfo.department || "Cundinamarca",
      residenceAddress: personalInfo.address || "Dirección registrada",
      monthlyIncome: Number(employmentInfo.monthlyIncome || 5000000),
      monthlyExpenses: Number(employmentInfo.monthlyExpenses || 2000000),
      occupation: employmentInfo.employmentType || "asalariado",
      companyName: employmentInfo.companyName || undefined,
      requestedAmount: Number(creditDetails.amount || creditDetails.requestedAmount || 120000000),
      termMonths: Number(creditDetails.termMonths || (creditDetails.termYears ? creditDetails.termYears * 12 : 180)),
      productCategory: creditDetails.creditType || "VIVIENDA_NO_VIS",
      ipAddress,
      userAgent,
      consentHabeasData: true,
    });

    const trackingToken = signMagicTrackingToken({
      applicationId: intakeResult.applicationId,
      clientId: intakeResult.clientId,
      fileNumber: intakeResult.fileNumber,
    });

    const portalMagicUrl = `/portal?trackToken=${encodeURIComponent(trackingToken)}`;
    const documentsMagicUrl = `/portal/documentos?trackToken=${encodeURIComponent(trackingToken)}&applicationId=${encodeURIComponent(intakeResult.applicationId)}`;

    const res = NextResponse.json(
      {
        success: true,
        id: intakeResult.applicationId,
        fileNumber: intakeResult.fileNumber,
        trackingToken,
        portalMagicUrl,
        documentsMagicUrl,
      },
      { status: 201 }
    );

    res.cookies.set(MAGIC_TRACK_COOKIE_NAME, trackingToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error("[API credits/apply] Error:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar la solicitud de crédito." },
      { status: 500 }
    );
  }
}
