import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Lê o fim do período atual da assinatura (o campo mudou de lugar entre versões
// da API do Stripe — tentamos os dois).
function periodEndIso(sub: Stripe.Subscription): string | null {
  const s = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const ts = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

function planFor(status: Stripe.Subscription.Status): "free" | "pro" {
  return status === "active" || status === "trialing" ? "pro" : "free";
}

// Sincroniza a assinatura + o plano efetivo do workspace (via service_role).
async function syncSubscription(
  admin: Admin,
  workspaceId: string,
  sub: Stripe.Subscription,
  customerId: string
) {
  const plan = planFor(sub.status);

  await admin.from("subscriptions").upsert(
    {
      workspace_id: workspaceId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: sub.items.data[0]?.price.id ?? null,
      plan,
      status: sub.status,
      current_period_end: periodEndIso(sub),
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: "workspace_id" }
  );

  await admin.from("workspaces").update({ plan }).eq("id", workspaceId);
}

async function resolveWorkspaceId(
  admin: Admin,
  sub: Stripe.Subscription
): Promise<string | null> {
  if (sub.metadata?.workspace_id) return sub.metadata.workspace_id;
  const { data } = await admin
    .from("subscriptions")
    .select("workspace_id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  return data?.workspace_id ?? null;
}

// Webhook do Stripe: ativa/desativa o Pro. Rota pública (o Stripe não tem
// sessão); a autenticidade vem da VERIFICAÇÃO DE ASSINATURA.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId =
          session.client_reference_id ?? session.metadata?.workspace_id ?? null;
        if (workspaceId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await syncSubscription(admin, workspaceId, sub, sub.customer as string);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = await resolveWorkspaceId(admin, sub);
        if (workspaceId) {
          await syncSubscription(admin, workspaceId, sub, sub.customer as string);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe webhook] handler error", error);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
