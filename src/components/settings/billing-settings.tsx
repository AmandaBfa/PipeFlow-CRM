"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing";
import type { WorkspaceBilling } from "@/lib/data/subscription";
import { formatDate } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento atrasado",
  canceled: "Cancelada",
  unpaid: "Não paga",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
  paused: "Pausada",
};

export function BillingSettings({
  billing,
  isAdmin,
}: {
  billing: WorkspaceBilling;
  isAdmin: boolean;
}) {
  const searchParams = useSearchParams();
  const [pending, setPending] = React.useState(false);
  const isPro = billing.plan === "pro";

  // Feedback do retorno do Checkout (?checkout=success|cancel).
  React.useEffect(() => {
    const result = searchParams.get("checkout");
    if (result === "success") {
      toast.success("Pagamento concluído! Seu plano está sendo ativado.");
    } else if (result === "cancel") {
      toast("Checkout cancelado.");
    }
  }, [searchParams]);

  async function handleUpgrade() {
    setPending(true);
    const result = await createCheckoutSession();
    setPending(false);
    if (result && !result.ok) toast.error(result.error ?? "Falha no checkout.");
  }

  async function handleManage() {
    setPending(true);
    const result = await createPortalSession();
    setPending(false);
    if (result && !result.ok) toast.error(result.error ?? "Falha ao abrir o portal.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plano & cobrança</CardTitle>
        <CardDescription>Gerencie a assinatura do workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">Plano atual:</span>
          <Badge variant={isPro ? "default" : "secondary"}>
            {isPro ? "Pro" : "Grátis"}
          </Badge>
          {billing.status && (
            <span className="text-xs text-muted-foreground">
              {STATUS_LABEL[billing.status] ?? billing.status}
            </span>
          )}
        </div>

        {isPro ? (
          <p className="text-sm text-muted-foreground">
            {billing.cancelAtPeriodEnd
              ? `Sua assinatura será cancelada em ${
                  billing.currentPeriodEnd
                    ? formatDate(billing.currentPeriodEnd)
                    : "breve"
                }.`
              : billing.currentPeriodEnd
                ? `Renova em ${formatDate(billing.currentPeriodEnd)}.`
                : "Assinatura ativa."}
          </p>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 text-sm font-medium">Faça upgrade para o Pro</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Membros ilimitados
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Leads ilimitados
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> R$ 49/mês
              </li>
            </ul>
          </div>
        )}

        {isAdmin ? (
          isPro ? (
            <Button variant="outline" onClick={handleManage} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerenciar assinatura
            </Button>
          ) : (
            <Button onClick={handleUpgrade} disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Fazer upgrade para o Pro
            </Button>
          )
        ) : (
          <p className="text-xs text-muted-foreground">
            Apenas administradores gerenciam o plano.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
