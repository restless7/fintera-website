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
    title: "Línea 1 · Crédito de Vivienda y Financiación Personal (B2C)",
    description:
      "Conectamos compradores de vivienda y personas naturales con entidades financieras vigiladas (Bancolombia, Banco de Bogotá, AV Villas, BBVA, Banco de Occidente, Banco Caja Social, Credifamilia y Banco Unión) mediante comparación objetiva y transparente.",
    features: [
      "Crédito hipotecario y leasing habitacional VIS y No VIS (Pesos y UVR)",
      "Análisis de capacidad de endeudamiento (relación primera cuota / ingreso ≤ 30%)",
      "Comparación integral de tasa E.A. (SFC), seguros vinculados y gastos de cierre",
      "Crédito de libre inversión y libranza sujetos a perfil crediticio",
    ],
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    id: "procesos",
    icon: DocumentCheckIcon,
    title: "Gestión Documental y Precalificación Digital",
    description:
      "Estructuramos y validamos tu carpeta financiera antes de radicar ante los bancos aliados, reduciendo reprocesos y cuidando tu historial en centrales de riesgo.",
    features: [
      "Simulación hipotecaria y autodiagnóstico financiero en línea",
      "Revisión previa de extractos, soportes laborales y declaraciones tributarias (DIAN)",
      "Seguimiento transparente del estado de tu solicitud en el Portal de Clientes",
      "Tratamiento seguro de datos personales bajo la Ley 1581 de 2012 (Habeas Data)",
    ],
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "acompanamiento",
    icon: UserGroupIcon,
    title: "Acompañamiento Especializado en Todo el Proceso",
    description:
      "No solo presentamos una solicitud: te orientamos desde la estructuración inicial hasta el estudio de títulos, avalúo y desembolso.",
    features: [
      "Especialistas en estructuración hipotecaria y financiera a tu disposición",
      "Orientación clara sobre requisitos para empleados, independientes y colombianos en el exterior",
      "Actualizaciones oportunas en cada hito del estudio de crédito",
      "Educación financiera continua a través de nuestro portal FINTERA Insights",
    ],
    gradient: "from-purple-500 to-blue-500",
  },
];

const futureServices = [
  {
    icon: ChartBarIcon,
    title: "Línea 2 · Liquidez Empresarial y Factoring (RADIAN / DIAN)",
    description:
      "Diagnóstico de capital de trabajo para empresas que venden a crédito (30–90 días), verificación de los 3 eventos obligatorios de factura electrónica en RADIAN y estructuración de operaciones de factoring a través de nuestros aliados financieros autorizados.",
    status: "Diagnóstico y Estructuración con Aliados",
    gradient: "from-green-500 to-cyan-500",
  },
  {
    icon: BuildingOfficeIcon,
    title: "Comparador Multibanco Basado en Datos Oficiales",
    description:
      "Monitoreo continuo de reportes de tasas de interés de la Superfinanciera (SFC), Banco de la República y DANE para decisiones informadas.",
    status: "Activo en FINTERA Insights",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: TruckIcon,
    title: "Leasing Operativo y Financiación de Activos Productivos",
    description:
      "Alternativas en desarrollo para renovación de maquinaria, equipos y flota empresarial sin descapitalizar la operación.",
    status: "En Estructuración",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: BanknotesIcon,
    title: "Red de Aliados Estratégicos (Inmobiliarias, Constructoras y Contadores)",
    description:
      "Canal especializado de acompañamiento financiero para compradores de proyectos inmobiliarios y clientes empresariales.",
    status: "Alianzas Abiertas",
    gradient: "from-pink-500 to-purple-500",
  },
];

const differentiators = [
  {
    icon: ChartBarIcon,
    title: "1. Criterio Financiero",
    description:
      "Analizamos tu capacidad de pago, estructura de costos, seguros y flujo de caja antes de recomendar una alternativa.",
  },
  {
    icon: UserGroupIcon,
    title: "2. Acompañamiento Cercano",
    description:
      "Te orientamos paso a paso durante la preparación documental, radicación y seguimiento ante las entidades aliadas.",
  },
  {
    icon: ShieldCheckIcon,
    title: "3. Transparencia Absoluta",
    description:
      "Explicamos requisitos, tasas efectivas anuales (E.A.), condiciones y riesgos reales sin promesas engañosas.",
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
                Soluciones Empresariales B2B y Ecosistema de Aliados
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
