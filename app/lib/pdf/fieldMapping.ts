import { CreditRequestFormData } from "@/app/lib/validation/creditRequestSchema";

/**
 * Maps form data to PDF field names
 * PDF field names extracted from SSF-vigente-marzo-2025.pdf
 * 
 * @param data - Form data (can be partial for testing)
 */
export function mapFormDataToPdfFields(data: Partial<CreditRequestFormData>) {
  const today = new Date();

  return {
    // Fecha de diligenciamiento (today's date)
    "Dia": today.getDate().toString(),
    "Mes": (today.getMonth() + 1).toString(),
    "Año": today.getFullYear().toString(),

    // Código de oficina


    // Producto solicitado: Siempre Crédito
    "Crédito": "Yes",

    // Tipos de crédito (en el campo detalle del producto)
    "Detalle producto 1": mapCreditTypes(data.creditTypes),

    // Monto y plazo
    "Monto1": data.requestedAmount ? data.requestedAmount.toString() : "",
    "Plazo1": data.termMonths ? data.termMonths.toString() : "",

    // Portafolio (esto va en un campo de radio group que necesitaríamos mapear según los valores del PDF)
    // "Rol": data.portfolio || "",

    // Datos personales
    "Primer nombre": data.firstName || "",
    "Segundo nombre": data.secondName || "",
    "Primer apellido": data.firstLastName || "",
    "Segundo apellido": data.secondLastName || "",

    // Tipo y número de documento
    "Tipo de documento": data.documentType ? mapDocumentType(data.documentType) : "",
    "Número de documento": data.documentNumber || "",

    // Fecha de expedición
    "Lugar de expedición": data.documentIssuePlace || "",
    "Día exp": data.documentIssueDate ? new Date(data.documentIssueDate).getDate().toString() : "",
    "Mes exp": data.documentIssueDate ? (new Date(data.documentIssueDate).getMonth() + 1).toString() : "",
    "Año exp": data.documentIssueDate ? new Date(data.documentIssueDate).getFullYear().toString() : "",

    // Nacionalidad y lugar de nacimiento
    "Nacionalidad": data.nationality || "",
    "Ciudad, departamento y país de nacimiento": data.birthCity && data.birthDepartment && data.birthCountry
      ? `${data.birthCity}, ${data.birthDepartment}, ${data.birthCountry}`
      : "",

    // Fecha de nacimiento
    "Día nac": data.birthDate ? new Date(data.birthDate).getDate().toString() : "",
    "Mes nac": data.birthDate ? (new Date(data.birthDate).getMonth() + 1).toString() : "",
    "Año nac": data.birthDate ? new Date(data.birthDate).getFullYear().toString() : "",

    // Residencia
    "Ciudad, departamente y país de residencia": data.residenceCity && data.residenceDepartment && data.residenceCountry
      ? `${data.residenceCity}, ${data.residenceDepartment}, ${data.residenceCountry}`
      : "",
    "Dirección de residencia": data.residenceAddress || "",

    // Contacto
    "Correo electrónico": data.email || "",
    "Número de celular": data.mobileNumber || "",

    // Medios de contacto preferidos (checkboxes)
    "Llamada telefónica": data.preferredContactMethods?.includes("llamada") ? "Yes" : "Off",
    "Correo electrónico2": data.preferredContactMethods?.includes("correo") ? "Yes" : "Off",
    "WhatsApp": data.preferredContactMethods?.includes("whatsapp") ? "Yes" : "Off",
    "Mensaje de texto": data.preferredContactMethods?.includes("sms") ? "Yes" : "Off",

    // Género (radio button)
    "Genero": data.gender ? mapGender(data.gender) : "",

    // Grupo étnico (radio button)
    "Grupo étnico": mapEthnicGroup(data.ethnicGroup),

    // PEP (radio button): OpciÃ³n19=Sí, OpciÃ³n2=No
    "PEP": data.isPEP ? "OpciÃ³n19" : "OpciÃ³n2",

    // Familiar en banco: OpciÃ³n18=Sí, OpciÃ³n1=No
    "Familiar": data.hasFamilyInBank ? "OpciÃ³n18" : "OpciÃ³n1",
    "Nombre familiar": data.familyNameInBank || "",

    // Ocupación (radio button)
    "Ocupación": data.occupation ? mapOccupation(data.occupation) : "",

    // Nombre de la empresa (para asalariado/pensionado)
    "Texto33": data.companyName || "",

    // Actividad económica (para independiente)
    "Actividad económica": data.mainEconomicActivity || "",
    "Código CIIU": data.ciiuCode || "",

    // Especifique otro (para ocupación "otro")
    "Cuál": data.otherOccupationDetail || "",

    // Referencias - Name includes address after "/"
    "Referencia personal": data.personalReferenceName
      ? `${data.personalReferenceName}${data.personalReferenceAddress ? ` / ${data.personalReferenceAddress}` : ""}`
      : "",
    "Ciudad referencia 1": data.personalReferenceCity && data.personalReferenceDept
      ? `${data.personalReferenceCity}, ${data.personalReferenceDept}`
      : "",
    "Teléfono 1": data.personalReferencePhone || "",

    "Referencia familiar": data.familyReferenceName
      ? `${data.familyReferenceName}${data.familyReferenceAddress ? ` / ${data.familyReferenceAddress}` : ""}`
      : "",
    "Ciudad referencia 2": data.familyReferenceCity && data.familyReferenceDept
      ? `${data.familyReferenceCity}, ${data.familyReferenceDept}`
      : "",
    "Teléfono 2": data.familyReferencePhone || "",

    "Referencia comercial": data.commercialReferenceName
      ? `${data.commercialReferenceName}${data.commercialReferenceAddress ? ` / ${data.commercialReferenceAddress}` : ""}`
      : "",
    "Ciudad referencia 3": data.commercialReferenceCity ? `${data.commercialReferenceCity}, ${data.commercialReferenceDept}` : "",
    "Teléfono 3": data.commercialReferencePhone || "",

    // Información financiera: Opción26=Sí, Opción1=No
    "Declara Renta": data.declaresTaxes ? "Opción26" : "Opción1",
    "Total ingresos mensuales": data.monthlyIncome ? data.monthlyIncome.toString() : "0",
    "Total gastos mensuales": data.monthlyExpenses ? data.monthlyExpenses.toString() : "0",
    "Total ingresos de otras fuentes": data.otherIncome ? data.otherIncome.toString() : "0",
    "Valor total de bienes": data.totalAssets ? data.totalAssets.toString() : "0",
    "Valor total de deudas": data.totalLiabilities ? data.totalLiabilities.toString() : "0",

    // Impuestos en el extranjero: OpciÃ³n27=Sí, OpciÃ³n28=No
    "Impuestos otro país": data.paysTaxesAbroad ? "OpciÃ³n27" : "OpciÃ³n28",
    "País en que pagas impuestos": data.foreignTaxCountry || "",
    "TIN": data.tin || "",
  };
}

