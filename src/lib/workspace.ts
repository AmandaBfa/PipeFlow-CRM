import { cookies } from "next/headers";

import { getSessionUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

// Cookie que guarda o workspace ativo do usuário (preferência entre sessões).
export const ACTIVE_WORKSPACE_COOKIE = "active_workspace";

// Workspace no formato que o shell consome (com iniciais para o avatar).
export interface WorkspaceSummary {
  id: string;
  name: string;
  plan: "free" | "pro";
  initials: string;
}

// Lista os workspaces do usuário logado. O RLS já filtra por membresia, então
// esta query retorna apenas os workspaces onde o usuário é membro.
export async function getWorkspaces(): Promise<WorkspaceSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("id, name, plan")
    .order("created_at", { ascending: true });

  return (data ?? []).map((ws) => ({
    id: ws.id,
    name: ws.name,
    plan: ws.plan,
    initials: getInitials(ws.name),
  }));
}

// Resolve o workspace ativo: preferência no cookie, senão o primeiro da lista.
// Aceita a lista já carregada para evitar uma segunda query.
export async function getCurrentWorkspace(
  workspaces?: WorkspaceSummary[]
): Promise<WorkspaceSummary | null> {
  const list = workspaces ?? (await getWorkspaces());
  if (list.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  return list.find((ws) => ws.id === activeId) ?? list[0];
}

export type WorkspaceRole = "admin" | "member";

// Membro do workspace, no formato consumido pela UI (avatar + papel).
export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: WorkspaceRole;
}

// Membros do workspace ativo, com nome real via `profiles` (RLS de co-membros).
export async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id, role, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (!members || members.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in(
      "id",
      members.map((m) => m.user_id)
    );

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => {
    const p = profileMap.get(m.user_id);
    const name = p?.full_name?.trim() || p?.email?.split("@")[0] || "Usuário";
    return {
      id: m.user_id,
      name,
      email: p?.email ?? "",
      initials: getInitials(name),
      role: m.role,
    };
  });
}

// Convite pendente do workspace ativo (a policy de SELECT é admin-only).
export interface WorkspaceInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  createdAt: string;
  expiresAt: string;
}

export async function getWorkspaceInvites(): Promise<WorkspaceInvite[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_invites")
    .select("id, email, role, created_at, expires_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    createdAt: i.created_at,
    expiresAt: i.expires_at,
  }));
}

// Papel do usuário logado no workspace ativo (null se não for membro).
export async function getCurrentMembership(): Promise<WorkspaceRole | null> {
  const [workspace, user] = await Promise.all([
    getCurrentWorkspace(),
    getSessionUser(),
  ]);
  if (!workspace || !user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.role ?? null;
}
