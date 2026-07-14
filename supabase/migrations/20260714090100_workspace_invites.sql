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