/**
 * Helper functions to map enum values to PDF field values
 */

function mapDocumentType(type: string): string {
  // Tipo de documento: OpciÃ³n1=CC, OpciÃ³n2=RC, OpciÃ³n3=CE, OpciÃ³n4=TI, OpciÃ³n5=PAS
  const mapping: Record<string, string> = {
    "CC": "OpciÃ³n1",
    "RC": "OpciÃ³n2",
    "CE": "OpciÃ³n3",
    "TI": "OpciÃ³n4",
    "PAS": "OpciÃ³n5"
  };
  return mapping[type] || "OpciÃ³n1";
}

function mapGender(gender: string): string {
  // Genero: Opción6=Femenino, Opción7=Masculino, Opción9=Transexual, Opción6=No binario (hay duplicado)
  const mapping: Record<string, string> = {
    "femenino": "Opción6",
    "masculino": "Opción7",
    "transexual": "Opción9",
    "no_binario": "Opción6" // Note: PDF has duplicate Opción6
  };
  return mapping[gender] || "Opción7";
}

function mapEthnicGroup(group?: string): string {
  if (!group) return "OpciÃ³n10";

  // Grupo étnico: OpciÃ³n10=Ninguno, OpciÃ³n11=Gitano, OpciÃ³n12=Afro, OpciÃ³n13=Indígena, 
  // OpciÃ³n14=Raizal, OpciÃ³n15=Palenquero, OpciÃ³n1=Sin información
  const mapping: Record<string, string> = {
    "ninguno": "OpciÃ³n10",
    "gitano_rrom": "OpciÃ³n11",
    "afrocolombiano": "OpciÃ³n12",
    "indigena": "OpciÃ³n13",
    "raizal": "OpciÃ³n14",
    "palenquero": "OpciÃ³n15",
    "sin_informacion": "OpciÃ³n1"
  };
  return mapping[group] || "OpciÃ³n10";
}

function mapOccupation(occupation: string): string {
  // Ocupación: OpciÃ³n21=Asalariado, OpciÃ³n22=Independiente, OpciÃ³n23=Pensionado, OpciÃ³n2=Otro
  const mapping: Record<string, string> = {
    "asalariado": "OpciÃ³n21",
    "independiente": "OpciÃ³n22",
    "pensionado": "OpciÃ³n23",
    "otro": "OpciÃ³n2"
  };
  return mapping[occupation] || "OpciÃ³n21";
}

function mapCreditTypes(types?: string[]): string {
  // Validar que types exista y sea array
  if (!types || !Array.isArray(types) || types.length === 0) {
    return "";
  }

  // Map credit type codes to readable names
  const mapping: Record<string, string> = {
    "vivienda": "Crédito de Vivienda - Compra o construcción de vivienda",
    "libranza": "Crédito de Libranza - Descuento directo de nómina",
    "libre_destino": "Crédito de Libre Destino",
    "compra_cartera": "Compra de Cartera - Unificación de deudas"
  };

  return types.map(type => mapping[type] || type).join(", ");
}
