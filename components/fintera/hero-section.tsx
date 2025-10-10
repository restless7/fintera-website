"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { ChartBarSquareIcon } from "@heroicons/react/24/outline";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-fintera-50 to-gradient-from/10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e950_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e950_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-r from-fintera-400/20 to-gradient-via/20 rounded-full blur-xl"
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
          className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-gradient-to-r from-gradient-from/20 to-fintera-500/20 rounded-full blur-xl"
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
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column - Content */}
          <motion.div 
            className="space-y-8 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-fintera-600 text-lg font-semibold tracking-wider">
                FINTERA
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              El Crédito que{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 via-gradient-via to-gradient-to">
                Necesitas Hoy
              </span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Créditos de vivienda, libre inversión y empresarial en{" "}
              <span className="text-fintera-600 font-semibold">Colombia. Proceso rápido y garantizado.</span>
            </motion.p>
            
            {/* Trust indicators */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start text-sm text-slate-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-fintera-500" />
                <span>100% Seguro y Confiable</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarSquareIcon className="h-5 w-5 text-fintera-500" />
                <span>Análisis en Tiempo Real</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-fintera-500" />
                <span>Aprobación Rápida</span>
              </div>
            </motion.div>
            
            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                variant="gradient"
                size="lg" 
                className="px-8 py-4 rounded-xl shadow-lg shadow-fintera-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Precalíficate Ahora
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Ver Requisitos
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Right Column - Financial Dashboard Mockup */}
          <motion.div 
            className="relative flex justify-center items-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {/* Main Dashboard Container */}
            <div className="relative">
              {/* Dashboard Frame */}
              <motion.div 
                className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-fintera-200/50"
                style={{
                  transform: "perspective(1000px) rotateX(10deg) rotateY(-10deg)",
                }}
                animate={{
                  rotateY: [-10, -5, -10],
                  rotateX: [10, 15, 10],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full opacity-80"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full opacity-80"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-fintera-600 text-sm font-medium">Panel de Créditos</div>
                  </div>
                </div>
                
                {/* Credit Overview */}
                <div className="bg-gradient-to-r from-fintera-50 to-gradient-from/10 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-slate-700">Monto Disponible</h3>
                    <span className="text-xs text-green-600">Aprobado</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-2">$120.500.000</div>
                  
                  {/* Mini chart */}
                  <div className="h-12 flex items-end space-x-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-fintera-500 to-fintera-300 rounded-t"
                        style={{ 
                          height: `${30 + Math.sin(i * 0.5) * 20}%`,
                          minHeight: '8px'
                        }}
                        animate={{
                          height: [`${30 + Math.sin(i * 0.5) * 20}%`, `${35 + Math.sin(i * 0.7) * 25}%`, `${30 + Math.sin(i * 0.5) * 20}%`],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div 
                      className="bg-white/60 border border-fintera-100 rounded-xl p-3"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-xs text-slate-600 mb-1">Tasa de Interés</div>
                      <div className="text-lg font-semibold text-slate-900">1.2% EA</div>
                      <div className="text-xs text-green-600">↓ Más Baja</div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-white/60 border border-fintera-100 rounded-xl p-3"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-xs text-slate-600 mb-1">Estado Aprobación</div>
                      <div className="text-lg font-semibold text-slate-900">92%</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                        <motion.div 
                          className="bg-gradient-to-r from-fintera-500 to-gradient-via h-1.5 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: "92%" }}
                          transition={{ duration: 2, delay: 1 }}
                        />
                      </div>
                    </motion.div>
                </div>
              </motion.div>
              
              {/* Floating Elements */}
              <motion.div 
                className="absolute -top-8 -right-8 bg-gradient-to-r from-fintera-500 to-gradient-via text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ 
                  y: [-10, 10, -10],
                  rotate: [-2, 2, -2],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                Sin Papeleos
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-6 -left-8 bg-gradient-to-r from-gradient-from to-gradient-via text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
                animate={{ 
                  y: [10, -10, 10],
                  rotate: [2, -2, 2],
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              >
                Aprobación Rápida
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-fintera-400/60 rounded-full flex justify-center">
          <motion.div 
            className="w-1 h-3 bg-fintera-400 rounded-full mt-2"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
