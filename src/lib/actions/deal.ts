"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { DEAL_STAGES, type DealStage } from "@/lib/deal-stage";
import { dealSchema, type DealInput } from "@/lib/validations/deal";
import type { MutationResult } from "./types";

// CRUD de negócios + movimentação de etapa (drag-and-drop) no Supabase.

export async function createDeal(input: DealInput): Promise<MutationResult> {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const workspace = await getCurrentWorkspace();
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };

  const supabase = await createClient();
  const { error } = await supabase.from("deals").insert({
    workspace_id: workspace.id,
    title: parsed.data.title,
    value: parsed.data.value,
    stage: parsed.data.stage,
    lead_id: parsed.data.leadId || null,
    owner_id: parsed.data.ownerId || null,
    due_date: parsed.data.dueDate || null,
  });

  if (error) return { ok: false, error: "Não foi possível salvar o negócio." };
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateDeal(
  id: string,
  input: DealInput
): Promise<MutationResult> {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update({
      title: parsed.data.title,
      value: parsed.data.value,
      stage: parsed.data.stage,
      lead_id: parsed.data.leadId || null,
      owner_id: parsed.data.ownerId || null,
      due_date: parsed.data.dueDate || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: "Não foi possível atualizar o negócio." };
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("deals").delete().eq("id", id);

  if (error) return { ok: false, error: "Não foi possível excluir o negócio." };
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Move o negócio para outra etapa (persiste o drag-and-drop).
export async function moveDealStage(
  id: string,
  stage: DealStage
): Promise<MutationResult> {
  if (!(DEAL_STAGES as readonly string[]).includes(stage)) {
    return { ok: false, error: "Etapa inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", id);

  if (error) return { ok: false, error: "Não foi possível mover o negócio." };
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}
