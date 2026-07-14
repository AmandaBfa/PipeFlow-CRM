"use client";

import * as React from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "./lead-form-dialog";
import type { Lead } from "@/lib/data/leads";
import type { WorkspaceMember } from "@/lib/workspace";

// Botão "Editar" + dialog na página de detalhe (que é Server Component).
export function LeadDetailActions({
  lead,
  members,
}: {
  lead: Lead;
  members: WorkspaceMember[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Editar
      </Button>
      <LeadFormDialog
        open={open}
        onOpenChange={setOpen}
        lead={lead}
        members={members}
      />
    </>
  );
}
