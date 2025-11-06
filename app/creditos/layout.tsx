import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créditos en Colombia | Vivienda, Vehículo, Libre Inversión y Libranza - FINTERA",
  description: "Descubre los mejores créditos en Colombia. Crédito de vivienda hasta $500M, vehículo hasta $200M, libre inversión hasta $150M y libranza. Tasas desde 10.5% E.A. Aliado oficial Banco de Bogotá.",
  keywords: [
    "crédito de vivienda colombia",
    "crédito de vehículo",
    "crédito libre inversión",
    "libranza colombia",
    "banco de bogotá créditos",
    "crédito hipotecario",
    "préstamo personal",
    "financiación vivienda",
  ],
  openGraph: {
    title: "Créditos en Colombia | FINTERA",
    description: "Créditos de vivienda, vehículo, libre inversión y libranza con las mejores tasas del mercado.",
    type: "website",
    url: "https://fintera.com.co/creditos",
    images: [
      {
        url: "/images/creditos-og.jpg",
        width: 1200,
        height: 630,
        alt: "Créditos FINTERA - Vivienda, Vehículo, Libre Inversión",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Créditos en Colombia | FINTERA",
    description: "Las mejores opciones de crédito en Colombia. Aliado oficial del Banco de Bogotá.",
    images: ["/images/creditos-og.jpg"],
  },
};

export default function CreditosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
