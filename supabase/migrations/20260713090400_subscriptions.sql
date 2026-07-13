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
