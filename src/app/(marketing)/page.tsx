import type { Metadata } from "next";

import { FeaturesGrid } from "@/components/marketing/features-grid";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Reveal } from "@/components/marketing/reveal";
import { StatsBand } from "@/components/marketing/stats-band";

export const metadata: Metadata = {
  title: "PipeFlow CRM — Seu pipeline de vendas, simples e visual",
  description:
    "CRM de vendas para PMEs e times comerciais: leads, pipeline Kanban arrastar-e-soltar e métricas, sem a complexidade de HubSpot ou Pipedrive.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <FeaturesGrid />

      {/* Planos e preços */}
      <section
        id="planos"
        className="scroll-mt-20 border-t border-border/60 bg-muted/30"
      >
        <div className="container py-20 lg:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Planos simples e transparentes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comece grátis e faça upgrade quando o seu time crescer.
            </p>
          </Reveal>
          <div className="mt-14">
            <PricingCards />
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
