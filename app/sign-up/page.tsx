import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Registro | Fintera Enterprise CRM",
  description: "Registro seguro en la plataforma Fintera",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <SignUp routing="hash" signInUrl="/sign-in" fallbackRedirectUrl="/admin" />
    </div>
  );
}
