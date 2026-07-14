"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { leadSchema, type LeadInput } from "@/lib/validations/lead";
import type { MutationResult } from "./types";

// CRUD de leads no Supabase. O RLS é a fronteira: update/delete por `id` só
// afetam leads dos workspaces do usuário. Revalidamos leads + dashboard (KPIs).

export async function createLead(input: LeadInput): Promise<MutationResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const workspace = await getCurrentWorkspace();
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    workspace_id: workspace.id,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    company: parsed.data.company || null,
    position: parsed.data.position || null,
    status: parsed.data.status,
    owner_id: parsed.data.ownerId || null,
  });

  if (error) return { ok: false, error: "Não foi possível salvar o lead." };
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateLead(
  id: string,
  input: LeadInput
): Promise<MutationResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      position: parsed.data.position || null,
      status: parsed.data.status,
      owner_id: parsed.data.ownerId || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: "Não foi possível atualizar o lead." };
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteLead(id: string): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) return { ok: false, error: "Não foi possível excluir o lead." };
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}
