import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Iniciar Sesión | Fintera Enterprise CRM",
  description: "Acceso seguro a la plataforma Fintera",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col gap-6 items-center justify-center bg-slate-950 px-4 py-12">
      <div className="max-w-md text-center text-slate-100"><h1 className="text-xl font-semibold">Acceso a FINTERA</h1><p className="mt-2 text-sm">¿Buscas tu portal de cliente? <Link href="/onboarding/sign-in" className="font-semibold text-cyan-200 underline">Ingresa a Mi portal</Link>.</p><p className="mt-2 text-xs text-slate-300">El acceso administrativo requiere autorización de FINTERA.</p></div>
      <SignIn routing="hash" signUpUrl="/sign-up" fallbackRedirectUrl="/admin" />
    </div>
  );
}
