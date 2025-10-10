"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

const creditTypes = [
  { value: "vivienda", label: "Crédito de Vivienda", maxAmount: "500M" },
  { value: "libre-inversion", label: "Libre Inversión", maxAmount: "150M" },
  { value: "empresarial", label: "Crédito Empresarial", maxAmount: "800M" },
];

const incomeRanges = [
  { value: "2-4", label: "$2M - $4M" },
  { value: "4-8", label: "$4M - $8M" },
  { value: "8-15", label: "$8M - $15M" },
  { value: "15+", label: "Más de $15M" },
];

const cities = [
  "Bucaramanga", "Bogotá", "Medellín", "Cali", "Cartagena", 
  "Barranquilla", "Pereira", "Manizales", "Otra ciudad"
];

export default function PrequalificationSection() {
  const [formData, setFormData] = useState({
    creditType: "",
    amount: "",
    income: "",
    city: "",
    name: "",
    phone: "",
    email: ""
  });

  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se enviaría la data al CRM/sistema de leads
    console.log("Lead capturado:", formData);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-fintera-50 via-white to-gradient-from/10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.03),transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-fintera-600 text-sm font-semibold tracking-wider uppercase">
                Precalificación Instantánea
              </span>
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Descubre tu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                Capacidad de Crédito
              </span>{" "}
              en 2 Minutos
            </motion.h2>
            
            <motion.p 
              className="text-xl text-slate-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Completa nuestra evaluación rápida y conoce exactamente cuánto puedes acceder 
              y con qué condiciones preferenciales.
            </motion.p>

            {/* Benefits */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center space-x-2 text-fintera-600">
                <ClockIcon className="h-5 w-5" />
                <span className="text-sm font-medium">2 minutos</span>
              </div>
              <div className="flex items-center space-x-2 text-fintera-600">
                <ShieldCheckIcon className="h-5 w-5" />
                <span className="text-sm font-medium">100% seguro</span>
              </div>
              <div className="flex items-center space-x-2 text-fintera-600">
                <BanknotesIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Sin compromiso</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Prequalification Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-xl border-fintera-200/50 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Paso {currentStep} de 3
                </CardTitle>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <motion.div 
                    className="bg-gradient-to-r from-fintera-500 to-gradient-via h-2 rounded-full"
                    initial={{ width: "33%" }}
                    animate={{ width: `${(currentStep / 3) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        ¿Qué tipo de crédito necesitas?
                      </h3>
                      <div className="grid gap-4">
                        {creditTypes.map((type) => (
                          <motion.label
                            key={type.value}
                            className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              formData.creditType === type.value
                                ? 'border-fintera-500 bg-fintera-50'
                                : 'border-slate-200 hover:border-fintera-300'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="creditType"
                                value={type.value}
                                checked={formData.creditType === type.value}
                                onChange={(e) => setFormData({...formData, creditType: e.target.value})}
                                className="w-4 h-4 text-fintera-600"
                              />
                              <span className="font-medium text-slate-900">{type.label}</span>
                            </div>
                            <span className="text-sm text-fintera-600 font-semibold">
                              Hasta ${type.maxAmount}
                            </span>
                          </motion.label>
                        ))}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          ¿Qué monto necesitas? (en millones)
                        </label>
                        <Input
                          type="number"
                          placeholder="Ej: 50"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          className="text-lg h-12"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        Información sobre tus ingresos
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          ¿Cuáles son tus ingresos mensuales?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {incomeRanges.map((range) => (
                            <motion.label
                              key={range.value}
                              className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                formData.income === range.value
                                  ? 'border-fintera-500 bg-fintera-50'
                                  : 'border-slate-200 hover:border-fintera-300'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <input
                                type="radio"
                                name="income"
                                value={range.value}
                                checked={formData.income === range.value}
                                onChange={(e) => setFormData({...formData, income: e.target.value})}
                                className="sr-only"
                              />
                              <span className="font-medium text-slate-900 text-sm">{range.label}</span>
                            </motion.label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          ¿En qué ciudad te encuentras?
                        </label>
                        <select
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full h-12 border border-fintera-200 rounded-md px-3 py-2 focus:border-fintera-500 focus:ring-fintera-500"
                        >
                          <option value="">Selecciona tu ciudad</option>
                          {cities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        Datos de contacto
                      </h3>
                      
                      <div className="grid gap-4">
                        <Input
                          type="text"
                          placeholder="Nombre completo"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="h-12"
                        />
                        
                        <Input
                          type="tel"
                          placeholder="Número de celular"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="h-12"
                        />
                        
                        <Input
                          type="email"
                          placeholder="Correo electrónico"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="h-12"
                        />
                      </div>

                      <div className="bg-fintera-50 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <CheckCircleIcon className="h-5 w-5 text-fintera-600 mt-0.5" />
                          <p className="text-sm text-slate-600">
                            Al continuar, aceptas que nos comuniquemos contigo para ofrecerte 
                            las mejores opciones de crédito disponibles.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-6"
                      >
                        Anterior
                      </Button>
                    )}
                    
                    <div className="flex-1 flex justify-end">
                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          variant="gradient"
                          size="lg"
                          onClick={handleNext}
                          disabled={
                            (currentStep === 1 && (!formData.creditType || !formData.amount)) ||
                            (currentStep === 2 && (!formData.income || !formData.city))
                          }
                          className="px-8 hover:scale-105 transition-transform duration-200"
                        >
                          Continuar
                          <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          variant="gradient"
                          size="lg"
                          className="px-8 hover:scale-105 transition-transform duration-200"
                        >
                          Obtener Mi Precalificación
                          <CheckCircleIcon className="ml-2 h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
