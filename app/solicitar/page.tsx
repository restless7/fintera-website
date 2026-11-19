import {
  OnboardingFrame,
  OnboardingProgress,
} from "@/components/customer-onboarding/OnboardingFrame";
import { QuickRequestForm } from "@/components/customer-onboarding/QuickRequestForm";

export const metadata = {
  title: "Inicia tu solicitud | FINTERA",
  description:
    "Cuéntanos qué servicio financiero necesitas. Registra tu interés y continúa con tu cuenta de Fintera.",
};
export default function SolicitarPage() {
  return (
    <OnboardingFrame>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Comencemos con lo esencial
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
        Cuéntanos qué necesitas. Luego crea tu cuenta y confirma una solicitud
        breve de orientación financiera.
      </p>
      <OnboardingProgress step={1} />
      <QuickRequestForm />
    </OnboardingFrame>
  );
}
