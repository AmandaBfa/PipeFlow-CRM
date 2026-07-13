import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseClientEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

// Client do Supabase para o servidor (Server Components e Server Actions).
// Lê e escreve a sessão nos cookies da request. É `async` para acompanhar a
// API de cookies do Next (síncrona no 14, assíncrona no 15+) — `await cookies()`
// funciona nas duas versões.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseClientEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado a partir de um Server Component (cookies são read-only aqui).
          // Pode ignorar com segurança: o refresh da sessão é feito no middleware.
        }
      },
    },
  });
}
