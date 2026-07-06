import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Configurações · PipeFlow CRM",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Workspace, membros e cobrança."
      />
      <EmptyState
        icon={Settings}
        title="Configurações em breve"
        description="Gestão de workspace, membros e billing aparecem nos Milestones 2, 7 e 8."
      />
    </div>
  );
}
