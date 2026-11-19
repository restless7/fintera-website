"use client";

import { PUBLIC_CONTACT } from "@/lib/public-contact";
import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const contactMethods = [
  {
    icon: PhoneIcon,
    title: "Teléfono",
    detail: PUBLIC_CONTACT.phoneDisplay,
    description: "Lun - Vie: 8:00 AM - 6:00 PM",
    link: PUBLIC_CONTACT.telephoneUrl,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: EnvelopeIcon,
    title: "Correo Electrónico",
    detail: "info@fintera.com.co",
    description: "Canal de atención",
    link: "mailto:info@fintera.com.co",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "WhatsApp",
    detail: PUBLIC_CONTACT.phoneDisplay,
    description: "Canal oficial",
    link: PUBLIC_CONTACT.whatsappUrl,
    gradient: "from-green-500 to-cyan-500",
  },
  {
    icon: MapPinIcon,
    title: "Ubicación",
    detail: "Bucaramanga, Santander",
    description: "Colombia",
    link: "#",
    gradient: "from-purple-500 to-blue-500",
  },
];

const faqs = [
  {
    question: "¿Cuánto tiempo tarda la aprobación de un crédito?",
    answer: "La precalificación es inmediata (2 minutos). La respuesta definitiva del banco toma entre 24 y 48 horas hábiles una vez entregada toda la documentación.",
  },
  {
    question: "¿Tienen algún costo los servicios de FINTERA?",
    answer: "No cobramos por el proceso de solicitud ni asesoría. FINTERA es remunerado directamente por el banco aliado cuando tu crédito es aprobado y desembolsado.",
  },
  {
    question: "¿Qué documentos necesito para solicitar un crédito?",
    answer: "Los documentos básicos son: cédula, certificado laboral, extractos bancarios de los últimos 3 meses y declaración de renta (si aplica). Nuestros asesores te guían en el proceso.",
  },
  {
    question: "¿Puedo solicitar si tengo historial crediticio negativo?",
    answer: "Cada caso es evaluado individualmente. Nuestro modelo de precisión analiza múltiples variables más allá del score tradicional. Te recomendamos aplicar para una evaluación personalizada.",
  },
  {
    question: "¿Atienden a nivel nacional?",
    answer: "Sí, procesamos solicitudes de crédito en todo el territorio colombiano. El proceso es 100% digital, no necesitas visitas presenciales.",
  },
];

export default function ContactoPage() {
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
                <span className="text-blue-800 text-sm font-semibold tracking-wider uppercase">
                  Contáctanos
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mt-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Estamos Aquí{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  para Ayudarte
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Nuestro equipo de asesores especializados está listo para resolver tus dudas 
                y guiarte en tu proceso de solicitud de crédito.
              </motion.p>
            </motion.div>

            {/* Contact Methods Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              {contactMethods.map((method, index) => (
                <motion.a
                  key={method.title}
                  href={method.link}
                  target={method.link.startsWith('http') ? '_blank' : undefined}
                  rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="block"
                >
                  <Card className="h-full border-fintera-100/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 bg-gradient-to-r ${method.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <method.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{method.title}</h3>
                      <p className="text-blue-800 font-semibold mb-1">{method.detail}</p>
                      <p className="text-sm text-slate-500">{method.description}</p>
                    </CardContent>
                  </Card>
                </motion.a>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-12 mb-20">
              {/* Official contact channels */}
              <motion.div
                id="formulario"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <Card className="border-fintera-100/50 shadow-xl">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Hablemos por nuestros canales oficiales</h2>
                    <p className="text-slate-600 leading-relaxed mb-6">Elige cómo comunicarte con FINTERA. WhatsApp y correo se abren en sus aplicaciones; el mensaje se envía cuando lo confirmes allí.</p>
                    <div className="flex flex-col gap-3">
                      <a href={PUBLIC_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white hover:bg-blue-800">Escribir por WhatsApp</a>
                      <a href="mailto:info@fintera.com.co" className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-blue-800">Escribir a info@fintera.com.co</a>
                      <a href={PUBLIC_CONTACT.telephoneUrl} className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-blue-800">Llamar al {PUBLIC_CONTACT.phoneDisplay}</a>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-slate-600">Si quieres iniciar un proceso, puedes <a href="/solicitar" className="font-semibold text-blue-800 underline">registrar una solicitud breve</a> y consultar su estado desde Mi portal.</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Info & CTA */}
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* WhatsApp CTA */}
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-cyan-50 shadow-xl">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      Chatea con Nosotros
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      Puedes comunicarte con nuestro equipo por el WhatsApp oficial de FINTERA.
                    </p>
                    <a 
                      href={PUBLIC_CONTACT.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        className="bg-green-800 hover:bg-green-900 text-white font-semibold h-12 px-8 rounded-xl shadow-lg"
                      >
                        Abrir WhatsApp
                      </Button>
                    </a>
                  </CardContent>
                </Card>

                {/* Office Hours */}
                <Card className="border-fintera-100/50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Horarios de Atención</h3>
                    </div>
                    <div className="space-y-3 text-slate-600">
                      <div className="flex justify-between">
                        <span>Lunes - Viernes:</span>
                        <span className="font-semibold">8:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sábados:</span>
                        <span className="font-semibold">9:00 AM - 1:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Domingos:</span>
                        <span className="text-slate-600">Cerrado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card className="border-fintera-100/50 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <MapPinIcon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Ubicación</h3>
                    </div>
                    <p className="text-slate-600 mb-4">
                      <strong>FINTERA</strong><br />
                      Bucaramanga, Santander<br />
                      Colombia<br />
                      <span className="text-sm text-slate-500">
                        (Atención 100% digital - no requiere visitas presenciales)
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* FAQ Section */}
            <motion.div
              className="mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Preguntas Frecuentes
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  Resolvemos las dudas más comunes sobre nuestros servicios
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="border-fintera-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-start gap-3">
                          <span className="text-blue-800 flex-shrink-0">Q.</span>
                          {faq.question}
                        </h3>
                        <p className="text-slate-600 leading-relaxed pl-7">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-slate-600 mb-4">¿No encuentras la respuesta que buscas?</p>
                <a href="#formulario">
                  <Button variant="outline" className="border-2 border-fintera-200 hover:border-fintera-400 hover:bg-fintera-50 rounded-xl font-semibold">
                    Contáctanos Directamente
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
