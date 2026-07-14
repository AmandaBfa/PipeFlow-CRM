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
import { createLead, updateLead } from "@/lib/actions/lead";
import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/lead-status";
import { leadSchema } from "@/lib/validations/lead";
import type { WorkspaceMember } from "@/lib/workspace";
import type { Lead } from "@/lib/data/leads";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Quando presente, o dialog está em modo de edição.
  lead?: Lead;
  members: WorkspaceMember[];
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  members,
}: LeadFormDialogProps) {
  const router = useRouter();
  const isEditing = Boolean(lead);
  const defaultOwner = members[0]?.id ?? "";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [status, setStatus] = React.useState<LeadStatus>("new");
  const [ownerId, setOwnerId] = React.useState<string>(defaultOwner);
  const [errors, setErrors] = React.useState<
    Record<string, string[] | undefined>
  >({});
  const [pending, setPending] = React.useState(false);

  // Reinicia o formulário sempre que o dialog abre (com os dados do lead em edição).
  React.useEffect(() => {
    if (!open) return;
    setName(lead?.name ?? "");
    setEmail(lead?.email ?? "");
    setPhone(lead?.phone ?? "");
    setCompany(lead?.company ?? "");
    setPosition(lead?.position ?? "");
    setStatus(lead?.status ?? "new");
    setOwnerId(lead?.ownerId ?? defaultOwner);
    setErrors({});
  }, [open, lead, defaultOwner]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = leadSchema.safeParse({
      name,
      email,
      phone,
      company,
      position,
      status,
      ownerId,
    });

    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);

    const result = lead
      ? await updateLead(lead.id, parsed.data)
      : await createLead(parsed.data);

    setPending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível salvar o lead.");
      return;
    }

    toast.success(lead ? "Lead atualizado com sucesso." : "Lead criado com sucesso.");
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do contato."
              : "Cadastre um novo contato no seu funil."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do contato"
              aria-invalid={errors.name ? true : undefined}
            />
            <FieldError errors={errors.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contato@empresa.com"
                aria-invalid={errors.email ? true : undefined}
              />
              <FieldError errors={errors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(11) 90000-0000"
              />
              <FieldError errors={errors.phone} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Nome da empresa"
              />
              <FieldError errors={errors.company} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder="Cargo do contato"
              />
              <FieldError errors={errors.position} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as LeadStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.status} />
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
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar alterações" : "Criar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
