import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * FINTERA ENTERPRISE CRM — NEXT.JS 16 PROXY / MIDDLEWARE
 * Protege áreas internas (/admin/crm/*) y portal del cliente (/portal/*)
 * Permite acceso público irrestricto al simulador financiero y páginas de captación.
 */

const isPublicRoute = createRouteMatcher([
  '/',
  '/simulador(.*)',
  '/creditos(.*)',
  '/credit-request(.*)',
  '/credits/(.*)',
  '/portafolio(.*)',
  '/contacto(.*)',
  '/nosotros(.*)',
  '/legal/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/credit-request(.*)',
  '/api/fill-form(.*)',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Rutas públicas no requieren autenticación
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 2. Verificar sesión de Clerk
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
