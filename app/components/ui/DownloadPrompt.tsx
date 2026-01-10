"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, X } from "lucide-react";

interface DownloadPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadCredit: () => void;
  onDownloadAuthorization: () => void;
  onFinish: () => void;
  userName?: string;
}

export function DownloadPrompt({
  isOpen,
  onClose,
  onDownloadCredit,
  onDownloadAuthorization,
  onFinish,
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
                    <h2 className="text-2xl font-bold">¡Solicitud Procesada!</h2>
                    <p className="text-blue-100 text-sm">Documentos generados exitosamente</p>
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
                        {userName}, hemos generado tus documentos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Instrucciones importantes:</h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Descarga <strong>ambos documentos</strong>.</li>
                      <li>Firma los dos documentos.</li>
                      <li><strong>Importante:</strong> En la "Autorización Well", incluye tu <strong>huella</strong>.</li>
                      <li>
                        Envía ambos archivos firmados de vuelta a nuestro WhatsApp dedicado:{" "}
                        <a
                          href="https://wa.me/573244444430?text=Hola%2C%20adjunto%20mis%20documentos%20firmados%20para%20la%20solicitud%20de%20cr%C3%A9dito."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          +57 324 444 4430
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={onDownloadCredit}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    Descargar Solicitud de Crédito
                  </button>

                  <button
                    onClick={onDownloadAuthorization}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-all shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    Descargar Autorización Well
                  </button>

                  <button
                    onClick={onFinish}
                    className="mt-2 px-6 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Finalizar y ver instrucciones de envío
                  </button>
                </div>

                {/* Note */}
                <p className="text-xs text-gray-500 text-center">
                  Recuerda que debes firmar ambos documentos antes de enviarlos.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
