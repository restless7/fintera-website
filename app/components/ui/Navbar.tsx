"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Simulador", href: "/simulador" },
  { name: "Créditos", href: "/creditos" },
  { name: "Portafolio", href: "/portafolio" },
  { name: "Insights", href: "/insights" },
  { name: "Aliados", href: "/aliados" },
  { name: "Nosotros", href: "/nosotros" },
  { name: "Contacto", href: "/contacto" },
];

export function Navbar() {
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [openAtPath, setOpenAtPath] = useState<string | null>(null);
  const menuOpen = openAtPath === pathname;
  const closeMenu = () => setOpenAtPath(null);
  useEffect(() => {
    const closeOnBack = () => setOpenAtPath(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setOpenAtPath(null);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("popstate", closeOnBack);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("popstate", closeOnBack);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <nav
      aria-label="Navegación del sitio"
      className="fixed inset-x-0 top-0 z-[60] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-3">
          <Link href="/" aria-label="Fintera, inicio" className="shrink-0">
            <Image
              src="/images/fintera-wordmark.png"
              alt="Fintera"
              width={168}
              height={48}
              className="h-11 w-36 object-contain sm:w-40"
              priority
            />
          </Link>
          <div className="hidden items-center gap-4 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-blue-700 focus-visible:outline-blue-700"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/portal"
              className="rounded-lg px-2 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-blue-700"
            >
              Mi portal
            </Link>
            <Link
              href="/onboarding/sign-up"
              className="hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:inline-flex"
            >
              Crear cuenta
            </Link>
            <Link
              href="/solicitar"
              className="hidden rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 xl:inline-flex"
            >
              Solicitar crédito
            </Link>
            <button
              ref={menuButton}
              type="button"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              aria-controls="public-mobile-menu"
              onClick={() => setOpenAtPath(menuOpen ? null : pathname)}
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-blue-700 xl:hidden"
            >
              {menuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div
          id="public-mobile-menu"
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-slate-200 bg-white xl:hidden"
        >
          <div className="mx-auto grid max-w-7xl gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                aria-current={pathname === link.href ? "page" : undefined}
                className="rounded-lg px-3 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2">
              <Link
                href="/onboarding/sign-up"
                onClick={closeMenu}
                className="rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-800"
              >
                Crear cuenta
              </Link>
              <Link
                href="/solicitar"
                onClick={closeMenu}
                className="rounded-lg bg-blue-700 px-4 py-3 text-center font-semibold text-white"
              >
                Solicitar crédito
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
