import type { ReactNode } from "react";
import { PortalShell } from "@/components/customer-portal/PortalShell";
import "./portal.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Portal del cliente | Fintera", description: "Solicitudes, documentos y acompañamiento para su crédito." };
export default function CustomerPortalLayout({ children }: { children: ReactNode }) {
  // Each API resolves real Clerk identity and object scope independently; signed tracking is status-only.
  return <PortalShell>{children}</PortalShell>;
}
