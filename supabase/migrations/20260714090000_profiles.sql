-- =====================================================================
-- Milestone 7 — Colaboração: tabela `profiles` (espelho de auth.users)
-- =====================================================================
-- O cliente não pode ler `auth.users`; `profiles` expõe nome/e-mail dos
-- usuários de forma controlada (RLS) para montar a lista de membros e mostrar
-- nomes de donos de leads/deals em times.
--
-- Populada pelo trigger `handle_new_user` (estendido abaixo) + backfill dos
-- usuários já existentes. RLS: você vê seu perfil e o de CO-MEMBROS.
-- Idempotente.
-- =====================================================================

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Trigger de signup estendido: cria o profile + workspace pessoal + admin.
-- (create or replace mantém o mesmo trigger `on_auth_user_created`.)
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
  ws_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Meu Workspace'
  );

  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.workspaces (name, owner_id)
  values (ws_name, new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'admin');

  return new;
end;
$$;

-- Backfill dos usuários que já existiam antes desta migration.
insert into public.profiles (id, full_name, email)
select
  u.id,
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  u.email
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Helper: dois usuários compartilham algum workspace? (para o RLS abaixo)
-- SECURITY DEFINER para evitar recursão ao ler workspace_members.
-- ---------------------------------------------------------------------
create or replace function public.shares_workspace_with(other uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m1
    join public.workspace_members m2 on m1.workspace_id = m2.workspace_id
    where m1.user_id = (select auth.uid())
      and m2.user_id = other
  );
$$;

-- ---------------------------------------------------------------------
-- RLS: profiles (você vê o seu + o de co-membros; edita só o seu)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_comember" on public.profiles;
create policy "profiles_select_self_or_comember"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.shares_workspace_with(id));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, update on public.profiles to authenticated;
