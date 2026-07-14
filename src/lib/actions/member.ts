"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { inviteUrl, sendInvitationEmail } from "@/lib/resend";
import { inviteSchema } from "@/lib/validations/invite";
import {
  ACTIVE_WORKSPACE_COOKIE,
  getCurrentMembership,
  getCurrentWorkspace,
  type WorkspaceRole,
} from "@/lib/workspace";
import type { MutationResult } from "./types";

const FREE_MEMBER_LIMIT = 2;

interface InviteResult extends MutationResult {
  inviteUrl?: string;
  emailSent?: boolean;
}

// Convida um colaborador: valida admin + limite do plano Free, cria o convite
// tokenizado, envia o e-mail (Resend) e devolve o link copiável.
export async function inviteMember(
  email: string,
  role: WorkspaceRole
): Promise<InviteResult> {
  const parsed = inviteSchema.safeParse({ email, role });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const [workspace, membership, user] = await Promise.all([
    getCurrentWorkspace(),
    getCurrentMembership(),
    getSessionUser(),
  ]);
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };
  if (membership !== "admin") {
    return { ok: false, error: "Apenas administradores podem convidar." };
  }

  const supabase = await createClient();

  // Limite do plano Free: máx. 2 membros (contando convites pendentes).
  if (workspace.plan === "free") {
    const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
      supabase
        .from("workspace_invites")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
    ]);
    if ((memberCount ?? 0) + (inviteCount ?? 0) >= FREE_MEMBER_LIMIT) {
      return {
        ok: false,
        error:
          "O plano Free permite até 2 membros. Faça upgrade para o Pro para convidar mais.",
      };
    }
  }

  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: workspace.id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    token,
    invited_by: user?.id ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Já existe um convite pendente para esse e-mail." };
    }
    return { ok: false, error: "Não foi possível criar o convite." };
  }

  const emailSent = await sendInvitationEmail({
    to: parsed.data.email,
    workspaceName: workspace.name,
    inviterName: user?.name ?? "Um colega",
    token,
  });

  revalidatePath("/settings");
  return { ok: true, inviteUrl: inviteUrl(token), emailSent };
}

export async function cancelInvite(inviteId: string): Promise<MutationResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId);
  if (error) return { ok: false, error: "Não foi possível cancelar o convite." };
  revalidatePath("/settings");
  return { ok: true };
}

export async function changeMemberRole(
  userId: string,
  role: WorkspaceRole
): Promise<MutationResult> {
  const [workspace, membership] = await Promise.all([
    getCurrentWorkspace(),
    getCurrentMembership(),
  ]);
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };
  if (membership !== "admin") return { ok: false, error: "Apenas administradores." };

  const supabase = await createClient();

  // Não deixar o workspace sem nenhum administrador.
  if (role === "member") {
    const [{ count: adminCount }, { data: target }] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("role", "admin"),
      supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace.id)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    if (target?.role === "admin" && (adminCount ?? 0) <= 1) {
      return { ok: false, error: "O workspace precisa de ao menos um administrador." };
    }
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: "Não foi possível alterar o papel." };
  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMember(userId: string): Promise<MutationResult> {
  const [workspace, membership] = await Promise.all([
    getCurrentWorkspace(),
    getCurrentMembership(),
  ]);
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };
  if (membership !== "admin") return { ok: false, error: "Apenas administradores." };

  const supabase = await createClient();
  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspace.id)
    .maybeSingle();
  if (ws?.owner_id === userId) {
    return { ok: false, error: "O dono do workspace não pode ser removido." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId);
  if (error) return { ok: false, error: "Não foi possível remover o membro." };
  revalidatePath("/settings");
  return { ok: true };
}

export async function renameWorkspace(name: string): Promise<MutationResult> {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "Dê um nome com pelo menos 2 caracteres." };
  }

  const [workspace, membership] = await Promise.all([
    getCurrentWorkspace(),
    getCurrentMembership(),
  ]);
  if (!workspace) return { ok: false, error: "Nenhum workspace ativo." };
  if (membership !== "admin") return { ok: false, error: "Apenas administradores." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ name: trimmed })
    .eq("id", workspace.id);
  if (error) return { ok: false, error: "Não foi possível renomear o workspace." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Aceita um convite (via RPC SECURITY DEFINER) e torna o workspace ativo.
export async function acceptInvite(
  token: string
): Promise<MutationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    invite_token: token,
  });

  if (error) {
    const messages: Record<string, string> = {
      not_authenticated: "Faça login para aceitar o convite.",
      invite_not_found: "Convite inválido ou já utilizado.",
      invite_expired: "Este convite expirou.",
      invite_email_mismatch:
        "Este convite é para outro e-mail. Entre com a conta convidada.",
      member_limit_reached:
        "O workspace atingiu o limite de membros do plano Free.",
    };
    const key = Object.keys(messages).find((k) => error.message.includes(k));
    return { ok: false, error: key ? messages[key] : "Não foi possível aceitar o convite." };
  }

  if (typeof data === "string") {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, data, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
