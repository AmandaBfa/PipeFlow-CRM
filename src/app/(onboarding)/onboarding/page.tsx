import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Bem-vindo",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
