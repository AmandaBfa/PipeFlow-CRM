-- =====================================================================
-- Milestone 4 — Pipeline Kanban de Vendas
-- =====================================================================
-- Tabela `deals` (negócios) + RLS por workspace.
--
-- Depende de: 20260713090000_workspaces_and_members.sql e
--             20260713090100_leads.sql.
-- Idempotente: seguro reexecutar no SQL Editor.
--
-- Os valores de `stage` espelham src/lib/deal-stage.ts (DEAL_STAGES);
-- `won`/`lost` são etapas terminais.
-- =====================================================================

create table if not exists public.deals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- Lead vinculado. Se o lead for removido, o negócio permanece (lead vira NULL).
  lead_id      uuid references public.leads (id) on delete set null,
  title        text not null check (char_length(trim(title)) between 1 and 140),
  value        numeric(14, 2) not null default 0 check (value >= 0),
  stage        text not null default 'new_lead'
                 check (stage in ('new_lead', 'contacted', 'proposal_sent', 'negotiation', 'won', 'lost')),
  owner_id     uuid references auth.users (id) on delete set null,
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists deals_workspace_id_idx on public.deals (workspace_id);
create index if not exists deals_lead_id_idx       on public.deals (lead_id);
create index if not exists deals_owner_id_idx      on public.deals (owner_id);
create index if not exists deals_stage_idx         on public.deals (workspace_id, stage);

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: deals (isolamento por workspace)
-- ---------------------------------------------------------------------
alter table public.deals enable row level security;

drop policy if exists "deals_select_members" on public.deals;
create policy "deals_select_members"
  on public.deals for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "deals_insert_members" on public.deals;
create policy "deals_insert_members"
  on public.deals for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "deals_update_members" on public.deals;
create policy "deals_update_members"
  on public.deals for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "deals_delete_members" on public.deals;
create policy "deals_delete_members"
  on public.deals for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.deals to authenticated;
