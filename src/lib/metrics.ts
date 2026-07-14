import { getLeadOptions } from "@/lib/data/leads";
import {
  DEAL_STAGE_CONFIG,
  DEAL_STAGES,
  TERMINAL_STAGES,
  type DealStage,
} from "@/lib/deal-stage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace, getWorkspaceMembers } from "@/lib/workspace";

// Métricas do dashboard — queries agregadas no Supabase, filtradas pelo
// workspace ativo (Milestone 6). O RLS garante o isolamento.

export interface DashboardKpis {
  totalLeads: number;
  openDeals: number;
  pipelineValue: number; // soma do valor dos negócios abertos (BRL)
  conversionRate: number; // win rate em % (0-100): ganhos / (ganhos + perdidos)
}

export interface FunnelDatum {
  stage: DealStage;
  label: string;
  count: number;
  color: string; // hex (Recharts)
}

export interface UpcomingDeal {
  id: string;
  title: string;
  value: number;
  dueDate: string;
  leadLabel: string;
  ownerName: string | null;
  ownerInitials: string | null;
}

// Etapas do funil = progressão até o ganho (exclui "lost", desfecho negativo).
const FUNNEL_STAGES: DealStage[] = DEAL_STAGES.filter((stage) => stage !== "lost");

function emptyFunnel(): FunnelDatum[] {
  return FUNNEL_STAGES.map((stage) => ({
    stage,
    label: DEAL_STAGE_CONFIG[stage].label,
    count: 0,
    color: DEAL_STAGE_CONFIG[stage].chartColor,
  }));
}

// KPIs + funil numa única leitura (contagem de leads + negócios do workspace).
export async function getDashboardMetrics(): Promise<{
  kpis: DashboardKpis;
  funnel: FunnelDatum[];
}> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) {
    return {
      kpis: { totalLeads: 0, openDeals: 0, pipelineValue: 0, conversionRate: 0 },
      funnel: emptyFunnel(),
    };
  }

  const supabase = await createClient();
  const [{ count: leadCount }, { data: dealRows }] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    supabase.from("deals").select("stage, value").eq("workspace_id", workspace.id),
  ]);

  const deals = (dealRows ?? []).map((d) => ({
    stage: d.stage as DealStage,
    value: typeof d.value === "string" ? Number(d.value) : d.value,
  }));

  const isOpen = (stage: DealStage) => !TERMINAL_STAGES.includes(stage);
  const open = deals.filter((d) => isOpen(d.stage));
  const won = deals.filter((d) => d.stage === "won").length;
  const lost = deals.filter((d) => d.stage === "lost").length;
  const closed = won + lost;

  return {
    kpis: {
      totalLeads: leadCount ?? 0,
      openDeals: open.length,
      pipelineValue: open.reduce((sum, d) => sum + d.value, 0),
      conversionRate: closed === 0 ? 0 : Math.round((won / closed) * 100),
    },
    funnel: FUNNEL_STAGES.map((stage) => ({
      stage,
      label: DEAL_STAGE_CONFIG[stage].label,
      count: deals.filter((d) => d.stage === stage).length,
      color: DEAL_STAGE_CONFIG[stage].chartColor,
    })),
  };
}

// Negócios abertos com prazo definido, mais próximos primeiro (enriquecidos).
export async function getUpcomingDeals(limit = 5): Promise<UpcomingDeal[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = await createClient();
  const [{ data: rows }, leadOptions, members] = await Promise.all([
    supabase
      .from("deals")
      .select("id, title, value, due_date, lead_id, owner_id")
      .eq("workspace_id", workspace.id)
      .not("due_date", "is", null)
      .not("stage", "in", "(won,lost)")
      .order("due_date", { ascending: true })
      .limit(limit),
    getLeadOptions(),
    getWorkspaceMembers(),
  ]);

  const leadMap = new Map(leadOptions.map((l) => [l.id, l]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (rows ?? []).map((d) => {
    const lead = d.lead_id ? leadMap.get(d.lead_id) : undefined;
    const owner = d.owner_id ? memberMap.get(d.owner_id) : undefined;
    return {
      id: d.id,
      title: d.title,
      value: typeof d.value === "string" ? Number(d.value) : d.value,
      dueDate: d.due_date as string,
      leadLabel: lead ? lead.company || lead.name : "",
      ownerName: owner?.name ?? null,
      ownerInitials: owner?.initials ?? null,
    };
  });
}
