import { CreditRequestFormData } from "@/app/lib/validation/creditRequestSchema";

const MONTH_NAMES = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

/**
 * Maps form data to Authorization Well PDF fields
 * 
 * @param data - Form data
 */
export function mapFormDataToAuthorizationFields(data: Partial<CreditRequestFormData>) {
    const today = new Date();

    const fullName = [
        data.firstName,
        data.secondName,
        data.firstLastName,
        data.secondLastName
    ].filter(Boolean).join(" ").toUpperCase();

    const city = data.residenceCity ? data.residenceCity.toUpperCase() : "BOGOTÁ D.C.";

    return {
        "declarant_name_header": fullName,
        "declarant_id_header": data.documentNumber || "",
        "sign_city": city,
        "sign_day": today.getDate().toString(),
        "sign_month": MONTH_NAMES[today.getMonth()],
        "sign_year": today.getFullYear().toString(),
        "declarant_name_footer": fullName,
        "declarant_id_footer": `${data.documentType || "CC"} ${data.documentNumber || ""}`,
        "id_expedition_place": data.documentIssuePlace?.toUpperCase() || ""
    };
}
