import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  // Cores do chip do ícone (ex.: "bg-success/10 text-success").
  iconClassName?: string;
}

// Card de KPI do dashboard. Sem deltas de tendência fabricados — só o valor real.
export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  iconClassName,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            iconClassName
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
