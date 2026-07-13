-- =====================================================================
-- PipeFlow CRM — SCRIPT CONSOLIDADO (colar inteiro no SQL Editor e Run)
-- =====================================================================
-- Concatenação, na ordem correta, das 5 migrations em supabase/migrations/.
-- ARQUIVO GERADO — não edite aqui. Fonte de verdade: os arquivos individuais
-- em supabase/migrations/ (usados pelo `supabase db push`). Este consolidado é
-- só uma conveniência para aplicar tudo de uma vez no Studio.
-- Idempotente: pode reexecutar sem erro.
-- =====================================================================

-- #####################################################################
-- >>> 20260713090000_workspaces_and_members.sql
-- #####################################################################
-- =====================================================================
-- Milestone 2 â€” Multi-empresa (Workspaces) & fundaÃ§Ã£o de RLS
-- =====================================================================
-- Cria as tabelas de tenancy (workspaces, workspace_members), as funÃ§Ãµes
-- auxiliares de RLS e o trigger que provisiona um workspace pessoal no signup.
--
-- Este arquivo Ã© IDEMPOTENTE: pode ser colado inteiro no SQL Editor do
-- Supabase Studio e reexecutado sem erro (usa IF NOT EXISTS / OR REPLACE /
-- DROP ... IF EXISTS).
--
-- IMPORTANTE (seguranÃ§a): as policies filtram por associaÃ§Ã£o ao workspace via
-- as funÃ§Ãµes `is_workspace_member` / `is_workspace_admin`. Elas sÃ£o
-- SECURITY DEFINER de propÃ³sito â€” rodam com os privilÃ©gios do dono e, por isso,
-- IGNORAM o RLS ao consultar `workspace_members` por dentro. Sem isso, uma
-- policy em `workspace_members` que consulta a prÃ³pria `workspace_members`
-- entraria em RECURSÃƒO INFINITA. NÃ£o troque para SECURITY INVOKER.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: mantÃ©m `updated_at` sempre coerente em UPDATEs.
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
-- Tabela: workspaces (a empresa/time â€” o tenant)
-- ---------------------------------------------------------------------
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 80),
  -- Plano "efetivo" (desnormalizado p/ leitura rÃ¡pida em checagens de limite).
  -- A fonte de verdade do billing Ã© a tabela `subscriptions`; o webhook do
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
-- Tabela: workspace_members (junÃ§Ã£o user <-> workspace, com papel)
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
-- FunÃ§Ãµes auxiliares de RLS (SECURITY DEFINER â€” ver nota no topo).
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

-- SÃ³ Ã© possÃ­vel criar um workspace do qual vocÃª Ã© o dono (o trigger de signup
-- tambÃ©m cria, mas roda como definer e ignora esta checagem).
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

-- Membros enxergam a lista de membros do prÃ³prio workspace.
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
-- vincula o novo usuÃ¡rio como admin. Roda como DEFINER para poder inserir
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
  -- Nome do workspace: metadata do signup -> nome do usuÃ¡rio -> antes do @ -> fallback.
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
-- Grants (defesa em profundidade â€” RLS continua sendo a fronteira real).
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.workspaces        to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;


-- #####################################################################
-- >>> 20260713090100_leads.sql
-- #####################################################################
-- =====================================================================
-- Milestone 3 â€” Leads & Contatos
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
  -- ResponsÃ¡vel. Se o usuÃ¡rio sair, o lead permanece (owner vira NULL).
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
-- Milestone 4 â€” Pipeline Kanban de Vendas
-- =====================================================================
-- Tabela `deals` (negÃ³cios) + RLS por workspace.
--
-- Depende de: 20260713090000_workspaces_and_members.sql e
--             20260713090100_leads.sql.
-- Idempotente: seguro reexecutar no SQL Editor.
--
-- Os valores de `stage` espelham src/lib/deal-stage.ts (DEAL_STAGES);
-- `won`/`lost` sÃ£o etapas terminais.
-- =====================================================================

create table if not exists public.deals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- Lead vinculado. Se o lead for removido, o negÃ³cio permanece (lead vira NULL).
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
-- Milestone 5 â€” Registro de Atividades (Timeline)
-- =====================================================================
-- Tabela `activities` (histÃ³rico por lead) + RLS por workspace.
--
-- Depende de: 20260713090000_workspaces_and_members.sql e
--             20260713090100_leads.sql.
-- Idempotente: seguro reexecutar no SQL Editor.
--
-- Os valores de `type` espelham ActivityType em src/lib/placeholder-data.ts.
-- NÃ£o tem `updated_at`: atividades sÃ£o registros imutÃ¡veis do histÃ³rico.
-- =====================================================================

create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- Atividade pertence a um lead; se o lead sai, a timeline vai junto.
  lead_id      uuid not null references public.leads (id) on delete cascade,
  type         text not null check (type in ('call', 'email', 'meeting', 'note')),
  description  text not null check (char_length(trim(description)) between 1 and 2000),
  -- Autor do registro. Preservamos a atividade se o usuÃ¡rio for removido.
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
-- Milestone 8 â€” MonetizaÃ§Ã£o (Stripe): estado de assinatura por workspace
-- =====================================================================
-- Tabela `subscriptions` (1:1 com workspace) â€” fonte de verdade do billing.
--
-- Depende de: 20260713090000_workspaces_and_members.sql.
-- Idempotente: seguro reexecutar no SQL Editor.
--
-- SEGURANÃ‡A: membros sÃ³ PODEM LER a assinatura do prÃ³prio workspace. Toda
-- ESCRITA vem do webhook do Stripe usando a SERVICE_ROLE_KEY, que ignora o RLS.
-- Por isso NÃƒO hÃ¡ policy de insert/update/delete para `authenticated` â€” o
-- default (deny) jÃ¡ bloqueia o cliente de forjar o plano.
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

-- Sem policies de escrita de propÃ³sito: apenas a service_role (webhook) escreve.
grant select on public.subscriptions to authenticated;

