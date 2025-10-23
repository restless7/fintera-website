"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORM_STEPS, FormStep } from "../schema";

interface FormProgressProps {
  currentStep: FormStep;
  completedSteps: FormStep[];
}

export function FormProgress({ currentStep, completedSteps }: FormProgressProps) {
  const currentStepIndex = FORM_STEPS.findIndex(step => step.key === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / FORM_STEPS.length) * 100;

  return (
    <div className="w-full mb-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Paso {currentStepIndex + 1} de {FORM_STEPS.length}</span>
          <span>{Math.round(progressPercentage)}% completo</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center relative">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 -z-10" />
        <div 
          className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-fintera-600 to-fintera-500 -z-10 transition-all duration-300"
          style={{ width: `${(currentStepIndex / (FORM_STEPS.length - 1)) * 100}%` }}
        />

        {FORM_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = step.key === currentStep;
          const isPast = index < currentStepIndex;

          return (
            <div key={step.key} className="flex flex-col items-center relative">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 relative z-10",
                  {
                    "bg-fintera-600 border-fintera-600 text-white": isCompleted || isPast,
                    "bg-fintera-100 border-fintera-600 text-fintera-600": isCurrent && !isCompleted,
                    "bg-gray-100 border-gray-300 text-gray-400": !isPast && !isCurrent && !isCompleted,
                  }
                )}
              >
                {isCompleted || isPast ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-24">
                <h4 
                  className={cn(
                    "text-xs font-medium leading-tight",
                    {
                      "text-fintera-600": isCurrent,
                      "text-gray-600": isPast || isCompleted,
                      "text-gray-400": !isPast && !isCurrent && !isCompleted,
                    }
                  )}
                >
                  {step.title}
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StepHeaderProps {
  step: FormStep;
  stepNumber: number;
  totalSteps: number;
}

export function StepHeader({ step, stepNumber, totalSteps }: StepHeaderProps) {
  const stepConfig = FORM_STEPS.find(s => s.key === step);
  
  if (!stepConfig) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-8 h-8 bg-fintera-100 text-fintera-600 rounded-full text-sm font-semibold">
          {stepNumber}
        </div>
        <div className="text-sm text-muted-foreground">
          Paso {stepNumber} de {totalSteps}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {stepConfig.title}
      </h2>
      <p className="text-gray-600">
        {stepConfig.description}
      </p>
    </div>
  );
}