"use client";

import * as React from "react";

import { DEAL_STAGES, type DealStage } from "@/lib/deal-stage";
import { placeholderDeals, type PlaceholderDeal } from "@/lib/placeholder-data";
import type { DealInput } from "@/lib/validations/deal";

export type Deal = PlaceholderDeal;

interface StageMetric {
  count: number;
  total: number;
}

interface DealsContextValue {
  deals: Deal[];
  filteredDeals: Deal[];
  dealsByStage: Record<DealStage, Deal[]>;
  stageMetrics: Record<DealStage, StageMetric>;
  search: string;
  ownerFilter: string; // id do membro | "all"
  hasActiveFilters: boolean;
  setSearch: (value: string) => void;
  setOwnerFilter: (value: string) => void;
  clearFilters: () => void;
  getDeal: (id: string) => Deal | undefined;
  addDeal: (input: DealInput) => Deal;
  updateDeal: (id: string, input: DealInput) => void;
  deleteDeal: (id: string) => void;
  moveDeal: (id: string, stage: DealStage) => void;
}

const DealsContext = React.createContext<DealsContextValue | null>(null);

// Estado dos negócios em memória (aula 2.4). Semeado por placeholder-data, vive
// no layout de /pipeline. No Milestone 4 as mutações abaixo (add/update/delete/
// move) viram Server Actions do Supabase.
export function DealsProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = React.useState<Deal[]>(placeholderDeals);
  const [search, setSearch] = React.useState("");
  const [ownerFilter, setOwnerFilter] = React.useState<string>("all");

  const filteredDeals = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchesSearch =
        term === "" || deal.title.toLowerCase().includes(term);
      const matchesOwner = ownerFilter === "all" || deal.ownerId === ownerFilter;
      return matchesSearch && matchesOwner;
    });
  }, [deals, search, ownerFilter]);

  // Negócios agrupados por etapa (uma lista por coluna do board).
  const dealsByStage = React.useMemo(() => {
    const grouped = Object.fromEntries(
      DEAL_STAGES.map((stage) => [stage, [] as Deal[]])
    ) as Record<DealStage, Deal[]>;
    for (const deal of filteredDeals) grouped[deal.stage].push(deal);
    return grouped;
  }, [filteredDeals]);

  // Contagem + soma de valor por etapa (header da coluna).
  const stageMetrics = React.useMemo(() => {
    return Object.fromEntries(
      DEAL_STAGES.map((stage) => [
        stage,
        {
          count: dealsByStage[stage].length,
          total: dealsByStage[stage].reduce((sum, deal) => sum + deal.value, 0),
        },
      ])
    ) as Record<DealStage, StageMetric>;
  }, [dealsByStage]);

  const getDeal = React.useCallback(
    (id: string) => deals.find((deal) => deal.id === id),
    [deals]
  );

  const addDeal = React.useCallback((input: DealInput) => {
    // TODO(deals): criar via Server Action + Supabase (Milestone 4).
    const deal: Deal = {
      id: `deal_${crypto.randomUUID()}`,
      title: input.title,
      value: input.value,
      stage: input.stage,
      leadId: input.leadId,
      ownerId: input.ownerId,
      dueDate: input.dueDate || undefined,
      createdAt: new Date().toISOString(),
    };
    setDeals((prev) => [deal, ...prev]);
    return deal;
  }, []);

  const updateDeal = React.useCallback((id: string, input: DealInput) => {
    // TODO(deals): atualizar via Server Action + Supabase (Milestone 4).
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === id
          ? {
              ...deal,
              title: input.title,
              value: input.value,
              stage: input.stage,
              leadId: input.leadId,
              ownerId: input.ownerId,
              dueDate: input.dueDate || undefined,
            }
          : deal
      )
    );
  }, []);

  const deleteDeal = React.useCallback((id: string) => {
    // TODO(deals): excluir via Server Action + Supabase (Milestone 4).
    setDeals((prev) => prev.filter((deal) => deal.id !== id));
  }, []);

  // Movimentação otimista/instantânea ao soltar o card. O card vai para o topo
  // da coluna destino (feedback visível). O toast fica a cargo de quem chama.
  const moveDeal = React.useCallback((id: string, stage: DealStage) => {
    // TODO(deals): persistir a mudança de etapa via Server Action (Milestone 4).
    setDeals((prev) => {
      const index = prev.findIndex((deal) => deal.id === id);
      if (index === -1 || prev[index].stage === stage) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      return [{ ...moved, stage }, ...next];
    });
  }, []);

  const value = React.useMemo<DealsContextValue>(
    () => ({
      deals,
      filteredDeals,
      dealsByStage,
      stageMetrics,
      search,
      ownerFilter,
      hasActiveFilters: search.trim() !== "" || ownerFilter !== "all",
      setSearch,
      setOwnerFilter,
      clearFilters: () => {
        setSearch("");
        setOwnerFilter("all");
      },
      getDeal,
      addDeal,
      updateDeal,
      deleteDeal,
      moveDeal,
    }),
    [
      deals,
      filteredDeals,
      dealsByStage,
      stageMetrics,
      search,
      ownerFilter,
      getDeal,
      addDeal,
      updateDeal,
      deleteDeal,
      moveDeal,
    ]
  );

  return (
    <DealsContext.Provider value={value}>{children}</DealsContext.Provider>
  );
}

export function useDeals() {
  const context = React.useContext(DealsContext);
  if (!context) {
    throw new Error("useDeals deve ser usado dentro de <DealsProvider>");
  }
  return context;
}
