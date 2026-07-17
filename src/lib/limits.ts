import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace, type WorkspaceSummary } from "@/lib/workspace";

// Fonte única dos limites do plano Free. Pro é ilimitado.
// Enforçado no SERVIDOR (Server Actions) — a UI só usa isto para avisar antes.
export const FREE_LIMITS = {
  leads: 50,
  members: 2,
} as const;

export interface LimitCheck {
  allowed: boolean;
  current: number;
  /** `null` = ilimitado (plano Pro). */
  limit: number | null;
  /** Mensagem pronta para o usuário quando `allowed` é false. */
  reason: string | null;
}

const LEAD_LIMIT_REASON = `O plano Free permite até ${FREE_LIMITS.leads} leads. Faça upgrade para o Pro.`;
const MEMBER_LIMIT_REASON = `O plano Free permite até ${FREE_LIMITS.members} membros. Faça upgrade para o Pro para convidar mais.`;

const NO_WORKSPACE: LimitCheck = {
  allowed: false,
  current: 0,
  limit: null,
  reason: "Nenhum workspace ativo.",
};

// Pode criar mais um lead no workspace ativo?
// Aceita o workspace já carregado para evitar uma query a mais.
export async function canAddLead(
  workspace?: WorkspaceSummary | null
): Promise<LimitCheck> {
  const ws = workspace ?? (await getCurrentWorkspace());
  if (!ws) return NO_WORKSPACE;

  const supabase = await createClient();
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id);
  const current = count ?? 0;

  if (ws.plan === "pro") {
    return { allowed: true, current, limit: null, reason: null };
  }

  const allowed = current < FREE_LIMITS.leads;
  return {
    allowed,
    current,
    limit: FREE_LIMITS.leads,
    reason: allowed ? null : LEAD_LIMIT_REASON,
  };
}

// Pode adicionar mais um membro? Convites pendentes CONTAM — cada um vira um
// membro ao ser aceito (o RPC `accept_invitation` reforça o limite no banco).
export async function canAddMember(
  workspace?: WorkspaceSummary | null
): Promise<LimitCheck> {
  const ws = workspace ?? (await getCurrentWorkspace());
  if (!ws) return NO_WORKSPACE;

  const supabase = await createClient();
  const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("user_id", { count: "exact", head: true })
      .eq("workspace_id", ws.id),
    supabase
      .from("workspace_invites")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ws.id),
  ]);
  const current = (memberCount ?? 0) + (inviteCount ?? 0);

  if (ws.plan === "pro") {
    return { allowed: true, current, limit: null, reason: null };
  }

  const allowed = current < FREE_LIMITS.members;
  return {
    allowed,
    current,
    limit: FREE_LIMITS.members,
    reason: allowed ? null : MEMBER_LIMIT_REASON,
  };
}
