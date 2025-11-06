"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Card, CardContent } from "@/components/ui/card";
import { LockClosedIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const securityFeatures = [
  { title: "Encriptación SSL/TLS 256-bit", description: "Todas las comunicaciones están protegidas con el más alto nivel de encriptación bancaria." },
  { title: "Autenticación de Dos Factores", description: "Protección adicional para acceder a tu información sensible." },
  { title: "Servidores Certificados", description: "Infraestructura con certificaciones ISO 27001 y SOC 2 Tipo II." },
  { title: "Monitoreo 24/7", description: "Vigilancia constante contra amenazas y vulnerabilidades." },
  { title: "Respaldos Automáticos", description: "Copias de seguridad diarias encriptadas en múltiples ubicaciones." },
  { title: "Auditorías de Seguridad", description: "Revisiones trimestrales por firmas independientes especializadas." },
];

export default function SeguridadPage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e950_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e950_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        </div>

        <div className="relative z-10 pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <LockClosedIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Seguridad de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  Datos
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Tu información está protegida con estándares bancarios de seguridad de clase mundial.
              </p>
            </motion.div>

            {/* Security Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full border-fintera-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <CheckCircleIcon className="w-10 h-10 text-green-600 mb-3" />
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="border-fintera-100/50 shadow-xl">
                <CardContent className="p-8 md:p-12 space-y-6">
                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Compromiso con tu Seguridad</h2>
                    <p className="text-slate-600 leading-relaxed">
                      En FINTERA entendemos que la confianza es la base de nuestra relación contigo. Por eso implementamos múltiples capas de seguridad para proteger tu información personal y financiera en todo momento.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Protección de Datos Personales</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Cumplimos estrictamente con la Ley 1581 de 2012 de Protección de Datos Personales de Colombia. Tu información nunca será vendida ni compartida con terceros sin tu autorización expresa, excepto cuando sea requerido por ley o necesario para procesar tu solicitud de crédito.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Prevención de Fraude</h3>
                    <p className="text-slate-600 leading-relaxed mb-3">
                      Utilizamos sistemas avanzados de detección de fraude que incluyen:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li>Verificación de identidad en múltiples etapas</li>
                      <li>Análisis de comportamiento y patrones sospechosos</li>
                      <li>Validación biométrica cuando sea aplicable</li>
                      <li>Alertas automáticas ante actividad inusual</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Reportar Incidente de Seguridad</h3>
                    <p className="text-slate-600 leading-relaxed mb-2">
                      Si sospechas de alguna actividad no autorizada en tu cuenta o has recibido comunicaciones sospechosas que parecen provenir de FINTERA:
                    </p>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-3">
                      <p className="text-slate-700 font-semibold">Contáctanos inmediatamente:</p>
                      <p className="text-slate-600">Email: <a href="mailto:seguridad@fintera.com.co" className="text-fintera-600 hover:underline">seguridad@fintera.com.co</a></p>
                      <p className="text-slate-600">Teléfono: +57 (300) 123-4567</p>
                    </div>
                  </section>

                  <div className="bg-blue-50 border-l-4 border-fintera-600 p-4 mt-6">
                    <p className="text-slate-700 text-sm">
                      <strong>Recuerda:</strong> FINTERA NUNCA te solicitará por correo o teléfono tu contraseña completa, número de tarjeta de crédito, o códigos de verificación enviados a tu celular.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
