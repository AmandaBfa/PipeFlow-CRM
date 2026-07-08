"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { type DealStage } from "@/lib/deal-stage";
import { DealFormDialog } from "./deal-form-dialog";
import { DealsBoard } from "./deals-board";
import { DealsToolbar } from "./deals-toolbar";
import { DeleteDealDialog } from "./delete-deal-dialog";
import { type Deal } from "./deals-provider";

// Composição da tela de pipeline: cabeçalho + toolbar + board Kanban + dialogs.
export function DealsView() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingDeal, setEditingDeal] = React.useState<Deal | undefined>(
    undefined
  );
  const [presetStage, setPresetStage] = React.useState<DealStage | undefined>(
    undefined
  );
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingDeal, setDeletingDeal] = React.useState<Deal | undefined>(
    undefined
  );

  function openCreate(stage?: DealStage) {
    setEditingDeal(undefined);
    setPresetStage(stage);
    setFormOpen(true);
  }

  function openEdit(deal: Deal) {
    setEditingDeal(deal);
    setPresetStage(undefined);
    setFormOpen(true);
  }

  function openDelete(deal: Deal) {
    setDeletingDeal(deal);
    setDeleteOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Arraste negócios pelas etapas do funil."
      >
        <Button onClick={() => openCreate()}>
          <Plus className="h-4 w-4" />
          Novo negócio
        </Button>
      </PageHeader>

      <DealsToolbar />

      <DealsBoard onCreate={openCreate} onEdit={openEdit} onDelete={openDelete} />

      <DealFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        deal={editingDeal}
        presetStage={presetStage}
      />
      <DeleteDealDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deal={deletingDeal}
      />
    </div>
  );
}
