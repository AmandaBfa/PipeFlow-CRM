"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEAL_STAGE_CONFIG } from "@/lib/deal-stage";
import { formatCurrency, formatDueDate } from "@/lib/format";
import { getLead, getMember } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import type { Deal } from "./deals-provider";

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  // Preview renderizado no DragOverlay: sem wiring de drag nem menu.
  overlay?: boolean;
}

export function DealCard({ deal, onEdit, onDelete, overlay = false }: DealCardProps) {
  const config = DEAL_STAGE_CONFIG[deal.stage];
  const lead = getLead(deal.leadId);
  const owner = getMember(deal.ownerId);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id, disabled: overlay });
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={cn(
        "group rounded-lg border border-l-2 bg-card p-3 shadow-sm transition-all",
        config.accentClassName,
        !overlay &&
          "cursor-grab hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        overlay && "rotate-1 cursor-grabbing shadow-lg",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{deal.title}</p>
        {!overlay && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onPointerDown={(event) => event.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="-mr-1 -mt-1 h-6 w-6 shrink-0 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações do negócio</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem className="gap-2" onSelect={() => onEdit?.(deal)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onSelect={() => onDelete?.(deal)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <p
        className={cn(
          "mt-2 text-base font-semibold tabular-nums",
          deal.stage === "won" && "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {formatCurrency(deal.value)}
      </p>

      {lead && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {lead.name}
          {lead.company ? ` · ${lead.company}` : ""}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px]">
              {owner?.initials ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground">
            {owner?.name ?? "—"}
          </span>
        </div>
        {deal.dueDate && (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDueDate(deal.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
