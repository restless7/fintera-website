import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | Escríbenos o Llámanos | FINTERA Colombia",
  description: "Contáctanos para resolver tus dudas sobre créditos. Teléfono: +57 300 123-4567, Email: info@fintera.com.co, WhatsApp disponible. Atención: Lun-Vie 8AM-6PM, Sáb 9AM-1PM.",
  keywords: [
    "contacto fintera",
    "teléfono fintera",
    "whatsapp fintera",
    "correo fintera",
    "asesoría créditos colombia",
    "servicio al cliente",
    "soporte fintera",
  ],
  openGraph: {
    title: "Contacto | FINTERA Colombia",
    description: "Estamos aquí para ayudarte. Contáctanos por teléfono, email o WhatsApp.",
    type: "website",
    url: "https://fintera.com.co/contacto",
    images: [
      {
        url: "/images/contacto-og.jpg",
        width: 1200,
        height: 630,
        alt: "Contacto FINTERA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contacto | FINTERA Colombia",
    description: "Asesores especializados listos para ayudarte con tu crédito.",
    images: ["/images/contacto-og.jpg"],
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
