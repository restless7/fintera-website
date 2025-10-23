import { z } from "zod";

// Credit type enum
export const CreditTypeEnum = z.enum([
  "vivienda",
  "vehiculo", 
  "libranza",
  "libre_destino",
  "compra_de_cartera"
]);

// Document type enum
export const DocumentTypeEnum = z.enum(["cc", "ce", "pasaporte"]);

// Contact method enum
export const ContactMethodEnum = z.enum([
  "telefono",
  "correo", 
  "whatsapp",
  "sms"
]);

// Gender enum
export const GenderEnum = z.enum([
  "masculino",
  "femenino", 
  "no_binario",
  "prefiero_no_decirlo"
]);

// Occupation enum
export const OccupationEnum = z.enum([
  "asalariado",
  "independiente",
  "pensionado", 
  "otro"
]);

// Ethnic groups (optional)
export const EthnicGroupEnum = z.enum([
  "indigena",
  "rom_gitano",
  "raizal",
  "palenquero",
  "negro_mulato_afrocolombiano",
  "mestizo",
  "blanco",
  "otro",
  "no_informa"
]).optional();

// Step 1: Credit Details Schema
export const CreditDetailsSchema = z.object({
  creditType: CreditTypeEnum,
  requestedAmount: z.number()
    .min(1000000, "El monto mínimo es $1,000,000")
    .max(2000000000, "El monto máximo es $2,000,000,000"),
  termMonths: z.number()
    .min(6, "El plazo mínimo es 6 meses")
    .max(360, "El plazo máximo es 360 meses (30 años)")
});

// Step 2: Personal Information Schema
export const PersonalInfoSchema = z.object({
  firstName: z.string()
    .min(2, "El primer nombre debe tener al menos 2 caracteres")
    .max(50, "El primer nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios"),
  
  secondName: z.string()
    .max(50, "El segundo nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, "Solo se permiten letras y espacios")
    .optional()
    .or(z.literal("")),
    
  firstLastName: z.string()
    .min(2, "El primer apellido debe tener al menos 2 caracteres")
    .max(50, "El primer apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios"),
    
  secondLastName: z.string()
    .max(50, "El segundo apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, "Solo se permiten letras y espacios")
    .optional()
    .or(z.literal("")),
    
  documentType: DocumentTypeEnum,
  
  documentNumber: z.string()
    .min(6, "El número de documento debe tener al menos 6 caracteres")
    .max(15, "El número de documento no puede exceder 15 caracteres")
    .regex(/^[0-9A-Z\-]+$/, "Formato de documento inválido"),
    
  documentIssueCity: z.string()
    .min(2, "La ciudad de expedición es requerida")
    .max(100, "La ciudad no puede exceder 100 caracteres"),
    
  documentIssueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 100);
      return d <= today && d >= minDate;
    }, "La fecha de expedición debe ser válida"),
    
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
      return d <= eighteenYearsAgo;
    }, "Debe ser mayor de 18 años"),
    
  nationality: z.string()
    .min(2, "La nacionalidad es requerida")
    .max(50, "La nacionalidad no puede exceder 50 caracteres"),
    
  residenceCity: z.string()
    .min(2, "La ciudad de residencia es requerida")
    .max(100, "La ciudad no puede exceder 100 caracteres"),
    
  residenceAddress: z.string()
    .min(10, "La dirección debe tener al menos 10 caracteres")
    .max(200, "La dirección no puede exceder 200 caracteres"),
    
  email: z.string()
    .email("Formato de email inválido")
    .max(100, "El email no puede exceder 100 caracteres"),
    
  phoneNumber: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(/^[0-9\-\+\(\)\s]+$/, "Formato de teléfono inválido"),
    
  preferredContactMethod: ContactMethodEnum,
  gender: GenderEnum,
  ethnicGroup: EthnicGroupEnum
});

// Step 3: Employment/Financial Information Schema  
export const EmploymentInfoSchema = z.object({
  occupation: OccupationEnum,
  
  // Conditional field for independientes
  mainActivityDescription: z.string()
    .min(10, "Describa brevemente su actividad económica principal")
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
    
  ciiuCode: z.string()
    .max(10, "El código CIIU no puede exceder 10 caracteres")
    .optional()
    .or(z.literal("")),
    
  monthlyIncome: z.number()
    .min(1000000, "Los ingresos mensuales mínimos son $1,000,000")
    .max(1000000000, "Los ingresos mensuales máximos son $1,000,000,000"),
    
  monthlyExpenses: z.number()
    .min(500000, "Los gastos mensuales mínimos son $500,000")
    .max(1000000000, "Los gastos mensuales máximos son $1,000,000,000"),
    
  otherIncome: z.number()
    .min(0, "Los otros ingresos no pueden ser negativos")
    .max(1000000000, "Los otros ingresos máximos son $1,000,000,000")
    .optional()
    .or(z.literal(0)),
    
  totalAssets: z.number()
    .min(0, "Los activos no pueden ser negativos")
    .max(10000000000, "Los activos máximos son $10,000,000,000"),
    
  totalLiabilities: z.number()
    .min(0, "Los pasivos no pueden ser negativos")
    .max(10000000000, "Los pasivos máximos son $10,000,000,000"),
    
  taxDeclarationStatus: z.boolean(),
  foreignTaxResidency: z.boolean(),
  
  // Conditional fields for foreign tax residency
  foreignCountry: z.string()
    .min(2, "El país es requerido")
    .max(100, "El país no puede exceder 100 caracteres")
    .optional(),
    
  tinNumber: z.string()
    .min(5, "El TIN debe tener al menos 5 caracteres")
    .max(20, "El TIN no puede exceder 20 caracteres")
    .optional()
    .or(z.literal(""))
})
.refine((data) => {
  // If independiente, mainActivityDescription is required
  if (data.occupation === "independiente" && !data.mainActivityDescription) {
    return false;
  }
  return true;
}, {
  message: "La descripción de actividad es requerida para independientes",
  path: ["mainActivityDescription"]
})
.refine((data) => {
  // If foreign tax residency, country and TIN are required
  if (data.foreignTaxResidency && (!data.foreignCountry || !data.tinNumber)) {
    return false;
  }
  return true;
}, {
  message: "País y TIN son requeridos si tiene residencia fiscal en el exterior",
  path: ["foreignCountry"]
})
.refine((data) => {
  // Monthly expenses cannot exceed monthly income + other income
  const totalIncome = data.monthlyIncome + (data.otherIncome || 0);
  return data.monthlyExpenses <= totalIncome * 1.2; // Allow 20% margin
}, {
  message: "Los gastos mensuales no pueden ser muy superiores a los ingresos",
  path: ["monthlyExpenses"]
});

