import type { ReactNode } from "react";
import { OnboardingFrame } from "@/components/customer-onboarding/OnboardingFrame";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OnboardingFrame>{children}</OnboardingFrame>;
}
