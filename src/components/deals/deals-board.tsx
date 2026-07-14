"use client";

import * as React from "react";
import Link from "next/link";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanSquare, Plus, SearchX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  DEAL_STAGE_CONFIG,
  DEAL_STAGES,
  type DealStage,
} from "@/lib/deal-stage";
import { DealCard } from "./deal-card";
import { KanbanColumn } from "./kanban-column";
import { useDeals, type Deal } from "./deals-provider";

interface DealsBoardProps {
  onCreate: (stage?: DealStage) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

export function DealsBoard({ onCreate, onEdit, onDelete }: DealsBoardProps) {
  const { deals, dealsByStage, stageMetrics, getDeal, moveDeal, hasActiveFilters } =
    useDeals();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const activeDeal = activeId ? getDeal(activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const toStage = over.id as DealStage;
    const deal = getDeal(String(active.id));
    if (!deal || deal.stage === toStage) return;

    moveDeal(deal.id, toStage);

    const label = DEAL_STAGE_CONFIG[toStage].label;
    if (toStage === "won") {
      toast.success(`"${deal.title}" marcado como ganho! 🎉`);
    } else if (toStage === "lost") {
      toast(`"${deal.title}" movido para Perdido.`);
    } else {
      toast.success(`"${deal.title}" movido para ${label}.`);
    }
  }

  // Sem resultados. Com filtros = "nenhum encontrado"; sem filtros = vazio.
  if (deals.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        icon={SearchX}
        title="Nenhum negócio encontrado"
        description="Ajuste a busca ou os filtros para ver mais resultados."
      >
        <Button variant="outline" asChild>
          <Link href="/pipeline">Limpar filtros</Link>
        </Button>
      </EmptyState>
    ) : (
      <EmptyState
        icon={KanbanSquare}
        title="Nenhum negócio ainda"
        description="Crie seu primeiro negócio para começar a mover pelo funil."
      >
        <Button onClick={() => onCreate()}>
          <Plus className="h-4 w-4" />
          Novo negócio
        </Button>
      </EmptyState>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage, index) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            index={index}
            deals={dealsByStage[stage]}
            metric={stageMetrics[stage]}
            onCreate={onCreate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
