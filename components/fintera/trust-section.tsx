"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, ShieldCheckIcon, LockClosedIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const trustFeatures = [
  {
    icon: ShieldCheckIcon,
    title: "Entidades Financieras Reconocidas",
    description: "Trabajamos únicamente con bancos y entidades supervisadas por la Superfinanciera, garantizando tu seguridad y confianza.",
  },
  {
    icon: LockClosedIcon,
    title: "Proceso 100% Transparente",
    description: "Sin letra pequeña ni sorpresas. Conoces todas las condiciones antes de comprometerte con cualquier crédito.",
  },
  {
    icon: AcademicCapIcon,
    title: "Experiencia del Sector",
    description: "Nuestro equipo cuenta con más de 15 años de experiencia en banca y finanzas en el mercado colombiano.",
  },
];

const certifications = [
  "Superfinanciera",
  "Ley de Habeas Data",
  "ISO 27001",
  "PCI DSS",
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-fintera-50/30 to-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-fintera-200 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.05),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column - Content */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
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
                Confianza y Respaldo
              </span>
            </motion.div>

            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Tu socio de confianza para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
                obtener el mejor crédito
              </span>{" "}
              en Colombia
            </motion.h2>
            
            <motion.p 
              className="text-xl text-slate-600 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              En Fintera creemos que el acceso al crédito debe ser transparente y confiable. 
              Por eso trabajamos solo con las mejores entidades financieras del país.
            </motion.p>

            {/* Trust Features */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {trustFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-start space-x-4 group"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  <motion.div 
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-fintera-500 to-gradient-via p-0.5 group-hover:scale-110 transition-transform duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-fintera-600" />
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-fintera-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Certifications */}
            <motion.div
              className="border-t border-fintera-100 pt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Certificaciones y Cumplimiento</h4>
              <div className="flex flex-wrap gap-3">
                {certifications.map((cert, index) => (
                  <motion.div
                    key={cert}
                    className="flex items-center space-x-2 bg-white border border-fintera-100 rounded-full px-4 py-2 shadow-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-slate-700">{cert}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <Button 
                variant="gradient"
                size="lg"
                className="px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              >
                Ver Nuestras Certificaciones
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Right Column - Visual */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Main Security Illustration */}
            <div className="relative">
              <motion.div 
                className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-fintera-200/50"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Security Dashboard */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Security Center</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">All Systems Secure</span>
                    </div>
                  </div>

                  {/* Security Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700">Encryption</span>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-900">AES-256</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-gradient-to-r from-blue-50 to-fintera-100 rounded-2xl p-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-fintera-700">Uptime</span>
                        <CheckCircleIcon className="h-5 w-5 text-fintera-500" />
                      </div>
                      <div className="text-2xl font-bold text-fintera-900">99.9%</div>
                    </motion.div>
                  </div>

                  {/* Security Features */}
                  <div className="space-y-3">
                    {[
                      { label: "Multi-Factor Authentication", status: "Active" },
                      { label: "Real-time Monitoring", status: "Active" },
                      { label: "Data Backup & Recovery", status: "Active" },
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      >
                        <div className="flex items-center space-x-3">
                          <ShieldCheckIcon className="h-5 w-5 text-fintera-500" />
                          <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        </div>
                        <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating Security Badges */}
              <motion.div 
                className="absolute -top-6 -left-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ 
                  rotate: [-2, 2, -2],
                  y: [-5, 5, -5]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                Secured
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-6 -right-6 bg-gradient-to-r from-fintera-500 to-gradient-via text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ 
                  rotate: [2, -2, 2],
                  y: [5, -5, 5]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              >
                Trusted
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
