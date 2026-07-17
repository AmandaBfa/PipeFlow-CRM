-- =====================================================================
-- PipeFlow CRM - SCRIPT CONSOLIDADO (colar inteiro no SQL Editor e Run)
-- =====================================================================
-- Concatenacao, na ordem correta, das migrations em supabase/migrations/.
-- ARQUIVO GERADO - nao edite aqui. Fonte de verdade: os arquivos individuais.
-- Idempotente: pode reexecutar sem erro.
-- =====================================================================

-- #####################################################################
-- >>> 20260713090000_workspaces_and_members.sql
-- #####################################################################
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


-- #####################################################################
-- >>> 20260713090100_leads.sql
-- #####################################################################
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


-- #####################################################################
-- >>> 20260713090200_deals.sql
-- #####################################################################
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


-- #####################################################################
-- >>> 20260713090300_activities.sql
-- #####################################################################
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


-- #####################################################################
-- >>> 20260713090400_subscriptions.sql
-- #####################################################################
-- =====================================================================
-- Milestone 8 — Monetização (Stripe): estado de assinatura por workspace
-- =====================================================================
-- Tabela `subscriptions` (1:1 com workspace) — fonte de verdade do billing.
--
-- Depende de: 20260713090000_workspaces_and_members.sql.
-- Idempotente: seguro reexecutar no SQL Editor.
--
-- SEGURANÇA: membros só PODEM LER a assinatura do próprio workspace. Toda
-- ESCRITA vem do webhook do Stripe usando a SERVICE_ROLE_KEY, que ignora o RLS.
-- Por isso NÃO há policy de insert/update/delete para `authenticated` — o
-- default (deny) já bloqueia o cliente de forjar o plano.
-- =====================================================================

create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  -- 1:1 com o workspace (unique). Cascade: sai o workspace, sai a assinatura.
  workspace_id           uuid not null unique references public.workspaces (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_price_id        text,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  status                 text not null default 'active'
                           check (status in (
                             'active', 'trialing', 'past_due', 'canceled',
                             'incomplete', 'incomplete_expired', 'unpaid', 'paused'
                           )),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_workspace_id_idx
  on public.subscriptions (workspace_id);
create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS: subscriptions (somente leitura para membros; escrita = service_role)
-- ---------------------------------------------------------------------
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_members" on public.subscriptions;
create policy "subscriptions_select_members"
  on public.subscriptions for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- Sem policies de escrita de propósito: apenas a service_role (webhook) escreve.
grant select on public.subscriptions to authenticated;


-- #####################################################################
-- >>> 20260713100000_rls_hardening.sql
-- #####################################################################
-- =====================================================================
-- Hardening de RLS/funções — boas práticas (skill supabase-postgres-best-practices)
-- =====================================================================
-- 1. Envolve auth.uid() em (select auth.uid()): o Postgres avalia uma vez por
--    query (initPlan) em vez de por linha — ganho de performance no RLS.
-- 2. Fixa search_path na set_updated_at (advisor: function_search_path_mutable).
-- 3. search_path = '' nas funções definer (tudo já é schema-qualified).
--
-- Depende de: 20260713090000_workspaces_and_members.sql (funções já existem).
-- Idempotente: `create or replace` — seguro reexecutar no SQL Editor.
-- Não altera as assinaturas, então as policies existentes continuam válidas.
-- =====================================================================

-- Trigger de updated_at: fixa o search_path (now() vem do pg_catalog, sempre disponível).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Membresia: (select auth.uid()) + search_path vazio (nomes já qualificados).
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_admin(ws uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws
      and user_id = (select auth.uid())
      and role = 'admin'
  );
$$;


-- #####################################################################
-- >>> 20260714090000_profiles.sql
-- #####################################################################
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


-- #####################################################################
-- >>> 20260714090100_workspace_invites.sql
-- #####################################################################
-- =====================================================================
-- Milestone 7 — Colaboração: convites (`workspace_invites`) + aceite
-- =====================================================================
-- Convite tokenizado por e-mail. Admins do workspace gerenciam (RLS). O convidado
-- (ainda não-membro) lê o convite e aceita via RPCs SECURITY DEFINER, que
-- contornam o RLS e aplicam as regras (e-mail bate, não expirou, limite do plano).
--
-- LIMITE DO PLANO FREE: máximo 2 membros por workspace — enforçado no aceite
-- (e também na Server Action de convite). Plano Pro: ilimitado.
-- Idempotente.
-- =====================================================================

create table if not exists public.workspace_invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null,
  role         text not null default 'member' check (role in ('admin', 'member')),
  token        text not null unique default gen_random_uuid()::text,
  invited_by   uuid references auth.users (id) on delete set null,
  expires_at   timestamptz not null default now() + interval '7 days',
  created_at   timestamptz not null default now(),
  -- Um convite pendente por e-mail por workspace.
  unique (workspace_id, email)
);

