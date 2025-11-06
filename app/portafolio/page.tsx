"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BuildingLibraryIcon,
  DocumentCheckIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  BanknotesIcon,
  TruckIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const currentServices = [
  {
    id: "servicios",
    icon: BuildingLibraryIcon,
    title: "Alianzas con Entidades Financieras",
    description: "Somos aliado comercial oficial de Banco de Bogotá, lo que nos permite ofrecerte acceso directo a los mejores productos crediticios del mercado colombiano.",
    features: [
      "Crédito de vivienda con tasas desde 10.5% E.A.",
      "Crédito de libre inversión hasta $150M",
      "Crédito de vehículo con aprobación rápida",
      "Libranza con descuento directo de nómina",
    ],
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    id: "procesos",
    icon: DocumentCheckIcon,
    title: "Procesamiento y Diligenciamiento Digital",
    description: "Simplificamos todo el proceso de solicitud y aprobación de créditos con nuestra plataforma digital de última generación.",
    features: [
      "Formularios en línea optimizados y seguros",
      "Carga de documentos 100% digital",
      "Seguimiento en tiempo real de tu solicitud",
      "Firma electrónica válida legalmente",
    ],
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "acompanamiento",
    icon: UserGroupIcon,
    title: "Acompañamiento en Tiempos de Trámite",
    description: "No estás solo en el proceso. Nuestro equipo te acompaña desde la precalificación hasta el desembolso de tu crédito.",
    features: [
      "Asesores especializados disponibles 6 días a la semana",
      "Respuesta a consultas en menos de 2 horas",
      "Actualizaciones automáticas por WhatsApp y correo",
      "Resolución proactiva de inconvenientes",
    ],
    gradient: "from-purple-500 to-blue-500",
  },
];

const futureServices = [
  {
    icon: ChartBarIcon,
    title: "Factoring",
    description: "Próximamente: Adelanto de cartera para empresas y comercios.",
    status: "Próximamente",
    gradient: "from-green-500 to-cyan-500",
  },
  {
    icon: TruckIcon,
    title: "Renting y Leasing",
    description: "Acceso a vehículos y equipos sin compra inicial.",
    status: "En Desarrollo",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: BuildingOfficeIcon,
    title: "Integración Multibanca",
    description: "Comparación en tiempo real entre múltiples entidades financieras.",
    status: "2026",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: BanknotesIcon,
    title: "Servicios B2B de Procesamiento de Leads",
    description: "Plataforma especializada para intermediarios y brokers financieros.",
    status: "En Planeación",
    gradient: "from-pink-500 to-purple-500",
  },
];

const differentiators = [
  {
    icon: ClockIcon,
    title: "Velocidad de Respuesta",
    description: "Precalificación en 2 minutos, respuesta final en menos de 24 horas.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Transparencia Total",
    description: "Sin letra pequeña ni sorpresas. Tasas y condiciones claras desde el inicio.",
  },
  {
    icon: ChartBarIcon,
    title: "Modelo de Precisión",
    description: "Inteligencia comercial y scoring avanzado para mayor tasa de aprobación.",
  },
];

export default function PortafolioPage() {
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-fintera-600 text-sm font-semibold tracking-wider uppercase">
                  Nuestro Portafolio de Servicios
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mt-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Soluciones{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  Financieras Integrales
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Descubre cómo FINTERA está transformando el acceso al crédito en Colombia con tecnología, 
                transparencia y acompañamiento personalizado.
              </motion.p>
            </motion.div>

            {/* Current Services */}
            <div className="mb-20">
              <motion.h2
                className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <RocketLaunchIcon className="w-8 h-8 text-fintera-600" />
                Servicios Actuales
              </motion.h2>

              <div className="grid md:grid-cols-1 gap-8">
                {currentServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    id={service.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border-fintera-100/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader className={`bg-gradient-to-r ${service.gradient} p-6`}>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                            <service.icon className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold text-white">
                              {service.title}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                          {service.description}
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                          {service.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl">
                              <div className="w-2 h-2 bg-fintera-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-slate-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Future Services */}
            <div id="futuros" className="mb-20">
              <motion.h2
                className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <RocketLaunchIcon className="w-8 h-8 text-purple-600" />
                Productos Futuros
              </motion.h2>

              <div className="grid md:grid-cols-2 gap-6">
                {futureServices.map((service, index) => (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 border-dashed border-2 border-slate-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-gradient-to-r ${service.gradient} rounded-xl flex items-center justify-center`}>
                              <service.icon className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-xl font-bold text-slate-900">
                              {service.title}
                            </CardTitle>
                          </div>
                          <span className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {service.status}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600">{service.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Differentiators */}
            <motion.div
              className="bg-gradient-to-r from-fintera-600 via-gradient-via to-gradient-to rounded-3xl p-12 shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
                ¿Por qué elegir FINTERA?
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {differentiators.map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-blue-100">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
