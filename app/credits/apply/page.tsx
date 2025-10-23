"use client";

import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { FormProgress } from "./components/FormProgress";
import { StepCreditDetails } from "./components/StepCreditDetails";
import { StepPersonalInfo } from "./components/StepPersonalInfo";
import { StepEmploymentInfo } from "./components/StepEmploymentInfo";
import { StepReferences } from "./components/StepReferences";
import { Summary } from "./components/Summary";
import {
  FormStep,
  CreditDetailsForm,
  PersonalInfoForm,
  EmploymentInfoForm,
  ReferencesForm,
  ConsentForm,
  CompleteApplicationForm,
} from "./schema";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface FormData {
  creditDetails: Partial<CreditDetailsForm>;
  personalInfo: Partial<PersonalInfoForm>;
  employmentInfo: Partial<EmploymentInfoForm>;
  references: Partial<ReferencesForm>;
}

export default function CreditApplicationPage() {
  const [currentStep, setCurrentStep] = useState<FormStep>("creditDetails");
  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    creditDetails: {},
    personalInfo: {},
    employmentInfo: {},
    references: {},
  });

  const updateFormData = useCallback((step: keyof FormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data }
    }));
  }, []);

  const markStepCompleted = useCallback((step: FormStep) => {
    setCompletedSteps(prev => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
  }, []);

  const getNextStep = (current: FormStep): FormStep | null => {
    const steps: FormStep[] = ["creditDetails", "personalInfo", "employmentInfo", "references", "consent"];
    const currentIndex = steps.indexOf(current);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  };

  const getPreviousStep = (current: FormStep): FormStep | null => {
    const steps: FormStep[] = ["creditDetails", "personalInfo", "employmentInfo", "references", "consent"];
    const currentIndex = steps.indexOf(current);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  };

  const handleStepNext = (stepData: any) => {
    const currentStepKey = currentStep === "consent" ? "references" : currentStep;
    
    if (currentStep !== "consent") {
      updateFormData(currentStepKey as keyof FormData, stepData);
    }
    
    markStepCompleted(currentStep);

    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const handleStepPrevious = () => {
    const previousStep = getPreviousStep(currentStep);
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  };

  const handleFinalSubmit = async (consentData: ConsentForm) => {
    setIsSubmitting(true);

    try {
      // Prepare complete application data
      const completeApplication: CompleteApplicationForm = {
        creditDetails: formData.creditDetails as CreditDetailsForm,
        personalInfo: formData.personalInfo as PersonalInfoForm,
        employmentInfo: formData.employmentInfo as EmploymentInfoForm,
        references: formData.references as ReferencesForm,
        consent: consentData,
      };

      // Submit to API
      const response = await fetch("/api/credits/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeApplication),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar la solicitud");
      }

      const result = await response.json();
      setApplicationId(result.id);

      toast.success("¡Solicitud enviada exitosamente!", {
        description: "Recibirá una confirmación por correo electrónico.",
      });

      // Mark final step as completed
      markStepCompleted(currentStep);

    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Error al enviar la solicitud", {
        description: error instanceof Error ? error.message : "Por favor, inténtelo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If application was successfully submitted
  if (applicationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fintera-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Solicitud Enviada Exitosamente!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Su solicitud de crédito ha sido recibida y está siendo procesada.
            </p>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-left space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Número de Solicitud:</p>
                    <p className="font-mono font-semibold text-fintera-600">{applicationId}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Próximos Pasos:</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-fintera-600 flex-shrink-0 mt-0.5" />
                        <span>Recibirá una confirmación por correo electrónico</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-fintera-600 flex-shrink-0 mt-0.5" />
                        <span>Nuestro equipo evaluará su solicitud en 1-3 días hábiles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-fintera-600 flex-shrink-0 mt-0.5" />
                        <span>Nos contactaremos con usted para informar la decisión</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-fintera-600 flex-shrink-0 mt-0.5" />
                        <span>Podemos contactar a sus referencias para verificación</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <p className="text-sm text-gray-500 mt-6">
              Para consultas, puede contactarnos al <strong>+57 1 234 5678</strong> 
              {" "}o <strong>info@fintera.com</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fintera-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Solicitud de Crédito
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete el formulario paso a paso para solicitar su crédito. 
            La información que proporcione será tratada de forma confidencial y segura.
          </p>
        </div>

        {/* Progress Indicator */}
        <FormProgress currentStep={currentStep} completedSteps={completedSteps} />

        {/* Form Content */}
        <div className="mb-8">
          {currentStep === "creditDetails" && (
            <StepCreditDetails
              data={formData.creditDetails}
              onNext={(data) => handleStepNext(data)}
            />
          )}

          {currentStep === "personalInfo" && (
            <StepPersonalInfo
              data={formData.personalInfo}
              onNext={(data) => handleStepNext(data)}
              onPrevious={handleStepPrevious}
            />
          )}

          {currentStep === "employmentInfo" && (
            <StepEmploymentInfo
              data={formData.employmentInfo}
              onNext={(data) => handleStepNext(data)}
              onPrevious={handleStepPrevious}
            />
          )}

          {currentStep === "references" && (
            <StepReferences
              data={formData.references}
              employmentData={formData.employmentInfo}
              onNext={(data) => handleStepNext(data)}
              onPrevious={handleStepPrevious}
            />
          )}

          {currentStep === "consent" && (
            <Summary
              applicationData={{
                creditDetails: formData.creditDetails as CreditDetailsForm,
                personalInfo: formData.personalInfo as PersonalInfoForm,
                employmentInfo: formData.employmentInfo as EmploymentInfoForm,
                references: formData.references as ReferencesForm,
              }}
              onSubmit={handleFinalSubmit}
              onPrevious={handleStepPrevious}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 mt-12 border-t pt-8">
          <p>
            © 2024 Fintera. Todos los derechos reservados. | 
            <a href="#" className="text-fintera-600 hover:underline ml-1">Política de Privacidad</a> | 
            <a href="#" className="text-fintera-600 hover:underline ml-1">Términos y Condiciones</a>
          </p>
          <p className="mt-2">
            ¿Necesita ayuda? Contacte a nuestro equipo de soporte: 
            <strong className="text-fintera-600"> +57 1 234 5678</strong>
          </p>
        </footer>
      </div>
    </div>
  );
}