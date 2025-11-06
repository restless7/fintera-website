import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre FINTERA | Quiénes Somos | Misión, Visión y Valores",
  description: "Conoce la historia de FINTERA, aliado comercial oficial del Banco de Bogotá. Nuestra misión es democratizar el acceso al crédito en Colombia con transparencia, agilidad y precisión.",
  keywords: [
    "fintera colombia",
    "quiénes somos",
    "aliado banco de bogotá",
    "fintech colombia",
    "historia fintera",
    "misión visión valores",
    "inteligencia comercial",
    "scoring crediticio",
  ],
  openGraph: {
    title: "Sobre FINTERA | Transformando el Crédito en Colombia",
    description: "Tecnología, transparencia y acompañamiento especializado para democratizar el acceso al crédito.",
    type: "website",
    url: "https://fintera.com.co/nosotros",
    images: [
      {
        url: "/images/nosotros-og.jpg",
        width: 1200,
        height: 630,
        alt: "FINTERA - Quiénes Somos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobre FINTERA | Quiénes Somos",
    description: "Transformando el acceso al crédito en Colombia desde 2023.",
    images: ["/images/nosotros-og.jpg"],
  },
};

export default function NosotrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
