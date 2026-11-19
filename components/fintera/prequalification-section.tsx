"use client";

import { QuickRequestForm } from "@/components/customer-onboarding/QuickRequestForm";

export default function PrequalificationSection() {
  return (
    <section
      id="prequalification"
      className="scroll-mt-24 bg-slate-50 px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-800">
          Inicia tu proceso con FINTERA
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Tu solicitud empieza con lo esencial
        </h2>
        <p className="mb-8 mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Cuéntanos qué crédito te interesa. Luego crea tu cuenta y confirma una
          solicitud breve de orientación financiera. La evaluación del crédito
          corresponde a la entidad financiera.
        </p>
        <QuickRequestForm />
      </div>
    </section>
  );
}
