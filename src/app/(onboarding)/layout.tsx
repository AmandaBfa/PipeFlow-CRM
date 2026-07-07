import Link from "next/link";
import { KanbanSquare } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

// Layout do fluxo de primeiro acesso: enxuto e centralizado, sem a sidebar do
// app. Dark mode como padrão (herdado do root layout).
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">PipeFlow</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
