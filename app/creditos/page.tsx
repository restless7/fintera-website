"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  HomeIcon,
  TruckIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const creditTypes = [
  {
    id: "vivienda",
    icon: HomeIcon,
    title: "Crédito de Vivienda",
    description: "Haz realidad el sueño de tu casa propia con las mejores condiciones del mercado colombiano.",
    monto: "Hasta $500.000.000",
    plazo: "Hasta 20 años",
    tasa: "Desde 10.5% E.A.",
    gradient: "from-blue-500 to-cyan-500",
    benefits: [
      "Financiación hasta del 80% del valor del inmueble",
      "Cuotas fijas o variables según tu preferencia",
      "Posibilidad de incluir seguros en el crédito",
      "Asesoría jurídica incluida en el proceso",
    ],
    requirements: [
      "Ser mayor de edad y menor de 70 años",
      "Ingresos mínimos de $2.500.000 mensuales",
      "Cuota inicial desde el 20%",
      "Antigüedad laboral mínima de 1 año",
    ],
  },
  {
    id: "libre-inversion",
    icon: BanknotesIcon,
    title: "Crédito de Libre Inversión",
    description: "Dinero disponible para cualquier proyecto personal: educación, viajes, imprevistos o lo que necesites.",
    monto: "Hasta $150.000.000",
    plazo: "Hasta 5 años",
    tasa: "Desde 1.5% M.V.",
    gradient: "from-cyan-500 to-blue-600",
    benefits: [
      "Desembolso inmediato en 24-48 horas",
      "Sin destinación específica requerida",
      "Cuotas fijas mensuales",
      "Prepago sin penalización",
    ],
    requirements: [
      "Ser mayor de edad",
      "Ingresos mínimos de $1.500.000 mensuales",
      "Buen historial crediticio",
      "Antigüedad laboral mínima de 6 meses",
    ],
  },
  {
    id: "vehiculo",
    icon: TruckIcon,
    title: "Crédito de Vehículo",
    description: "Adquiere el vehículo nuevo o usado que necesitas con tasas preferenciales y condiciones flexibles.",
    monto: "Hasta $200.000.000",
    plazo: "Hasta 7 años",
    tasa: "Desde 14.9% E.A.",
    gradient: "from-purple-500 to-blue-500",
    benefits: [
      "Financiación hasta del 90% del valor del vehículo",
      "Incluye seguro todo riesgo",
      "Cuota inicial desde el 10%",
      "Renovación anticipada disponible",
    ],
    requirements: [
      "Ser mayor de edad y menor de 75 años",
      "Ingresos mínimos de $2.000.000 mensuales",
      "Vehículo modelo no mayor a 15 años",
      "Cuota inicial del 10% mínimo",
    ],
  },
  {
    id: "libranza",
    icon: DocumentTextIcon,
    title: "Libranza",
    description: "Crédito con descuento directo de nómina, ideal para empleados del sector público y privado.",
    monto: "Hasta $100.000.000",
    plazo: "Hasta 6 años",
    tasa: "Desde 1.2% M.V.",
    gradient: "from-green-500 to-cyan-500",
    benefits: [
      "Descuento automático de nómina",
      "Tasas de interés más bajas del mercado",
      "Aprobación rápida y sin complicaciones",
      "Sin necesidad de codeudor",
    ],
    requirements: [
      "Ser empleado activo con contrato vigente",
      "Antigüedad laboral mínima de 6 meses",
      "Autorización de descuento por nómina",
      "Capacidad de pago disponible en salario",
    ],
  },
];

export default function CreditosPage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/50 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e950_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e950_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
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

        <div className="relative z-10 pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Hero Section */}
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Hero Image Container */}
              <div className="relative w-full max-w-4xl mx-auto mb-12 aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/creditos-hero.jpg"
                  alt="Créditos FINTERA - Vivienda, Vehículo, Libre Inversión y Libranza"
                  fill
                  className="object-cover"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-fintera-600 text-sm font-semibold tracking-wider uppercase">
                  Nuestros Productos Financieros
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mt-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Créditos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  Diseñados para Ti
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Como aliado comercial oficial de Banco de Bogotá, te ofrecemos las mejores opciones 
                de financiamiento en Colombia con tasas competitivas y procesos transparentes.
              </motion.p>
            </motion.div>

            {/* Credit Cards Grid */}
            <div className="space-y-12">
              {creditTypes.map((credit, index) => (
                <motion.div
                  key={credit.id}
                  id={credit.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-fintera-100/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className={`bg-gradient-to-r ${credit.gradient} p-8`}>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <credit.icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-3xl font-bold text-white mb-2">
                              {credit.title}
                            </CardTitle>
                            <p className="text-blue-100 text-lg">
                              {credit.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8">
                      {/* Quick Info */}
                      <div className="grid md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-slate-200">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                          <div className="text-sm text-slate-600 mb-1">Monto</div>
                          <div className="text-2xl font-bold text-fintera-600">{credit.monto}</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl">
                          <div className="text-sm text-slate-600 mb-1">Plazo</div>
                          <div className="text-2xl font-bold text-fintera-600">{credit.plazo}</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                          <div className="text-sm text-slate-600 mb-1">Tasa</div>
                          <div className="text-2xl font-bold text-fintera-600">{credit.tasa}</div>
                        </div>
                      </div>

                      {/* Benefits and Requirements */}
                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                            Beneficios
                          </h3>
                          <ul className="space-y-3">
                            {credit.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-fintera-500 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-slate-600">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                            Requisitos
                          </h3>
                          <ul className="space-y-3">
                            {credit.requirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-slate-600">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/credit-request" className="flex-1">
                          <Button
                            className={`w-full h-12 bg-gradient-to-r ${credit.gradient} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg`}
                          >
                            Solicitar {credit.title}
                            <ArrowRightIcon className="ml-2 w-5 h-5" />
                          </Button>
                        </Link>
                        <Link href="/contacto">
                          <Button
                            variant="outline"
                            className="h-12 px-8 border-2 border-fintera-200 hover:border-fintera-400 hover:bg-fintera-50 rounded-xl font-semibold"
                          >
                            Más Información
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div
              className="mt-20 text-center bg-gradient-to-r from-fintera-600 via-gradient-via to-gradient-to rounded-3xl p-12 shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿No estás seguro cuál es el mejor crédito para ti?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Nuestros asesores especializados te ayudarán a encontrar la opción perfecta según tus necesidades y capacidad de pago.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contacto">
                  <Button
                    size="lg"
                    className="bg-white text-fintera-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl"
                  >
                    Hablar con un Asesor
                  </Button>
                </Link>
                <Link href="/credit-request">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl"
                  >
                    Iniciar Solicitud
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
