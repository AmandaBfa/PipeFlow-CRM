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
import { deleteDeal } from "@/lib/actions/deal";
import type { Deal } from "@/lib/data/deals";

interface DeleteDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
}

export function DeleteDealDialog({
  open,
  onOpenChange,
  deal,
}: DeleteDealDialogProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleDelete() {
    if (!deal) return;
    setPending(true);
    const result = await deleteDeal(deal.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível excluir o negócio.");
      return;
    }

    toast.success(`Negócio "${deal.title}" excluído.`);
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir negócio</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            {deal ? <strong>{deal.title}</strong> : "este negócio"}? Essa ação
            não pode ser desfeita.
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
