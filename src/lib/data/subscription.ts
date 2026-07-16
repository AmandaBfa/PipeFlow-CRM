import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";

// Estado de billing do workspace ativo (plano efetivo + detalhes do Stripe).
export interface WorkspaceBilling {
  plan: "free" | "pro";
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
}

export async function getWorkspaceBilling(): Promise<WorkspaceBilling | null> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, current_period_end, cancel_at_period_end, stripe_customer_id"
    )
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  return {
    // `workspaces.plan` é o plano efetivo (o webhook sincroniza).
    plan: workspace.plan,
    status: data?.status ?? null,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    hasStripeCustomer: Boolean(data?.stripe_customer_id),
  };
}
