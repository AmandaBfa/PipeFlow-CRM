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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/form-messages";
import { createDeal, updateDeal } from "@/lib/actions/deal";
import { DEAL_STAGE_OPTIONS, type DealStage } from "@/lib/deal-stage";
import { dealSchema } from "@/lib/validations/deal";
import { useDeals, type Deal } from "./deals-provider";

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Presente => modo edição.
  deal?: Deal;
  // Etapa pré-selecionada ao criar a partir de uma coluna.
  presetStage?: DealStage;
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  presetStage,
}: DealFormDialogProps) {
  const router = useRouter();
  const { members, leadOptions } = useDeals();
  const isEditing = Boolean(deal);
  const defaultOwner = members[0]?.id ?? "";
  const defaultLead = leadOptions[0]?.id ?? "";

  const [title, setTitle] = React.useState("");
  const [value, setValue] = React.useState("");
  const [stage, setStage] = React.useState<DealStage>("new_lead");
  const [leadId, setLeadId] = React.useState(defaultLead);
  const [ownerId, setOwnerId] = React.useState(defaultOwner);
  const [dueDate, setDueDate] = React.useState("");
  const [errors, setErrors] = React.useState<
    Record<string, string[] | undefined>
  >({});
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(deal?.title ?? "");
    setValue(deal ? String(deal.value) : "");
    setStage(deal?.stage ?? presetStage ?? "new_lead");
    setLeadId(deal?.leadId ?? defaultLead);
    setOwnerId(deal?.ownerId ?? defaultOwner);
    setDueDate(deal?.dueDate ?? "");
    setErrors({});
  }, [open, deal, presetStage, defaultLead, defaultOwner]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = dealSchema.safeParse({
      title,
      value,
      stage,
      leadId,
      ownerId,
      dueDate: dueDate || undefined,
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);

    const result = deal
      ? await updateDeal(deal.id, parsed.data)
      : await createDeal(parsed.data);

    setPending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível salvar o negócio.");
      return;
    }

    toast.success(
      deal ? "Negócio atualizado com sucesso." : "Negócio criado com sucesso."
    );
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar negócio" : "Novo negócio"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do negócio."
              : "Cadastre um novo negócio no funil."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Implantação do CRM"
              aria-invalid={errors.title ? true : undefined}
            />
            <FieldError errors={errors.title} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="100"
                inputMode="numeric"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="0"
                aria-invalid={errors.value ? true : undefined}
              />
              <FieldError errors={errors.value} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
              <FieldError errors={errors.dueDate} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
              <SelectTrigger id="stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={errors.stage} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead">Lead</Label>
              <Select
                value={leadId}
                onValueChange={setLeadId}
                disabled={leadOptions.length === 0}
              >
                <SelectTrigger id="lead">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {leadOptions.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name}
                      {lead.company ? ` · ${lead.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {leadOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Cadastre um lead antes de criar um negócio.
                </p>
              ) : (
                <FieldError errors={errors.leadId} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Responsável</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.ownerId} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || leadOptions.length === 0}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar alterações" : "Criar negócio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