create index if not exists workspace_invites_workspace_id_idx on public.workspace_invites (workspace_id);
create index if not exists workspace_invites_token_idx on public.workspace_invites (token);

-- ---------------------------------------------------------------------
-- RLS: apenas admins do workspace veem/gerenciam os convites.
-- (O convidado lê pelo RPC definer `get_invite_by_token`, não pela tabela.)
-- ---------------------------------------------------------------------
alter table public.workspace_invites enable row level security;

drop policy if exists "workspace_invites_select_admin" on public.workspace_invites;
create policy "workspace_invites_select_admin"
  on public.workspace_invites for select
  to authenticated
  using (public.is_workspace_admin(workspace_id));

drop policy if exists "workspace_invites_insert_admin" on public.workspace_invites;
create policy "workspace_invites_insert_admin"
  on public.workspace_invites for insert
  to authenticated
  with check (public.is_workspace_admin(workspace_id));

drop policy if exists "workspace_invites_delete_admin" on public.workspace_invites;
create policy "workspace_invites_delete_admin"
  on public.workspace_invites for delete
  to authenticated
  using (public.is_workspace_admin(workspace_id));

grant select, insert, delete on public.workspace_invites to authenticated;

-- ---------------------------------------------------------------------
-- RPC: lê o convite por token (para a página de aceite). Definer: ignora o RLS,
-- mas só devolve dados de quem tem o token (impossível de adivinhar).
-- ---------------------------------------------------------------------
create or replace function public.get_invite_by_token(invite_token text)
returns table (
  workspace_id   uuid,
  workspace_name text,
  email          text,
  role           text,
  expired        boolean
)
language sql
security definer
stable
set search_path = ''
as $$
  select i.workspace_id, w.name, i.email, i.role, (i.expires_at < now())
  from public.workspace_invites i
  join public.workspaces w on w.id = i.workspace_id
  where i.token = invite_token;
$$;

-- ---------------------------------------------------------------------
-- RPC: aceitar convite. Valida token/e-mail/expiração + LIMITE do plano Free,
-- vincula o usuário como membro e apaga o convite. Retorna o workspace_id.
-- ---------------------------------------------------------------------
create or replace function public.accept_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv          public.workspace_invites%rowtype;
  uid          uuid := (select auth.uid());
  user_email   text;
  ws_plan      text;
  member_count integer;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select email into user_email from auth.users where id = uid;

  select * into inv from public.workspace_invites where token = invite_token;
  if not found then
    raise exception 'invite_not_found';
  end if;
  if inv.expires_at < now() then
    raise exception 'invite_expired';
  end if;
  if lower(inv.email) <> lower(coalesce(user_email, '')) then
    raise exception 'invite_email_mismatch';
  end if;

  -- Já é membro? apenas limpa o convite e retorna.
  if exists (
    select 1 from public.workspace_members
    where workspace_id = inv.workspace_id and user_id = uid
  ) then
    delete from public.workspace_invites where id = inv.id;
    return inv.workspace_id;
  end if;

  -- Limite do plano Free: no máximo 2 membros.
  select plan into ws_plan from public.workspaces where id = inv.workspace_id;
  select count(*) into member_count
  from public.workspace_members where workspace_id = inv.workspace_id;
  if ws_plan = 'free' and member_count >= 2 then
    raise exception 'member_limit_reached';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, uid, inv.role);

  delete from public.workspace_invites where id = inv.id;
  return inv.workspace_id;
end;
$$;

grant execute on function public.get_invite_by_token(text) to anon, authenticated;
grant execute on function public.accept_invitation(text) to authenticated;


-- #####################################################################
-- >>> 20260714100000_free_lead_limit.sql
-- #####################################################################
-- =====================================================================
-- Limite do plano Free = 50 leads, enforçado NO BANCO (paridade com membros)
-- =====================================================================
-- O limite de membros já é inviolável (RPC `accept_invitation`). O de leads
-- vivia só na Server Action `createLead` — um insert direto na API o furava.
-- Este trigger BEFORE INSERT fecha isso: nem o service_role escapa.
--
-- Só afeta INSERTs em workspaces `free` com 50 leads. Linhas existentes e
-- workspaces `pro` (ilimitado) não são tocados. Idempotente.
-- =====================================================================

create or replace function public.enforce_free_lead_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws_plan    text;
  lead_count integer;
begin
  select plan into ws_plan
  from public.workspaces
  where id = new.workspace_id;

  if ws_plan = 'free' then
    select count(*) into lead_count
    from public.leads
    where workspace_id = new.workspace_id;

    if lead_count >= 50 then
      raise exception 'lead_limit_reached'
        using hint = 'O plano Free permite até 50 leads. Faça upgrade para o Pro.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_enforce_free_limit on public.leads;
create trigger leads_enforce_free_limit
  before insert on public.leads
  for each row execute function public.enforce_free_lead_limit();

