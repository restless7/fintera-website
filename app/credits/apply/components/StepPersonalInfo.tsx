"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonalInfoSchema, PersonalInfoForm, DOCUMENT_TYPE_LABELS } from "../schema";
import { StepHeader } from "./FormProgress";
import { User, FileText, MapPin, Mail, Phone, Users, Calendar } from "lucide-react";

interface StepPersonalInfoProps {
  data: Partial<PersonalInfoForm>;
  onNext: (data: PersonalInfoForm) => void;
  onPrevious: () => void;
}

export function StepPersonalInfo({ data, onNext, onPrevious }: StepPersonalInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<PersonalInfoForm>({
    resolver: zodResolver(PersonalInfoSchema),
    mode: "onChange",
    defaultValues: {
      ...data,
    },
  });

  const onSubmit = (formData: PersonalInfoForm) => {
    onNext(formData);
  };

  const handleSelectChange = (field: keyof PersonalInfoForm, value: string) => {
    setValue(field as any, value);
    trigger(field);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, "");
    // Format as Colombian phone number
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue("phoneNumber", formatted);
    trigger("phoneNumber");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepHeader step="personalInfo" stepNumber={2} totalSteps={5} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Names Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Nombres y Apellidos</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Primer Nombre *</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="Ej: Juan"
                  className="mt-1"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="secondName">Segundo Nombre</Label>
                <Input
                  id="secondName"
                  {...register("secondName")}
                  placeholder="Ej: Carlos"
                  className="mt-1"
                />
                {errors.secondName && (
                  <p className="text-sm text-red-600 mt-1">{errors.secondName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="firstLastName">Primer Apellido *</Label>
                <Input
                  id="firstLastName"
                  {...register("firstLastName")}
                  placeholder="Ej: García"
                  className="mt-1"
                />
                {errors.firstLastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.firstLastName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="secondLastName">Segundo Apellido</Label>
                <Input
                  id="secondLastName"
                  {...register("secondLastName")}
                  placeholder="Ej: Rodríguez"
                  className="mt-1"
                />
                {errors.secondLastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.secondLastName.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Información del Documento</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Tipo de Documento *</Label>
                <Select
                  value={watch("documentType")}
                  onValueChange={(value) => handleSelectChange("documentType", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.documentType && (
                  <p className="text-sm text-red-600 mt-1">{errors.documentType.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="documentNumber">Número de Documento *</Label>
                <Input
                  id="documentNumber"
                  {...register("documentNumber")}
                  placeholder="Ej: 12345678"
                  className="mt-1"
                />
                {errors.documentNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.documentNumber.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="documentIssueCity">Ciudad de Expedición *</Label>
                <Input
                  id="documentIssueCity"
                  {...register("documentIssueCity")}
                  placeholder="Ej: Bogotá"
                  className="mt-1"
                />
                {errors.documentIssueCity && (
                  <p className="text-sm text-red-600 mt-1">{errors.documentIssueCity.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentIssueDate">Fecha de Expedición *</Label>
                <Input
                  id="documentIssueDate"
                  type="date"
                  {...register("documentIssueDate")}
                  className="mt-1"
                />
                {errors.documentIssueDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.documentIssueDate.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate")}
                  className="mt-1"
                />
                {errors.birthDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.birthDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Información de Residencia</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="nationality">Nacionalidad *</Label>
                <Input
                  id="nationality"
                  {...register("nationality")}
                  placeholder="Ej: Colombiana"
                  className="mt-1"
                />
                {errors.nationality && (
                  <p className="text-sm text-red-600 mt-1">{errors.nationality.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="residenceCity">Ciudad de Residencia *</Label>
                <Input
                  id="residenceCity"
                  {...register("residenceCity")}
                  placeholder="Ej: Medellín"
                  className="mt-1"
                />
                {errors.residenceCity && (
                  <p className="text-sm text-red-600 mt-1">{errors.residenceCity.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="residenceAddress">Dirección de Residencia *</Label>
              <Input
                id="residenceAddress"
                {...register("residenceAddress")}
                placeholder="Ej: Carrera 50 # 25-30, Apartamento 402"
                className="mt-1"
              />
              {errors.residenceAddress && (
                <p className="text-sm text-red-600 mt-1">{errors.residenceAddress.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Phone className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Información de Contacto</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="ejemplo@email.com"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Número de Teléfono *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={watch("phoneNumber") || ""}
                  onChange={handlePhoneChange}
                  placeholder="300 123 4567"
                  className="mt-1"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label>Medio de Contacto Preferido *</Label>
              <Select
                value={watch("preferredContactMethod")}
                onValueChange={(value) => handleSelectChange("preferredContactMethod", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telefono">Teléfono</SelectItem>
                  <SelectItem value="correo">Correo Electrónico</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              {errors.preferredContactMethod && (
                <p className="text-sm text-red-600 mt-1">{errors.preferredContactMethod.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-fintera-600" />
              <h3 className="text-lg font-semibold">Información Personal</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Género *</Label>
                <Select
                  value={watch("gender")}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="no_binario">No Binario</SelectItem>
                    <SelectItem value="prefiero_no_decirlo">Prefiero no decirlo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
                )}
              </div>
              
              <div>
                <Label>Grupo Étnico (Opcional)</Label>
                <Select
                  value={watch("ethnicGroup") || "no_especifica"}
                  onValueChange={(value) => handleSelectChange("ethnicGroup", value === "no_especifica" ? "" : value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_especifica">Prefiero no especificar</SelectItem>
                    <SelectItem value="indigena">Indígena</SelectItem>
                    <SelectItem value="rom_gitano">Rom (Gitano)</SelectItem>
                    <SelectItem value="raizal">Raizal</SelectItem>
                    <SelectItem value="palenquero">Palenquero</SelectItem>
                    <SelectItem value="negro_mulato_afrocolombiano">Negro, Mulato, Afrocolombiano</SelectItem>
                    <SelectItem value="mestizo">Mestizo</SelectItem>
                    <SelectItem value="blanco">Blanco</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="no_informa">No informa</SelectItem>
                  </SelectContent>
                </Select>
                {errors.ethnicGroup && (
                  <p className="text-sm text-red-600 mt-1">{errors.ethnicGroup.message}</p>
                )}
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