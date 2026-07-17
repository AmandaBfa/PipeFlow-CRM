"use server";

import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/session";
import { getProPriceId, getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership, getCurrentWorkspace } from "@/lib/workspace";
import type { MutationResult } from "./types";

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

// Inicia o Checkout do plano Pro (assinatura). Admin-only. Em sucesso,
// redireciona para o Stripe; em erro, devolve a mensagem para o toast.
export async function createCheckoutSession(): Promise<MutationResult> {
  const stripe = getStripe();
  const priceId = getProPriceId();
  if (!stripe || !priceId) {
    return { ok: false, error: "Stripe não está configurado." };
  }

  const [workspace, membership, user] = await Promise.all([
    getCurrentWorkspace(),
    getCurrentMembership(),
    getSessionUser(),
  ]);
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };
  if (membership !== "admin") {
    return { ok: false, error: "Apenas administradores gerenciam o plano." };
  }
  if (workspace.plan === "pro") {
    return { ok: false, error: "Este workspace já está no plano Pro." };
  }

  // Reaproveita o customer do Stripe se já existir (evita duplicar).
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  const customerId = sub?.stripe_customer_id ?? undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(customerId
      ? { customer: customerId }
      : { customer_email: user?.email }),
    client_reference_id: workspace.id,
    // O webhook lê workspace_id + user_id daqui (quem iniciou o upgrade).
    metadata: { workspace_id: workspace.id, user_id: user?.id ?? "" },
    subscription_data: {
      metadata: { workspace_id: workspace.id, user_id: user?.id ?? "" },
    },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/settings?checkout=success`,
    cancel_url: `${appUrl()}/settings?checkout=cancel`,
  });

  if (!session.url) {
    return { ok: false, error: "Não foi possível iniciar o checkout." };
  }
  redirect(session.url);
}

// Abre o Customer Portal do Stripe (gerenciar/cancelar). Admin-only.
export async function createPortalSession(): Promise<MutationResult> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Stripe não está configurado." };

  const [workspace, membership] = await Promise.all([
    getCurrentWorkspace(),
    getCurrentMembership(),
  ]);
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };
  if (membership !== "admin") {
    return { ok: false, error: "Apenas administradores gerenciam o plano." };
  }

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!sub?.stripe_customer_id) {
    return { ok: false, error: "Nenhuma assinatura ativa para gerenciar." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl()}/settings`,
  });
  redirect(session.url);
}
