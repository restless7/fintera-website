import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portafolio de Servicios Financieros | FINTERA Colombia",
  description: "Descubre nuestro portafolio de servicios financieros: alianzas con Banco de Bogotá, procesamiento digital, acompañamiento personalizado y productos futuros como factoring y renting.",
  keywords: [
    "servicios financieros colombia",
    "alianzas bancarias",
    "procesamiento digital créditos",
    "factoring colombia",
    "renting colombia",
    "intermediación financiera",
    "fintech colombia",
  ],
  openGraph: {
    title: "Portafolio de Servicios | FINTERA",
    description: "Soluciones financieras integrales con tecnología y acompañamiento personalizado.",
    type: "website",
    url: "https://fintera.com.co/portafolio",
    images: [
      {
        url: "/images/portafolio-og.jpg",
        width: 1200,
        height: 630,
        alt: "Portafolio FINTERA - Servicios Financieros",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portafolio de Servicios | FINTERA",
    description: "Servicios financieros actuales y futuros con tecnología de punta.",
    images: ["/images/portafolio-og.jpg"],
  },
};

export default function PortafolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
