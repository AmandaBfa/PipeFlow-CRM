"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { activitySchema, type ActivityInput } from "@/lib/validations/activity";
import type { MutationResult } from "./types";

// Registra uma atividade na timeline de um lead. Valida que o lead pertence ao
// workspace ativo antes de inserir (defesa em profundidade, além do RLS).
export async function createActivity(
  leadId: string,
  input: ActivityInput
): Promise<MutationResult> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  const [workspace, user] = await Promise.all([
    getCurrentWorkspace(),
    getSessionUser(),
  ]);
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };

  const supabase = await createClient();

  // O lead precisa existir no workspace ativo (o RLS já garante a visibilidade).
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead não encontrado." };

  const { error } = await supabase.from("activities").insert({
    workspace_id: workspace.id,
    lead_id: leadId,
    type: parsed.data.type,
    description: parsed.data.description,
    author_id: user?.id ?? null,
  });

  if (error) return { ok: false, error: "Não foi possível registrar a atividade." };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}
