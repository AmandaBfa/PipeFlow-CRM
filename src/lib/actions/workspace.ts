"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspace";

// Define o workspace ativo (troca no switcher). Valida a membresia via RLS
// antes de gravar o cookie.
export async function setActiveWorkspaceAction(
  workspaceId: string
): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();

  // Se o RLS não retornou a linha, o usuário não é membro: ignora.
  if (!data) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
}

// Conclui o onboarding: renomeia o workspace pessoal (já criado pelo trigger
// no signup) e leva ao dashboard. Nome vazio/curto = pula sem renomear.
export async function completeOnboardingAction(name: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const trimmed = name.trim();
  if (trimmed.length >= 2) {
    // RLS: só um admin do workspace atualiza — o trigger já vinculou o usuário
    // como admin do seu workspace pessoal (owner_id = user.id).
    await supabase
      .from("workspaces")
      .update({ name: trimmed })
      .eq("owner_id", user.id);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
