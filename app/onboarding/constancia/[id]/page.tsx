import { ServiceRequestReceipt } from "@/components/customer-onboarding/ServiceRequestReceipt";
import "./receipt.css";

export const metadata = {
  title: "Constancia de solicitud de servicio | FINTERA",
  robots: { index: false, follow: false },
};
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceRequestReceipt requestId={id} />;
}
