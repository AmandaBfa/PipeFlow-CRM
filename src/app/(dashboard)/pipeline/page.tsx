import type { Metadata } from "next";
import { KanbanSquare, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Pipeline · PipeFlow CRM",
};

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Arraste negócios pelas etapas do funil."
      >
        <Button disabled>
          <Plus className="h-4 w-4" />
          Novo negócio
        </Button>
      </PageHeader>
      <EmptyState
        icon={KanbanSquare}
        title="Board em construção"
        description="O Kanban de negócios com drag-and-drop chega no Milestone 4."
      />
    </div>
  );
}
