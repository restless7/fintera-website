import { CreditRequestFormData } from "@/app/lib/validation/creditRequestSchema";

/**
 * Maps form data to PDF field names
 * PDF field names extracted from SSF-vigente-marzo-2025.pdf
 */
export function mapFormDataToPdfFields(data: CreditRequestFormData) {
  const today = new Date();
  
  return {
    // Fecha de diligenciamiento (today's date)
    "Dia": today.getDate().toString(),
    "Mes": (today.getMonth() + 1).toString(),
    "Año": today.getFullYear().toString(),
    
    // Código de oficina
    "Codigo de oficina": data.officeCode || "",
    
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
    "Primer nombre": data.firstName,
    "Segundo nombre": data.secondName || "",
    "Primer apellido": data.firstLastName,
    "Segundo apellido": data.secondLastName || "",
    
    // Tipo y número de documento
    "Tipo de documento": mapDocumentType(data.documentType),
    "Número de documento": data.documentNumber,
    
    // Fecha de expedición
    "Lugar de expedición": data.documentIssuePlace,
    "Día exp": data.documentIssueDate ? new Date(data.documentIssueDate).getDate().toString() : "",
    "Mes exp": data.documentIssueDate ? (new Date(data.documentIssueDate).getMonth() + 1).toString() : "",
    "Año exp": data.documentIssueDate ? new Date(data.documentIssueDate).getFullYear().toString() : "",
    
    // Nacionalidad y lugar de nacimiento
    "Nacionalidad": data.nationality,
    "Ciudad, departamento y país de nacimiento": `${data.birthCity}, ${data.birthDepartment}, ${data.birthCountry}`,
    
    // Fecha de nacimiento
    "Día nac": data.birthDate ? new Date(data.birthDate).getDate().toString() : "",
    "Mes nac": data.birthDate ? (new Date(data.birthDate).getMonth() + 1).toString() : "",
    "Año nac": data.birthDate ? new Date(data.birthDate).getFullYear().toString() : "",
    
    // Residencia
    "Ciudad, departamente y país de residencia": `${data.residenceCity}, ${data.residenceDepartment}, ${data.residenceCountry}`,
    "Dirección de residencia": data.residenceAddress,
    
    // Contacto
    "Correo electrónico": data.email,
    "Número de celular": data.mobileNumber,
    
    // Medios de contacto preferidos (checkboxes)
    "Llamada telefónica": data.preferredContactMethods?.includes("llamada") ? "Yes" : "Off",
    "Correo electrónico2": data.preferredContactMethods?.includes("correo") ? "Yes" : "Off",
    "WhatsApp": data.preferredContactMethods?.includes("whatsapp") ? "Yes" : "Off",
    "Mensaje de texto": data.preferredContactMethods?.includes("sms") ? "Yes" : "Off",
    
    // Género (radio button)
    "Genero": mapGender(data.gender),
    
    // Grupo étnico (radio button)
    "Grupo étnico": mapEthnicGroup(data.ethnicGroup),
    
    // PEP (radio button): Opción19=Sí, Opción2=No
    "PEP": data.isPEP ? "Opción19" : "Opción2",
    
    // Familiar en banco: Opción18=Sí, Opción1=No
    "Familiar": data.hasFamilyInBank ? "Opción18" : "Opción1",
    "Nombre familiar": data.familyNameInBank || "",
    
    // Ocupación (radio button)
    "Ocupación": mapOccupation(data.occupation),
    
    // Nombre de la empresa (para asalariado/pensionado)
    "Texto33": data.companyName || "",
    
    // Actividad económica (para independiente)
    "Actividad económica": data.mainEconomicActivity || "",
    "Código CIIU": data.ciiuCode || "",
    
    // Especifique otro (para ocupación "otro")
    "Cuál": data.otherOccupationDetail || "",
    
    // Referencias
    "Referencia personal": data.personalReferenceName,
    "Ciudad referencia 1": `${data.personalReferenceCity}, ${data.personalReferenceDept}`,
    "Teléfono 1": data.personalReferencePhone,
    
    "Referencia familiar": data.familyReferenceName,
    "Ciudad referencia 2": `${data.familyReferenceCity}, ${data.familyReferenceDept}`,
    "Teléfono 2": data.familyReferencePhone,
    
    "Referencia comercial": data.commercialReferenceName || "",
    "Ciudad referencia 3": data.commercialReferenceCity ? `${data.commercialReferenceCity}, ${data.commercialReferenceDept}` : "",
    "Teléfono 3": data.commercialReferencePhone || "",
    
    // Información financiera: Opción26=Sí, Opción1=No
    "Declara Renta": data.declaresTaxes ? "Opción26" : "Opción1",
    "Total ingresos mensuales": data.monthlyIncome.toString(),
    "Total gastos mensuales": data.monthlyExpenses.toString(),
    "Total ingresos de otras fuentes": data.otherIncome ? data.otherIncome.toString() : "0",
    "Valor total de bienes": data.totalAssets.toString(),
    "Valor total de deudas": data.totalLiabilities.toString(),
    
    // Impuestos en el extranjero: Opción27=Sí, Opción28=No
    "Impuestos otro país": data.paysTaxesAbroad ? "Opción27" : "Opción28",
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
    "CC": "Opción1",
    "RC": "Opción2",
    "CE": "Opción3",
    "TI": "Opción4",
    "PAS": "Opción5"
  };
  return mapping[type] || "Opción1";
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
  if (!group) return "Opción10";
  
  // Grupo étnico: Opción10=Ninguno, Opción11=Gitano, Opción12=Afro, Opción13=Indígena, 
  // Opción14=Raizal, Opción15=Palenquero, Opción1=Sin información
  const mapping: Record<string, string> = {
    "ninguno": "Opción10",
    "gitano_rrom": "Opción11",
    "afrocolombiano": "Opción12",
    "indigena": "Opción13",
    "raizal": "Opción14",
    "palenquero": "Opción15",
    "sin_informacion": "Opción1"
  };
  return mapping[group] || "Opción10";
}

function mapOccupation(occupation: string): string {
  // Ocupación: Opción21=Asalariado, Opción22=Independiente, Opción23=Pensionado, Opción2=Otro
  const mapping: Record<string, string> = {
    "asalariado": "Opción21",
    "independiente": "Opción22",
    "pensionado": "Opción23",
    "otro": "Opción2"
  };
  return mapping[occupation] || "Opción21";
}

function mapCreditTypes(types: string[]): string {
  // Map credit type codes to readable names
  const mapping: Record<string, string> = {
    "vivienda": "Crédito de Vivienda - Compra o construcción de vivienda",
    "vehiculo": "Crédito de Vehículo - Compra de vehículo nuevo o usado",
    "libranza": "Crédito de Libranza - Descuento directo de nómina",
    "libre_destino": "Crédito de Libre Destino - Sin destinación específica",
    "compra_cartera": "Compra de Cartera - Unificación de deudas"
  };
  
  return types.map(type => mapping[type] || type).join(", ");
}
