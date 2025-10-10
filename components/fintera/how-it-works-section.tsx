"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  UserPlusIcon, 
  LinkIcon, 
  LightBulbIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

const steps = [
  {
    step: "01",
    icon: UserPlusIcon,
    title: "Precalíficate",
    description: "Completa nuestro formulario en 2 minutos y conoce tu capacidad de crédito al instante.",
    details: ["Datos básicos", "Ingresos y gastos", "Tipo de crédito"],
    color: "from-fintera-500 to-gradient-via",
  },
  {
    step: "02", 
    icon: LinkIcon,
    title: "Revisamos tu Perfil",
    description: "Analizamos tu información y te conectamos con la entidad financiera ideal para ti.",
    details: ["Análisis crediticio", "Comparación de opciones", "Selección de entidad"],
    color: "from-gradient-via to-gradient-to",
  },
  {
    step: "03",
    icon: LightBulbIcon, 
    title: "Obtienes tu Crédito",
    description: "Recibe la aprobación y desembolso en tiempo récord con las mejores condiciones del mercado.",
    details: ["Aprobación rápida", "Mejores tasas", "Desembolso inmediato"],
    color: "from-gradient-from to-fintera-600",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-fintera-200 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-fintera-50/30 via-white to-fintera-50/20" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
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
              ¿Cómo Funciona?
            </span>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Obtener tu crédito es{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
              más fácil
            </span>{" "}
            que nunca
          </motion.h2>
          
          <motion.p 
            className="text-xl text-slate-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Nuestro proceso simplificado te permite acceder al crédito que necesitas 
            en solo 3 pasos, sin complicaciones ni pérdida de tiempo.
          </motion.p>
        </motion.div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Desktop Timeline Line */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-fintera-200 via-fintera-300 to-fintera-200"></div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                className="relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Mobile Timeline Line */}
                {index < steps.length - 1 && (
                  <div className="md:hidden absolute left-12 top-24 w-0.5 h-16 bg-gradient-to-b from-fintera-200 to-fintera-300"></div>
                )}

                {/* Step Circle */}
                <motion.div 
                  className="relative mb-8"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${step.color} p-0.5 mx-auto relative z-10`}>
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <step.icon className="h-10 w-10 text-fintera-600" />
                    </div>
                  </div>
                  
                  {/* Step Number */}
                  <motion.div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-fintera-600 to-gradient-via rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.2 }}
                  >
                    {step.step}
                  </motion.div>
                </motion.div>

                {/* Content */}
                <motion.div 
                  className="text-center space-y-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
                >
                  <h3 className="text-2xl font-bold text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {step.description}
                  </p>
                  
                  {/* Step Details */}
                  <div className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <motion.div
                        key={detail}
                        className="flex items-center justify-center space-x-2 text-sm text-slate-500"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                          duration: 0.4, 
                          delay: 0.5 + index * 0.2 + detailIndex * 0.1 
                        }}
                      >
                        <CheckCircleIcon className="h-4 w-4 text-fintera-500" />
                        <span>{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16 pt-12 border-t border-fintera-100"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              ¿Listo para obtener tu crédito ideal?
            </h3>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Únete a miles de colombianos que ya han obtenido el financiamiento 
              que necesitaban con las mejores condiciones del mercado.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="gradient"
                size="lg" 
                className="px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                Precalíficarme Ahora
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span>Sin compromisos ni costos ocultos</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-20 w-20 h-20 bg-gradient-to-r from-fintera-400/10 to-gradient-via/10 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-r from-gradient-from/10 to-fintera-500/10 rounded-full blur-lg" />
      </div>
    </section>
  );
}
