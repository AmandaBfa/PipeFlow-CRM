import { ACTIVITY_TYPES, type ActivityType } from "@/lib/activity-type";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembers } from "@/lib/workspace";

// View-model de atividade, enriquecido com o autor (nome/iniciais).
export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  description: string;
  authorId: string | null;
  authorName: string | null;
  authorInitials: string | null;
  createdAt: string;
}

// Atividades de um lead, mais recentes primeiro. O RLS restringe às atividades
// dos workspaces do usuário — logo, um lead de outro workspace retorna vazio.
export async function getActivities(leadId: string): Promise<Activity[]> {
  const supabase = await createClient();
  const [{ data }, members] = await Promise.all([
    supabase
      .from("activities")
      .select("id, lead_id, type, description, author_id, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    getWorkspaceMembers(),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (data ?? []).map((a) => {
    const author = a.author_id ? memberMap.get(a.author_id) : undefined;
    return {
      id: a.id,
      leadId: a.lead_id,
      type: (ACTIVITY_TYPES as readonly string[]).includes(a.type)
        ? (a.type as ActivityType)
        : "note",
      description: a.description,
      authorId: a.author_id,
      authorName: author?.name ?? null,
      authorInitials: author?.initials ?? null,
      createdAt: a.created_at,
    };
  });
}
