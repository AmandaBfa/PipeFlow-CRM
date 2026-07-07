"use client";

import * as React from "react";
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
import { DEAL_STAGE_OPTIONS, type DealStage } from "@/lib/deal-stage";
import { placeholderLeads, placeholderMembers } from "@/lib/placeholder-data";
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

const DEFAULT_OWNER = placeholderMembers[0].id;
const DEFAULT_LEAD = placeholderLeads[0].id;

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  presetStage,
}: DealFormDialogProps) {
  const { addDeal, updateDeal } = useDeals();
  const isEditing = Boolean(deal);

  const [title, setTitle] = React.useState("");
  const [value, setValue] = React.useState("");
  const [stage, setStage] = React.useState<DealStage>("new_lead");
  const [leadId, setLeadId] = React.useState(DEFAULT_LEAD);
  const [ownerId, setOwnerId] = React.useState(DEFAULT_OWNER);
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
    setLeadId(deal?.leadId ?? DEFAULT_LEAD);
    setOwnerId(deal?.ownerId ?? DEFAULT_OWNER);
    setDueDate(deal?.dueDate ?? "");
    setErrors({});
  }, [open, deal, presetStage]);

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
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (deal) {
      updateDeal(deal.id, parsed.data);
      toast.success("Negócio atualizado com sucesso.");
    } else {
      addDeal(parsed.data);
      toast.success("Negócio criado com sucesso.");
    }

    setPending(false);
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
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger id="lead">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {placeholderLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name}
                      {lead.company ? ` · ${lead.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.leadId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Responsável</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {placeholderMembers.map((member) => (
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
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar alterações" : "Criar negócio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
