import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Lê o fim do período atual (o campo mudou de lugar entre versões da API).
function periodEndIso(sub: Stripe.Subscription): string | null {
  const s = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const ts = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

// Id da assinatura a partir da invoice (o campo também variou entre versões).
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as unknown as {
    subscription?: string | { id: string } | null;
  };
  const sub = inv.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

// Política de plano: mantém o Pro durante `past_due` (o Stripe ainda está
// tentando cobrar — carência). Só cai para Free quando a assinatura de fato
// termina (canceled/unpaid/incomplete).
function planFor(status: Stripe.Subscription.Status): "free" | "pro" {
  return status === "active" || status === "trialing" || status === "past_due"
    ? "pro"
    : "free";
}

// Sincroniza a assinatura + o plano efetivo do workspace (via service_role).
// Idempotente: reaplicar o mesmo evento leva ao mesmo estado.
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
      // "Vai cancelar" = flag do fim-de-período OU `cancel_at` (data específica).
      // O Customer Portal às vezes usa `cancel_at` em vez de `cancel_at_period_end`.
      cancel_at_period_end: sub.cancel_at_period_end || sub.cancel_at != null,
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

// Webhook do Stripe — a ÚNICA exceção que usa Route Handler no projeto
// (integração externa; todo o resto do app escreve via Server Actions).
// Rota pública: o Stripe não tem sessão — a autenticidade vem da VERIFICAÇÃO
// DE ASSINATURA sobre o body cru.
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

  // Body como TEXT (cru): o Stripe assina os bytes exatos. Um request.json()
  // reserializaria o payload e quebraria a verificação da assinatura.
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
      // 1) Pagamento aprovado -> ativa o Pro.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId =
          session.client_reference_id ?? session.metadata?.workspace_id ?? null;
        const userId = session.metadata?.user_id ?? null;
        if (workspaceId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await syncSubscription(admin, workspaceId, sub, sub.customer as string);
          console.log(
            `[stripe] Pro ativado — workspace=${workspaceId} user=${userId ?? "?"}`
          );
        }
        break;
      }

      // 2) Assinatura encerrada -> volta para Free.
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = await resolveWorkspaceId(admin, sub);
        if (workspaceId) {
          await syncSubscription(admin, workspaceId, sub, sub.customer as string);
          console.log(
            `[stripe] assinatura encerrada -> Free — workspace=${workspaceId} user=${
              sub.metadata?.user_id ?? "?"
            }`
          );
        }
        break;
      }

      // 3) Falha de pagamento -> registra o estado (past_due) para a UI avisar.
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoiceSubscriptionId(invoice);
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const workspaceId = await resolveWorkspaceId(admin, sub);
          if (workspaceId) {
            await syncSubscription(admin, workspaceId, sub, sub.customer as string);
            console.warn(
              `[stripe] pagamento FALHOU — workspace=${workspaceId} status=${sub.status}`
            );
          }
        }
        break;
      }

      // Extra (fora do spec, mas mantém o Customer Portal em sincronia:
      // cancelar-ao-fim-do-período e troca de plano chegam como `updated`).
      case "customer.subscription.updated": {
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
