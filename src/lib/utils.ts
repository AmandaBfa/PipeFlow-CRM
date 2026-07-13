import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes condicionais e resolve conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extrai até duas iniciais de um nome (para avatares). */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Retorna `value` se for um caminho interno seguro — começa com "/" simples,
 * sem "//" nem "\\" (que browsers tratam como protocol-relative → open redirect).
 * Caso contrário, retorna `fallback`. Use para validar `?next=`.
 */
export function safeInternalPath(value: unknown, fallback: string): string {
  return typeof value === "string" &&
    /^\/(?!\/)/.test(value) &&
    !value.includes("\\")
    ? value
    : fallback;
}
