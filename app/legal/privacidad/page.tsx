"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/50 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e950_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e950_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        </div>

        <div className="relative z-10 pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Hero Section */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-fintera-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <ShieldCheckIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Política de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  Privacidad
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                En FINTERA protegemos tu información personal con los más altos estándares de seguridad y confidencialidad.
              </p>
              
              <p className="text-sm text-slate-500 mt-4">
                Última actualización: Enero 2025
              </p>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="border-fintera-100/50 shadow-xl">
                <CardContent className="p-8 md:p-12 space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Información que Recopilamos</h2>
                    <div className="space-y-3 text-slate-600 leading-relaxed">
                      <p><strong className="text-slate-900">Datos personales:</strong> Nombre completo, cédula de ciudadanía, fecha de nacimiento, correo electrónico, número telefónico y dirección de residencia.</p>
                      <p><strong className="text-slate-900">Datos financieros:</strong> Información laboral, ingresos mensuales, historial crediticio, extractos bancarios y declaración de renta.</p>
                      <p><strong className="text-slate-900">Datos de navegación:</strong> Dirección IP, tipo de navegador, páginas visitadas y tiempo de permanencia en el sitio.</p>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Uso de la Información</h2>
                    <p className="text-slate-600 leading-relaxed mb-3">
                      La información recopilada es utilizada exclusivamente para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li>Procesar tu solicitud de crédito ante nuestras entidades aliadas</li>
                      <li>Realizar análisis de precalificación y scoring crediticio</li>
                      <li>Enviarte actualizaciones sobre el estado de tu solicitud</li>
                      <li>Cumplir con requisitos legales y regulatorios (SARLAFT, SAGRILAFT)</li>
                      <li>Mejorar nuestros servicios y experiencia de usuario</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Compartir Información con Terceros</h2>
                    <p className="text-slate-600 leading-relaxed mb-3">
                      Tu información personal será compartida únicamente con:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li><strong className="text-slate-900">Entidades financieras aliadas:</strong> Banco de Bogotá y otras instituciones con las que tengas solicitud activa</li>
                      <li><strong className="text-slate-900">Centrales de riesgo:</strong> Datacrédito, TransUnion, CIFIN para consulta de historial crediticio</li>
                      <li><strong className="text-slate-900">Autoridades competentes:</strong> Cuando sea requerido por ley o mandato judicial</li>
                    </ul>
                    <p className="text-slate-600 leading-relaxed mt-3">
                      <strong>FINTERA NO vende, alquila ni comparte tu información personal con fines comerciales a terceros no autorizados.</strong>
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Seguridad de los Datos</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Implementamos medidas técnicas y organizativas para proteger tu información:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4 mt-3">
                      <li>Encriptación SSL/TLS en todas las comunicaciones</li>
                      <li>Servidores seguros con certificaciones internacionales</li>
                      <li>Acceso restringido a personal autorizado únicamente</li>
                      <li>Monitoreo continuo de vulnerabilidades</li>
                      <li>Respaldo periódico de información</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Tus Derechos</h2>
                    <p className="text-slate-600 leading-relaxed mb-3">
                      De acuerdo con la Ley 1581 de 2012 (Habeas Data), tienes derecho a:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li>Conocer, actualizar y rectificar tus datos personales</li>
                      <li>Solicitar prueba de la autorización otorgada</li>
                      <li>Ser informado sobre el uso de tus datos</li>
                      <li>Presentar quejas ante la Superintendencia de Industria y Comercio</li>
                      <li>Revocar la autorización y solicitar la supresión de datos (sujeto a obligaciones legales)</li>
                      <li>Acceder gratuitamente a tus datos personales</li>
                    </ul>
                    <p className="text-slate-600 leading-relaxed mt-4">
                      Para ejercer estos derechos, contáctanos en: <a href="mailto:privacidad@fintera.com.co" className="text-fintera-600 hover:underline font-semibold">privacidad@fintera.com.co</a>
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cookies y Tecnologías Similares</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Utilizamos cookies para mejorar tu experiencia de navegación. Puedes configurar tu navegador para rechazar cookies, pero esto puede limitar algunas funcionalidades del sitio.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Retención de Datos</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Conservamos tu información personal durante el tiempo necesario para cumplir con los fines descritos, más el periodo requerido por ley (generalmente 10 años para registros financieros según normativa colombiana).
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cambios a Esta Política</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Nos reservamos el derecho de actualizar esta política de privacidad. Los cambios significativos serán notificados por correo electrónico y/o mediante aviso destacado en nuestro sitio web.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Contacto</h2>
                    <div className="text-slate-600 leading-relaxed space-y-2">
                      <p><strong className="text-slate-900">Correo electrónico:</strong> privacidad@fintera.com.co</p>
                      <p><strong className="text-slate-900">Teléfono:</strong> +57 (300) 123-4567</p>
                      <p><strong className="text-slate-900">Dirección:</strong> Bucaramanga, Santander, Colombia</p>
                    </div>
                  </section>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                    <p className="text-sm text-slate-500 text-center">
                      Al utilizar nuestros servicios, aceptas los términos de esta política de privacidad y autorizas el tratamiento de tus datos personales conforme a la normativa colombiana vigente.
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
