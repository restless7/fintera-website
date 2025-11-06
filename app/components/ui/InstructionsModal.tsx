"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Upload, X, MessageCircle } from "lucide-react";

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 relative sticky top-0 z-10">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold">Cómo enviar tu documento</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Canales oficiales para continuar con tu solicitud
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Important note */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">
                        Importante: Firma física requerida
                      </h3>
                      <p className="text-sm text-amber-700">
                        El documento debe ser firmado de manera física. No se aceptan firmas digitales para este proceso.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submission channels */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Canales de envío disponibles:
                  </h3>

                  {/* Email */}
                  <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Correo electrónico</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Envía tu documento escaneado o fotografiado a:
                        </p>
                        <a
                          href="mailto:solicitudes@fintera.com"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Mail className="w-4 h-4" />
                          solicitudes@fintera.com
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">WhatsApp</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Envía tu documento directamente por WhatsApp:
                        </p>
                        <a
                          href="https://wa.me/573001234567"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          +57 300 123 4567
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Phone className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Línea telefónica</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Comunícate con nosotros y te guiaremos en el proceso:
                        </p>
                        <a
                          href="tel:+5716012345"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          (601) 234 5678
                        </a>
                        <p className="text-xs text-gray-500 mt-2">
                          Horario: Lunes a Viernes 8:00 AM - 6:00 PM
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Portal web (future) */}
                  <div className="border border-gray-200 rounded-xl p-4 opacity-60">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          Portal web
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Próximamente
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600">
                          Pronto podrás subir tu documento directamente desde nuestra plataforma web.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    💡 Consejos para tu documento:
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      Asegúrate de que la firma sea claramente visible
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      Si fotografías el documento, hazlo con buena iluminación
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      El archivo debe estar en formato PDF o imagen (JPG, PNG)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      Incluye tu nombre y número de documento en el asunto del correo
                    </li>
                  </ul>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
