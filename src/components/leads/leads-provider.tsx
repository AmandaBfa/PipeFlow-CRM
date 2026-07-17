"use client";

import * as React from "react";

import type { Lead } from "@/lib/data/leads";
import type { LeadStatus } from "@/lib/lead-status";
import type { LimitCheck } from "@/lib/limits";
import type { WorkspaceMember } from "@/lib/workspace";

// Re-exporta o view-model para os componentes que importavam `Lead` daqui.
export type { Lead } from "@/lib/data/leads";

interface LeadsContextValue {
  leads: Lead[];
  members: WorkspaceMember[];
  getMember: (id: string | null) => WorkspaceMember | undefined;
  search: string;
  statusFilter: LeadStatus | "all";
  ownerFilter: string;
  hasActiveFilters: boolean;
  /** Uso/limite de leads do plano (vem do servidor, `lib/limits`). */
  leadUsage: LimitCheck;
}

const LeadsContext = React.createContext<LeadsContextValue | null>(null);

// Container de dados dos leads — hidratado pelo servidor (já filtrados no banco).
// Sem mutações aqui: os dialogs chamam as Server Actions diretamente; o toolbar
// escreve os filtros na URL (que dispara o re-fetch server-side).
export function LeadsProvider({
  leads,
  members,
  search,
  statusFilter,
  ownerFilter,
  leadUsage,
  children,
}: {
  leads: Lead[];
  members: WorkspaceMember[];
  search: string;
  statusFilter: LeadStatus | "all";
  ownerFilter: string;
  leadUsage: LimitCheck;
  children: React.ReactNode;
}) {
  const getMember = React.useCallback(
    (id: string | null) => (id ? members.find((m) => m.id === id) : undefined),
    [members]
  );

  const value = React.useMemo<LeadsContextValue>(
    () => ({
      leads,
      members,
      getMember,
      search,
      statusFilter,
      ownerFilter,
      hasActiveFilters:
        search.trim() !== "" || statusFilter !== "all" || ownerFilter !== "all",
      leadUsage,
    }),
    [leads, members, getMember, search, statusFilter, ownerFilter, leadUsage]
  );

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = React.useContext(LeadsContext);
  if (!context) {
    throw new Error("useLeads deve ser usado dentro de <LeadsProvider>");
  }
  return context;
}
