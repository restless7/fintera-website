import { z } from "zod";

export const creditRequestSchema = z.object({
  // 1. Solicitud de crédito
  requestDate: z.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === 'string') return new Date(val);
      return new Date();
    },
    z.date()
  ),
  officeCode: z.string().optional(),
  creditTypes: z.array(
    z.enum([
      "vivienda",
      "vehiculo",
      "libranza",
      "libre_destino",
      "compra_cartera"
    ])
  ).min(1, "Seleccione al menos un tipo de crédito"),
  requestedAmount: z.number().positive("El monto debe ser positivo").optional(),
  termMonths: z.number().int().positive("El plazo debe ser positivo").optional(),

  // 2. Datos personales
  firstName: z.string().min(2, "El primer nombre es requerido"),
  secondName: z.string().optional(),
  firstLastName: z.string().min(2, "El primer apellido es requerido"),
  secondLastName: z.string().optional(),
  documentType: z.enum(["CC", "RC", "CE", "TI", "PAS"], {
    required_error: "Seleccione un tipo de documento"
  }),
  documentNumber: z.string().min(5, "Número de documento inválido"),
  documentIssuePlace: z.string().min(2, "Lugar de expedición es requerido"),
  documentIssueDate: z.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === 'string') return new Date(val);
      return val;
    },
    z.date({ required_error: "Fecha de expedición es requerida" })
  ),
  nationality: z.string().min(2, "Nacionalidad es requerida"),
  birthCity: z.string().min(2, "Ciudad de nacimiento es requerida"),
  birthDepartment: z.string().min(2, "Departamento de nacimiento es requerido"),
  birthCountry: z.string().default("Colombia"),
  birthDate: z.preprocess(
    (val) => {
      if (val instanceof Date) return val;
      if (typeof val === 'string') return new Date(val);
      return val;
    },
    z.date({ required_error: "Fecha de nacimiento es requerida" })
  ),
  residenceCity: z.string().min(2, "Ciudad de residencia es requerida"),
  residenceDepartment: z.string().min(2, "Departamento de residencia es requerido"),
  residenceCountry: z.string().default("Colombia"),
  residenceAddress: z.string().min(5, "Dirección de residencia es requerida"),
  email: z.string().email("Correo electrónico inválido"),
  mobileNumber: z.string().min(10, "Número de celular debe tener al menos 10 dígitos"),
  preferredContactMethods: z.array(
    z.enum(["llamada", "correo", "whatsapp", "sms"])
  ).min(1, "Seleccione al menos un medio de contacto"),
  gender: z.enum(["femenino", "masculino", "transexual", "no_binario"], {
    required_error: "Seleccione un género"
  }),
  ethnicGroup: z.enum([
    "ninguno",
    "gitano_rrom",
    "afrocolombiano",
    "indigena",
    "raizal",
    "palenquero",
    "sin_informacion"
  ]).optional(),
  isPEP: z.boolean().default(false),
  hasFamilyInBank: z.boolean().default(false),
  familyNameInBank: z.string().optional(),

  // 3. Datos laborales
  occupation: z.enum(["asalariado", "independiente", "pensionado", "otro"], {
    required_error: "Seleccione una ocupación"
  }),
  companyName: z.string().optional(),
  otherOccupationDetail: z.string().optional(),
  mainEconomicActivity: z.string().optional(),
  ciiuCode: z.string().optional(),

  // 4. Referencias
  personalReferenceName: z.string().min(2, "Nombre de referencia personal es requerido"),
  personalReferenceCity: z.string().min(2, "Ciudad de referencia personal es requerida"),
  personalReferenceDept: z.string().min(2, "Departamento de referencia personal es requerido"),
  personalReferencePhone: z.string().min(10, "Teléfono de referencia personal debe tener al menos 10 dígitos"),
  
  familyReferenceName: z.string().min(2, "Nombre de referencia familiar es requerido"),
  familyReferenceCity: z.string().min(2, "Ciudad de referencia familiar es requerida"),
  familyReferenceDept: z.string().min(2, "Departamento de referencia familiar es requerido"),
  familyReferencePhone: z.string().min(10, "Teléfono de referencia familiar debe tener al menos 10 dígitos"),
  
  commercialReferenceName: z.string().optional(),
  commercialReferenceCity: z.string().optional(),
  commercialReferenceDept: z.string().optional(),
  commercialReferencePhone: z.string().optional(),

  // 5. Información financiera
  declaresTaxes: z.boolean().default(false),
  monthlyIncome: z.number().positive("Los ingresos mensuales deben ser positivos"),
  monthlyExpenses: z.number().positive("Los gastos mensuales deben ser positivos"),
  otherIncome: z.number().nonnegative("Otros ingresos no pueden ser negativos").optional(),
  totalAssets: z.number().nonnegative("El valor de bienes no puede ser negativo"),
  totalLiabilities: z.number().nonnegative("El valor de deudas no puede ser negativo"),
  paysTaxesAbroad: z.boolean().default(false),
  foreignTaxCountry: z.string().optional(),
  tin: z.string().optional(),
}).refine((data) => {
  // If occupation is "asalariado" or "pensionado", require companyName
  if (data.occupation === "asalariado" || data.occupation === "pensionado") {
    return data.companyName && data.companyName.trim().length > 0;
  }
  return true;
}, {
  message: "Por favor especifique el nombre de la empresa",
  path: ["companyName"]
}).refine((data) => {
  // If occupation is "otro", require otherOccupationDetail
  if (data.occupation === "otro") {
    return data.otherOccupationDetail && data.otherOccupationDetail.trim().length > 0;
  }
  return true;
}, {
  message: "Por favor especifique su ocupación",
  path: ["otherOccupationDetail"]
}).refine((data) => {
  // If occupation is "independiente", require commercial reference
  if (data.occupation === "independiente") {
    return (
      data.commercialReferenceName &&
      data.commercialReferenceCity &&
      data.commercialReferenceDept &&
      data.commercialReferencePhone
    );
  }
  return true;
}, {
  message: "Referencia comercial es requerida para trabajadores independientes",
  path: ["commercialReferenceName"]
}).refine((data) => {
  // If paysTaxesAbroad is true, require foreignTaxCountry and tin
  if (data.paysTaxesAbroad) {
    return data.foreignTaxCountry && data.tin;
  }
  return true;
}, {
  message: "País y TIN son requeridos si paga impuestos en el extranjero",
  path: ["foreignTaxCountry"]
}).refine((data) => {
  // If hasFamilyInBank is true, require familyNameInBank
  if (data.hasFamilyInBank) {
    return data.familyNameInBank;
  }
  return true;
}, {
  message: "Nombre del familiar es requerido",
  path: ["familyNameInBank"]
});

export type CreditRequestFormData = z.infer<typeof creditRequestSchema>;
