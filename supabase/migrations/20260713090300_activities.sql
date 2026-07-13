-- =====================================================================
-- Milestone 5 — Registro de Atividades (Timeline)
-- =====================================================================
-- Tabela `activities` (histórico por lead) + RLS por workspace.
--
-- Depende de: 20260713090000_workspaces_and_members.sql e
--             20260713090100_leads.sql.
-- Idempotente: seguro reexecutar no SQL Editor.
--
-- Os valores de `type` espelham ActivityType em src/lib/placeholder-data.ts.
-- Não tem `updated_at`: atividades são registros imutáveis do histórico.
-- =====================================================================

create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- Atividade pertence a um lead; se o lead sai, a timeline vai junto.
  lead_id      uuid not null references public.leads (id) on delete cascade,
  type         text not null check (type in ('call', 'email', 'meeting', 'note')),
  description  text not null check (char_length(trim(description)) between 1 and 2000),
  -- Autor do registro. Preservamos a atividade se o usuário for removido.
  author_id    uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists activities_workspace_id_idx on public.activities (workspace_id);
create index if not exists activities_lead_id_idx      on public.activities (lead_id, created_at desc);

-- ---------------------------------------------------------------------
-- RLS: activities (isolamento por workspace)
-- ---------------------------------------------------------------------
alter table public.activities enable row level security;

drop policy if exists "activities_select_members" on public.activities;
create policy "activities_select_members"
  on public.activities for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "activities_insert_members" on public.activities;
create policy "activities_insert_members"
  on public.activities for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "activities_update_members" on public.activities;
create policy "activities_update_members"
  on public.activities for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "activities_delete_members" on public.activities;
create policy "activities_delete_members"
  on public.activities for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.activities to authenticated;
