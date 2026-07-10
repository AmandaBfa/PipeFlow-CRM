import Link from "next/link";
import { KanbanSquare } from "lucide-react";

import { cn } from "@/lib/utils";

// Marca do PipeFlow (mesma identidade da sidebar/auth).
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2", className)}
      aria-label="PipeFlow — página inicial"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <KanbanSquare className="h-5 w-5" />
      </div>
      <span className="text-lg font-semibold tracking-tight">PipeFlow</span>
    </Link>
  );
}
