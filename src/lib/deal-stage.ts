// Fonte única das etapas do pipeline de negócios (deals): valores, ordem,
// rótulos PT-BR e cores por etapa. Reutilizado pela validação, dados fake e UI.
// Quando a tabela `deals` for criada (Milestone 4), este enum vira o CHECK/enum
// no Postgres. `won`/`lost` são etapas terminais.
//
// IMPORTANTE: as classes de cor abaixo são fixas por etapa (nunca concatenadas
// dinamicamente) e este arquivo (src/lib) está no `content` do tailwind.config
// para não serem purgadas.

export const DEAL_STAGES = [
  "new_lead",
  "contacted",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

interface DealStageConfig {
  label: string;
  // Tint do badge (bg + text), funciona em light e dark.
  badgeClassName: string;
  // Cor do título da coluna.
  headerClassName: string;
  // Bolinha de cor no header da coluna.
  dotClassName: string;
  // Borda-esquerda do card + sombra colorida no hover.
  accentClassName: string;
  // Ring quando a coluna é alvo de drop (isOver).
  ringClassName: string;
  // Cor sólida (hex) para gráficos (Recharts não usa classes Tailwind).
  chartColor: string;
}

export const DEAL_STAGE_CONFIG: Record<DealStage, DealStageConfig> = {
  new_lead: {
    label: "Novo",
    badgeClassName: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    headerClassName: "text-slate-600 dark:text-slate-300",
    dotClassName: "bg-slate-400",
    accentClassName: "border-l-slate-400 hover:shadow-slate-500/10",
    ringClassName: "ring-slate-400/40",
    chartColor: "#94a3b8",
  },
  contacted: {
    label: "Contato feito",
    badgeClassName: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    headerClassName: "text-indigo-600 dark:text-indigo-400",
    dotClassName: "bg-indigo-500",
    accentClassName: "border-l-indigo-500 hover:shadow-indigo-500/15",
    ringClassName: "ring-indigo-500/40",
    chartColor: "#6366f1",
  },
  proposal_sent: {
    label: "Proposta enviada",
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    headerClassName: "text-amber-600 dark:text-amber-400",
    dotClassName: "bg-amber-500",
    accentClassName: "border-l-amber-500 hover:shadow-amber-500/15",
    ringClassName: "ring-amber-500/40",
    chartColor: "#f59e0b",
  },
  negotiation: {
    label: "Em negociação",
    badgeClassName: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    headerClassName: "text-orange-600 dark:text-orange-400",
    dotClassName: "bg-orange-500",
    accentClassName: "border-l-orange-500 hover:shadow-orange-500/15",
    ringClassName: "ring-orange-500/40",
    chartColor: "#f97316",
  },
  won: {
    label: "Ganho",
    badgeClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    headerClassName: "text-emerald-600 dark:text-emerald-400",
    dotClassName: "bg-emerald-500",
    accentClassName: "border-l-emerald-500 hover:shadow-emerald-500/15",
    ringClassName: "ring-emerald-500/40",
    chartColor: "#10b981",
  },
  lost: {
    label: "Perdido",
    badgeClassName: "bg-red-500/10 text-red-600 dark:text-red-400",
    headerClassName: "text-red-600 dark:text-red-400",
    dotClassName: "bg-red-500",
    accentClassName: "border-l-red-500 hover:shadow-red-500/10",
    ringClassName: "ring-red-500/40",
    chartColor: "#ef4444",
  },
};

// Opções ordenadas para selects.
export const DEAL_STAGE_OPTIONS = DEAL_STAGES.map((value) => ({
  value,
  label: DEAL_STAGE_CONFIG[value].label,
}));

// Etapas terminais (fecham o negócio).
export const TERMINAL_STAGES: readonly DealStage[] = ["won", "lost"];
