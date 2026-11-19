import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/ui/Navbar";
import Footer from "@/components/fintera/footer";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

export function OnboardingFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="customer-onboarding min-h-screen bg-slate-50 px-4 pb-16 pt-28 text-slate-900 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-blue-800">
            FINTERA · Servicios financieros
          </p>
          {children}
          <p className="mt-8 text-sm leading-relaxed text-slate-600">
            ¿Necesitas acompañamiento?{" "}
            <a
              className="font-semibold text-blue-800 underline"
              href={PUBLIC_CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp {PUBLIC_CONTACT.phoneDisplay}
            </a>
            . También puedes{" "}
            <Link
              href="/portal"
              className="font-semibold text-blue-800 underline"
            >
              volver a Mi portal
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol
      aria-label="Pasos de tu solicitud"
      className="my-7 grid grid-cols-3 gap-2 text-xs sm:gap-4 sm:text-sm"
    >
      {["Registro inicial", "Tu cuenta", "Solicitud de servicio"].map(
        (label, index) => (
          <li
            key={label}
            aria-current={step === index + 1 ? "step" : undefined}
            className={`border-t-4 pt-3 ${index + 1 <= step ? "border-blue-700 text-blue-900" : "border-slate-200 text-slate-600"}`}
          >
            <span className="font-bold">{index + 1}. </span>
            {label}
          </li>
        ),
      )}
    </ol>
  );
}
