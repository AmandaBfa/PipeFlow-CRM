"use client";

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
import { useDeals, type Deal } from "./deals-provider";

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
  const { deleteDeal } = useDeals();

  function handleDelete() {
    if (!deal) return;
    deleteDeal(deal.id);
    toast.success(`Negócio "${deal.title}" excluído.`);
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
          >
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
