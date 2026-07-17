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
