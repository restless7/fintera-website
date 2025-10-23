"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConsentSchema, ConsentForm, CompleteApplicationForm, CREDIT_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from "../schema";
import { StepHeader } from "./FormProgress";
import { FileCheck, Shield, Eye, Send, CheckCircle2, AlertCircle } from "lucide-react";

interface SummaryProps {
  applicationData: Omit<CompleteApplicationForm, 'consent'>;
  onSubmit: (data: ConsentForm) => void;
  onPrevious: () => void;
  isSubmitting?: boolean;
}

export function Summary({ applicationData, onSubmit, onPrevious, isSubmitting = false }: SummaryProps) {
  const {
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<ConsentForm>({
    resolver: zodResolver(ConsentSchema),
    mode: "onChange",
    defaultValues: {
      dataProcessingConsent: false,
      informationVeracityConsent: false,
    },
  });

  const handleCheckboxChange = (field: keyof ConsentForm, checked: boolean) => {
    setValue(field, checked);
    trigger(field);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO");
  };

  const onFormSubmit = (consentData: ConsentForm) => {
    onSubmit(consentData);
  };

  const { creditDetails, personalInfo, employmentInfo, references } = applicationData;

  return (
    <div className="max-w-4xl mx-auto">
      <StepHeader step="consent" stepNumber={5} totalSteps={5} />

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        
        {/* Application Summary Header */}
        <Card className="bg-gradient-to-r from-fintera-50 to-blue-50 border-fintera-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-fintera-600 rounded-full flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-fintera-900">Resumen de Solicitud</h2>
                <p className="text-fintera-700">Revise su información antes de enviar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-fintera-200">
                <p className="text-sm text-gray-600">Tipo de Crédito</p>
                <p className="font-semibold text-fintera-900">
                  {CREDIT_TYPE_LABELS[creditDetails.creditType]}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-fintera-200">
                <p className="text-sm text-gray-600">Monto Solicitado</p>
                <p className="font-semibold text-fintera-900">
                  {formatCurrency(creditDetails.requestedAmount)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-fintera-200">
                <p className="text-sm text-gray-600">Plazo</p>
                <p className="font-semibold text-fintera-900">
                  {creditDetails.termMonths} meses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-fintera-600" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre Completo</p>
                  <p className="font-medium">
                    {personalInfo.firstName} {personalInfo.secondName} {personalInfo.firstLastName} {personalInfo.secondLastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">
                    {DOCUMENT_TYPE_LABELS[personalInfo.documentType]} - {personalInfo.documentNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                  <p className="font-medium">{formatDate(personalInfo.birthDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{personalInfo.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{personalInfo.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ciudad de Residencia</p>
                  <p className="font-medium">{personalInfo.residenceCity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium">{personalInfo.residenceAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Medio de Contacto Preferido</p>
                  <p className="font-medium capitalize">{personalInfo.preferredContactMethod}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-fintera-600" />
              Información Laboral y Financiera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Ocupación</p>
                  <p className="font-medium capitalize">{employmentInfo.occupation}</p>
                </div>
                {employmentInfo.mainActivityDescription && (
                  <div>
                    <p className="text-sm text-gray-600">Actividad Principal</p>
                    <p className="font-medium">{employmentInfo.mainActivityDescription}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                  <p className="font-medium">{formatCurrency(employmentInfo.monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gastos Mensuales</p>
                  <p className="font-medium">{formatCurrency(employmentInfo.monthlyExpenses)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Activos</p>
                  <p className="font-medium">{formatCurrency(employmentInfo.totalAssets)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pasivos</p>
                  <p className="font-medium">{formatCurrency(employmentInfo.totalLiabilities)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Declara Renta</p>
                  <p className="font-medium">{employmentInfo.taxDeclarationStatus ? "Sí" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Residencia Fiscal Exterior</p>
                  <p className="font-medium">{employmentInfo.foreignTaxResidency ? "Sí" : "No"}</p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mt-6 p-4 bg-fintera-50 rounded-lg border border-fintera-200">
              <h4 className="font-medium text-fintera-900 mb-3">Resumen Financiero</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Capacidad de Pago</p>
                  <p className="font-semibold text-fintera-900">
                    {formatCurrency(employmentInfo.monthlyIncome - employmentInfo.monthlyExpenses + (employmentInfo.otherIncome || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patrimonio Neto</p>
                  <p className="font-semibold text-fintera-900">
                    {formatCurrency(employmentInfo.totalAssets - employmentInfo.totalLiabilities)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* References Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-fintera-600" />
              Referencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Referencia Personal</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nombre:</span> {references.personalReferenceName}</p>
                  <p><span className="font-medium">Teléfono:</span> {references.personalReferencePhone}</p>
                  <p><span className="font-medium">Ciudad:</span> {references.personalReferenceCity}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Referencia Familiar</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nombre:</span> {references.familyReferenceName}</p>
                  <p><span className="font-medium">Teléfono:</span> {references.familyReferencePhone}</p>
                  <p><span className="font-medium">Ciudad:</span> {references.familyReferenceCity}</p>
                </div>
              </div>
            </div>

            {/* Commercial reference if applicable */}
            {references.commercialReferenceName && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Referencia Comercial</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nombre:</span> {references.commercialReferenceName}</p>
                  <p><span className="font-medium">Teléfono:</span> {references.commercialReferencePhone}</p>
                  <p><span className="font-medium">Ciudad:</span> {references.commercialReferenceCity}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent and Authorizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-fintera-600" />
              Autorizaciones y Consentimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="dataProcessingConsent"
                  checked={watch("dataProcessingConsent")}
                  onCheckedChange={(checked) => handleCheckboxChange("dataProcessingConsent", checked as boolean)}
                />
                <Label 
                  htmlFor="dataProcessingConsent" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  <span className="font-semibold">Autorización Tratamiento de Datos Personales:</span> 
                  {" "}Autorizo de manera libre, voluntaria, previa, expresa e informada a Fintera para tratar mis datos personales 
                  de acuerdo con la Política de Tratamiento de Datos Personales y la Ley 1581 de 2012. 
                  Mis datos serán utilizados para evaluar mi solicitud de crédito, realizar estudios de riesgo crediticio, 
                  reportar a centrales de riesgo y contactarme sobre productos financieros.
                </Label>
              </div>
              {errors.dataProcessingConsent && (
                <p className="text-sm text-red-600 ml-7">{errors.dataProcessingConsent.message}</p>
              )}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="informationVeracityConsent"
                  checked={watch("informationVeracityConsent")}
                  onCheckedChange={(checked) => handleCheckboxChange("informationVeracityConsent", checked as boolean)}
                />
                <Label 
                  htmlFor="informationVeracityConsent" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  <span className="font-semibold">Declaración de Veracidad:</span> 
                  {" "}Declaro bajo la gravedad del juramento que toda la información suministrada en este formulario 
                  es verídica, completa y actualizada. Me comprometo a informar cualquier cambio en mi situación 
                  financiera o personal que pueda afectar mi capacidad de pago.
                </Label>
              </div>
              {errors.informationVeracityConsent && (
                <p className="text-sm text-red-600 ml-7">{errors.informationVeracityConsent.message}</p>
              )}
            </div>

            {/* Important Information */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <h4 className="font-semibold mb-2">Información Importante:</h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>La aprobación del crédito está sujeta a evaluación y verificación de la información.</li>
                    <li>Las referencias proporcionadas pueden ser contactadas para verificación.</li>
                    <li>El suministro de información falsa puede ser causal de rechazo de la solicitud.</li>
                    <li>Los términos y condiciones finales serán establecidos una vez aprobada la solicitud.</li>
                  </ul>
                </div>
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
            disabled={isSubmitting}
            size="lg"
            className="min-w-32"
          >
            Anterior
          </Button>
          <Button 
            type="submit" 
            disabled={!isValid || isSubmitting}
            size="lg"
            className="min-w-40 bg-gradient-to-r from-fintera-600 to-fintera-700 hover:from-fintera-700 hover:to-fintera-800"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Enviar Solicitud
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}