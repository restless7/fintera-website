"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  GiftIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";

const benefits = [
  { icon: ShieldCheckIcon, text: "100% seguro y confiable" },
  { icon: ClockIcon, text: "Respuesta en 24 horas" },
  { icon: GiftIcon, text: "Sin costos ocultos" },
];

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Deterministic particle positions to prevent hydration mismatch
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: ((i * 17 + 23) % 100),
      top: ((i * 31 + 47) % 100),
      delay: (i * 0.15) % 3,
    }));
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-fintera-600 via-gradient-via to-gradient-to relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_70%)]" />
        
        {/* Animated particles */}
        {isClient && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Tu crédito perfecto{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white">
                te está esperando
              </span>
            </motion.h2>
            
            <motion.p 
              className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Únete a miles de colombianos que ya confiaron en Fintera para obtener 
              el financiamiento que necesitaban. Sin papeleos ni demoras.
            </motion.p>
            
            {/* Benefits */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  className="flex items-center space-x-2 text-blue-100"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <benefit.icon className="h-5 w-5 text-blue-200" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    ¡Obtén tu Crédito Hoy!
                  </h3>
                  <p className="text-blue-100">
                    Completa tus datos y recibe una respuesta inmediata con las mejores condiciones
                  </p>
                </motion.div>

                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      <Input
                        type="text"
                        placeholder="Nombre completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/90 border-white/30 focus:border-white focus:bg-white h-12 text-slate-900 placeholder:text-slate-500"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                    >
                      <Input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/90 border-white/30 focus:border-white focus:bg-white h-12 text-slate-900 placeholder:text-slate-500"
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <Button 
                      type="submit"
                      size="lg"
                      className="bg-white text-fintera-600 hover:bg-blue-50 px-12 py-4 text-lg font-semibold rounded-xl shadow-xl hover:scale-105 transition-all duration-300 border-0"
                    >
                      Solicitar Mi Crédito Ahora
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Button>
                    
                    <p className="mt-4 text-sm text-blue-200">
                      Al continuar, aceptas que nos comuniquemos contigo para ofrecerte{" "}
                      <a href="#" className="underline hover:text-white transition-colors">
                        las mejores opciones de crédito
                      </a>{" "}
                      disponibles en Colombia.
                    </p>
                  </motion.div>
                </form>

                {/* Additional Trust Indicators */}
                <motion.div 
                  className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8 pt-6 border-t border-white/20"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  <div className="flex items-center space-x-2 text-blue-200 text-sm">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Sin compromiso inicial</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-200 text-sm">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Proceso 100% digital</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-200 text-sm">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Respuesta en 24 horas</span>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom Stats */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">2.800+</div>
                <div className="text-sm text-blue-200">Clientes Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">$24.500M</div>
                <div className="text-sm text-blue-200">Créditos Otorgados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">96%</div>
                <div className="text-sm text-blue-200">Satisfacción</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
