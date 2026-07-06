import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Dashboard · PipeFlow CRM",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral das suas vendas."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Métricas em breve"
        description="Os indicadores e o funil de vendas aparecem aqui a partir do Milestone 6."
      />
    </div>
  );
}
