import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getCurrentWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Bem-vindo",
};

export default async function OnboardingPage() {
  // O trigger já criou o workspace no signup (nomeado pelo full_name).
  // Prefixamos o campo com esse nome para o usuário só ajustar.
  const workspace = await getCurrentWorkspace();
  return <OnboardingFlow defaultName={workspace?.name ?? ""} />;
}
