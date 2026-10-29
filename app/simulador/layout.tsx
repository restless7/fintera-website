import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulador de Crédito Multibanco | Fintera Colombia",
  description:
    "Simula y compara tu crédito hipotecario, leasing habitacional y compra de cartera entre los principales bancos de Colombia: Bancolombia, Banco de Bogotá, AV Villas, BBVA, Occidente, Caja Social, Credifamilia y Banco Unión.",
  keywords: [
    "simulador credito hipotecario",
    "simulador bancolombia",
    "simulador banco de bogota",
    "simulador bbva",
    "simulador av villas",
    "simulador banco de occidente",
    "simulador caja social",
    "simulador credifamilia",
    "leasing habitacional colombia",
    "fintera simulador"
  ],
};

export default function SimuladorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
