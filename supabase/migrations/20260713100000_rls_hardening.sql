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
