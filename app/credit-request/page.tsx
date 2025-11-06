"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { creditRequestSchema, type CreditRequestFormData } from "@/app/lib/validation/creditRequestSchema";
import { SectionCard } from "@/app/components/form/SectionCard";
import { InputField } from "@/app/components/form/InputField";
import { SelectField } from "@/app/components/form/SelectField";
import { CheckboxGroup } from "@/app/components/form/CheckboxGroup";
import { SubmitButton } from "@/app/components/ui/SubmitButton";
import { DownloadPrompt } from "@/app/components/ui/DownloadPrompt";
import { InstructionsModal } from "@/app/components/ui/InstructionsModal";
import { fetchAndDownloadPDF } from "@/app/lib/pdf/downloadHelper";

export default function CreditRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<CreditRequestFormData | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm<CreditRequestFormData>({
    resolver: zodResolver(creditRequestSchema),
    defaultValues: {
      productsRequested: [],
      preferredContactMethods: [],
      isPEP: false,
      hasFamilyInBank: false,
      declaresTaxes: false,
      paysTaxesAbroad: false,
      birthCountry: "Colombia",
      residenceCountry: "Colombia"
    }
  });

  const occupation = watch("occupation");
  const paysTaxesAbroad = watch("paysTaxesAbroad");
  const hasFamilyInBank = watch("hasFamilyInBank");

  const onSubmit = async (data: CreditRequestFormData) => {
    setIsSubmitting(true);
    try {
      // Dates are already converted by Zod schema
      // Save to database
      const response = await fetch("/api/credit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        // Save form data for PDF generation
        setSubmittedData(data);
        
        // Show download modal
        setShowDownloadModal(true);
        
        toast.success("¡Solicitud guardada exitosamente!");
      } else {
        toast.error(result.message || "Error al enviar la solicitud");
      }
    } catch (error) {
      toast.error("Error de conexión. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!submittedData) return;
    
    toast.loading("Generando PDF...");
    
    const result = await fetchAndDownloadPDF(submittedData);
    
    toast.dismiss();
    
    if (result.success) {
      toast.success("¡PDF descargado exitosamente!");
      // Close download modal and mark as submitted
      setShowDownloadModal(false);
      setIsSubmitted(true);
    } else {
      toast.error(result.error || "Error al generar el PDF");
    }
  };

  const handleViewInstructions = () => {
    setShowDownloadModal(false);
    setShowInstructionsModal(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Gracias por diligenciar tu solicitud de crédito!
            </h1>
            <p className="text-gray-600 mb-8">
              Hemos recibido tu información y nuestro equipo la revisará en las próximas 24-48 horas.
              Te contactaremos a través de los medios que indicaste.
            </p>
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Próximos pasos:</h3>
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">1.</span>
                  <span>Revisaremos tu información y documentación</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">2.</span>
                  <span>Te contactaremos para confirmar detalles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">3.</span>
                  <span>Recibirás una respuesta sobre tu solicitud</span>
                </li>
              </ul>
            </div>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
            >
              Volver al inicio
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Solicitud de Crédito
          </h1>
          <p className="text-lg text-gray-600">
            Completa la información para iniciar tu proceso de vinculación
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-full shadow-md p-2">
            <div className="flex items-center justify-between relative">
              <div
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                style={{ width: `${(currentSection / 5) * 100}%` }}
              />
              {[1, 2, 3, 4, 5].map((section) => (
                <div
                  key={section}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentSection >= section
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {section}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Solicitud de Producto */}
          <SectionCard
            title="1. Solicitud de Producto"
            description="Seleccione los productos y servicios que desea solicitar"
          >
            <InputField
              label="Código de oficina"
              {...register("officeCode")}
              error={errors.officeCode?.message}
              placeholder="Opcional"
            />

            <CheckboxGroup
              label="Productos solicitados"
              options={[
                { value: "cuenta_ahorros", label: "Cuenta de Ahorros" },
                { value: "cuenta_corriente", label: "Cuenta Corriente" },
                { value: "credito", label: "Crédito" },
                { value: "cdt", label: "CDT" },
                { value: "tarjeta_credito", label: "Tarjeta de Crédito" },
                { value: "portafolio", label: "Portafolio" },
                { value: "leasing", label: "Leasing" },
                { value: "fondo_inversion", label: "Fondo de Inversión" }
              ]}
              name="productsRequested"
              register={register}
              error={errors.productsRequested?.message}
              required
            />

            <InputField
              label="Detalle del producto"
              {...register("productDetail")}
              error={errors.productDetail?.message}
              placeholder="Especifique detalles adicionales"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Monto o cupo solicitado"
                type="number"
                {...register("requestedAmount", { valueAsNumber: true })}
                error={errors.requestedAmount?.message}
                placeholder="$0"
              />
              <InputField
                label="Plazo en meses"
                type="number"
                {...register("termMonths", { valueAsNumber: true })}
                error={errors.termMonths?.message}
                placeholder="12"
              />
            </div>

            {/* Portfolio Information - Display Only */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Nuestros Portafolios</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">Masivo</h4>
                  <p className="text-sm text-gray-700">Paso a paso, Impulsa, Joven</p>
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-700 mb-2">Preferente</h4>
                  <p className="text-sm text-gray-700">Preferente, Preferente VV, Preferente Élite</p>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-700 mb-2">Premium</h4>
                  <p className="text-sm text-gray-700">Premium, Premium Ultra</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Transversal</h4>
                  <p className="text-sm text-gray-700">Básico, Legado</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Datos Personales */}
          <SectionCard
            title="2. Datos Personales"
            description="Ingrese su información personal completa"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Primer Nombre"
                {...register("firstName")}
                error={errors.firstName?.message}
                required
              />
              <InputField
                label="Segundo Nombre"
                {...register("secondName")}
                error={errors.secondName?.message}
              />
              <InputField
                label="Primer Apellido"
                {...register("firstLastName")}
                error={errors.firstLastName?.message}
                required
              />
              <InputField
                label="Segundo Apellido"
                {...register("secondLastName")}
                error={errors.secondLastName?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Tipo de Documento"
                options={[
                  { value: "CC", label: "Cédula de Ciudadanía" },
                  { value: "RC", label: "Registro Civil" },
                  { value: "CE", label: "Cédula de Extranjería" },
                  { value: "TI", label: "Tarjeta de Identidad" },
                  { value: "PAS", label: "Pasaporte" }
                ]}
                {...register("documentType")}
                error={errors.documentType?.message}
                required
              />
              <InputField
                label="Número de Documento"
                {...register("documentNumber")}
                error={errors.documentNumber?.message}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Lugar de Expedición"
                {...register("documentIssuePlace")}
                error={errors.documentIssuePlace?.message}
                required
              />
              <InputField
                label="Fecha de Expedición"
                type="date"
                {...register("documentIssueDate")}
                error={errors.documentIssueDate?.message}
                required
              />
            </div>

            <InputField
              label="Nacionalidad"
              {...register("nationality")}
              error={errors.nationality?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Ciudad de Nacimiento"
                {...register("birthCity")}
                error={errors.birthCity?.message}
                required
              />
              <InputField
                label="Departamento de Nacimiento"
                {...register("birthDepartment")}
                error={errors.birthDepartment?.message}
                required
              />
              <InputField
                label="País de Nacimiento"
                {...register("birthCountry")}
                error={errors.birthCountry?.message}
                defaultValue="Colombia"
                required
              />
            </div>

            <InputField
              label="Fecha de Nacimiento"
              type="date"
              {...register("birthDate")}
              error={errors.birthDate?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Ciudad de Residencia"
                {...register("residenceCity")}
                error={errors.residenceCity?.message}
                required
              />
              <InputField
                label="Departamento de Residencia"
                {...register("residenceDepartment")}
                error={errors.residenceDepartment?.message}
                required
              />
              <InputField
                label="País de Residencia"
                {...register("residenceCountry")}
                error={errors.residenceCountry?.message}
                defaultValue="Colombia"
                required
              />
            </div>

            <InputField
              label="Dirección de Residencia"
              {...register("residenceAddress")}
              error={errors.residenceAddress?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Correo Electrónico"
                type="email"
                {...register("email")}
                error={errors.email?.message}
                required
              />
              <InputField
                label="Número de Celular"
                type="tel"
                {...register("mobileNumber")}
                error={errors.mobileNumber?.message}
                required
              />
            </div>

            <CheckboxGroup
              label="Medios de contacto preferidos"
              options={[
                { value: "llamada", label: "Llamada telefónica" },
                { value: "correo", label: "Correo electrónico" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "sms", label: "SMS" }
              ]}
              name="preferredContactMethods"
              register={register}
              error={errors.preferredContactMethods?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Género"
                options={[
                  { value: "femenino", label: "Femenino" },
                  { value: "masculino", label: "Masculino" },
                  { value: "transexual", label: "Transexual" },
                  { value: "no_binario", label: "No binario" }
                ]}
                {...register("gender")}
                error={errors.gender?.message}
                required
              />
              <SelectField
                label="Grupo Étnico"
                options={[
                  { value: "ninguno", label: "Ninguno" },
                  { value: "gitano_rrom", label: "Gitano o Rrom" },
                  { value: "afrocolombiano", label: "Afrocolombiano" },
                  { value: "indigena", label: "Indígena" },
                  { value: "raizal", label: "Raizal" },
                  { value: "palenquero", label: "Palenquero" },
                  { value: "sin_informacion", label: "Sin información" }
                ]}
                {...register("ethnicGroup")}
                error={errors.ethnicGroup?.message}
              />
            </div>

            <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isPEP")}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">
                  ¿Es usted Persona Políticamente Expuesta (PEP)?
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("hasFamilyInBank")}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">
                  ¿Tiene familiares trabajando en Banco de Bogotá o filiales?
                </span>
              </label>

              {hasFamilyInBank && (
                <InputField
                  label="Nombre del familiar"
                  {...register("familyNameInBank")}
                  error={errors.familyNameInBank?.message}
                  required
                />
              )}
            </div>
          </SectionCard>

          {/* Section 3: Datos Laborales */}
          <SectionCard
            title="3. Datos Laborales"
            description="Información sobre su ocupación y actividad económica"
          >
            <SelectField
              label="Ocupación"
              options={[
                { value: "asalariado", label: "Asalariado" },
                { value: "independiente", label: "Independiente" },
                { value: "pensionado", label: "Pensionado" },
                { value: "otro", label: "Otro" }
              ]}
              {...register("occupation")}
              error={errors.occupation?.message}
              required
            />

            {(occupation === "asalariado" || occupation === "pensionado") && (
              <InputField
                label="Nombre de la empresa"
                {...register("companyName")}
                error={errors.companyName?.message}
                placeholder="Nombre de la empresa o entidad"
                required
              />
            )}

            {occupation === "otro" && (
              <InputField
                label="Especifique su ocupación"
                {...register("otherOccupationDetail")}
                error={errors.otherOccupationDetail?.message}
                placeholder="Describa su ocupación"
                required
              />
            )}

            {occupation === "independiente" && (
              <>
                <InputField
                  label="Actividad Económica Principal"
                  {...register("mainEconomicActivity")}
                  error={errors.mainEconomicActivity?.message}
                  placeholder="Describa su actividad económica"
                />
                <InputField
                  label="Código CIIU"
                  {...register("ciiuCode")}
                  error={errors.ciiuCode?.message}
                  placeholder="Código de Clasificación Industrial"
                />
              </>
            )}
          </SectionCard>

          {/* Section 4: Referencias */}
          <SectionCard
            title="4. Referencias"
            description="Proporcione información de sus referencias personales, familiares y comerciales"
          >
            <div className="space-y-6">
              {/* Personal Reference */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900">Referencia Personal</h3>
                <InputField
                  label="Nombre Completo"
                  {...register("personalReferenceName")}
                  error={errors.personalReferenceName?.message}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Ciudad"
                    {...register("personalReferenceCity")}
                    error={errors.personalReferenceCity?.message}
                    required
                  />
                  <InputField
                    label="Departamento"
                    {...register("personalReferenceDept")}
                    error={errors.personalReferenceDept?.message}
                    required
                  />
                  <InputField
                    label="Teléfono"
                    type="tel"
                    {...register("personalReferencePhone")}
                    error={errors.personalReferencePhone?.message}
                    required
                  />
                </div>
              </div>

              {/* Family Reference */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                <h3 className="font-semibold text-gray-900">Referencia Familiar</h3>
                <InputField
                  label="Nombre Completo"
                  {...register("familyReferenceName")}
                  error={errors.familyReferenceName?.message}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Ciudad"
                    {...register("familyReferenceCity")}
                    error={errors.familyReferenceCity?.message}
                    required
                  />
                  <InputField
                    label="Departamento"
                    {...register("familyReferenceDept")}
                    error={errors.familyReferenceDept?.message}
                    required
                  />
                  <InputField
                    label="Teléfono"
                    type="tel"
                    {...register("familyReferencePhone")}
                    error={errors.familyReferencePhone?.message}
                    required
                  />
                </div>
              </div>

              {/* Commercial Reference - Only for independientes */}
              {occupation === "independiente" && (
                <div className="p-4 bg-blue-50 rounded-xl space-y-4">
                  <h3 className="font-semibold text-gray-900">Referencia Comercial</h3>
                  <InputField
                    label="Nombre Completo"
                    {...register("commercialReferenceName")}
                    error={errors.commercialReferenceName?.message}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                      label="Ciudad"
                      {...register("commercialReferenceCity")}
                      error={errors.commercialReferenceCity?.message}
                      required
                    />
                    <InputField
                      label="Departamento"
                      {...register("commercialReferenceDept")}
                      error={errors.commercialReferenceDept?.message}
                      required
                    />
                    <InputField
                      label="Teléfono"
                      type="tel"
                      {...register("commercialReferencePhone")}
                      error={errors.commercialReferencePhone?.message}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 5: Información Financiera */}
          <SectionCard
            title="5. Información Financiera"
            description="Detalles sobre sus ingresos, gastos y situación financiera"
          >
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                {...register("declaresTaxes")}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">
                ¿Declara renta?
              </span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Total Ingresos Mensuales"
                type="number"
                {...register("monthlyIncome", { valueAsNumber: true })}
                error={errors.monthlyIncome?.message}
                placeholder="$0"
                required
              />
              <InputField
                label="Total Gastos Mensuales"
                type="number"
                {...register("monthlyExpenses", { valueAsNumber: true })}
                error={errors.monthlyExpenses?.message}
                placeholder="$0"
                required
              />
              <InputField
                label="Ingresos de Otras Fuentes"
                type="number"
                {...register("otherIncome", { valueAsNumber: true })}
                error={errors.otherIncome?.message}
                placeholder="$0"
              />
              <InputField
                label="Valor Total de Bienes"
                type="number"
                {...register("totalAssets", { valueAsNumber: true })}
                error={errors.totalAssets?.message}
                placeholder="$0"
                required
              />
              <InputField
                label="Valor Total de Deudas"
                type="number"
                {...register("totalLiabilities", { valueAsNumber: true })}
                error={errors.totalLiabilities?.message}
                placeholder="$0"
                required
              />
            </div>

            <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("paysTaxesAbroad")}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">
                  ¿Paga impuestos en otro país?
                </span>
              </label>

              {paysTaxesAbroad && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="País en que paga impuestos"
                    {...register("foreignTaxCountry")}
                    error={errors.foreignTaxCountry?.message}
                    required
                  />
                  <InputField
                    label="TIN (Número de Identificación Tributaria)"
                    {...register("tin")}
                    error={errors.tin?.message}
                    required
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Submit Button */}
          <div className="flex justify-center">
            <div className="w-full md:w-2/3 lg:w-1/2">
              <SubmitButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Enviando solicitud..."
              >
                Enviar Solicitud de Crédito
              </SubmitButton>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Al enviar este formulario, confirma que la información proporcionada es veraz y completa.
          </p>
        </form>

        {/* Download PDF Modal */}
        <DownloadPrompt
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          onDownload={handleDownloadPDF}
          onViewInstructions={handleViewInstructions}
          userName={submittedData?.firstName || "Usuario"}
        />

        {/* Instructions Modal */}
        <InstructionsModal
          isOpen={showInstructionsModal}
          onClose={() => {
            setShowInstructionsModal(false);
            setIsSubmitted(true);
          }}
        />
      </div>
    </div>
  );
}
