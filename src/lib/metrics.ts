import {
  DEAL_STAGE_CONFIG,
  DEAL_STAGES,
  TERMINAL_STAGES,
  type DealStage,
} from "@/lib/deal-stage";
import {
  placeholderDeals,
  placeholderLeads,
  type PlaceholderDeal,
} from "@/lib/placeholder-data";

// Métricas do dashboard derivadas dos dados fake (aula 2.5).
// TODO(dashboard): no Milestone 6 real, viram queries agregadas no Supabase
// (Server Components), filtradas por workspace_id.

// Negócio "aberto" = ainda não terminal (não ganho nem perdido).
function isOpen(deal: PlaceholderDeal) {
  return !TERMINAL_STAGES.includes(deal.stage);
}

export interface DashboardKpis {
  totalLeads: number;
  openDeals: number;
  pipelineValue: number; // soma do valor dos negócios abertos (BRL)
  conversionRate: number; // win rate em % (0-100): ganhos / (ganhos + perdidos)
}

export function getKpis(): DashboardKpis {
  const open = placeholderDeals.filter(isOpen);
  const won = placeholderDeals.filter((deal) => deal.stage === "won").length;
  const lost = placeholderDeals.filter((deal) => deal.stage === "lost").length;
  const closed = won + lost;

  return {
    totalLeads: placeholderLeads.length,
    openDeals: open.length,
    pipelineValue: open.reduce((sum, deal) => sum + deal.value, 0),
    conversionRate: closed === 0 ? 0 : Math.round((won / closed) * 100),
  };
}

// Etapas do funil = progressão até o ganho (exclui "lost", desfecho negativo).
const FUNNEL_STAGES: DealStage[] = DEAL_STAGES.filter((stage) => stage !== "lost");

export interface FunnelDatum {
  stage: DealStage;
  label: string;
  count: number;
  color: string; // hex (Recharts)
}

export function getFunnelData(): FunnelDatum[] {
  return FUNNEL_STAGES.map((stage) => ({
    stage,
    label: DEAL_STAGE_CONFIG[stage].label,
    count: placeholderDeals.filter((deal) => deal.stage === stage).length,
    color: DEAL_STAGE_CONFIG[stage].chartColor,
  }));
}

// Negócios abertos com prazo definido, ordenados do mais próximo ao mais distante.
export function getUpcomingDeals(limit = 5): PlaceholderDeal[] {
  return placeholderDeals
    .filter((deal) => isOpen(deal) && deal.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, limit);
}
