"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReferencesSchema, ReferencesForm, EmploymentInfoForm } from "../schema";
import { StepHeader } from "./FormProgress";
import { Users, User, Building, MapPin, Phone } from "lucide-react";

interface StepReferencesProps {
  data: Partial<ReferencesForm>;
  employmentData: Partial<EmploymentInfoForm>;
  onNext: (data: ReferencesForm) => void;
  onPrevious: () => void;
}

export function StepReferences({ data, employmentData, onNext, onPrevious }: StepReferencesProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<ReferencesForm>({
    resolver: zodResolver(ReferencesSchema),
    mode: "onChange",
    defaultValues: {
      ...data,
    },
  });

  const isIndependent = employmentData?.occupation === "independiente";

  const onSubmit = (formData: ReferencesForm) => {
    onNext(formData);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (field: keyof ReferencesForm, e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue(field as any, formatted);
    trigger(field);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepHeader step="references" stepNumber={4} totalSteps={5} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Personal Reference */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Referencia Personal</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="personalReferenceName">Nombre Completo *</Label>
                <Input
                  id="personalReferenceName"
                  {...register("personalReferenceName")}
                  placeholder="Ej: María Elena Gómez"
                  className="mt-1"
                />
                {errors.personalReferenceName && (
                  <p className="text-sm text-red-600 mt-1">{errors.personalReferenceName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="personalReferencePhone">Teléfono *</Label>
                <Input
                  id="personalReferencePhone"
                  type="tel"
                  value={watch("personalReferencePhone") || ""}
                  onChange={(e) => handlePhoneChange("personalReferencePhone", e)}
                  placeholder="300 123 4567"
                  className="mt-1"
                />
                {errors.personalReferencePhone && (
                  <p className="text-sm text-red-600 mt-1">{errors.personalReferencePhone.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="personalReferenceCity">Ciudad *</Label>
                <Input
                  id="personalReferenceCity"
                  {...register("personalReferenceCity")}
                  placeholder="Ej: Bogotá"
                  className="mt-1"
                />
                {errors.personalReferenceCity && (
                  <p className="text-sm text-red-600 mt-1">{errors.personalReferenceCity.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family Reference */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Referencia Familiar</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="familyReferenceName">Nombre Completo *</Label>
                <Input
                  id="familyReferenceName"
                  {...register("familyReferenceName")}
                  placeholder="Ej: Carlos Alberto Pérez"
                  className="mt-1"
                />
                {errors.familyReferenceName && (
                  <p className="text-sm text-red-600 mt-1">{errors.familyReferenceName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="familyReferencePhone">Teléfono *</Label>
                <Input
                  id="familyReferencePhone"
                  type="tel"
                  value={watch("familyReferencePhone") || ""}
                  onChange={(e) => handlePhoneChange("familyReferencePhone", e)}
                  placeholder="310 456 7890"
                  className="mt-1"
                />
                {errors.familyReferencePhone && (
                  <p className="text-sm text-red-600 mt-1">{errors.familyReferencePhone.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="familyReferenceCity">Ciudad *</Label>
                <Input
                  id="familyReferenceCity"
                  {...register("familyReferenceCity")}
                  placeholder="Ej: Medellín"
                  className="mt-1"
                />
                {errors.familyReferenceCity && (
                  <p className="text-sm text-red-600 mt-1">{errors.familyReferenceCity.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Reference - Only for independientes */}
        {isIndependent && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building className="w-5 h-5 text-fintera-600" />
                <h3 className="text-lg font-semibold">Referencia Comercial</h3>
                <span className="text-sm text-muted-foreground">(Requerida para trabajadores independientes)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="commercialReferenceName">Nombre Completo/Empresa *</Label>
                  <Input
                    id="commercialReferenceName"
                    {...register("commercialReferenceName")}
                    placeholder="Ej: Tech Solutions S.A.S."
                    className="mt-1"
                  />
                  {errors.commercialReferenceName && (
                    <p className="text-sm text-red-600 mt-1">{errors.commercialReferenceName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="commercialReferencePhone">Teléfono *</Label>
                  <Input
                    id="commercialReferencePhone"
                    type="tel"
                    value={watch("commercialReferencePhone") || ""}
                    onChange={(e) => handlePhoneChange("commercialReferencePhone", e)}
                    placeholder="601 234 5678"
                    className="mt-1"
                  />
                  {errors.commercialReferencePhone && (
                    <p className="text-sm text-red-600 mt-1">{errors.commercialReferencePhone.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="commercialReferenceCity">Ciudad *</Label>
                  <Input
                    id="commercialReferenceCity"
                    {...register("commercialReferenceCity")}
                    placeholder="Ej: Cali"
                    className="mt-1"
                  />
                  {errors.commercialReferenceCity && (
                    <p className="text-sm text-red-600 mt-1">{errors.commercialReferenceCity.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Las referencias proporcionadas pueden ser contactadas para verificar la información.</li>
                  <li>Asegúrese de que las personas referenciadas estén informadas sobre su solicitud de crédito.</li>
                  <li>Los números de teléfono deben ser válidos y estar activos.</li>
                  {isIndependent && (
                    <li>La referencia comercial debe ser de un cliente o proveedor con quien haya trabajado.</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button 
            type="button"
            variant="outline" 
            onClick={onPrevious}
            size="lg"
            className="min-w-32"
          >
            Anterior
          </Button>
          <Button 
            type="submit" 
            disabled={!isValid}
            size="lg"
            className="min-w-32"
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  );
}