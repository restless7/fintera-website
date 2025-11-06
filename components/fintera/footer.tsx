"use client";

import { motion } from "framer-motion";

const footerLinks = {
  creditos: [
    { name: "Crédito de Libre Inversión", href: "/creditos#libre-inversion" },
    { name: "Crédito de Vivienda", href: "/creditos#vivienda" },
    { name: "Crédito de Vehículo", href: "/creditos#vehiculo" },
    { name: "Libranza", href: "/creditos#libranza" },
  ],
  portafolio: [
    { name: "Servicios Financieros", href: "/portafolio#servicios" },
    { name: "Procesos y Documentación", href: "/portafolio#procesos" },
    { name: "Productos Futuros", href: "/portafolio#futuros" },
  ],
  nosotros: [
    { name: "Cómo Trabajamos", href: "/nosotros#como-trabajamos" },
    { name: "Nuestro Modelo", href: "/nosotros#modelo" },
    { name: "Oportunidades Laborales", href: "/nosotros#carreras" },
    { name: "Prensa", href: "/nosotros#prensa" },
  ],
  contacto: [
    { name: "Formulario de Contacto", href: "/contacto#formulario" },
    { name: "WhatsApp", href: "https://wa.me/573001234567" },
    { name: "Correo Corporativo", href: "mailto:info@fintera.com.co" },
  ],
  legal: [
    { name: "Política de Privacidad", href: "/legal/privacidad" },
    { name: "Términos del Servicio", href: "/legal/terminos" },
    { name: "Seguridad", href: "/legal/seguridad" },
    { name: "Cumplimiento", href: "/legal/cumplimiento" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-fintera-900/20 via-transparent to-gradient-via/20" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main Footer */}
        <div className="py-16">
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-6 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fintera-400 to-gradient-via mb-4">
                  FINTERA
                </h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Tu aliado comercial de confianza para acceder a los mejores créditos en Colombia. 
                  Transparencia, agilidad y precisión en cada proceso.
                </p>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Aliado oficial Banco de Bogotá</span>
                </div>
              </motion.div>
            </div>

            {/* Créditos Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-semibold text-white mb-4">Créditos</h4>
              <ul className="space-y-2">
                {footerLinks.creditos.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-slate-400 hover:text-fintera-400 transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Portafolio Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="font-semibold text-white mb-4">Portafolio</h4>
              <ul className="space-y-2">
                {footerLinks.portafolio.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-slate-400 hover:text-fintera-400 transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Nosotros Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="font-semibold text-white mb-4">Nosotros</h4>
              <ul className="space-y-2">
                {footerLinks.nosotros.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-slate-400 hover:text-fintera-400 transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact & Legal Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-6"
            >
              <div>
                <h4 className="font-semibold text-white mb-4">Contacto</h4>
                <ul className="space-y-2">
                  {footerLinks.contacto.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href} 
                        className="text-slate-400 hover:text-fintera-400 transition-colors duration-200 text-sm"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href} 
                        className="text-slate-400 hover:text-fintera-400 transition-colors duration-200 text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="border-t border-slate-800 py-8 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-slate-400 text-sm mb-4 md:mb-0">
            © 2024 Fintera. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>All systems operational</span>
            </div>
            <div>Status: Secure</div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
