"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { DeleteLeadDialog } from "./delete-lead-dialog";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadsTable } from "./leads-table";
import { LeadsToolbar } from "./leads-toolbar";
import { type Lead } from "./leads-provider";

// Composição da tela de leads: cabeçalho + toolbar + tabela + dialogs.
// Mantém o estado de qual lead está sendo editado/excluído.
export function LeadsView() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState<Lead | undefined>(
    undefined
  );
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingLead, setDeletingLead] = React.useState<Lead | undefined>(
    undefined
  );

  function openCreate() {
    setEditingLead(undefined);
    setFormOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setFormOpen(true);
  }

  function openDelete(lead: Lead) {
    setDeletingLead(lead);
    setDeleteOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" description="Seus contatos e oportunidades.">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </PageHeader>

      <LeadsToolbar />

      <LeadsTable
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editingLead}
      />
      <DeleteLeadDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        lead={deletingLead}
      />
    </div>
  );
}
