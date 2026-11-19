import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { OnboardingProgress } from "@/components/customer-onboarding/OnboardingFrame";

export const metadata = { title: "Ingresa a tu cuenta | FINTERA" };
export default async function CustomerSignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/onboarding/solicitud");
  return (
    <>
      <h1 className="text-3xl font-bold">
        Ingresa para continuar tu solicitud
      </h1>
      <p className="mt-3 text-slate-600">
        Usa tu cuenta de Fintera. Tu solicitud se revisa después del acceso;
        iniciar sesión no implica aprobación de crédito.
      </p>
      <OnboardingProgress step={2} />
      <div className="flex min-w-0 justify-center py-3">
        <SignIn
          routing="hash"
          signUpUrl="/onboarding/sign-up"
          forceRedirectUrl="/onboarding/solicitud"
        />
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Aún no has registrado tu interés?{" "}
        <Link
          href="/solicitar"
          className="font-semibold text-blue-800 underline"
        >
          Iniciar un registro corto
        </Link>
        .{" "}
        <Link href="/portal" className="font-semibold text-blue-800 underline">
          Ir a Mi portal
        </Link>
        .
      </p>
    </>
  );
}
