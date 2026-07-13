"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "./workspace-provider";

// Seletor de workspace com dados reais (Milestone 2). A troca persiste no
// cookie e recarrega o contexto; desktop e mobile ficam sincronizados via
// WorkspaceProvider.
export function WorkspaceSwitcher() {
  const { workspaces, selected, select } = useWorkspace();

  // Sem workspace não deve ocorrer (o trigger cria um no signup), mas guardamos.
  if (!selected) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          {selected.initials}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">
            {selected.name}
          </span>
          <span className="truncate text-xs capitalize text-muted-foreground">
            Plano {selected.plan}
          </span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => select(ws)}
            className="gap-2"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
              {ws.initials}
            </div>
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.id === selected.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {/* Criar workspace entra numa aula futura (precisa de RPC definer). */}
        <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
          <Plus className="h-4 w-4" />
          Criar workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
