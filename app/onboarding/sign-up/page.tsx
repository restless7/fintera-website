import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { OnboardingProgress } from "@/components/customer-onboarding/OnboardingFrame";

export const metadata = { title: "Crea tu cuenta | FINTERA" };
export default async function CustomerSignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/onboarding/solicitud");
  return (
    <>
      <h1 className="text-3xl font-bold">Crea tu cuenta para continuar</h1>
      <p className="mt-3 text-slate-600">
        Si ya registraste tu interés, usa el mismo correo y verifícalo. Si
        llegaste directamente, podrás iniciar una solicitud breve después de
        crear tu cuenta.
      </p>
      <OnboardingProgress step={2} />
      <div className="flex min-w-0 justify-center py-3">
        <SignUp
          routing="hash"
          signInUrl="/onboarding/sign-in"
          forceRedirectUrl="/onboarding/solicitud"
        />
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/onboarding/sign-in"
          className="font-semibold text-blue-800 underline"
        >
          Iniciar sesión
        </Link>
        .{" "}
        <Link
          href="/solicitar"
          className="font-semibold text-blue-800 underline"
        >
          Registrar mi interés primero
        </Link>
        .
      </p>
    </>
  );
}
