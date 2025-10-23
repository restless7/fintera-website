"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditDetailsSchema, CreditDetailsForm, CREDIT_TYPE_LABELS, CreditType } from "../schema";
import { StepHeader } from "./FormProgress";
import { DollarSign, Calendar, CreditCard } from "lucide-react";

interface StepCreditDetailsProps {
  data: Partial<CreditDetailsForm>;
  onNext: (data: CreditDetailsForm) => void;
  onPrevious?: () => void;
}

export function StepCreditDetails({ data, onNext }: StepCreditDetailsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<CreditDetailsForm>({
    resolver: zodResolver(CreditDetailsSchema),
    mode: "onChange",
    defaultValues: {
      creditType: data?.creditType,
      requestedAmount: data?.requestedAmount || 0,
      termMonths: data?.termMonths || 0,
    },
  });

  const selectedCreditType = watch("creditType");

  const onSubmit = (formData: CreditDetailsForm) => {
    onNext(formData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    const numericValue = parseInt(value) || 0;
    setValue("requestedAmount", numericValue);
    trigger("requestedAmount");
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setValue("termMonths", value);
    trigger("termMonths");
  };

  const getCreditTypeIcon = (type: CreditType) => {
    switch (type) {
      case "vivienda":
        return "🏠";
      case "vehiculo":
        return "🚗";
      case "libranza":
        return "💼";
      case "libre_destino":
        return "💰";
      case "compra_de_cartera":
        return "📊";
      default:
        return "💳";
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepHeader step="creditDetails" stepNumber={1} totalSteps={5} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Credit Type Selection */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-fintera-600" />
                <Label className="text-base font-semibold">Tipo de Crédito</Label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(CREDIT_TYPE_LABELS).map(([key, label]) => {
                  const isSelected = selectedCreditType === key;
                  return (
                    <div
                      key={key}
                      className={`
                        relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md
                        ${isSelected 
                          ? "border-fintera-600 bg-fintera-50" 
                          : "border-gray-200 hover:border-fintera-300"
                        }
                      `}
                      onClick={() => {
                        setValue("creditType", key as CreditType);
                        trigger("creditType");
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCreditTypeIcon(key as CreditType)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{label}</h3>
                          <p className="text-sm text-gray-500">
                            {key === "vivienda" && "Compra o construcción de vivienda"}
                            {key === "vehiculo" && "Compra de vehículo nuevo o usado"}
                            {key === "libranza" && "Descuento directo de nómina"}
                            {key === "libre_destino" && "Sin destinación específica"}
                            {key === "compra_de_cartera" && "Unificación de deudas"}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        {...register("creditType")}
                        value={key}
                        className="absolute opacity-0"
                      />
                    </div>
                  );
                })}
              </div>
              {errors.creditType && (
                <p className="text-sm text-red-600">{errors.creditType.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Amount and Term */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requested Amount */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-fintera-600" />
                  <Label htmlFor="requestedAmount" className="text-base font-semibold">
                    Monto Solicitado
                  </Label>
                </div>
                
                <div className="relative">
                  <Input
                    id="requestedAmount"
                    type="text"
                    placeholder="Ej: 50,000,000"
                    value={watch("requestedAmount") ? formatCurrency(watch("requestedAmount")) : ""}
                    onChange={handleAmountChange}
                    className="pl-8"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Mínimo: {formatCurrency(1000000)}</p>
                  <p>• Máximo: {formatCurrency(2000000000)}</p>
                </div>
                
                {errors.requestedAmount && (
                  <p className="text-sm text-red-600">{errors.requestedAmount.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Term in Months */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-fintera-600" />
                  <Label htmlFor="termMonths" className="text-base font-semibold">
                    Plazo (meses)
                  </Label>
                </div>
                
                <Input
                  id="termMonths"
                  type="number"
                  min="6"
                  max="360"
                  placeholder="Ej: 120"
                  {...register("termMonths", { valueAsNumber: true })}
                  onChange={handleTermChange}
                />
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Mínimo: 6 meses</p>
                  <p>• Máximo: 360 meses (30 años)</p>
                  {watch("termMonths") > 0 && (
                    <p className="text-fintera-600">
                      = {Math.round(watch("termMonths") / 12)} años y {watch("termMonths") % 12} meses
                    </p>
                  )}
                </div>
                
                {errors.termMonths && (
                  <p className="text-sm text-red-600">{errors.termMonths.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        {selectedCreditType && watch("requestedAmount") > 0 && watch("termMonths") > 0 && (
          <Card className="bg-fintera-50 border-fintera-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-fintera-900 mb-3">Resumen de Solicitud</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Tipo de Crédito:</p>
                  <p className="font-medium">{CREDIT_TYPE_LABELS[selectedCreditType]}</p>
                </div>
                <div>
                  <p className="text-gray-600">Monto:</p>
                  <p className="font-medium">{formatCurrency(watch("requestedAmount"))}</p>
                </div>
                <div>
                  <p className="text-gray-600">Plazo:</p>
                  <p className="font-medium">{watch("termMonths")} meses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-end pt-6">
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