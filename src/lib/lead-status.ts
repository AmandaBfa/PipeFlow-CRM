// Fonte única dos status de lead: valores, ordem, rótulos PT-BR e cores do badge.
// Reutilizado pela validação (lib/validations/lead.ts), pelos dados fake e pela UI.
// Quando a tabela `leads` for criada (Milestone 3), este enum vira o CHECK/enum no Postgres.

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

interface LeadStatusConfig {
  label: string;
  // Tom suave usando os tokens semânticos do tema (funciona em light e dark).
  badgeClassName: string;
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, LeadStatusConfig> = {
  new: { label: "Novo", badgeClassName: "bg-muted text-muted-foreground" },
  contacted: { label: "Contatado", badgeClassName: "bg-primary/10 text-primary" },
  qualified: { label: "Qualificado", badgeClassName: "bg-warning/15 text-warning" },
  unqualified: {
    label: "Desqualificado",
    badgeClassName: "bg-destructive/10 text-destructive",
  },
  converted: { label: "Convertido", badgeClassName: "bg-success/15 text-success" },
};

// Opções ordenadas para selects e filtros.
export const LEAD_STATUS_OPTIONS = LEAD_STATUSES.map((value) => ({
  value,
  label: LEAD_STATUS_CONFIG[value].label,
}));
