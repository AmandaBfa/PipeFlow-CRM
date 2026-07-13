import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseClientEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

// Client do Supabase para uso no browser (componentes "use client").
// Singleton preguiçoso: cria uma única instância na primeira chamada e a reusa
// nas seguintes, evitando abrir múltiplas conexões no mesmo tab.
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (!client) {
    const { url, anonKey } = getSupabaseClientEnv();
    client = createBrowserClient<Database>(url, anonKey);
  }
  return client;
}
