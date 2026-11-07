import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getAdminLanding } from "@/lib/auth/admin-landing";
import { getAdminAccess } from "@/lib/auth/admin-session";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Acceso al equipo | Fintera",
  robots: { index: false, follow: false },
};

export default async function AdminAccessPage() {
  const access = await getAdminAccess();
  if (access.status === "SIGNED_OUT") redirect("/sign-in");
  if (access.status === "AUTHORIZED") {
    const landing = getAdminLanding(access.context);
    if (landing) redirect(landing);
  }

  const unavailable = access.status === "UNAVAILABLE";
  const title = unavailable
    ? "El panel no está disponible en este momento"
    : access.status === "AUTHORIZED"
      ? "No tienes módulos internos habilitados"
    : access.status === "CLIENT"
      ? "Tu cuenta es de cliente"
    : access.status === "INACTIVE"
      ? "El acceso interno de esta cuenta no está habilitado"
      : "Tu cuenta está creada; falta el acceso al equipo";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-blue-50/50 px-4 py-12 text-slate-900 flex items-center justify-center">
      <section
        className="w-full max-w-lg rounded-2xl border border-sky-200/80 bg-white/85 backdrop-blur-xl p-6 sm:p-8 shadow-xl"
        aria-labelledby="access-title"
      >
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-wider text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50">
              <Image src="/images/shieldlogo.png" width={26} height={26} alt="" unoptimized />
            </span>
            <span>FINTERA</span>
          </Link>
          <div aria-label="Opciones de tu cuenta"><UserButton /></div>
        </div>
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">
          Acceso al equipo
        </p>
        <h1 id="access-title" className="text-2xl font-extrabold leading-tight text-slate-900">{title}</h1>
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600" role="status">
          {unavailable ? (
            <p>No podemos verificar el acceso interno ahora. Intenta de nuevo más tarde. No necesitas crear otra cuenta.</p>
          ) : (
            <>
              <p>{access.status === "AUTHORIZED" ? "Tu identidad está vinculada al equipo, pero los permisos actuales no habilitan un módulo de inicio." : access.status === "CLIENT" ? "Tu cuenta no tiene acceso al área interna de empleados. Los accesos de cliente se verifican por sus propios vínculos." : "Ya tienes una sesión iniciada. Registrarse no concede acceso al área de empleados."}</p>
              <p>Solicita al responsable del equipo que revise y habilite el acceso de esta cuenta.</p>
            </>
          )}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          {unavailable && <Link href="/admin" prefetch={false} className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500">Volver a intentar</Link>}
          <Link href="/" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-sky-50 hover:border-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500">Volver al sitio</Link>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">Puedes cambiar de cuenta o cerrar sesión desde el menú de tu cuenta.</p>
      </section>
    </main>
  );
}
