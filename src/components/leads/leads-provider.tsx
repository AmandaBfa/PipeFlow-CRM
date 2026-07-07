"use client";

import * as React from "react";

import type { LeadStatus } from "@/lib/lead-status";
import { placeholderLeads, type PlaceholderLead } from "@/lib/placeholder-data";
import type { LeadInput } from "@/lib/validations/lead";

export type Lead = PlaceholderLead;

interface LeadsContextValue {
  leads: Lead[];
  filteredLeads: Lead[];
  search: string;
  statusFilter: LeadStatus | "all";
  ownerFilter: string; // id do membro | "all"
  hasActiveFilters: boolean;
  setSearch: (value: string) => void;
  setStatusFilter: (value: LeadStatus | "all") => void;
  setOwnerFilter: (value: string) => void;
  clearFilters: () => void;
  getLead: (id: string) => Lead | undefined;
  addLead: (input: LeadInput) => Lead;
  updateLead: (id: string, input: LeadInput) => void;
  deleteLead: (id: string) => void;
}

const LeadsContext = React.createContext<LeadsContextValue | null>(null);

// Estado dos leads em memória (aula 2.3). Semeado por placeholder-data e vive no
// layout de /leads, então sobrevive à navegação lista↔detalhe. No Milestone 3
// as mutações abaixo (add/update/delete) viram Server Actions do Supabase.
export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = React.useState<Lead[]>(placeholderLeads);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<LeadStatus | "all">(
    "all"
  );
  const [ownerFilter, setOwnerFilter] = React.useState<string>("all");

  const filteredLeads = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        term === "" ||
        lead.name.toLowerCase().includes(term) ||
        lead.company.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;
      const matchesOwner = ownerFilter === "all" || lead.ownerId === ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [leads, search, statusFilter, ownerFilter]);

  const getLead = React.useCallback(
    (id: string) => leads.find((lead) => lead.id === id),
    [leads]
  );

  const addLead = React.useCallback((input: LeadInput) => {
    // TODO(leads): criar via Server Action + Supabase (Milestone 3).
    const lead: Lead = {
      id: `lead_${crypto.randomUUID()}`,
      name: input.name,
      email: input.email,
      phone: input.phone ?? "",
      company: input.company ?? "",
      position: input.position ?? "",
      status: input.status,
      ownerId: input.ownerId,
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, []);

  const updateLead = React.useCallback((id: string, input: LeadInput) => {
    // TODO(leads): atualizar via Server Action + Supabase (Milestone 3).
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? {
              ...lead,
              name: input.name,
              email: input.email,
              phone: input.phone ?? "",
              company: input.company ?? "",
              position: input.position ?? "",
              status: input.status,
              ownerId: input.ownerId,
            }
          : lead
      )
    );
  }, []);

  const deleteLead = React.useCallback((id: string) => {
    // TODO(leads): excluir via Server Action + Supabase (Milestone 3).
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  }, []);

  const value = React.useMemo<LeadsContextValue>(
    () => ({
      leads,
      filteredLeads,
      search,
      statusFilter,
      ownerFilter,
      hasActiveFilters:
        search.trim() !== "" || statusFilter !== "all" || ownerFilter !== "all",
      setSearch,
      setStatusFilter,
      setOwnerFilter,
      clearFilters: () => {
        setSearch("");
        setStatusFilter("all");
        setOwnerFilter("all");
      },
      getLead,
      addLead,
      updateLead,
      deleteLead,
    }),
    [
      leads,
      filteredLeads,
      search,
      statusFilter,
      ownerFilter,
      getLead,
      addLead,
      updateLead,
      deleteLead,
    ]
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
