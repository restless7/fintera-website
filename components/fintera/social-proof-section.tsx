"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { StarIcon } from "@heroicons/react/24/solid";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const testimonials = [
  {
    name: "Carlos Mendoza",
    title: "Empresario",
    company: "Bucaramanga",
    content: "Obtuve mi crédito de vivienda en tiempo récord. El proceso fue transparente y las condiciones fueron mucho mejores que las que me ofrecía mi banco tradicional.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "María Fernanda García",
    title: "Profesional Independiente",
    company: "Medellín", 
    content: "Necesitaba un crédito de libre inversión para expandir mi negocio. En Fintera encontré exactamente lo que buscaba: rapidez, claridad y excelentes tasas.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b194?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Jorge Ramírez",
    title: "Gerente General",
    company: "Bogotá",
    content: "El crédito empresarial que conseguí me permitió modernizar mi empresa. Todo el proceso fue digital y en menos de una semana tenía el dinero en mi cuenta.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
];

const partners = [
  { name: "Bancolombia", logo: "🏦" },
  { name: "Banco de Bogotá", logo: "🏛️" },
  { name: "Davivienda", logo: "💼" },
  { name: "BBVA Colombia", logo: "📈" },
  { name: "Banco Popular", logo: "💎" },
  { name: "Scotiabank", logo: "🎯" },
];

const stats = [
  { value: "96%", label: "Satisfacción del Cliente" },
  { value: "2.800+", label: "Créditos Aprobados" },
  { value: "$24.500M", label: "Millones Desembolsados" },
  { value: "15+", label: "Entidades Aliadas" },
];

export default function SocialProofSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-fintera-50/50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-fintera-200 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.05),transparent_50%)]" />
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
              Testimonios Reales
            </span>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Miles de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintera-600 to-gradient-via">
              colombianos satisfechos
            </span>{" "}
            confían en nosotros
          </motion.h2>
          
          <motion.p 
            className="text-xl text-slate-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Conoce las experiencias de quienes ya obtuvieron el crédito que necesitaban 
            con las mejores condiciones y el proceso más rápido del mercado.
          </motion.p>
        </motion.div>

        {/* Statistics */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <motion.div 
                className="text-4xl md:text-5xl font-bold text-slate-900 mb-2"
                whileHover={{ scale: 1.1 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-slate-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-fintera-100/50 bg-white/80 backdrop-blur-sm group">
                <CardContent className="p-6">
                  <motion.div
                    className="mb-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-fintera-400 mb-4 group-hover:text-fintera-600 transition-colors" />
                  </motion.div>
                  
                  {/* Stars */}
                  <div className="flex space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.2, delay: 0.5 + index * 0.2 + i * 0.1 }}
                      >
                        <StarIcon className="h-5 w-5 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  
                  <p className="text-slate-600 leading-relaxed mb-6 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-fintera-400 to-gradient-via overflow-hidden"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-fintera-600 transition-colors">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {testimonial.title}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Partner Logos */}
        <motion.div
          className="border-t border-fintera-100 pt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Respaldados por las mejores entidades financieras
            </h3>
            <p className="text-slate-500">
              Trabajamos con los bancos líderes de Colombia para ofrecerte las mejores opciones
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                className="group cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-white/60 hover:bg-white transition-colors duration-300 border border-transparent hover:border-fintera-200">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {partner.logo}
                  </div>
                  <div className="text-sm font-medium text-slate-600 group-hover:text-fintera-600 transition-colors">
                    {partner.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
