import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Leads · PipeFlow CRM",
};

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Leads" description="Seus contatos e oportunidades.">
        <Button disabled>
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </PageHeader>
      <EmptyState
        icon={Users}
        title="Nenhum lead ainda"
        description="O cadastro e a listagem de leads chegam no Milestone 3."
      />
    </div>
  );
}
