import { DocumentCategory } from "@/prisma/generated/client";
import { ViviendaDocumentFacts, RequirementApplicability, VIVIENDA_DOCUMENT_CATALOG_VERSION } from "./portal-contracts";

// Exact public intake labels and canonical simulator aliases; no generic credit matches.
const VIVIENDA_PRODUCTS = new Set([
  "VIVIENDA_VIS", "VIVIENDA_NO_VIS", "LEASING", "LEASING_HABITACIONAL", "HIPOTECARIO_VIS", "HIPOTECARIO_NO_VIS",
  "LEASING-HABITACIONAL", "HIPOTECARIO-VIS", "HIPOTECARIO-NOVIS", "LEASING-VIS", "LEASING-NOVIS", "VIVIENDA",
  ...["Leasing Hab Nuevo", "Leasing Hab Usado", "Hipotecario Nuevo", "Hipotecario Usado", "Compra de cartera", "Remodelación"].map(v => `Vivienda - ${v}`.toUpperCase()),
]);
export function supportsViviendaDocuments(product: string): boolean { return VIVIENDA_PRODUCTS.has(product.trim().toUpperCase()); }
export interface ViviendaCatalogItem {
  code: string; slotKey: string; catalogVersion: string; title: string; description: string;
  category: DocumentCategory; periodLabel: string | null; applicability: RequirementApplicability;
  applicabilityReason: string; isMandatory: boolean;
}
export function buildViviendaRequirements(facts: ViviendaDocumentFacts): ViviendaCatalogItem[] {
  const items: ViviendaCatalogItem[] = [];
  const add = (code: string, title: string, category: DocumentCategory, applies: boolean | null, periodLabel: string | null = null, slotKey = "DOCUMENT") => {
    items.push({ code, slotKey, catalogVersion: VIVIENDA_DOCUMENT_CATALOG_VERSION, title, category, periodLabel,
      description: "Requisito general de vivienda definido por Fintera. Los requisitos particulares del banco se muestran por separado.",
      applicability: applies === null ? "NEEDS_INFORMATION" : applies ? "APPLIES" : "NOT_APPLICABLE",
      applicabilityReason: applies === null ? "Confirme la información de su perfil para determinar si se requiere." : applies ? "Aplica según el perfil confirmado." : "No aplica según el perfil confirmado.", isMandatory: true });
  };
  const employed = facts.occupation === "UNKNOWN" ? null : facts.occupation === "ASALARIADO";
  const independent = facts.occupation === "UNKNOWN" ? null : facts.occupation === "INDEPENDIENTE";
  const independentFlag = (value: boolean | null) => independent === false ? false : independent === null ? null : value;
  add("IDENTITY", "Documento de identidad", DocumentCategory.IDENTIFICATION, true);
  for (let month = 1; month <= 2; month++) add("PAYSLIP", "Desprendible de nómina", DocumentCategory.LABOR_INCOME, employed, month === 1 ? "Mes más reciente" : "Mes anterior", `MONTH_${month}`);
  add("EMPLOYMENT_CERTIFICATE", "Certificado laboral", DocumentCategory.LABOR_INCOME, employed);
  add("INCOME_TAX_RETURN", "Última declaración de renta", DocumentCategory.TAX_FINANCIAL, independent === true ? true : employed === true ? facts.declaresIncomeTax : null, "Última declaración presentada");
  add("RUT", "Registro Único Tributario (RUT)", DocumentCategory.TAX_FINANCIAL, independent);
  add("PROPERTY_OWNERSHIP_CERTIFICATE", "Certificado de tradición y libertad de los inmuebles arrendados", DocumentCategory.PROPERTY_DOCS, independentFlag(facts.propertyRentalIncome));
  add("PROPERTY_RENTAL_LEASES", "Contratos de arrendamiento de inmuebles", DocumentCategory.INDEPENDENT_INCOME, independentFlag(facts.propertyRentalIncome));
  add("VEHICLE_RENTAL_COMPANY_CONTRACTS", "Contratos con las empresas de alquiler de vehículos", DocumentCategory.INDEPENDENT_INCOME, independentFlag(facts.vehicleRentalIncome));
  add("VEHICLE_OWNERSHIP_CARDS", "Tarjetas de propiedad de los vehículos", DocumentCategory.INDEPENDENT_INCOME, independentFlag(facts.vehicleRentalIncome));
  add("VEHICLE_RENTAL_COLLECTION_ACCOUNTS", "Cuentas de cobro por alquiler de vehículos", DocumentCategory.INDEPENDENT_INCOME, independentFlag(facts.vehicleRentalIncome));
  add("GENERAL_INCOME_PROOF", "Soportes de ingresos de la actividad independiente", DocumentCategory.INDEPENDENT_INCOME, independentFlag(facts.propertyRentalIncome === null || facts.vehicleRentalIncome === null ? null : !facts.propertyRentalIncome && !facts.vehicleRentalIncome));
  for (let month = 1; month <= 3; month++) add("BANK_STATEMENT", "Extractos bancarios", DocumentCategory.INDEPENDENT_INCOME, independent, ["Mes más reciente", "Mes anterior", "Tercer mes más reciente"][month - 1], `MONTH_${month}`);
  add("CHAMBER_OF_COMMERCE", "Certificado de Cámara de Comercio", DocumentCategory.INDEPENDENT_INCOME, independentFlag(facts.chamberOfCommerceApplies));
  add("ANNUAL_FINANCIAL_STATEMENTS", "Últimos estados financieros anuales", DocumentCategory.TAX_FINANCIAL, independentFlag(facts.annualFinancialStatementsApply), "Último ejercicio anual disponible");
  return items;
}
