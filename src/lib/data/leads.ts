import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";

// View-model de lead (camelCase) consumido pela UI, mapeado das linhas do banco.
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: LeadStatus;
  ownerId: string | null;
  createdAt: string;
}

// Lead em formato leve para selects (ex.: vincular um deal a um lead).
export interface LeadOption {
  id: string;
  name: string;
  company: string;
}

export interface LeadFilters {
  q?: string;
  status?: string;
  owner?: string;
}

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  status: string;
  owner_id: string | null;
  created_at: string;
}

const SELECT = "id, name, email, phone, company, position, status, owner_id, created_at";

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    company: row.company ?? "",
    position: row.position ?? "",
    status: (LEAD_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as LeadStatus)
      : "new",
    ownerId: row.owner_id,
    createdAt: row.created_at,
  };
}

// Lista os leads do workspace ativo, com busca/filtros aplicados NO BANCO.
// O RLS restringe aos workspaces do usuário; o `.eq(workspace_id)` fixa o ativo.
export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select(SELECT)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const q = filters.q?.trim();
  if (q) {
    // Sanitiza vírgula/parênteses que quebrariam a sintaxe do .or() do PostgREST.
    const term = `%${q.replace(/[,()]/g, " ")}%`;
    query = query.or(
      `name.ilike.${term},email.ilike.${term},company.ilike.${term}`
    );
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as LeadStatus);
  }
  if (filters.owner && filters.owner !== "all") {
    query = query.eq("owner_id", filters.owner);
  }

  const { data } = await query;
  return (data ?? []).map(toLead);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? toLead(data) : null;
}

export async function getLeadOptions(): Promise<LeadOption[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, name, company")
    .eq("workspace_id", workspace.id)
    .order("name", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company ?? "",
  }));
}
