import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Iniciar Sesión | Fintera Enterprise CRM",
  description: "Acceso seguro a la plataforma Fintera",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <SignIn routing="hash" />
    </div>
  );
}
