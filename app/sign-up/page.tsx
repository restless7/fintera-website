import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Registro | Fintera Enterprise CRM",
  description: "Registro seguro en la plataforma Fintera",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col gap-6 items-center justify-center bg-slate-950 px-4 py-12">
      <div className="max-w-md text-center text-slate-100"><h1 className="text-xl font-semibold">Acceso a FINTERA</h1><p className="mt-2 text-sm">¿Quieres crear una cuenta de cliente? <Link href="/onboarding/sign-up" className="font-semibold text-cyan-200 underline">Crear cuenta de cliente</Link>.</p><p className="mt-2 text-xs text-slate-300">El acceso administrativo requiere autorización de FINTERA.</p></div>
      <SignUp routing="hash" signInUrl="/sign-in" fallbackRedirectUrl="/admin" />
    </div>
  );
}
