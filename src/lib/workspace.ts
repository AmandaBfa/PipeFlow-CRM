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

// Membro do workspace, no formato consumido pela UI (avatar + seletor de responsável).
export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  initials: string;
}

// Membros do workspace ativo. Por ora "solo": só o usuário atual (convites = M7;
// nomes de outros membros exigirão uma tabela `profiles` no futuro).
export async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const user = await getSessionUser();
  if (!user) return [];
  return [
    { id: user.id, name: user.name, email: user.email, initials: user.initials },
  ];
}
