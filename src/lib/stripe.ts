import Stripe from "stripe";

// Cliente Stripe (singleton preguiçoso, somente-servidor). Degradação graciosa:
// sem STRIPE_SECRET_KEY retorna null e as ações de billing avisam que não está
// configurado. A `apiVersion` é omitida de propósito (usa o padrão do SDK).
let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}

export function getProPriceId(): string | null {
  return process.env.STRIPE_PRO_PRICE_ID || null;
}
