"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { moveDealStage } from "@/lib/actions/deal";
import { DEAL_STAGES, type DealStage } from "@/lib/deal-stage";
import type { Deal } from "@/lib/data/deals";
import type { LeadOption } from "@/lib/data/leads";
import type { WorkspaceMember } from "@/lib/workspace";

// Re-exporta o view-model para os componentes que importavam `Deal` daqui.
export type { Deal } from "@/lib/data/deals";

interface StageMetric {
  count: number;
  total: number;
}

interface DealsContextValue {
  deals: Deal[];
  dealsByStage: Record<DealStage, Deal[]>;
  stageMetrics: Record<DealStage, StageMetric>;
  members: WorkspaceMember[];
  leadOptions: LeadOption[];
  getDeal: (id: string) => Deal | undefined;
  getMember: (id: string | null) => WorkspaceMember | undefined;
  getLeadOption: (id: string | null) => LeadOption | undefined;
  moveDeal: (id: string, stage: DealStage) => void;
  search: string;
  ownerFilter: string;
  hasActiveFilters: boolean;
}

const DealsContext = React.createContext<DealsContextValue | null>(null);

// Container de dados dos negócios — hidratado pelo servidor (já filtrados no
// banco). O drag-and-drop faz update OTIMISTA local e persiste via Server Action
// (`moveDealStage`); em erro, o `router.refresh()` re-sincroniza e reverte.
export function DealsProvider({
  deals: initialDeals,
  members,
  leadOptions,
  search,
  ownerFilter,
  children,
}: {
  deals: Deal[];
  members: WorkspaceMember[];
  leadOptions: LeadOption[];
  search: string;
  ownerFilter: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [deals, setDeals] = React.useState<Deal[]>(initialDeals);

  // Ressincroniza com o servidor quando os dados (props) mudam.
  React.useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const dealsByStage = React.useMemo(() => {
    const grouped = Object.fromEntries(
      DEAL_STAGES.map((stage) => [stage, [] as Deal[]])
    ) as Record<DealStage, Deal[]>;
    for (const deal of deals) grouped[deal.stage].push(deal);
    return grouped;
  }, [deals]);

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
  const getMember = React.useCallback(
    (id: string | null) => (id ? members.find((m) => m.id === id) : undefined),
    [members]
  );
  const getLeadOption = React.useCallback(
    (id: string | null) => (id ? leadOptions.find((l) => l.id === id) : undefined),
    [leadOptions]
  );

  const moveDeal = React.useCallback(
    (id: string, stage: DealStage) => {
      // Otimista: move o card para o topo da coluna destino na hora.
      setDeals((prev) => {
        const index = prev.findIndex((deal) => deal.id === id);
        if (index === -1 || prev[index].stage === stage) return prev;
        const next = [...prev];
        const [moved] = next.splice(index, 1);
        return [{ ...moved, stage }, ...next];
      });
      startTransition(async () => {
        const result = await moveDealStage(id, stage);
        if (!result.ok) {
          toast.error(result.error ?? "Não foi possível mover o negócio.");
        }
        router.refresh();
      });
    },
    [router]
  );

  const value = React.useMemo<DealsContextValue>(
    () => ({
      deals,
      dealsByStage,
      stageMetrics,
      members,
      leadOptions,
      getDeal,
      getMember,
      getLeadOption,
      moveDeal,
      search,
      ownerFilter,
      hasActiveFilters: search.trim() !== "" || ownerFilter !== "all",
    }),
    [
      deals,
      dealsByStage,
      stageMetrics,
      members,
      leadOptions,
      getDeal,
      getMember,
      getLeadOption,
      moveDeal,
      search,
      ownerFilter,
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
