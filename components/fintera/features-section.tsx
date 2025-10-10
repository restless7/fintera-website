"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HomeIcon,
  BanknotesIcon, 
  BuildingOfficeIcon, 
  ShieldCheckIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: HomeIcon,
    title: "Crédito de Vivienda",
    description: "Financia la compra de tu casa propia con las tasas más competitivas del mercado. Hasta $500M con plazos de hasta 20 años.",
    gradient: "from-fintera-500 to-gradient-via",
    delay: 0.1,
  },
  {
    icon: BanknotesIcon,
    title: "Crédito de Libre Inversión",
    description: "Dinero disponible para lo que necesites: educación, vehículo, vacaciones o cualquier proyecto personal. Hasta $150M.",
    gradient: "from-gradient-via to-gradient-to",
    delay: 0.2,
  },
  {
    icon: BuildingOfficeIcon,
    title: "Crédito Empresarial",
    description: "Impulsa tu negocio con capital de trabajo, maquinaria o expansión. Financiamiento especializado para empresas.",
    gradient: "from-gradient-from to-fintera-500",
    delay: 0.3,
  },
  {
    icon: ShieldCheckIcon,
    title: "Proceso Rápido y Seguro",
    description: "Precalificación en línea, documentos digitales y respuesta en menos de 24 horas. Tu información está protegida.",
    gradient: "from-fintera-600 to-gradient-from",
    delay: 0.4,
  },
];

const stats = [
  { value: "96%", label: "Tasa de Aprobación", icon: ShieldCheckIcon },
  { value: "$24.500M", label: "Créditos Otorgados", icon: BanknotesIcon },
  { value: "2.800+", label: "Clientes Satisfechos", icon: LightBulbIcon },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-fintera-50/50 to-white" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-fintera-200 to-transparent" />
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
              Nuestros Productos
            </span>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Créditos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
              Especializados
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-slate-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Ofrecemos las mejores opciones de financiamiento en Colombia, con tasas preferenciales 
            y aprobación rápida para hacer realidad tus proyectos.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}
            >
              <Card className="group h-full hover:shadow-xl transition-all duration-300 border-fintera-100/50 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <motion.div 
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${feature.gradient} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}
                    whileHover={{ rotate: 5 }}
                  >
                    <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                      <feature.icon className={`h-6 w-6 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`} />
                    </div>
                  </motion.div>
                  <CardTitle className="text-xl font-semibold text-slate-900 group-hover:text-fintera-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div 
          className="border-t border-fintera-100 pt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="group"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex flex-col items-center space-y-3">
                  <motion.div 
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-fintera-500 to-gradient-via p-0.5 group-hover:from-gradient-via group-hover:to-gradient-to transition-all duration-300"
                    whileHover={{ rotate: 10 }}
                  >
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <stat.icon className="h-8 w-8 text-fintera-600" />
                    </div>
                  </motion.div>
                  <div>
                    <motion.div 
                      className="text-4xl md:text-5xl font-bold text-slate-900 mb-2"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-slate-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-r from-fintera-400/10 to-gradient-via/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-r from-gradient-from/10 to-fintera-500/10 rounded-full blur-xl" />
      </div>
    </section>
  );
}
