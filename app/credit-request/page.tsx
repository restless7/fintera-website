"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { creditRequestSchema, type CreditRequestFormData } from "@/app/lib/validation/creditRequestSchema";
import { colombiaData } from "@/app/lib/data/colombia";
import { SectionCard } from "@/app/components/form/SectionCard";
import { InputField } from "@/app/components/form/InputField";
import { SelectField } from "@/app/components/form/SelectField";
import { SliderField } from "@/app/components/form/SliderField";
import { CheckboxGroup } from "@/app/components/form/CheckboxGroup";
import { SubmitButton } from "@/app/components/ui/SubmitButton";
import { DownloadPrompt } from "@/app/components/ui/DownloadPrompt";
import { InstructionsModal } from "@/app/components/ui/InstructionsModal";
import { fetchAndDownloadPDF } from "@/app/lib/pdf/downloadHelper";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { useFormPersistence } from "@/app/hooks/useFormPersistence";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const productOptions = {
  "Vivienda": [
    "Leasing Hab Nuevo",
    "Leasing Hab Usado",
    "Hipotecario Nuevo",
    "Hipotecario Usado",
    "Compra de cartera",
    "Remodelación"
  ],
  "Libre destino": [
    "Nuevo",
    "Compra de cartera"
  ],
  "Libranza": [
    "Nueva",
    "Retanqueo",
    "Compra de cartera"
  ],
  "Vehículo": [
    "Nuevo",
    "Usado"
  ]
};

