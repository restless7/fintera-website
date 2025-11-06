"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default function TerminosPage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e950_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e950_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        </div>

        <div className="relative z-10 pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <DocumentTextIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Términos del{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  Servicio
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Condiciones de uso de la plataforma FINTERA y nuestros servicios de intermediación financiera.
              </p>
              
              <p className="text-sm text-slate-500 mt-4">
                Última actualización: Enero 2025
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="border-fintera-100/50 shadow-xl">
                <CardContent className="p-8 md:p-12 space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Aceptación de los Términos</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Al acceder y utilizar los servicios de FINTERA, aceptas estar legalmente vinculado por estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Descripción de los Servicios</h2>
                    <p className="text-slate-600 leading-relaxed mb-3">
                      FINTERA es un aliado comercial que actúa como intermediario entre solicitantes de crédito y entidades financieras debidamente autorizadas en Colombia. Nuestros servicios incluyen:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li>Evaluación y precalificación de solicitudes de crédito</li>
                      <li>Procesamiento y diligenciamiento de documentación</li>
                      <li>Intermediación ante entidades financieras aliadas</li>
                      <li>Acompañamiento durante el proceso de aprobación</li>
                      <li>Asesoría personalizada sobre productos crediticios</li>
                    </ul>
                    <p className="text-slate-600 leading-relaxed mt-3">
                      <strong className="text-slate-900">FINTERA NO es una entidad financiera.</strong> No otorgamos créditos directamente ni tomamos decisiones de aprobación o rechazo de solicitudes.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Obligaciones del Usuario</h2>
                    <p className="text-slate-600 leading-relaxed mb-3">
                      Al utilizar nuestros servicios, te comprometes a:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li>Proporcionar información veraz, exacta y actualizada</li>
                      <li>Ser mayor de edad según la legislación colombiana (18 años)</li>
                      <li>Tener capacidad legal para contratar créditos</li>
                      <li>Entregar documentación legítima y no falsificada</li>
                      <li>Responder oportunamente a las solicitudes de información</li>
                      <li>No utilizar la plataforma para actividades ilícitas o fraudulentas</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Costos y Comisiones</h2>
                    <p className="text-slate-600 leading-relaxed">
                      <strong className="text-slate-900">FINTERA NO cobra al usuario final por el procesamiento de solicitudes o asesoría.</strong> Nuestra remuneración proviene directamente de las entidades financieras aliadas cuando tu crédito es aprobado y desembolsado. Los únicos costos que asumirás son aquellos establecidos por la entidad financiera que apruebe tu crédito (tasas de interés, seguros, costos notariales, etc.), los cuales te serán informados claramente antes de la formalización.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Proceso de Solicitud</h2>
                    <div className="space-y-3 text-slate-600">
                      <p><strong className="text-slate-900">5.1 Precalificación:</strong> Es un análisis preliminar sin garantía de aprobación.</p>
                      <p><strong className="text-slate-900">5.2 Evaluación:</strong> La entidad financiera realiza el estudio definitivo. FINTERA no controla tiempos ni decisiones del banco.</p>
                      <p><strong className="text-slate-900">5.3 Aprobación:</strong> Es responsabilidad exclusiva de la entidad financiera.</p>
                      <p><strong className="text-slate-900">5.4 Desembolso:</strong> Se realiza una vez firmados los documentos legales con la entidad financiera.</p>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitación de Responsabilidad</h2>
                    <p className="text-slate-600 leading-relaxed mb-3">
                      FINTERA no se hace responsable por:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li>Rechazos de solicitudes por parte de las entidades financieras</li>
                      <li>Cambios en las condiciones crediticias ofrecidas por los bancos</li>
                      <li>Demoras en los procesos de aprobación por parte de terceros</li>
                      <li>Errores en la información proporcionada por el usuario</li>
                      <li>Pérdidas económicas derivadas de decisiones financieras del usuario</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Propiedad Intelectual</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Todo el contenido presente en fintera.com.co, incluyendo textos, imágenes, logotipos, diseños y código fuente, es propiedad exclusiva de FINTERA o sus licenciantes. Queda prohibida su reproducción, distribución o modificación sin autorización expresa.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Modificaciones del Servicio</h2>
                    <p className="text-slate-600 leading-relaxed">
                      FINTERA se reserva el derecho de modificar, suspender o descontinuar cualquier aspecto de sus servicios en cualquier momento, con o sin previo aviso. Las modificaciones a estos términos serán publicadas en este sitio y entrarán en vigencia inmediatamente.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Ley Aplicable y Jurisdicción</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será sometida a los tribunales competentes de Bucaramanga, Santander, Colombia.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contacto</h2>
                    <div className="text-slate-600 leading-relaxed space-y-2">
                      <p>Para consultas sobre estos términos:</p>
                      <p><strong className="text-slate-900">Correo:</strong> legal@fintera.com.co</p>
                      <p><strong className="text-slate-900">Teléfono:</strong> +57 (300) 123-4567</p>
                    </div>
                  </section>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                    <p className="text-sm text-slate-500 text-center">
                      Al utilizar nuestros servicios, confirmas que has leído, entendido y aceptado estos términos y condiciones en su totalidad.
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
