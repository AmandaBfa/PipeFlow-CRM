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
import type { LimitCheck } from "@/lib/limits";
import { cn } from "@/lib/utils";

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

const PLAN_FEATURES = {
  free: ["Até 50 leads", "Até 2 membros", "Pipeline Kanban", "Dashboard de métricas"],
  pro: [
    "Leads ilimitados",
    "Membros ilimitados",
    "Tudo do plano Grátis",
    "Suporte prioritário",
  ],
};

function UsageRow({ label, usage }: { label: string; usage: LimitCheck }) {
  if (usage.limit === null) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{usage.current} · ilimitado</span>
      </div>
    );
  }
  const pct = Math.min(100, Math.round((usage.current / usage.limit) * 100));
  const full = !usage.allowed;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className={cn("tabular-nums", full ? "font-medium text-warning" : "text-muted-foreground")}>
          {usage.current} de {usage.limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", full ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BillingSettings({
  billing,
  isAdmin,
  leadUsage,
  memberUsage,
}: {
  billing: WorkspaceBilling;
  isAdmin: boolean;
  leadUsage: LimitCheck;
  memberUsage: LimitCheck;
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
    <div className="space-y-6">
      {/* Plano atual + ação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano atual</CardTitle>
          <CardDescription>
            {isPro
              ? billing.cancelAtPeriodEnd
                ? `Sua assinatura será cancelada em ${
                    billing.currentPeriodEnd ? formatDate(billing.currentPeriodEnd) : "breve"
                  }.`
                : billing.currentPeriodEnd
                  ? `Renova em ${formatDate(billing.currentPeriodEnd)}.`
                  : "Assinatura ativa."
              : "Você está no plano Grátis."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isPro ? "default" : "secondary"}>
              {isPro ? "Pro" : "Grátis"}
            </Badge>
            {billing.status && (
              <span className="text-xs text-muted-foreground">
                {STATUS_LABEL[billing.status] ?? billing.status}
              </span>
            )}
          </div>

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
                Assinar o Pro
              </Button>
            )
          ) : (
            <p className="text-xs text-muted-foreground">
              Apenas administradores gerenciam o plano.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Uso do plano */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uso</CardTitle>
          <CardDescription>
            {isPro
              ? "Seu plano não tem limites."
              : "Limites do plano Grátis neste workspace."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageRow label="Leads" usage={leadUsage} />
          <UsageRow label="Membros (inclui convites pendentes)" usage={memberUsage} />
        </CardContent>
      </Card>

      {/* Comparativo Free vs Pro */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(["free", "pro"] as const).map((plan) => {
          const current = billing.plan === plan;
          const pro = plan === "pro";
          return (
            <div
              key={plan}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-6",
                pro ? "border-primary shadow-sm shadow-primary/10" : "border-border"
              )}
            >
              {current && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                  Plano atual
                </span>
              )}
              <h3 className="text-base font-semibold">{pro ? "Pro" : "Grátis"}</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {pro ? "R$ 49" : "R$ 0"}
                </span>
                <span className="pb-1 text-sm text-muted-foreground">/mês</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {PLAN_FEATURES[plan].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        pro ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {pro && !isPro && isAdmin && (
                <Button className="mt-6 w-full" onClick={handleUpgrade} disabled={pending}>
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Assinar o Pro
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
