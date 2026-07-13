-- =====================================================================
-- Verificação pós-apply (rodar no SQL Editor depois do apply_all.sql)
-- =====================================================================
-- Confere que o schema + a segurança RLS ficaram no estado esperado.
-- Rode cada bloco (ou tudo de uma vez) e confira os resultados.
-- =====================================================================

-- 1) RLS habilitado nas 6 tabelas? (rls_on deve ser TRUE em todas)
select relname as tabela, relrowsecurity as rls_on
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'workspaces', 'workspace_members', 'leads', 'deals', 'activities', 'subscriptions'
  )
order by relname;

-- 2) Policies por tabela
--    Esperado: workspaces=4, workspace_members=4, leads=4, deals=4,
--              activities=4, subscriptions=1 (só SELECT).
select tablename, count(*) as policies
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

-- 3) Funções auxiliares SECURITY DEFINER (security_definer deve ser TRUE)
select proname, prosecdef as security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_workspace_member', 'is_workspace_admin', 'handle_new_user', 'set_updated_at')
order by proname;

-- 4) Trigger de provisionamento no signup
--    Esperado: on_auth_user_created em auth.users
select tgname, tgrelid::regclass as tabela
from pg_trigger
where tgname = 'on_auth_user_created';

-- =====================================================================
-- 5) (Opcional) Teste real de isolamento RLS
-- =====================================================================
-- O SQL Editor roda como um papel privilegiado que IGNORA o RLS. Para testar
-- o isolamento de verdade, simule um usuário autenticado. Requer 2 usuários
-- já criados (via signup no app ou em Authentication > Users no dashboard).
-- Troque os UUIDs abaixo pelos reais.
--
-- begin;
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<UUID_DO_USUARIO_A>","role":"authenticated"}';
--   -- Deve retornar SÓ os workspaces do usuário A:
--   select id, name from public.workspaces;
-- rollback;
--
-- begin;
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<UUID_DO_USUARIO_B>","role":"authenticated"}';
--   -- Deve retornar SÓ os workspaces do usuário B (nenhum do A):
--   select id, name from public.workspaces;
-- rollback;
