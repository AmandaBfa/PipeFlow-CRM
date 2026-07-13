import { z } from "zod";

// Validação das variáveis de ambiente do Supabase (parte "Chaves" da aula 3.1).
// As NEXT_PUBLIC_* chegam ao browser; a service_role é somente-servidor.

const clientEnvSchema = z.object({
  url: z.string().url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida"),
  anonKey: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente"),
});

type SupabaseClientEnv = z.infer<typeof clientEnvSchema>;

let cached: SupabaseClientEnv | null = null;

/**
 * Chaves públicas do Supabase (usadas pelo client do browser e do servidor).
 * Lança um erro claro se estiverem ausentes/inválidas no `.env.local`.
 */
export function getSupabaseClientEnv(): SupabaseClientEnv {
  if (cached) return cached;

  const parsed = clientEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Configuração do Supabase ausente/inválida no .env.local. " +
        "Copie os valores de Project Settings → API (veja .env.example).\n" +
        parsed.error.issues.map((i) => `  - ${i.message}`).join("\n")
    );
  }

  cached = parsed.data;
  return cached;
}

/**
 * `true` se as chaves públicas do Supabase estão presentes.
 * Usado para degradação graciosa (ex.: middleware faz no-op sem chaves).
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
