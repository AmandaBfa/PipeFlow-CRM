"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteLead } from "@/lib/actions/lead";
import type { Lead } from "@/lib/data/leads";

interface DeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
}

export function DeleteLeadDialog({
  open,
  onOpenChange,
  lead,
}: DeleteLeadDialogProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleDelete() {
    if (!lead) return;
    setPending(true);
    const result = await deleteLead(lead.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível excluir o lead.");
      return;
    }

    toast.success(`Lead "${lead.name}" excluído.`);
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir lead</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            {lead ? <strong>{lead.name}</strong> : "este lead"}? Essa ação não
            pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
