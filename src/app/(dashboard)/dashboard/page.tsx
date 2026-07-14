import type { Metadata } from "next";
import { Briefcase, DollarSign, Target, Users } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { SalesFunnelChart } from "@/components/dashboard/sales-funnel-chart";
import { UpcomingDeals } from "@/components/dashboard/upcoming-deals";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Dashboard · PipeFlow CRM",
};

// Primeira tela após o login. Métricas computadas no server a partir dos dados
// fake (placeholderLeads/placeholderDeals) — viram queries do Supabase no
// Milestone 6 real (ver TODO(dashboard) em lib/metrics.ts).
export default async function DashboardPage() {
  const { kpis, funnel } = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral das suas vendas." />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total de leads"
          value={String(kpis.totalLeads)}
        />
        <MetricCard
          icon={Briefcase}
          label="Negócios abertos"
          value={String(kpis.openDeals)}
        />
        <MetricCard
          icon={DollarSign}
          label="Valor do pipeline"
          value={formatCurrency(kpis.pipelineValue)}
          hint={`em ${kpis.openDeals} negócios abertos`}
          iconClassName="bg-success/10 text-success"
        />
        <MetricCard
          icon={Target}
          label="Taxa de conversão"
          value={`${kpis.conversionRate}%`}
          hint="ganhos ÷ negócios fechados"
          iconClassName="bg-warning/15 text-warning"
        />
      </div>

      {/* Funil + prazos próximos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Funil de vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesFunnelChart data={funnel} />
          </CardContent>
        </Card>
        <div className="lg:col-span-1">
          <UpcomingDeals />
        </div>
      </div>
    </div>
  );
}
