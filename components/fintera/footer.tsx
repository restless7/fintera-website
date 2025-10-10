"use client";

import { motion } from "framer-motion";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Security", href: "#security" },
    { name: "Pricing", href: "#pricing" },
    { name: "API", href: "#api" },
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Careers", href: "#careers" },
    { name: "Press", href: "#press" },
    { name: "Contact", href: "#contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
    { name: "Security", href: "#security-policy" },
    { name: "Compliance", href: "#compliance" },
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
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Brand Column */}
            <div className="lg:col-span-1">
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
                  Empowering your financial future with AI-powered insights and 
                  expert guidance. Transform the way you manage and grow your wealth.
                </p>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Data secured with bank-grade encryption</span>
                </div>
              </motion.div>
            </div>

            {/* Product Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-slate-400 hover:text-fintera-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-slate-400 hover:text-fintera-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-slate-400 hover:text-fintera-400 transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
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
