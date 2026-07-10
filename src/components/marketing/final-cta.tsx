import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
      >
        <div className="h-[300px] w-[700px] max-w-full rounded-full bg-primary/15 blur-[120px]" />
      </div>
      <div className="container relative py-20 text-center lg:py-24">
        <Reveal className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pronto para organizar suas vendas?
          </h2>
          <p className="text-lg text-muted-foreground">
            Crie sua conta grátis e comece a mover negócios pelo pipeline hoje
            mesmo.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
