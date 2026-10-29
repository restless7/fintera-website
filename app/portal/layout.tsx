import React from "react";
import Link from "next/link";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { Building2, FileText, Home, User, ShieldCheck, PhoneCall } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portal del Cliente | Fintera Hipotecaria",
  description: "Seguimiento en línea de tu crédito hipotecario, estado bancario y gestión documental segura.",
};

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Salto de accesibilidad para lectores de pantalla (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-[#0F172A] text-white px-4 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
      >
        Saltar al contenido principal
      </a>

      {/* Barra de Navegación Principal */}
      <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Enlace a Inicio */}
            <div className="flex items-center gap-3">
              <Link
                href="/portal"
                className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981] rounded-md p-1"
                aria-label="Fintera Portal del Cliente Inicio"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  F
                </div>
                <div className="flex flex-col">
                  <span className="font-bold tracking-tight text-lg leading-tight">FINTERA</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Portal Cliente
                  </span>
                </div>
              </Link>
            </div>

            {/* Menú de Navegación Principal */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Navegación del Portal">
              <Link
                href="/portal"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <Home className="w-4 h-4 text-emerald-400" />
                Resumen
              </Link>

              <Link
                href="/portal/solicitudes"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                Mis Solicitudes
              </Link>

              <Link
                href="/portal/documentos"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                Documentos
              </Link>

              <Link
                href="/portal/perfil"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <User className="w-4 h-4 text-emerald-400" />
                Mi Perfil
              </Link>
            </nav>

            {/* Zona de Perfil y Soporte */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canal Seguro 256-bit</span>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <UserButton afterSignOutUrl="/sign-in" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior en móviles */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-[#0F172A] py-2 px-4">
          <Link
            href="/portal"
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-emerald-400 text-xs font-medium"
          >
            <Home className="w-4 h-4" />
            Inicio
          </Link>
          <Link
            href="/portal/solicitudes"
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-emerald-400 text-xs font-medium"
          >
            <Building2 className="w-4 h-4" />
            Solicitudes
          </Link>
          <Link
            href="/portal/documentos"
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-emerald-400 text-xs font-medium"
          >
            <FileText className="w-4 h-4" />
            Documentos
          </Link>
          <Link
            href="/portal/perfil"
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-emerald-400 text-xs font-medium"
          >
            <User className="w-4 h-4" />
            Perfil
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none" tabIndex={-1}>
        {children}
      </main>

      {/* Pie de Página Institucional */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Fintera Crédito & Vivienda S.A.S. Todos los derechos reservados. Vigilado Superintendencia Financiera de Colombia.</p>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacidad" className="hover:text-emerald-400 transition-colors">
              Habeas Data & Privacidad
            </Link>
            <Link href="/legal/seguridad" className="hover:text-emerald-400 transition-colors">
              Seguridad de la Información
            </Link>
            <Link href="/contacto" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <PhoneCall className="w-3 h-3" />
              Soporte Línea Directa
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
