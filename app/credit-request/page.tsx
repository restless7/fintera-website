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
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";

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
      creditTypes: [],
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
      <>
        <Navbar />
        <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/50 pt-32 pb-12 px-4 overflow-hidden">
          {/* Background Effects - Same as Hero Section */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e950_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e950_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            
            {/* Floating orbs */}
            <motion.div
              className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-cyan-500/20 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-full blur-xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.2, 0.4],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                delay: 1,
                ease: "easeInOut"
              }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center relative z-10"
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
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/50 pt-32 pb-12 px-4 overflow-hidden">
        {/* Background Effects - Same as Hero Section */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e950_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e950_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
          
          {/* Floating orbs */}
          <motion.div
            className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-cyan-500/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-full blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.2, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: 1,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
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
          {/* Section 1: Solicitud de Crédito */}
          <SectionCard
            title="1. Solicitud de Crédito"
            description="Seleccione el tipo de crédito que desea solicitar"
          >
            <InputField
              label="Código de oficina"
              {...register("officeCode")}
              error={errors.officeCode?.message}
              placeholder="Opcional"
            />

            <CheckboxGroup
              label="Tipo de Crédito"
              options={[
                { value: "vivienda", label: "Crédito de Vivienda - Compra o construcción de vivienda" },
                { value: "libranza", label: "Crédito de Libranza - Descuento directo de nómina" },
                { value: "libre_destino", label: "Crédito de Libre Destino - Sin destinación específica" },
                { value: "compra_cartera", label: "Compra de Cartera - Unificación de deudas" }
              ]}
              name="creditTypes"
              register={register}
              error={errors.creditTypes?.message}
              required
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
            <motion.div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 p-8 border border-blue-100/50 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl -z-0" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/20 to-blue-200/20 rounded-full blur-3xl -z-0" />
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500">
                        Nuestros Portafolios
                      </span>
                    </h3>
                    <p className="text-gray-600 text-sm">Soluciones financieras diseñadas para cada necesidad</p>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Masivo */}
                  <motion.div
                    className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl" />
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-blue-700 mb-2 group-hover:text-blue-600 transition-colors">Masivo</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Paso a paso, Impulsa, Joven</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Preferente */}
                  <motion.div
                    className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-cyan-200/50 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-3xl" />
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-cyan-700 mb-2 group-hover:text-cyan-600 transition-colors">Preferente</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Preferente, Preferente VV, Preferente Élite</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Premium */}
                  <motion.div
                    className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200/50 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl" />
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-purple-700 mb-2 group-hover:text-purple-600 transition-colors">Premium</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Premium, Premium Ultra</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Transversal */}
                  <motion.div
                    className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:border-gray-400/50 transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-500/10 to-transparent rounded-bl-3xl" />
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-700 mb-2 group-hover:text-gray-600 transition-colors">Transversal</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Básico, Legado</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
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
      <Footer />
    </>
  );
}
