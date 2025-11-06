"use client";

import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function SubmitButton({
  children,
  isLoading = false,
  loadingText = "Enviando...",
  className = "",
  ...props
}: SubmitButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      disabled={isLoading}
      className={`
        relative w-full px-8 py-4 rounded-xl font-bold text-white
        bg-gradient-to-r from-blue-600 to-cyan-500
        hover:from-blue-700 hover:to-cyan-600
        focus:outline-none focus:ring-4 focus:ring-blue-300
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
