"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";

export default function CumplimientoPage() {
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
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <CheckBadgeIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Cumplimiento{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                  Normativo
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                FINTERA opera en estricto cumplimiento de la normativa financiera colombiana y estándares internacionales.
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
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Marco Legal</h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      FINTERA cumple con todas las disposiciones legales aplicables a intermediarios financieros en Colombia:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li><strong className="text-slate-900">Ley 1581 de 2012:</strong> Protección de Datos Personales (Habeas Data)</li>
                      <li><strong className="text-slate-900">Circular Externa 100-000016 de 2020:</strong> Normas de Conducta Empresarial</li>
                      <li><strong className="text-slate-900">Ley 1266 de 2008:</strong> Gestión de Información Financiera y Crediticia</li>
                      <li><strong className="text-slate-900">Decreto 1074 de 2015:</strong> Regulación del Sector Comercio, Industria y Turismo</li>
                      <li><strong className="text-slate-900">Estatuto Orgánico del Sistema Financiero:</strong> Decreto 663 de 1993</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">SARLAFT y SAGRILAFT</h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      Implementamos el Sistema de Administración del Riesgo de Lavado de Activos y Financiación del Terrorismo (SARLAFT) y el Sistema de Autocontrol y Gestión del Riesgo Integral de Lavado de Activos, Financiación del Terrorismo y Financiación de la Proliferación de Armas de Destrucción Masiva (SAGRILAFT).
                    </p>
                    <div className="space-y-3 text-slate-600">
                      <p><strong className="text-slate-900">Procedimientos de Debida Diligencia:</strong></p>
                      <ul className="list-disc list-inside ml-4 space-y-2">
                        <li>Verificación de identidad de todos los clientes</li>
                        <li>Consulta en listas restrictivas nacionales e internacionales (OFAC, ONU, UE)</li>
                        <li>Monitoreo de transacciones sospechosas</li>
                        <li>Reporte a la UIAF cuando corresponda</li>
                        <li>Conocimiento del origen de fondos</li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Protección al Consumidor Financiero</h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      Como intermediarios, respetamos los derechos del consumidor financiero establecidos por la Superintendencia Financiera de Colombia:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                      <li>Derecho a recibir información clara, veraz y oportuna</li>
                      <li>Derecho a recibir productos y servicios con estándares de seguridad</li>
                      <li>Derecho a presentar quejas, reclamos y peticiones</li>
                      <li>Derecho a ser atendido con respeto y diligencia</li>
                      <li>Derecho a que su información sea manejada confidencialmente</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Código de Ética</h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      Nuestro equipo opera bajo estrictos principios éticos:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-fintera-50 p-4 rounded-lg">
                        <h4 className="font-bold text-slate-900 mb-2">Transparencia</h4>
                        <p className="text-sm text-slate-600">Comunicación clara y honesta en todas las interacciones.</p>
                      </div>
                      <div className="bg-cyan-50 p-4 rounded-lg">
                        <h4 className="font-bold text-slate-900 mb-2">Confidencialidad</h4>
                        <p className="text-sm text-slate-600">Protección absoluta de tu información personal.</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-bold text-slate-900 mb-2">Imparcialidad</h4>
                        <p className="text-sm text-slate-600">Recomendaciones basadas únicamente en tu perfil financiero.</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-bold text-slate-900 mb-2">Responsabilidad</h4>
                        <p className="text-sm text-slate-600">Compromiso con tus mejores intereses financieros.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Certificaciones y Alianzas</h2>
                    <ul className="space-y-3 text-slate-600">
                      <li className="flex items-start gap-3">
                        <CheckBadgeIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <strong className="text-slate-900">Aliado Comercial Oficial del Banco de Bogotá</strong>
                          <p className="text-sm">Certificación vigente para intermediar productos crediticios.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckBadgeIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <strong className="text-slate-900">Cumplimiento ISO 27001</strong>
                          <p className="text-sm">Gestión de seguridad de la información.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckBadgeIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                          <strong className="text-slate-900">Certificación SOC 2 Tipo II</strong>
                          <p className="text-sm">Auditoría independiente de controles de seguridad.</p>
                        </div>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Canal de Denuncias</h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      Si conoces o sospechas de alguna conducta irregular, violación a nuestro código de ética o incumplimiento normativo, puedes reportarlo de manera confidencial:
                    </p>
                    <div className="bg-slate-50 p-6 rounded-lg">
                      <p className="text-slate-700 mb-2"><strong>Email:</strong> <a href="mailto:cumplimiento@fintera.com.co" className="text-fintera-600 hover:underline">cumplimiento@fintera.com.co</a></p>
                      <p className="text-slate-700"><strong>Línea Ética:</strong> +57 (300) 123-4567</p>
                      <p className="text-sm text-slate-500 mt-3">Todas las denuncias son tratadas con confidencialidad y protección al denunciante según la Ley 1712 de 2014.</p>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Supervisión y Regulación</h2>
                    <p className="text-slate-600 leading-relaxed">
                      FINTERA está sujeto a la supervisión de:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4 mt-3">
                      <li><strong className="text-slate-900">Superintendencia de Industria y Comercio (SIC):</strong> Protección de datos personales</li>
                      <li><strong className="text-slate-900">Superintendencia Financiera de Colombia:</strong> Conducta de mercado y protección al consumidor financiero</li>
                      <li><strong className="text-slate-900">UIAF:</strong> Prevención de lavado de activos</li>
                    </ul>
                  </section>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                    <p className="text-sm text-slate-500 text-center">
                      FINTERA se compromete a mantener los más altos estándares de cumplimiento normativo y conducta ética en todas sus operaciones.
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
