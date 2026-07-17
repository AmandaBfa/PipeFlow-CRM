import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

// Client Supabase com a SERVICE_ROLE — IGNORA o RLS. Use SOMENTE no servidor e
// só com input confiável (ex.: webhook do Stripe já verificado por assinatura).
// NUNCA importe isto num Client Component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin: URL/service_role ausentes no ambiente.");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
