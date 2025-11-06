import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import GoogleAnalytics from "./components/GoogleAnalytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FINTERA | Créditos Inteligentes en Colombia",
  description: "Accede a los mejores créditos en Colombia con FINTERA. Aliado oficial del Banco de Bogotá. Créditos de vivienda, vehículo, libre inversión y libranza. Transparencia, agilidad y precisión en cada proceso.",
  keywords: [
    "créditos colombia",
    "banco de bogotá",
    "crédito de vivienda",
    "crédito de vehículo",
    "crédito libre inversión",
    "libranza",
    "fintech colombia",
    "préstamos personales",
    "servicios financieros",
  ],
  authors: [{ name: "FINTERA" }],
  creator: "FINTERA",
  publisher: "FINTERA",
  metadataBase: new URL("https://fintera.com.co"),
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://fintera.com.co",
    title: "FINTERA | Créditos Inteligentes en Colombia",
    description: "Accede a los mejores créditos en Colombia con FINTERA. Aliado oficial del Banco de Bogotá. Transparencia, agilidad y precisión.",
    siteName: "FINTERA",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FINTERA - Créditos Inteligentes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FINTERA | Créditos Inteligentes en Colombia",
    description: "Accede a los mejores créditos en Colombia. Aliado oficial del Banco de Bogotá.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <GoogleAnalytics />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
