"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { DeleteLeadDialog } from "./delete-lead-dialog";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadsTable } from "./leads-table";
import { LeadsToolbar } from "./leads-toolbar";
import { useLeads, type Lead } from "./leads-provider";

// Composição da tela de leads: cabeçalho + aviso de limite + toolbar + tabela.
export function LeadsView() {
  const { members, leadUsage } = useLeads();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingLead, setEditingLead] = React.useState<Lead | undefined>(
    undefined
  );
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingLead, setDeletingLead] = React.useState<Lead | undefined>(
    undefined
  );

  // `limit === null` => plano Pro (ilimitado): nenhum aviso.
  const showUsage = leadUsage.limit !== null;
  const atLimit = !leadUsage.allowed;

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
        <Button onClick={openCreate} disabled={atLimit}>
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </PageHeader>

      {showUsage && (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            atLimit
              ? "border-warning/40 bg-warning/10 text-warning"
              : "text-muted-foreground"
          )}
        >
          {atLimit ? (
            <>
              Limite do plano Grátis atingido ({leadUsage.current} de{" "}
              {leadUsage.limit} leads).{" "}
              <Link href="/settings/billing" className="font-medium underline">
                Faça upgrade para o Pro
              </Link>{" "}
              para criar mais.
            </>
          ) : (
            <>
              Plano Grátis:{" "}
              <strong className="tabular-nums font-medium">
                {leadUsage.current} de {leadUsage.limit}
              </strong>{" "}
              leads usados.
            </>
          )}
        </div>
      )}

      <LeadsToolbar />

      <LeadsTable onCreate={openCreate} onEdit={openEdit} onDelete={openDelete} />

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editingLead}
        members={members}
      />
      <DeleteLeadDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        lead={deletingLead}
      />
    </div>
  );
}
