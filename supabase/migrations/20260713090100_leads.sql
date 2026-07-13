-- =====================================================================
-- Milestone 3 — Leads & Contatos
-- =====================================================================
-- Tabela `leads` + RLS por workspace. Todos os membros do workspace podem
-- ler/escrever os leads do workspace (CRM de time simples).
--
-- Depende de: 20260713090000_workspaces_and_members.sql
--   (usa public.is_workspace_member e public.set_updated_at).
-- Idempotente: seguro reexecutar no SQL Editor.
--
-- Os valores de `status` espelham src/lib/lead-status.ts (LEAD_STATUSES).
-- =====================================================================

create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null check (char_length(trim(name)) between 1 and 120),
  email        text,
  phone        text,
  company      text,
  position     text,
  status       text not null default 'new'
                 check (status in ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  -- Responsável. Se o usuário sair, o lead permanece (owner vira NULL).
  owner_id     uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists leads_workspace_id_idx on public.leads (workspace_id);
create index if not exists leads_owner_id_idx     on public.leads (owner_id);
create index if not exists leads_status_idx       on public.leads (workspace_id, status);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: leads (isolamento por workspace)
-- ---------------------------------------------------------------------
alter table public.leads enable row level security;

drop policy if exists "leads_select_members" on public.leads;
create policy "leads_select_members"
  on public.leads for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "leads_insert_members" on public.leads;
create policy "leads_insert_members"
  on public.leads for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "leads_update_members" on public.leads;
create policy "leads_update_members"
  on public.leads for update
  to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "leads_delete_members" on public.leads;
create policy "leads_delete_members"
  on public.leads for delete
  to authenticated
  using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.leads to authenticated;
