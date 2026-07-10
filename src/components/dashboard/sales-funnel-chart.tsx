"use client";

import * as React from "react";
import {
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import type { FunnelDatum } from "@/lib/metrics";

interface SalesFunnelChartProps {
  data: FunnelDatum[];
}

// Funil de vendas (Recharts). Cores = etapas do pipeline (consistente com o
// Kanban). Acessibilidade (validada com o script de paleta da skill dataviz):
// identidade nunca só por cor — rótulo direto no segmento + legenda em texto +
// gap de 2px + tooltip (o par âmbar/laranja fica na faixa de CVD "floor", legal
// só com essas codificações secundárias).
export function SalesFunnelChart({ data }: SalesFunnelChartProps) {
  // Recharts precisa das dimensões do browser; skeleton até montar (evita
  // mismatch de hidratação e layout shift).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip content={<FunnelTooltip />} />
            {/* Animação desligada: o react-smooth do Recharts pode deixar os
                trapézios com opacidade 0 (não renderizam). */}
            <Funnel dataKey="count" data={data} isAnimationActive={false}>
              {data.map((entry) => (
                <Cell key={entry.stage} fill={entry.color} strokeWidth={2} />
              ))}
              <LabelList
                dataKey="count"
                position="center"
                fill="#ffffff"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={3}
                fontSize={14}
                fontWeight={700}
                style={{ paintOrder: "stroke" }}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda: identidade por texto (não só por cor). */}
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {data.map((entry) => (
          <li key={entry.stage} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="font-medium tabular-nums">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FunnelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: FunnelDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: datum.color }}
        />
        <span className="font-medium text-popover-foreground">
          {datum.label}
        </span>
      </div>
      <div className="mt-0.5 text-muted-foreground">
        {datum.count} {datum.count === 1 ? "negócio" : "negócios"}
      </div>
    </div>
  );
}
