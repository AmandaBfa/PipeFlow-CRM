"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEAL_STAGE_CONFIG, type DealStage } from "@/lib/deal-stage";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DealCard } from "./deal-card";
import type { Deal } from "./deals-provider";

interface KanbanColumnProps {
  stage: DealStage;
  index: number;
  deals: Deal[];
  metric: { count: number; total: number };
  onCreate: (stage: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

export function KanbanColumn({
  stage,
  index,
  deals,
  metric,
  onCreate,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const config = DEAL_STAGE_CONFIG[stage];
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className="flex w-[85vw] max-w-xs shrink-0 flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 sm:w-72"
    >
      {/* Header colorido da etapa */}
      <div className="px-1 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", config.dotClassName)} />
          <span className={cn("text-sm font-semibold", config.headerClassName)}>
            {config.label}
          </span>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {metric.count}
          </span>
        </div>
        <div
          data-stage-total={stage}
          className="pl-4 pt-0.5 text-xs tabular-nums text-muted-foreground"
        >
          {formatCurrency(metric.total)}
        </div>
      </div>

      {/* Área droppable */}
      <div
        ref={setNodeRef}
        data-stage={stage}
        className={cn(
          "flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border bg-card/60 p-2 shadow-sm backdrop-blur-sm transition-colors",
          isOver && "bg-accent/30 ring-2 ring-inset",
          isOver && config.ringClassName
        )}
      >
        {deals.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
            Solte um negócio aqui
          </p>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-auto justify-start gap-1.5 text-muted-foreground"
          onClick={() => onCreate(stage)}
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
