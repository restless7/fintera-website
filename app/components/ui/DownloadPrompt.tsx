"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, X } from "lucide-react";

interface DownloadPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onViewInstructions: () => void;
  userName?: string;
}

export function DownloadPrompt({
  isOpen,
  onClose,
  onDownload,
  onViewInstructions,
  userName = "Usuario"
}: DownloadPromptProps) {
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
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">¡Tu solicitud está lista!</h2>
                    <p className="text-blue-100 text-sm">Documento generado exitosamente</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Success message */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">
                        Formulario completado
                      </h3>
                      <p className="text-sm text-green-700">
                        {userName}, hemos generado tu documento con todos los datos ingresados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Próximos pasos:</h3>
                  <ol className="space-y-2">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      <span className="text-gray-700">
                        Descarga tu formulario diligenciado
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      <span className="text-gray-700">
                        Fírmalo de manera <strong>física</strong> (puedes imprimirlo)
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      <span className="text-gray-700">
                        Escanéalo o tómale una foto clara
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </span>
                      <span className="text-gray-700">
                        Envíalo por nuestros canales oficiales
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    Descargar documento
                  </button>
                  <button
                    onClick={onViewInstructions}
                    className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Ver instrucciones
                  </button>
                </div>

                {/* Note */}
                <p className="text-xs text-gray-500 text-center">
                  El archivo descargado tendrá el formato: Solicitud_Fintera_[Nombre]_[Fecha].pdf
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
