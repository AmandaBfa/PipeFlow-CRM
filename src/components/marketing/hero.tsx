import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Brilho índigo sutil ao fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 flex justify-center"
      >
        <div className="h-[420px] w-[820px] max-w-full rounded-full bg-primary/20 blur-[130px]" />
      </div>

      <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <Reveal className="space-y-6 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            CRM de vendas para PMEs e times comerciais
          </span>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Seu pipeline de vendas,{" "}
            <span className="text-primary">simples e visual</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
            Gerencie leads, mova negócios por um Kanban arrastar-e-soltar e
            acompanhe suas métricas — sem a complexidade de HubSpot ou Pipedrive.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button size="lg" asChild>
              <Link href="/signup">
                Começar grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#planos">Ver planos</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Grátis para começar · Sem cartão de crédito
          </p>
        </Reveal>

        <Reveal delay={120}>
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  );
}

// Mock estilizado do produto (mini Kanban) — decorativo.
function HeroPreview() {
  const columns = [
    { label: "Novo", dot: "bg-slate-400", cards: 2 },
    { label: "Proposta", dot: "bg-amber-500", cards: 2 },
    { label: "Ganho", dot: "bg-emerald-500", cards: 1 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl shadow-primary/5">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          app.pipeflow.com/pipeline
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4">
        {columns.map((column) => (
          <div key={column.label} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", column.dot)} />
              <span className="text-xs font-medium">{column.label}</span>
            </div>
            {Array.from({ length: column.cards }).map((_, index) => (
              <div
                key={index}
                className="space-y-1.5 rounded-lg border border-border bg-background/60 p-2.5"
              >
                <div className="h-2 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-primary/20" />
                <div className="h-2 w-2/3 rounded bg-muted/70" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
