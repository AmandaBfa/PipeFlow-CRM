import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Grátis",
    price: "R$ 0",
    period: "/mês",
    description: "Para começar a organizar suas vendas.",
    features: [
      "Até 2 membros",
      "Até 50 leads",
      "Pipeline Kanban",
      "Gestão de leads",
      "Dashboard de métricas",
    ],
    cta: "Começar grátis",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "/mês",
    description: "Para times que querem crescer sem limites.",
    features: [
      "Membros ilimitados",
      "Leads ilimitados",
      "Tudo do plano Grátis",
      "Colaboração em equipe",
      "Suporte prioritário",
    ],
    // Logado → billing na Settings; deslogado → cai no login e volta.
    cta: "Assinar Pro",
    href: "/settings",
    highlighted: true,
  },
];

export function PricingCards() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-card p-8",
            plan.highlighted
              ? "border-primary shadow-lg shadow-primary/10"
              : "border-border shadow-sm"
          )}
        >
          {plan.highlighted && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Recomendado
            </span>
          )}
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.description}
          </p>
          <div className="mt-4 flex items-end gap-1">
            <span className="text-4xl font-semibold tracking-tight">
              {plan.price}
            </span>
            <span className="pb-1 text-sm text-muted-foreground">
              {plan.period}
            </span>
          </div>
          <ul className="mt-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            asChild
            size="lg"
            variant={plan.highlighted ? "default" : "outline"}
            className="mt-8 w-full"
          >
            <Link href={plan.href}>{plan.cta}</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
