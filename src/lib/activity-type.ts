// Fonte única dos tipos de atividade: valores, rótulos PT-BR e opções.
// Espelha o CHECK da tabela `activities` (call|email|meeting|note).

export const ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  note: "Nota",
};

export const ACTIVITY_TYPE_OPTIONS = ACTIVITY_TYPES.map((value) => ({
  value,
  label: ACTIVITY_TYPE_LABEL[value],
}));
