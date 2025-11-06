import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Información Legal | FINTERA Colombia",
  description: "Políticas legales de FINTERA: privacidad, términos del servicio, seguridad de datos y cumplimiento normativo. Transparencia total en nuestra operación.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
