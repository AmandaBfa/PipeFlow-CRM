---
name: supabase-postgres-best-practices
description: >-
  Boas práticas de Supabase + Postgres para apps Next.js (App Router, @supabase/ssr):
  RLS e policies, funções SECURITY DEFINER, triggers de provisionamento, design de
  schema, migrations idempotentes, autenticação SSR, segurança e performance.
  Use ao criar/revisar migrations SQL, policies de RLS, funções/triggers no Postgres,
  clients Supabase, Server Actions de auth, ou ao endurecer a segurança do banco.
---

# Supabase + Postgres — Boas Práticas

Guia acionável para este stack (Next.js 14 App Router + `@supabase/ssr` + Postgres/Supabase).
**RLS é a fronteira de segurança — assuma que o client é hostil.**

## 1. Row Level Security (RLS)

- **Habilite RLS em TODA tabela do schema `public`** antes de expô-la: `alter table X enable row level security;`. Tabela exposta sem RLS = vazamento.
- **Uma policy por operação** (`select`, `insert`, `update`, `delete`) — mais claro e auditável que uma policy `for all`.
- **Especifique o papel**: `to authenticated` (ou `to anon`) em cada policy. Sem isso, a policy vale para todos os papéis.
- **`using` vs `with check`**: `using` filtra as linhas visíveis/afetadas (SELECT/UPDATE/DELETE); `with check` valida as linhas novas (INSERT/UPDATE). Em UPDATE, defina os dois.
- **Multi-tenant**: filtre por `workspace_id`/`tenant_id` via uma função auxiliar. Nunca confie num `workspace_id` vindo do client — a policy é quem decide.
- **Evite recursão**: uma policy em `T` que consulta `T` entra em recursão infinita (`infinite recursion detected in policy`). Resolva com uma função **`SECURITY DEFINER`** que consulta `T` ignorando o RLS (ver §2).

### Performance de RLS (importante em escala)
- **Envolva `auth.uid()` num subselect**: use `(select auth.uid())` em vez de `auth.uid()` direto. O Postgres avalia o subselect uma vez (initPlan) em vez de por linha. Vale também dentro de funções auxiliares usadas nas policies.
- **Indexe as colunas usadas nas policies** (ex.: `workspace_id`, `user_id`) — a policy vira um filtro em toda query.
- Prefira funções auxiliares `stable` para o Postgres poder cachear o resultado dentro da query.

## 2. Funções & Triggers

- **`SECURITY DEFINER` para bypassar RLS de propósito** (checagens de membresia, provisionamento). Rode como dono; nunca exponha dados que a policy esconderia.
- **SEMPRE fixe o `search_path`** em funções `SECURITY DEFINER`: `set search_path = ''` (e qualifique tudo: `public.tabela`, `auth.uid()`) ou `set search_path = public`. Sem isso, é vetor de sequestro de search_path (o linter aponta `function_search_path_mutable`).
- **Fixe `search_path` também em funções `SECURITY INVOKER`/triggers** simples (ex.: `set_updated_at`) — o advisor do Supabase reclama de qualquer função com search_path mutável.
- Marque a volatilidade certa: `stable` (só lê), `immutable` (puro), `volatile` (default, escreve).
- **Provisionamento no signup**: trigger `after insert on auth.users` chamando uma função `SECURITY DEFINER` que cria as linhas iniciais (workspace pessoal + membro admin). Se a função lançar erro, o signup falha (500) — mantenha-a simples e resiliente.
- **`updated_at` automático**: função `set_updated_at()` + trigger `before update` por tabela.

```sql
create or replace function public.is_workspace_member(ws uuid)
returns boolean language sql security definer stable
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = (select auth.uid())
  );
$$;
```

## 3. Design de Schema

- `snake_case` em tabelas/colunas; PKs `uuid default gen_random_uuid()`.
- Datas em `timestamptz` (nunca `timestamp` sem tz); dinheiro em `numeric`, não `float`.
- **Sempre defina `on delete`** nas FKs: `cascade` (dependente some junto), `set null` (preserva o registro), `restrict` (bloqueia).
- Restrinja domínio com `check (col in (...))` ou enums do Postgres — espelhe os enums do app (ex.: `lead-status.ts`).
- Indexe **toda FK** e as colunas de filtro de RLS/busca.
- Prefira desnormalizar um campo de leitura quente (ex.: `workspaces.plan`) com uma fonte de verdade clara e sincronização explícita.

## 4. Migrations

- **Versionadas e idempotentes**: `create table if not exists`, `create or replace function`, `drop policy if exists` antes de `create policy`, `drop trigger if exists`. Assim é seguro reexecutar no SQL Editor.
- **Uma preocupação por arquivo**, em ordem de dependência (tabelas base → dependentes).
- **Não edite uma migration já aplicada** — crie uma nova (ex.: `..._rls_hardening.sql`).
- **Regenere os tipos** após cada migration: `supabase gen types typescript --linked > src/types/supabase.ts`.
- Confirme a aplicação de verdade (não só "as tabelas existem"): cheque funções/policies/trigger com um script `verify_rls.sql` ou uma sonda REST/RPC.

## 5. Autenticação SSR (@supabase/ssr)

- Dois clients: `client.ts` (browser, singleton) e `server.ts` (servidor, `await cookies()`), ambos com o tipo `Database`.
- **Middleware/proxy** renova a sessão a cada request (`getUser()` dispara o refresh) e protege rotas. **Não confie só no middleware** — revalide `getUser()` também nos layouts/páginas server (defesa em profundidade).
- **`getUser()` (não `getSession()`) no servidor**: `getUser()` revalida o token com o Auth; `getSession()` lê o cookie sem validar.
- Escrita = **Server Actions**; leitura = **Server Components**. Route Handlers só para webhooks/integrações.
- Após login/logout, `revalidatePath("/", "layout")` antes do `redirect`.

## 6. Segurança

- **Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY`/`STRIPE_SECRET_KEY` ao browser. Só `NEXT_PUBLIC_*` vai pro client.
- `service_role` **bypassa RLS** — use apenas no servidor (webhooks), nunca com input não confiável.
- Tabelas escritas só por webhook (ex.: `subscriptions`): dê apenas policy de `select` a `authenticated`; sem policy de escrita, o default nega — só o `service_role` grava.
- Valide todo input com **Zod** antes de tocar o banco.
- No painel do Supabase: ligue **leaked password protection**, confirme **email confirmation** em produção (com SMTP próprio), e revise os provedores OAuth.

## 7. Verificação (checklist antes de dar como pronto)

- [ ] RLS habilitado em todas as tabelas (`pg_class.relrowsecurity`).
- [ ] Policies por operação, com `to authenticated`, cobrindo o isolamento.
- [ ] Funções `SECURITY DEFINER` com `search_path` fixo; `auth.uid()` em subselect.
- [ ] FKs indexadas; `on delete` definido.
- [ ] Trigger de provisionamento testado (signup real cria as linhas).
- [ ] Isolamento testado: dois usuários não veem dados um do outro.
- [ ] Tipos regenerados; `typecheck`/`lint`/`build` verdes.
- [ ] Nenhum segredo server-only vazando pro client.
