-- =====================================================================
-- Milestone 2 — Multi-empresa (Workspaces) & fundação de RLS
-- =====================================================================
-- Cria as tabelas de tenancy (workspaces, workspace_members), as funções
-- auxiliares de RLS e o trigger que provisiona um workspace pessoal no signup.
--
-- Este arquivo é IDEMPOTENTE: pode ser colado inteiro no SQL Editor do
-- Supabase Studio e reexecutado sem erro (usa IF NOT EXISTS / OR REPLACE /
-- DROP ... IF EXISTS).
--
-- IMPORTANTE (segurança): as policies filtram por associação ao workspace via
-- as funções `is_workspace_member` / `is_workspace_admin`. Elas são
-- SECURITY DEFINER de propósito — rodam com os privilégios do dono e, por isso,
-- IGNORAM o RLS ao consultar `workspace_members` por dentro. Sem isso, uma
-- policy em `workspace_members` que consulta a própria `workspace_members`
-- entraria em RECURSÃO INFINITA. Não troque para SECURITY INVOKER.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: mantém `updated_at` sempre coerente em UPDATEs.
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Tabela: workspaces (a empresa/time — o tenant)
-- ---------------------------------------------------------------------
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 80),
  -- Plano "efetivo" (desnormalizado p/ leitura rápida em checagens de limite).
  -- A fonte de verdade do billing é a tabela `subscriptions`; o webhook do
  -- Stripe (M8) sincroniza este campo.
  plan       text not null default 'free' check (plan in ('free', 'pro')),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Tabela: workspace_members (junção user <-> workspace, com papel)
-- ---------------------------------------------------------------------
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id)        on delete cascade,
  role         text not null default 'member' check (role in ('admin', 'member')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);

-- ---------------------------------------------------------------------
-- Funções auxiliares de RLS (SECURITY DEFINER — ver nota no topo).
-- ---------------------------------------------------------------------
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(ws uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- RLS: workspaces
-- ---------------------------------------------------------------------
alter table public.workspaces enable row level security;

drop policy if exists "workspaces_select_members" on public.workspaces;
create policy "workspaces_select_members"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

-- Só é possível criar um workspace do qual você é o dono (o trigger de signup
-- também cria, mas roda como definer e ignora esta checagem).
drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_admin" on public.workspaces;
create policy "workspaces_update_admin"
  on public.workspaces for update
  to authenticated
  using (public.is_workspace_admin(id))
  with check (public.is_workspace_admin(id));

drop policy if exists "workspaces_delete_admin" on public.workspaces;
create policy "workspaces_delete_admin"
  on public.workspaces for delete
  to authenticated
  using (public.is_workspace_admin(id));

-- ---------------------------------------------------------------------
-- RLS: workspace_members
-- ---------------------------------------------------------------------
alter table public.workspace_members enable row level security;

-- Membros enxergam a lista de membros do próprio workspace.
drop policy if exists "workspace_members_select_members" on public.workspace_members;
create policy "workspace_members_select_members"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- Apenas admins gerenciam membros (convite/aceite entram no M7 via RPC definer).
drop policy if exists "workspace_members_insert_admin" on public.workspace_members;
create policy "workspace_members_insert_admin"
  on public.workspace_members for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists "workspace_members_update_admin" on public.workspace_members;
create policy "workspace_members_update_admin"
  on public.workspace_members for update
  to authenticated
  using (public.is_workspace_admin(workspace_id))
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists "workspace_members_delete_admin" on public.workspace_members;
create policy "workspace_members_delete_admin"
  on public.workspace_members for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

-- ---------------------------------------------------------------------
-- Trigger de provisionamento: no signup, cria o workspace pessoal e
-- vincula o novo usuário como admin. Roda como DEFINER para poder inserir
-- ignorando o RLS.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  ws_name          text;
begin
  -- Nome do workspace: metadata do signup -> nome do usuário -> antes do @ -> fallback.
  ws_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Meu Workspace'
  );

  insert into public.workspaces (name, owner_id)
  values (ws_name, new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Grants (defesa em profundidade — RLS continua sendo a fronteira real).
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.workspaces        to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
