"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/form-messages";
import { createActivity } from "@/lib/actions/activity";
import { ACTIVITY_TYPE_OPTIONS, type ActivityType } from "@/lib/activity-type";
import { activitySchema } from "@/lib/validations/activity";

// Formulário rápido de nova atividade na página de detalhe do lead.
export function AddActivityForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [type, setType] = React.useState<ActivityType>("note");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<
    Record<string, string[] | undefined>
  >({});
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = activitySchema.safeParse({ type, description });
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    setPending(true);

    const result = await createActivity(leadId, parsed.data);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Não foi possível registrar a atividade.");
      return;
    }

    toast.success("Atividade registrada.");
    setDescription("");
    setType("note");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border bg-muted/30 p-3"
      noValidate
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="space-y-1.5 sm:w-40">
          <Label htmlFor="activity-type" className="text-xs">
            Tipo
          </Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as ActivityType)}
          >
            <SelectTrigger id="activity-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="activity-desc" className="text-xs">
            Descrição
          </Label>
          <Textarea
            id="activity-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="O que aconteceu? (ligação, e-mail, reunião, nota...)"
            rows={2}
            aria-invalid={errors.description ? true : undefined}
          />
          <FieldError errors={errors.description} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Registrar
        </Button>
      </div>
    </form>
  );
}
