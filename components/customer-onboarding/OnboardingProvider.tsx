"use client";

import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { PortalDraftProvider } from "@/components/customer-portal/PortalDraftStore";

/** Session-owned memory only. No PII is written to browser storage or URL parameters. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { sessionId } = useAuth();
  return (
    <PortalDraftProvider scopeKey={`onboarding:${sessionId || "anonymous"}`}>
      {children}
    </PortalDraftProvider>
  );
}
