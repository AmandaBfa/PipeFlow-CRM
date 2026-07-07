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
