import type { Metadata } from "next";

import { PricingCards } from "@/components/marketing/pricing-cards";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Preços · PipeFlow CRM",
  description:
    "Planos do PipeFlow CRM: comece grátis (até 2 membros e 50 leads) ou vá de Pro (R$ 49/mês, ilimitado).",
};

export default function PricingPage() {
  return (
    <section className="container py-20 lg:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Planos e preços
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Escolha o plano ideal para o seu time. Comece grátis, sem cartão de
          crédito.
        </p>
      </Reveal>
      <div className="mt-14">
        <PricingCards />
      </div>
    </section>
  );
}
