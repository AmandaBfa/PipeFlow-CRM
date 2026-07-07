// Formatação de datas em pt-BR. Timezone fixo (America/Sao_Paulo) para o
// resultado ser idêntico no servidor e no cliente e não causar mismatch de
// hidratação.
const TIME_ZONE = "America/Sao_Paulo";

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

// Valor monetário em reais (BRL). Locale fixo para render consistente.
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

// Data de vencimento (string "YYYY-MM-DD" do input type=date). Formata em UTC
// para não sofrer shift de fuso (evita cair um dia para trás).
export function formatDueDate(dateStr: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr));
}
