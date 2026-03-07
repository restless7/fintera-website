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
    category: "",
    subProduct: "",
    amount: "50",
    income: "",
    city: "",
    name: "",
    phone: "",
    email: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    maxCapacity: number;
    estimatedPayment: number;
    interestRate: number;
    recommendedTerm: number;
  } | null>(null);

  // Parse literal income tier ranges into usable arithmetic median values
  const getIncomeValue = (rangeStr: string) => {
    switch (rangeStr) {
      case "2-4": return 3000000;
      case "4-8": return 6000000;
      case "8-15": return 11500000;
      case "15+": return 18000000;
      default: return 0;
    }
  };

  // Convert Millions back to full integer
  const requestedAmount = parseInt(formData.amount) * 1000000;

  // Real world calculation mechanics simulating standard Colombian underwriting guidelines
  const calculateCreditCapacity = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const grossIncome = getIncomeValue(formData.income);
      let dtiLimit = 0.40; // Default 40%
      let termMonths = 60; // Default 5 years
      let interestRateMV = 0.017; // Default 1.7% Efectivo Mensual

      switch (formData.category) {
        case "Vivienda":
          dtiLimit = 0.30; // Ley de Vivienda limit
          termMonths = 240; // 20 years
          interestRateMV = 0.011; // 1.1%
          break;
        case "Vehículo":
          dtiLimit = 0.40;
          termMonths = 72; // 6 years
          interestRateMV = 0.0135; // 1.35%
          break;
        case "Libre destino":
          dtiLimit = 0.40;
          termMonths = 60; // 5 years
          interestRateMV = 0.017; // 1.7%
          break;
        case "Libranza":
          dtiLimit = 0.45; // Higher allowance via payroll deduc
          termMonths = 96; // 8 years
          interestRateMV = 0.0125; // 1.25%
          break;
      }

      // Max capacity formula (Present Value of maximum monthly installment allowed by DTI)
      const maxMonthlyPayment = grossIncome * dtiLimit;
      const maxLoanCapacity = maxMonthlyPayment * ((1 - Math.pow(1 + interestRateMV, -termMonths)) / interestRateMV);

      // Current exact simulated payment calculation (PMT formula)
      const simulatedMonthlyPayment = (requestedAmount * interestRateMV) / (1 - Math.pow(1 + interestRateMV, -termMonths));

      setSimulationResult({
        maxCapacity: maxLoanCapacity,
        estimatedPayment: simulatedMonthlyPayment,
        interestRate: interestRateMV * 100, // as percentage display
        recommendedTerm: termMonths
      });

      setIsSimulating(false);
      setCurrentStep(4);
    }, 1800);
  };

  const handleFunnelRedirect = () => {
    // Structure data identically to how our main credit form hook expects it (mapped directly to CreditRequestFormData keys)
    const funnelPayload = {
      creditTypes: [`${formData.category} - ${formData.subProduct}`],
      requestedAmount: parseInt(formData.amount) * 1000000,
      termMonths: String(simulationResult?.recommendedTerm || 60),
      firstName: formData.name.split(' ')[0] || "",
      firstLastName: formData.name.split(' ').slice(1).join(' ') || "",
      mobileNumber: formData.phone,
      email: formData.email,
      residenceCity: formData.city,
      monthlyIncome: getIncomeValue(formData.income),
      // Set safe default fallbacks for partial tracking matching
      birthCountry: "Colombia",
      residenceCountry: "Colombia"
    };

    // Stored inside the same localStorage key that `useFormPersistence` reads from upon booting the `/credit-request` page
    localStorage.setItem("fintera_credit_request", JSON.stringify({
      data: funnelPayload,
      timestamp: Date.now()
    }));

    window.location.href = "/credit-request";
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 3) {
      calculateCreditCapacity();
    }
  };

  return (
    <section id="prequalification" className="py-20 bg-gradient-to-br from-fintera-50 via-white to-gradient-from/10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-15 mix-blend-multiply"
          style={{ backgroundImage: "url('/images/prequalification-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.03),transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                  {currentStep < 4 ? `Paso ${currentStep} de 3` : "Resultados de Precalificación"}
                </CardTitle>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <motion.div
                    className="bg-gradient-to-r from-fintera-500 to-gradient-via h-2 rounded-full"
                    initial={{ width: "25%" }}
                    animate={{ width: `${(currentStep / 4) * 100}%` }}
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
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-slate-900">
                          ¿Qué tipo de crédito buscas?
                        </h3>
                        <div className="grid grid-cols-2 text-center gap-3">
                          {Object.keys(productOptions).map((category) => (
                            <div
                              key={category}
                              onClick={() => setFormData({ ...formData, category: category, subProduct: "" })}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.category === category
                                ? 'border-fintera-500 bg-fintera-50 text-fintera-700'
                                : 'border-slate-200 hover:border-fintera-300 text-slate-600'
                                }`}
                            >
                              <span className="font-medium">{category}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {formData.category && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-4"
                        >
                          <h4 className="text-sm font-medium text-slate-700">
                            Selecciona una opción para {formData.category}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {productOptions[formData.category as keyof typeof productOptions].map((option) => (
                              <div
                                key={option}
                                onClick={() => setFormData({ ...formData, subProduct: option })}
                                className={`p-3 border rounded-lg cursor-pointer text-sm transition-all ${formData.subProduct === option
                                  ? 'bg-fintera-600 text-white border-fintera-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-fintera-300'
                                  }`}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      <div className="pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-4 flex flex-col items-center">
                          <span>¿Qué monto necesitas?</span>
                          <span className="text-fintera-600 text-3xl font-black mt-2">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0
                            }).format(parseInt(formData.amount) * 1000000)}
                          </span>
                        </label>
                        <div className="relative pt-2">
                          <input
                            type="range"
                            min="1"
                            max="800"
                            step="1"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-fintera-600"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-2">
                            <span>$1M</span>
                            <span>$800M+</span>
                          </div>
                        </div>
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
                              className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.income === range.value
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
                                onChange={(e) => setFormData({ ...formData, income: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-12"
                        />

                        <Input
                          type="tel"
                          placeholder="Número de celular"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-12"
                        />

                        <Input
                          type="email"
                          placeholder="Correo electrónico"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

                  {currentStep === 4 && simulationResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6 pt-4"
                    >
                      <div className="text-center space-y-2 mb-8">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircleIcon className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">
                          ¡Tu perfil ha sido analizado con éxito, {formData.name.split(' ')[0]}!
                        </h3>
                        <p className="text-slate-600">Basado en nuestras políticas financieras, esta es tu oferta simulada de viabilidad:</p>
                      </div>

                      <div className="grid gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                          <p className="font-semibold text-slate-900 mb-2">Capacidad Máxima Aprobada Aprox.</p>
                          <h4 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              maximumFractionDigits: 0
                            }).format(simulationResult.maxCapacity)}
                          </h4>
                          <p className="text-sm text-slate-500 mt-2">
                            *(Monto superior sugerido al que solicitaste de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(requestedAmount)})
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <p className="text-sm text-slate-500 font-medium">Cuota Mensual Estimada</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                maximumFractionDigits: 0
                              }).format(simulationResult.estimatedPayment)}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-xl p-5">
                            <p className="text-sm text-slate-500 font-medium">Condiciones</p>
                            <p className="text-lg font-bold text-slate-900 mt-1">{simulationResult.recommendedTerm} Meses</p>
                            <p className="text-xs text-fintera-600 font-semibold mt-1">Tasa est. {simulationResult.interestRate.toFixed(2)}% M.V.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 mt-4">
                        <div className="flex items-start space-x-2">
                          <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                          <p className="text-sm text-slate-700 font-medium">
                            Tienes altas probabilidades de aprobación. Completa tu solicitud formal para asegurar estas tasas preferenciales antes de que cambien.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-6 mt-4">
                    {currentStep > 1 && currentStep < 4 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-6"
                        disabled={isSimulating}
                      >
                        Anterior
                      </Button>
                    )}

                    <div className={currentStep === 4 ? "w-full" : "flex-1 flex justify-end"}>
                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          variant="gradient"
                          size="lg"
                          onClick={handleNext}
                          disabled={
                            (currentStep === 1 && (!formData.category || !formData.subProduct || !formData.amount)) ||
                            (currentStep === 2 && (!formData.income || !formData.city))
                          }
                          className="px-8 hover:scale-105 transition-transform duration-200"
                        >
                          Continuar
                          <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </Button>
                      ) : currentStep === 3 ? (
                        <Button
                          type="submit"
                          variant="gradient"
                          size="lg"
                          disabled={isSimulating || !formData.name || !formData.phone || !formData.email}
                          className="px-8 hover:scale-105 transition-transform duration-200 bg-fintera-600 flex items-center gap-2 w-full md:w-auto min-w-[280px] justify-center"
                        >
                          {isSimulating ? (
                            <>
                              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Analizando tu historial...
                            </>
                          ) : (
                            <>
                              Calcular Opciones Reales
                              <CheckCircleIcon className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="gradient"
                          size="lg"
                          onClick={handleFunnelRedirect}
                          className="w-full h-14 text-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-blue-600 to-cyan-500 shadow-xl"
                        >
                          Completar Solicitud Formal y Agilizar mi Desembolso
                          <ArrowRightIcon className="ml-3 h-6 w-6" />
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