export default function CreditRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<CreditRequestFormData | null>(null);

  // Custom state for product tree selection
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [showRestoredBanner, setShowRestoredBanner] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<CreditRequestFormData>({
    resolver: zodResolver(creditRequestSchema),
    mode: "onChange",
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

  // Form persistence hook
  const { clearFormData, hasStoredData, getTimeRemaining } = useFormPersistence({
    watch,
    setValue,
    onRestore: () => {
      setShowRestoredBanner(true);
      const remaining = getTimeRemaining();
      toast.success(
        `Datos recuperados. Expiran en ${remaining} minuto${remaining !== 1 ? 's' : ''}.`,
        { duration: 5000 }
      );
      // Auto-hide banner after 8 seconds
      setTimeout(() => setShowRestoredBanner(false), 8000);
    },
  });

  const sectionFields: Record<number, (keyof CreditRequestFormData)[]> = {
    1: ["creditTypes", "requestedAmount", "termMonths"],
    2: ["firstName", "secondName", "firstLastName", "secondLastName", "documentType", "documentNumber", "documentIssuePlace", "documentIssueDate", "nationality", "birthCountry", "birthDepartment", "birthCity", "birthDate", "residenceCountry", "residenceDepartment", "residenceCity", "residenceAddress", "email", "mobileNumber", "preferredContactMethods", "gender", "ethnicGroup", "isPEP", "hasFamilyInBank", "familyNameInBank"],
    3: ["occupation", "companyName", "otherOccupationDetail", "mainEconomicActivity", "ciiuCode"],
    4: ["personalReferenceName", "personalReferenceAddress", "personalReferenceDept", "personalReferenceCity", "personalReferencePhone", "familyReferenceName", "familyReferenceAddress", "familyReferenceDept", "familyReferenceCity", "familyReferencePhone", "commercialReferenceName", "commercialReferenceAddress", "commercialReferenceDept", "commercialReferenceCity", "commercialReferencePhone"],
    5: ["declaresTaxes", "monthlyIncome", "monthlyExpenses", "otherIncome", "totalAssets", "totalLiabilities", "paysTaxesAbroad", "foreignTaxCountry", "tin"]
  };

  const sectionLabels: Record<number, string> = {
    1: "Solicitud",
    2: "Personal",
    3: "Laboral",
    4: "Referencias",
    5: "Financiera"
  };

  const handleNextStep = async (targetSection: number) => {
    if (targetSection > currentSection) {
      const fieldsToValidate = sectionFields[currentSection];
      const isStepValid = await trigger(fieldsToValidate);

      if (!isStepValid) {
        toast.error("Por favor completa todos los campos requeridos antes de avanzar");
        setTimeout(() => {
          const firstErrorId = Object.keys(errors)[0];
          if (firstErrorId) {
            const errorElement = document.getElementsByName(firstErrorId)[0] || document.getElementById(firstErrorId);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
              errorElement.classList.add("ring-2", "ring-red-500", "ring-offset-2", "animate-pulse");
              setTimeout(() => errorElement.classList.remove("ring-2", "ring-red-500", "ring-offset-2", "animate-pulse"), 3000);
              errorElement.focus();
            }
          }
        }, 100);
        return;
      }
    }
    setCurrentSection(targetSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onError = (formErrors: any) => {
    toast.error("Por favor revise los campos en rojo");
    const firstError = Object.keys(formErrors)[0];

    for (const [section, fields] of Object.entries(sectionFields)) {
      if ((fields as string[]).includes(firstError)) {
        setCurrentSection(Number(section));
        break;
      }
    }

    setTimeout(() => {
      const errorElement = document.getElementsByName(firstError)[0] || document.getElementById(firstError);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.classList.add("ring-2", "ring-red-500", "ring-offset-2", "animate-pulse");
        setTimeout(() => errorElement.classList.remove("ring-2", "ring-red-500", "ring-offset-2", "animate-pulse"), 3000);
        errorElement.focus();
      }
    }, 200);
  };

  const occupation = watch("occupation");
  const paysTaxesAbroad = watch("paysTaxesAbroad");
  const hasFamilyInBank = watch("hasFamilyInBank");

  // Watch location fields for dependent dropdowns
  const birthCountry = watch("birthCountry");
  const birthDepartment = watch("birthDepartment");
  const residenceCountry = watch("residenceCountry");

  const residenceDepartment = watch("residenceDepartment");

  // Watch credit types to sync category selection
  const creditTypes = watch("creditTypes");

  useEffect(() => {
    if (creditTypes && creditTypes.length > 0 && !selectedCategory) {
      const firstType = creditTypes[0];
      if (typeof firstType === 'string' && firstType.includes(" - ")) {
        const [category] = firstType.split(" - ");
        if (Object.keys(productOptions).includes(category)) {
          setSelectedCategory(category);
        }
      }
    }
  }, [creditTypes, selectedCategory]);

  // Watch reference departments
  const personalReferenceDept = watch("personalReferenceDept");
  const familyReferenceDept = watch("familyReferenceDept");
  const commercialReferenceDept = watch("commercialReferenceDept");

  // Get cities based on selected department
  const getCities = (departmentName?: string) => {
    const department = colombiaData.find(d => d.name === departmentName);
    return department ? department.cities.map(city => ({ value: city, label: city })) : [];
  };

  // Get departments options
  const departmentOptions = colombiaData.map(d => ({ value: d.name, label: d.name }));

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
        // Clear saved form data on successful submission
        clearFormData();

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

  const handleDownloadPDF = async (formType: 'credit' | 'authorization') => {
    if (!submittedData) return;

    const label = formType === 'credit' ? "Solicitud" : "Autorización";
    toast.loading(`Generando ${label}...`);

    const result = await fetchAndDownloadPDF(submittedData, formType);

    toast.dismiss();

    if (result.success) {
      toast.success(`¡${label} descargada exitosamente!`);
    } else {
      toast.error(result.error || `Error al generar el PDF de ${label}`);
    }
  };

  const handleFinishProcess = () => {
    setIsSubmitted(true);
    setShowDownloadModal(false);
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

              {/* Important reminder about documents */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <h3 className="font-semibold text-amber-900 mb-1">Recuerda:</h3>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• <strong>Firma ambos documentos</strong> de manera física</li>
                      <li>• En la <strong>"Autorización Well"</strong>, incluye tu <strong>huella dactilar</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA - Prominent */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-green-900 mb-3">📲 Envía tus documentos firmados:</h3>
                <a
                  href="https://wa.me/573244444430?text=Hola%2C%20adjunto%20mis%20documentos%20firmados%20para%20la%20solicitud%20de%20cr%C3%A9dito."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Enviar por WhatsApp +57 324 444 4430
                </a>
              </div>

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

        {/* Side Navigation */}
        <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-20">
          {[1, 2, 3, 4, 5].map((section) => {
            const hasError = sectionFields[section].some(field => errors[field as keyof CreditRequestFormData]);
            const isActive = currentSection === section;
            const isPast = currentSection > section;

            return (
              <button
                key={`side-nav-${section}`}
                type="button"
                onClick={() => handleNextStep(section)}
                className="group flex items-center gap-4 outline-none cursor-pointer"
                title={sectionLabels[section]}
              >
                <div className="flex items-center justify-end w-24">
                  <span
                    className={`text-sm tracking-wide transition-all duration-300 opacity-0 group-hover:opacity-100 ${isActive ? "text-blue-700 opacity-100 font-bold" : "text-gray-500 font-medium"
                      } ${hasError && !isActive ? "text-red-500 animate-pulse opacity-100" : ""}`}
                  >
                    {sectionLabels[section]}
                  </span>
                </div>
                <div
                  className={`h-1.5 transition-all duration-500 rounded-full ${isActive
                    ? "w-12 bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                    : isPast
                      ? "w-8 bg-blue-300 group-hover:bg-blue-400 group-hover:w-10"
                      : "w-4 bg-gray-300 group-hover:bg-gray-400 group-hover:w-6"
                    } ${hasError && !isActive ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse" : ""}`}
                />
              </button>
            );
          })}
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

          {/* Restored Data Banner */}
          <AnimatePresence>
            {showRestoredBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-r from-green-50 to-cyan-50 border-2 border-green-200 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        Datos recuperados automáticamente
                      </h3>
                      <p className="text-xs text-gray-600">
                        Hemos restaurado la información que guardaste anteriormente.
                        Los datos se guardan automáticamente mientras completas el formulario.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRestoredBanner(false)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <div className="bg-white rounded-full shadow-md p-2">
              <div className="flex items-center justify-between relative px-4 text-sm">
                <div
                  className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500 z-0"
                  style={{ width: `calc(${((currentSection - 1) / 4) * 100}% - 2rem)` }}
                />
                {[1, 2, 3, 4, 5].map((section) => {
                  const hasError = sectionFields[section].some(field => errors[field as keyof CreditRequestFormData]);
                  return (
                    <div key={section} className="flex flex-col items-center gap-2 relative z-10">
                      <button
                        type="button"
                        onClick={() => handleNextStep(section)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all relative outline-none ${currentSection === section
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg ring-4 ring-blue-100"
                          : currentSection > section
                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200 cursor-pointer"
                          } ${hasError && currentSection !== section ? "ring-2 ring-red-500 ring-offset-2 animate-pulse" : ""}`}
                      >
                        {section}
                      </button>
                      <span className={`absolute -bottom-6 text-xs font-medium whitespace-nowrap ${currentSection === section ? "text-blue-600" : "text-gray-400"
                        }`}>
                        {sectionLabels[section]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
            {/* Section 1: Solicitud de Crédito */}
            <div className={currentSection === 1 ? 'block' : 'hidden'}>
              <SectionCard
                title="1. Solicitud de Crédito"
                description="Seleccione el tipo de crédito que desea solicitar"
              >


                <div className="space-y-6 mb-8">
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de Crédito <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.keys(productOptions).map((category) => (
                      <div
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          // Clear selection when changing category to force sub-product selection
                          setValue("creditTypes", []);
                        }}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center flex items-center justify-center min-h-[80px] ${selectedCategory === category
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                          : 'border-slate-200 hover:border-blue-300 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <span className="font-medium">{category}</span>
                      </div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedCategory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <h4 className="text-sm font-medium text-slate-700 border-l-4 border-blue-500 pl-3">
                          Selecciona una opción para <span className="text-blue-600 font-bold">{selectedCategory}</span>:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {productOptions[selectedCategory as keyof typeof productOptions].map((option) => {
                            const fullValue = `${selectedCategory} - ${option}`;
                            const currentTypes = watch("creditTypes") || [];
                            const isSelected = currentTypes.includes(fullValue);

                            return (
                              <div
                                key={option}
                                onClick={() => {
                                  // Enforce single selection logic for the tree
                                  setValue("creditTypes", [fullValue], { shouldValidate: true });
                                }}
                                className={`relative p-3 border rounded-lg cursor-pointer text-sm transition-all flex items-center justify-between ${isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                  }`}
                              >
                                <span className="font-medium">{option}</span>
                                {isSelected && <CheckCircleIcon className="h-5 w-5 text-white" />}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {errors.creditTypes && (
                    <p className="text-sm text-red-500 mt-1">{errors.creditTypes.message}</p>
                  )}

                  {/* Hidden input to register the field for hook form if needed, handled by setValue manually though */}
                  <input type="hidden" {...register("creditTypes")} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SliderField
                    label="Monto o cupo solicitado"
                    name="requestedAmount"
                    control={control}
                    min={1000000}
                    max={100000000}
                    step={100000}
                    error={errors.requestedAmount?.message}
                    required
                  />
                  <SliderField
                    label="Plazo en meses"
                    name="termMonths"
                    control={control}
                    min={12}
                    max={selectedCategory === "Vivienda" ? 240 : 72}
                    step={12}
                    error={errors.termMonths?.message}
                    required
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

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => handleNextStep(2)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
                >
                  Siguiente paso
                </button>
              </div>
            </div>

            {/* Section 2: Datos Personales */}
            <div className={currentSection === 2 ? 'block' : 'hidden'}>
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
                    label="País de Nacimiento"
                    {...register("birthCountry")}
                    error={errors.birthCountry?.message}
                    defaultValue="Colombia"
                    required
                  />

                  {birthCountry === "Colombia" ? (
                    <>
                      <SelectField
                        label="Departamento de Nacimiento"
                        options={departmentOptions}
                        {...register("birthDepartment")}
                        error={errors.birthDepartment?.message}
                        required
                      />
                      <SelectField
                        label="Ciudad de Nacimiento"
                        options={getCities(birthDepartment)}
                        {...register("birthCity")}
                        error={errors.birthCity?.message}
                        disabled={!birthDepartment}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <InputField
                        label="Departamento de Nacimiento"
                        {...register("birthDepartment")}
                        error={errors.birthDepartment?.message}
                        required
                      />
                      <InputField
                        label="Ciudad de Nacimiento"
                        {...register("birthCity")}
                        error={errors.birthCity?.message}
                        required
                      />
                    </>
                  )}
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
                    label="País de Residencia"
                    {...register("residenceCountry")}
                    error={errors.residenceCountry?.message}
                    defaultValue="Colombia"
                    required
                  />

                  {residenceCountry === "Colombia" ? (
                    <>
                      <SelectField
                        label="Departamento de Residencia"
                        options={departmentOptions}
                        {...register("residenceDepartment")}
                        error={errors.residenceDepartment?.message}
                        required
                      />
                      <SelectField
                        label="Ciudad de Residencia"
                        options={getCities(residenceDepartment)}
                        {...register("residenceCity")}
                        error={errors.residenceCity?.message}
                        disabled={!residenceDepartment}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <InputField
                        label="Departamento de Residencia"
                        {...register("residenceDepartment")}
                        error={errors.residenceDepartment?.message}
                        required
                      />
                      <InputField
                        label="Ciudad de Residencia"
                        {...register("residenceCity")}
                        error={errors.residenceCity?.message}
                        required
                      />
                    </>
                  )}
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

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => handleNextStep(1)}
                  className="px-8 py-3 bg-white text-gray-600 border border-gray-300 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(3)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
                >
                  Siguiente paso
                </button>
              </div>
            </div>

            {/* Section 3: Datos Laborales */}
            <div className={currentSection === 3 ? 'block' : 'hidden'}>
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

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => handleNextStep(2)}
                  className="px-8 py-3 bg-white text-gray-600 border border-gray-300 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(4)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
                >
                  Siguiente paso
                </button>
              </div>
            </div>

            {/* Section 4: Referencias */}
            <div className={currentSection === 4 ? 'block' : 'hidden'}>
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
                    <InputField
                      label="Dirección"
                      {...register("personalReferenceAddress")}
                      error={errors.personalReferenceAddress?.message}
                      placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SelectField
                        label="Departamento"
                        options={departmentOptions}
                        {...register("personalReferenceDept")}
                        error={errors.personalReferenceDept?.message}
                        required
                      />
                      <SelectField
                        label="Ciudad"
                        options={getCities(personalReferenceDept)}
                        {...register("personalReferenceCity")}
                        error={errors.personalReferenceCity?.message}
                        disabled={!personalReferenceDept}
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
                    <InputField
                      label="Dirección"
                      {...register("familyReferenceAddress")}
                      error={errors.familyReferenceAddress?.message}
                      placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SelectField
                        label="Departamento"
                        options={departmentOptions}
                        {...register("familyReferenceDept")}
                        error={errors.familyReferenceDept?.message}
                        required
                      />
                      <SelectField
                        label="Ciudad"
                        options={getCities(familyReferenceDept)}
                        {...register("familyReferenceCity")}
                        error={errors.familyReferenceCity?.message}
                        disabled={!familyReferenceDept}
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
                      <InputField
                        label="Dirección"
                        {...register("commercialReferenceAddress")}
                        error={errors.commercialReferenceAddress?.message}
                        placeholder="Ej: Calle 123 #45-67, Barrio Centro"
                        required
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField
                          label="Departamento"
                          options={departmentOptions}
                          {...register("commercialReferenceDept")}
                          error={errors.commercialReferenceDept?.message}
                          required
                        />
                        <SelectField
                          label="Ciudad"
                          options={getCities(commercialReferenceDept)}
                          {...register("commercialReferenceCity")}
                          error={errors.commercialReferenceCity?.message}
                          disabled={!commercialReferenceDept}
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

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => handleNextStep(3)}
                  className="px-8 py-3 bg-white text-gray-600 border border-gray-300 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(5)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
                >
                  Siguiente paso
                </button>
              </div>
            </div>

            {/* Section 5: Información Financiera */}
            <div className={currentSection === 5 ? 'block' : 'hidden'}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <SliderField
                    label="Total Ingresos Mensuales"
                    name="monthlyIncome"
                    control={control}
                    min={0}
                    max={50000000}
                    step={100000}
                    error={errors.monthlyIncome?.message}
                    required
                  />
                  <SliderField
                    label="Total Gastos Mensuales"
                    name="monthlyExpenses"
                    control={control}
                    min={0}
                    max={50000000}
                    step={100000}
                    error={errors.monthlyExpenses?.message}
                    required
                  />
                  <SliderField
                    label="Ingresos de Otras Fuentes"
                    name="otherIncome"
                    control={control}
                    min={0}
                    max={20000000}
                    step={100000}
                    error={errors.otherIncome?.message}
                  />
                  <SliderField
                    label="Valor Total de Bienes"
                    name="totalAssets"
                    control={control}
                    min={0}
                    max={1000000000}
                    step={1000000}
                    error={errors.totalAssets?.message}
                    required
                  />
                  <SliderField
                    label="Valor Total de Deudas"
                    name="totalLiabilities"
                    control={control}
                    min={0}
                    max={500000000}
                    step={1000000}
                    error={errors.totalLiabilities?.message}
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
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => handleNextStep(4)}
                  className="w-full md:w-auto px-8 py-3 bg-white text-gray-600 border border-gray-300 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Anterior
                </button>
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
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Al enviar este formulario, confirma que la información proporcionada es veraz y completa.
            </p>
          </form>

          {/* Download PDF Modal */}
          <DownloadPrompt
            isOpen={showDownloadModal}
            onClose={() => setShowDownloadModal(false)}
            onDownloadCredit={() => handleDownloadPDF('credit')}
            onDownloadAuthorization={() => handleDownloadPDF('authorization')}
            onFinish={handleFinishProcess}
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
      </div >
      <Footer />
    </>
  );
}
