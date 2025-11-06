"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  LightBulbIcon,
  EyeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const brandPillars = [
  {
    icon: ShieldCheckIcon,
    title: "Transparencia",
    description: "Información clara y sin letra pequeña. Todas las tasas, plazos y condiciones visibles desde el primer momento.",
  },
  {
    icon: ClockIcon,
    title: "Agilidad",
    description: "Procesos optimizados digitalmente. Precalificación en 2 minutos, respuesta definitiva en 24 horas.",
  },
  {
    icon: ChartBarIcon,
    title: "Precisión",
    description: "Modelo de scoring avanzado y filtrado inteligente de leads para mayor tasa de aprobación.",
  },
  {
    icon: SparklesIcon,
    title: "Inteligencia Comercial",
    description: "Análisis de datos en tiempo real para conectar a cada cliente con la mejor opción de financiamiento.",
  },
  {
    icon: UserGroupIcon,
    title: "Acompañamiento Digital",
    description: "Asesores especializados disponibles en cada etapa del proceso, desde la solicitud hasta el desembolso.",
  },
];

const timeline = [
  {
    year: "2023",
    title: "Génesis",
    description: "FINTERA nace como respuesta a la complejidad del sistema crediticio colombiano. Identificamos que miles de colombianos cualificados son rechazados por falta de acompañamiento en el proceso.",
  },
  {
    year: "2024",
    title: "Alianza Estratégica",
    description: "Nos convertimos en aliado comercial oficial de Banco de Bogotá, una de las entidades financieras más sólidas de Colombia con más de 150 años de experiencia.",
  },
  {
    year: "2025",
    title: "Expansión Digital",
    description: "Lanzamiento de nuestra plataforma digital de extremo a extremo, permitiendo solicitudes 100% en línea con firma electrónica y seguimiento en tiempo real.",
  },
  {
    year: "2026",
    title: "Visión Multibanca",
    description: "Integración con múltiples entidades financieras para ofrecer comparación en tiempo real y la mejor opción de crédito para cada perfil.",
  },
];

const differentials = [
  {
    title: "Modelo de Precisión",
    description: "A diferencia de las financieras tradicionales, FINTERA utiliza un sistema de scoring propietario que analiza más de 40 variables para determinar la capacidad real de pago del solicitante. Esto nos permite aprobar clientes que serían rechazados en el sistema tradicional.",
  },
  {
    title: "Sin Conflicto de Intereses",
    description: "No somos un banco. Somos tu aliado comercial. Nuestro único objetivo es encontrarte el mejor crédito disponible, no vender productos específicos con metas de colocación.",
  },
  {
    title: "Tecnología al Servicio del Cliente",
    description: "Mientras los bancos tradicionales requieren visitas presenciales y trámites en papel, nosotros digitalizamos el 100% del proceso sin sacrificar el acompañamiento humano cuando lo necesitas.",
  },
];

