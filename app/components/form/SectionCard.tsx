"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, className = "" }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 ${className}`}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600 text-sm">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  );
}