// Step 4: References Schema
export const ReferencesSchema = z.object({
  personalReferenceName: z.string()
    .min(5, "El nombre completo es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios"),
    
  personalReferencePhone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(/^[0-9\-\+\(\)\s]+$/, "Formato de teléfono inválido"),
    
  personalReferenceCity: z.string()
    .min(2, "La ciudad es requerida")
    .max(100, "La ciudad no puede exceder 100 caracteres"),
    
  familyReferenceName: z.string()
    .min(5, "El nombre completo es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios"),
    
  familyReferencePhone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(/^[0-9\-\+\(\)\s]+$/, "Formato de teléfono inválido"),
    
  familyReferenceCity: z.string()
    .min(2, "La ciudad es requerida")
    .max(100, "La ciudad no puede exceder 100 caracteres"),
    
  // Commercial reference (conditional for independientes)
  commercialReferenceName: z.string()
    .min(5, "El nombre completo es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios")
    .optional()
    .or(z.literal("")),
    
  commercialReferencePhone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(/^[0-9\-\+\(\)\s]+$/, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),
    
  commercialReferenceCity: z.string()
    .min(2, "La ciudad es requerida")
    .max(100, "La ciudad no puede exceder 100 caracteres")
    .optional()
    .or(z.literal(""))
});

// Step 5: Consent Schema
export const ConsentSchema = z.object({
  dataProcessingConsent: z.boolean()
    .refine((val) => val === true, "Debe autorizar el tratamiento de datos personales"),
    
  informationVeracityConsent: z.boolean()
    .refine((val) => val === true, "Debe confirmar la veracidad de la información")
});

// Complete form schema (all steps combined)
export const CompleteApplicationSchema = z.object({
  creditDetails: CreditDetailsSchema,
  personalInfo: PersonalInfoSchema,
  employmentInfo: EmploymentInfoSchema,
  references: ReferencesSchema,
  consent: ConsentSchema
});

// Type exports for TypeScript
export type CreditType = z.infer<typeof CreditTypeEnum>;
export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type ContactMethod = z.infer<typeof ContactMethodEnum>;
export type Gender = z.infer<typeof GenderEnum>;
export type Occupation = z.infer<typeof OccupationEnum>;
export type EthnicGroup = z.infer<typeof EthnicGroupEnum>;

export type CreditDetailsForm = z.infer<typeof CreditDetailsSchema>;
export type PersonalInfoForm = z.infer<typeof PersonalInfoSchema>;
export type EmploymentInfoForm = z.infer<typeof EmploymentInfoSchema>;
export type ReferencesForm = z.infer<typeof ReferencesSchema>;
export type ConsentForm = z.infer<typeof ConsentSchema>;
export type CompleteApplicationForm = z.infer<typeof CompleteApplicationSchema>;

// Form step type
export type FormStep = "creditDetails" | "personalInfo" | "employmentInfo" | "references" | "consent";

// Credit type labels
export const CREDIT_TYPE_LABELS: Record<CreditType, string> = {
  vivienda: "Crédito de Vivienda",
  vehiculo: "Crédito de Vehículo", 
  libranza: "Crédito de Libranza",
  libre_destino: "Crédito de Libre Destino",
  compra_de_cartera: "Compra de Cartera"
};

// Document type labels  
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cc: "Cédula de Ciudadanía",
  ce: "Cédula de Extranjería",
  pasaporte: "Pasaporte"
};

// Step configuration
export const FORM_STEPS: Array<{
  key: FormStep;
  title: string;
  description: string;
}> = [
  {
    key: "creditDetails",
    title: "Detalles del Crédito",
    description: "Tipo de crédito, monto y plazo"
  },
  {
    key: "personalInfo", 
    title: "Información Personal",
    description: "Datos personales y de contacto"
  },
  {
    key: "employmentInfo",
    title: "Información Laboral",
    description: "Ocupación e ingresos"
  },
  {
    key: "references",
    title: "Referencias",
    description: "Referencias personales y familiares"
  },
  {
    key: "consent",
    title: "Autorización",
    description: "Consentimientos y confirmación"
  }
];