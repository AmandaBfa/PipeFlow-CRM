import Link from "next/link";
import { Check, KanbanSquare } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

const BRAND_HIGHLIGHTS = [
  "Pipeline Kanban arrastar-e-soltar",
  "Isolamento de dados por workspace",
  "Comece grátis, sem cartão de crédito",
];

// Layout das telas de autenticação: painel de marca (desktop) + área do
// formulário. Dark mode como padrão, herdado do root layout.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Painel de marca — visível só no desktop */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">PipeFlow</span>
        </Link>

        <div className="space-y-6">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Seu pipeline de vendas, simples e visual.
          </h2>
          <ul className="space-y-3 text-indigo-100">
            {BRAND_HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-indigo-200">
          Simplicidade &gt; complexidade.
        </p>
      </div>

      {/* Área do formulário */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-4 lg:justify-end">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PipeFlow</span>
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center p-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