export default function NosotrosPage() {
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-fintera-600 text-sm font-semibold tracking-wider uppercase">
                  Sobre FINTERA
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mt-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Transformando el{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  Acceso al Crédito
                </span>
                {" "}en Colombia
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Somos el puente entre personas cualificadas y las mejores oportunidades de financiamiento, 
                combinando tecnología de punta con acompañamiento humano especializado.
              </motion.p>
            </motion.div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Card className="h-full border-fintera-100/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-fintera-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                      <LightBulbIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Nuestra Misión</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Democratizar el acceso al crédito en Colombia mediante tecnología, transparencia y acompañamiento especializado, 
                      conectando a cada colombiano con la mejor opción de financiamiento según su perfil y capacidad de pago.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Card className="h-full border-fintera-100/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                      <EyeIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Nuestra Visión</h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Ser la plataforma líder de inteligencia comercial financiera en Colombia para 2026, 
                      integrando múltiples entidades bancarias y ofreciendo comparación en tiempo real 
                      con el mejor servicio de acompañamiento del mercado.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* How FINTERA Works Today */}
            <motion.div
              id="como-trabajamos"
              className="mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Cómo Funciona FINTERA Hoy
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  Como aliado comercial oficial de Banco de Bogotá, procesamos y optimizamos tu solicitud de crédito 
                  con un modelo de precisión único en el mercado.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Precalificación Inteligente",
                    description: "Completas nuestro formulario digital. Nuestro sistema analiza 40+ variables en tiempo real y determina tu elegibilidad en 2 minutos.",
                  },
                  {
                    step: "02",
                    title: "Optimización de Solicitud",
                    description: "Nuestros asesores revisan tu perfil, optimizan la documentación y estructuran tu solicitud para maximizar la probabilidad de aprobación.",
                  },
                  {
                    step: "03",
                    title: "Acompañamiento hasta el Final",
                    description: "Te acompañamos en todo el proceso con el banco, resolvemos inconvenientes y te mantenemos informado hasta el desembolso.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full border-fintera-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="text-5xl font-bold text-fintera-600/20 mb-4">{item.step}</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Brand Pillars */}
            <motion.div
              id="modelo"
              className="mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Nuestros Pilares de Marca
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  Cinco principios que guían cada decisión y proceso en FINTERA
                </p>
              </div>

              <div className="grid md:grid-cols-5 gap-6">
                {brandPillars.map((pillar, index) => (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full text-center border-fintera-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <CardContent className="p-6">
                        <div className="w-14 h-14 bg-gradient-to-r from-fintera-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <pillar.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-3">{pillar.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Nuestra Historia
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  La evolución de FINTERA desde su génesis hasta la visión futura
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-fintera-500 to-cyan-500" />
                
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    className={`flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  >
                    <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                      <Card className="border-fintera-100/50 shadow-lg">
                        <CardContent className="p-6">
                          <div className="text-3xl font-bold text-fintera-600 mb-2">{item.year}</div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                          <p className="text-slate-600">{item.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="w-2/12 flex justify-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-fintera-500 to-cyan-500 rounded-full border-4 border-white shadow-lg" />
                    </div>
                    <div className="w-5/12" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Differentials */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  ¿Qué Nos Hace Diferentes?
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  Nuestro diferencial competitivo frente a financieras y bancos tradicionales
                </p>
              </div>

              <div className="space-y-6">
                {differentials.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="border-fintera-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                        <p className="text-lg text-slate-600 leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Press & Media */}
            <motion.div
              id="prensa"
              className="mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Sala de Prensa
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  Recursos para medios de comunicación y cobertura de FINTERA
                </p>
              </div>

              <Card className="border-fintera-100/50 shadow-xl">
                <CardContent className="p-8 md:p-12">
                  <div className="prose prose-slate max-w-none">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Contacto de Prensa</h3>
                    <p className="text-slate-600 mb-6">
                      Para consultas de medios, solicitudes de entrevistas o información adicional sobre FINTERA:
                    </p>
                    <div className="bg-fintera-50 p-6 rounded-lg mb-8">
                      <p className="text-slate-700"><strong>Email:</strong> <a href="mailto:prensa@fintera.com.co" className="text-fintera-600 hover:underline">prensa@fintera.com.co</a></p>
                      <p className="text-slate-700"><strong>Teléfono:</strong> +57 (300) 123-4567</p>
                      <p className="text-slate-700"><strong>Horario de atención:</strong> Lunes a Viernes, 8:00 AM - 6:00 PM</p>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Kit de Prensa</h3>
                    <p className="text-slate-600 mb-4">
                      Descarga nuestro kit de prensa con logos, imágenes corporativas y boletines oficiales:
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button className="px-6 py-3 bg-fintera-600 text-white rounded-lg hover:bg-fintera-700 transition-colors">
                        Descargar Logos
                      </button>
                      <button className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
                        Boletín Corporativo
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              id="carreras"
              className="bg-gradient-to-r from-fintera-600 via-gradient-via to-gradient-to rounded-3xl p-12 shadow-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <RocketLaunchIcon className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Quieres Ser Parte de FINTERA?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Estamos buscando talento apasionado por la tecnología financiera y el servicio al cliente. 
                Si compartes nuestra visión, queremos conocerte.
              </p>
              <a 
                href="mailto:carreras@fintera.com.co"
                className="inline-block px-8 py-4 bg-white text-fintera-600 font-semibold rounded-xl shadow-xl hover:bg-blue-50 transition-all duration-300 hover:scale-105"
              >
                Envíanos tu CV
              </a>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
