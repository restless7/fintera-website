"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmploymentInfoSchema, EmploymentInfoForm } from "../schema";
import { StepHeader } from "./FormProgress";
import { Briefcase, DollarSign, Building, FileText, Globe } from "lucide-react";

interface StepEmploymentInfoProps {
  data: Partial<EmploymentInfoForm>;
  onNext: (data: EmploymentInfoForm) => void;
  onPrevious: () => void;
}

export function StepEmploymentInfo({ data, onNext, onPrevious }: StepEmploymentInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<EmploymentInfoForm>({
    resolver: zodResolver(EmploymentInfoSchema),
    mode: "onChange",
    defaultValues: {
      ...data,
    },
  });

  const selectedOccupation = watch("occupation");
  const foreignTaxResidency = watch("foreignTaxResidency");

  const onSubmit = (formData: EmploymentInfoForm) => {
    onNext(formData);
  };

  const handleSelectChange = (field: keyof EmploymentInfoForm, value: string) => {
    setValue(field as any, value);
    trigger(field);
  };

  const formatCurrency = (value?: number) => {
  const amount = value ?? 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};


  const handleAmountChange = (field: keyof EmploymentInfoForm, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    const numericValue = parseInt(value) || 0;
    setValue(field as any, numericValue);
    trigger(field);
  };

  const handleCheckboxChange = (field: keyof EmploymentInfoForm, checked: boolean) => {
    setValue(field as any, checked);
    trigger(field);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepHeader step="employmentInfo" stepNumber={3} totalSteps={5} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Occupation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Ocupación</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Tipo de Ocupación *</Label>
                <Select
                  value={watch("occupation")}
                  onValueChange={(value) => handleSelectChange("occupation", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asalariado">Asalariado</SelectItem>
                    <SelectItem value="independiente">Independiente</SelectItem>
                    <SelectItem value="pensionado">Pensionado</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.occupation && (
                  <p className="text-sm text-red-600 mt-1">{errors.occupation.message}</p>
                )}
              </div>

              {/* Conditional fields for independientes */}
              {selectedOccupation === "independiente" && (
                <>
                  <div>
                    <Label htmlFor="mainActivityDescription">Descripción de Actividad Principal *</Label>
                    <Input
                      id="mainActivityDescription"
                      {...register("mainActivityDescription")}
                      placeholder="Ej: Consultoría en sistemas de información"
                      className="mt-1"
                    />
                    {errors.mainActivityDescription && (
                      <p className="text-sm text-red-600 mt-1">{errors.mainActivityDescription.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ciiuCode">Código CIIU (Opcional)</Label>
                    <Input
                      id="ciiuCode"
                      {...register("ciiuCode")}
                      placeholder="Ej: 6201"
                      className="mt-1"
                    />
                    {errors.ciiuCode && (
                      <p className="text-sm text-red-600 mt-1">{errors.ciiuCode.message}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Información Financiera</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyIncome">Ingresos Mensuales *</Label>
                <div className="relative">
                  <Input
                    id="monthlyIncome"
                    type="text"
                    placeholder="Ej: 5,000,000"
                    value={watch("monthlyIncome") ? formatCurrency(watch("monthlyIncome")) : ""}
                    onChange={(e) => handleAmountChange("monthlyIncome", e)}
                    className="pl-8 mt-1"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                </div>
                {errors.monthlyIncome && (
                  <p className="text-sm text-red-600 mt-1">{errors.monthlyIncome.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="monthlyExpenses">Gastos Mensuales *</Label>
                <div className="relative">
                  <Input
                    id="monthlyExpenses"
                    type="text"
                    placeholder="Ej: 2,000,000"
                    value={watch("monthlyExpenses") ? formatCurrency(watch("monthlyExpenses")) : ""}
                    onChange={(e) => handleAmountChange("monthlyExpenses", e)}
                    className="pl-8 mt-1"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                </div>
                {errors.monthlyExpenses && (
                  <p className="text-sm text-red-600 mt-1">{errors.monthlyExpenses.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="otherIncome">Otros Ingresos (Opcional)</Label>
                <div className="relative">
                  <Input
                    id="otherIncome"
                    type="text"
                    placeholder="Ej: 500,000"
                    value={watch("otherIncome") !== undefined && watch("otherIncome") !== null 
  ? formatCurrency(watch("otherIncome") || 0) 
  : ""}

                    onChange={(e) => handleAmountChange("otherIncome", e)}
                    className="pl-8 mt-1"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                </div>
                {errors.otherIncome && (
                  <p className="text-sm text-red-600 mt-1">{errors.otherIncome.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="totalAssets">Total Activos *</Label>
                <div className="relative">
                  <Input
                    id="totalAssets"
                    type="text"
                    placeholder="Ej: 100,000,000"
                    value={watch("totalAssets") ? formatCurrency(watch("totalAssets")) : ""}
                    onChange={(e) => handleAmountChange("totalAssets", e)}
                    className="pl-8 mt-1"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                </div>
                {errors.totalAssets && (
                  <p className="text-sm text-red-600 mt-1">{errors.totalAssets.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="totalLiabilities">Total Pasivos *</Label>
                <div className="relative">
                  <Input
                    id="totalLiabilities"
                    type="text"
                    placeholder="Ej: 20,000,000"
                    value={watch("totalLiabilities") ? formatCurrency(watch("totalLiabilities")) : ""}
                    onChange={(e) => handleAmountChange("totalLiabilities", e)}
                    className="pl-8 mt-1"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                </div>
                {errors.totalLiabilities && (
                  <p className="text-sm text-red-600 mt-1">{errors.totalLiabilities.message}</p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            {watch("monthlyIncome") > 0 && watch("monthlyExpenses") > 0 && (
              <div className="mt-6 p-4 bg-fintera-50 rounded-lg border border-fintera-200">
                <h4 className="font-medium text-fintera-900 mb-2">Resumen Financiero</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ingresos Totales:</p>
                    <p className="font-medium">
                      {formatCurrency((watch("monthlyIncome") || 0) + (watch("otherIncome") || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Capacidad de Pago:</p>
                    <p className="font-medium">
                      {formatCurrency(Math.max(0, (watch("monthlyIncome") || 0) + (watch("otherIncome") || 0) - (watch("monthlyExpenses") || 0)))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Patrimonio Neto:</p>
                    <p className="font-medium">
                      {formatCurrency(Math.max(0, (watch("totalAssets") || 0) - (watch("totalLiabilities") || 0)))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Información Tributaria</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxDeclarationStatus"
                  checked={watch("taxDeclarationStatus")}
                  onCheckedChange={(checked) => handleCheckboxChange("taxDeclarationStatus", checked as boolean)}
                />
                <Label htmlFor="taxDeclarationStatus">
                  ¿Declara renta?
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="foreignTaxResidency"
                  checked={watch("foreignTaxResidency")}
                  onCheckedChange={(checked) => handleCheckboxChange("foreignTaxResidency", checked as boolean)}
                />
                <Label htmlFor="foreignTaxResidency">
                  ¿Tiene residencia fiscal en el exterior?
                </Label>
              </div>

              {/* Conditional fields for foreign tax residency */}
              {foreignTaxResidency && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-fintera-200">
                  <div>
                    <Label htmlFor="foreignCountry">País de Residencia Fiscal *</Label>
                    <Input
                      id="foreignCountry"
                      {...register("foreignCountry")}
                      placeholder="Ej: Estados Unidos"
                      className="mt-1"
                    />
                    {errors.foreignCountry && (
                      <p className="text-sm text-red-600 mt-1">{errors.foreignCountry.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tinNumber">Número TIN *</Label>
                    <Input
                      id="tinNumber"
                      {...register("tinNumber")}
                      placeholder="Ej: 123-45-6789"
                      className="mt-1"
                    />
                    {errors.tinNumber && (
                      <p className="text-sm text-red-600 mt-1">{errors.tinNumber.message}</p>
                    )}
                  </div>
                </div>
              )}
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