import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { DEAL_STAGES, type DealStage } from "@/lib/deal-stage";

// View-model de negócio (camelCase) consumido pela UI, mapeado das linhas do banco.
export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  leadId: string | null;
  ownerId: string | null;
  dueDate: string | null;
  createdAt: string;
}

export interface DealFilters {
  q?: string;
  owner?: string;
}

interface DealRow {
  id: string;
  title: string;
  value: number | string;
  stage: string;
  lead_id: string | null;
  owner_id: string | null;
  due_date: string | null;
  created_at: string;
}

const SELECT = "id, title, value, stage, lead_id, owner_id, due_date, created_at";

function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    title: row.title,
    // numeric do Postgres pode chegar como string; normalizamos para number.
    value: typeof row.value === "string" ? Number(row.value) : row.value,
    stage: (DEAL_STAGES as readonly string[]).includes(row.stage)
      ? (row.stage as DealStage)
      : "new_lead",
    leadId: row.lead_id,
    ownerId: row.owner_id,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

// Lista os negócios do workspace ativo, com busca/filtro por responsável NO BANCO.
export async function getDeals(filters: DealFilters = {}): Promise<Deal[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = await createClient();
  let query = supabase
    .from("deals")
    .select(SELECT)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const q = filters.q?.trim();
  if (q) {
    query = query.ilike("title", `%${q.replace(/[,()]/g, " ")}%`);
  }
  if (filters.owner && filters.owner !== "all") {
    query = query.eq("owner_id", filters.owner);
  }

  const { data } = await query;
  return (data ?? []).map(toDeal);
}
