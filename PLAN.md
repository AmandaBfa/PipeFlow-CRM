# PLAN — PipeFlow CRM

> Plano de execução incremental. Contexto de produto em [docs/PRD.md](docs/PRD.md); convenções técnicas em [CLAUDE.md](CLAUDE.md).
> Cada milestone é um incremento **entregável e testável de ponta a ponta**. Só avance quando o anterior estiver funcionando e verificado.

**Legenda:** `[ ]` a fazer · `[~]` em progresso · `[x]` concluído

---

## Milestone 0 — Setup do Projeto

**Objetivo:** repositório rodando local com stack base configurada.

- [x] `create-next-app` (App Router, TypeScript, Tailwind, ESLint, alias `@/`)
- [x] Instalar deps: `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `resend`, `@dnd-kit/core`, `@dnd-kit/sortable`, `recharts`, `zod`, `lucide-react`, `sonner`
- [x] Inicializar shadcn/ui + componentes base (`button`, `input`, `card`, `dialog`, `dropdown-menu`, `table`, `badge`, `avatar`, `sonner`, `label`)
- [x] Configurar tema em `globals.css` (tokens Índigo/slate, dark mode) e fonte Inter via `next/font`
- [x] Criar `.env.local` + `.env.example` com as variáveis do CLAUDE.md
- [x] `supabase/` inicializado (config + migration inicial vazia + seed) + **projeto criado na nuvem** e chaves no `.env.local` (verificadas com `pnpm supabase:check`)
- [x] `git init` + commits + branch `feat/project-setup` + **merge na `main`** + **push para o GitHub** (`AmandaBfa/PipeFlow-CRM`)

**Aceite:** ✅ `pnpm dev` sobe sem erros; `pnpm lint` e `pnpm typecheck` passam; `pnpm build` OK; página inicial renderiza com a fonte Inter e cores do tema.

---

## Milestone 1 — Autenticação & Shell do App

**Objetivo:** usuário cria conta, faz login e vê o layout do dashboard vazio.

- [x] Clients Supabase: `lib/supabase/{server,client}.ts` + `proxy.ts` (padrão `@supabase/ssr`)
- [x] `middleware.ts` fazendo refresh de sessão
- [x] Route groups `(auth)` — login, cadastro, recuperação e **callback real** (`exchangeCodeForSession`); autenticação do Supabase nas Server Actions (aula 3.3)
- [x] Route group `(dashboard)` — **protegido**: middleware (`proxy.ts`) + `getUser()` no layout redirecionam o deslogado para `/login?next=`
- [x] Layout do dashboard: sidebar (com workspace switcher) + barra superior + área de conteúdo
- [x] Logout — "Sair" chama a Server Action `signOutAction` (encerra a sessão do Supabase)

**Aceite:** signup → recebe sessão → acessa `/dashboard`; deslogado é bloqueado nas rotas privadas.

> **Aula 2.1 — Design System & App Shell (concluída):** shell responsivo com sidebar fixa (desktop) + drawer hambúrguer (mobile via `Sheet`), barra superior com título da seção e alternador de tema, **dark mode como padrão** (next-themes), seletor de workspace com dados fake sincronizado entre desktop/mobile via `WorkspaceProvider`, e páginas placeholder (`/dashboard`, `/leads`, `/pipeline`, `/settings`) com empty states. Base reutilizável adicionada: `sheet`, `separator`, `skeleton`, `tooltip`, `ThemeToggle`, `PageHeader`, `EmptyState`. Verificado com `typecheck`/`lint`/`build` + smoke test. **Falta só a autenticação** para fechar o Milestone 1.

> **Aula 2.2 — Auth & Onboarding UI (concluída):** grupo de rotas `(auth)` com layout split-screen (painel de marca + formulário) e telas de **login**, **cadastro** e **recuperação de senha** — todas com **validação Zod por campo**, **loading** nos botões (`useFormStatus`), mensagens de erro e **botões sociais** (Google/GitHub, só UI). Fluxo de **onboarding** em passos (grupo `(onboarding)`): boas-vindas → **nomear o workspace** → convite (opcional) → `/dashboard`. Navegação **fake** por ora — login → `/dashboard`, cadastro → `/onboarding`, sem checar credenciais; a autenticação real do Supabase apenas troca as Server Actions em `lib/actions/auth.ts` (marcadas com `TODO(auth)`). Base adicionada: shadcn `checkbox` e componentes `auth/*`. Verificado com `typecheck`/`lint`/`build` + **teste E2E** (Playwright/Edge) dos 4 fluxos, cobrindo validação, loading, erros e redirects.

> **Aula 3.1 — Setup Supabase & Chaves (concluída):** encanamento do Supabase pronto — **projeto criado na nuvem** e chaves no `.env.local` (gitignored). Clients `@supabase/ssr`: `client.ts` (browser, singleton preguiçoso) e `server.ts` (servidor, `await cookies()`, async); `lib/supabase/middleware.ts` + `src/middleware.ts` fazendo **refresh de sessão** a cada request (com **degradação graciosa**: no-op sem chaves). Leitura das chaves validada com **Zod** (`lib/env.ts`) e placeholder de `database.types.ts` (regerar no M2). Verificador `pnpm supabase:check` confere as 3 chaves + conectividade **sem imprimir valores**. Verificado com `supabase:check` (chaves ✓ + 200) + `typecheck`/`lint`/`build` (middleware compilado) + smoke das rotas. **Falta** para fechar o M1: auth real (login/signup/logout) e proteção de rota — próxima aula.

> **Aula 3.3 — Auth Real & Proteção de Rotas (concluída):** fecha o **Milestone 1**. **Server Actions reais** (`lib/actions/auth.ts`) contra o Supabase Auth: login (`signInWithPassword`), cadastro (`signUp` com `full_name` alimentando o trigger), **logout** (`signOut`), reset e nova senha — erros do Supabase em **PT-BR**. **Callback** real (`exchangeCodeForSession`) + página **/reset-password**. **Proteção de rota em 2 camadas**: `lib/supabase/proxy.ts` (renova a sessão + redireciona deslogado→`/login?next=` e logado→`/dashboard`), importado pelo `middleware.ts`, mais `getUser()` no layout do dashboard (defesa em profundidade). **Onboarding conectado ao banco**: como o trigger já cria o workspace no signup, o passo de nome faz **UPDATE** (via RLS de admin), sem duplicar — fecha junto os pendentes do M2 (`getCurrentWorkspace()` + **switcher com dados reais**, workspace ativo em cookie, identidade real do usuário no menu). Segurança: guard anti **open-redirect** no `?next=` (`safeInternalPath`). Confirmação de e-mail **desligada** no projeto (dev). **Hardening** aplicado (`supabase/migrations/20260713100000_rls_hardening.sql`): `(select auth.uid())` nas funções de RLS (perf) + `search_path` fixo. Verificado ponta a ponta: `typecheck`/`lint`/`build`, proteção via curl, **e2e real** (signup→sessão→trigger cria workspace+admin→RLS isola) e inspeção do catálogo (**21 policies, 4 funções, 5 triggers**, sem órfãos). Skill `.claude/skills/supabase-postgres-best-practices/` criada. Migrations passaram a ser aplicadas **direto na infra via Management API** (token `SUPABASE_ACCESS_TOKEN`). **Falta** (M6 + persistência): Server Actions reais de leads/deals/activities e conectar o dashboard de métricas ao banco.

---

## Milestone 2 — Multi-empresa (Workspaces) & RLS

**Objetivo:** fundação multi-tenant. Todo dado passa a pertencer a um workspace.

- [x] Migration: `workspaces`, `workspace_members` (`role`: admin|member)
- [x] Trigger `handle_new_user`: ao criar usuário, cria workspace pessoal e vincula como `admin`
- [x] **Policies RLS** em `workspaces`/`workspace_members` (usuário só vê workspaces onde é membro), via funções `SECURITY DEFINER` `is_workspace_member`/`is_workspace_admin`
- [x] Helper `getCurrentWorkspace()` (server) — resolve workspace ativo (cookie/preferência) — **aula 3.3**
- [x] Workspace switcher funcional no topo da sidebar (dados reais + troca persistida em cookie) — **aula 3.3**
- [x] Gerar tipos do banco — canônico em `src/types/supabase.ts` (`database.types.ts` re-exporta; clients apontam para `@/types/supabase`)

**Aceite:** dois usuários distintos não enxergam os dados um do outro; troca de workspace altera o contexto. **Este milestone define o padrão de RLS reaproveitado em todas as tabelas seguintes.**

> **Aula 3.2 — Migrations & Segurança RLS (concluída):** primeira leva de schema real no Supabase. **6 migrations** idempotentes em `supabase/migrations/` — `workspaces`, `workspace_members`, `leads`, `deals`, `activities`, `subscriptions` — com **RLS por `workspace_id` em todas**. O isolamento usa funções `SECURITY DEFINER` `is_workspace_member`/`is_workspace_admin` (evitam a **recursão de policy** e servem de gate de admin); trigger `handle_new_user` **provisiona workspace pessoal + admin no signup**; `subscriptions` é **somente-leitura** para o cliente (escrita só via `service_role`, para o webhook do Stripe no M8). Tipos do banco em `src/types/supabase.ts` (canônico, escrito à mão casando com as migrations; `database.types.ts` re-exporta). Extras: `supabase/apply_all.sql` (consolidado p/ colar no SQL Editor) e `supabase/verify_rls.sql` (checagem). **Schema aplicado no projeto da nuvem** via SQL Editor (6 tabelas confirmadas via REST); `typecheck`/`lint`/`build` OK; PR **#7** mergeado. Isso **adiantou** as migrations de M3/M4/M5 e o estado de billing do M8 — mas as **Server Actions reais** (leads/deals/activities) continuam `TODO`. Decisões: `leads.email` ficou `nullable` (o form exige via Zod); `plan` fica em `workspaces` (leitura rápida) **e** em `subscriptions` (fonte de verdade). **Falta** para fechar o M2: `getCurrentWorkspace()` e o **switcher funcional** (aula 3.3).

---

## Milestone 3 — Leads & Contatos

**Objetivo:** CRUD completo de leads com busca e filtros.

- [x] Migration `leads` (name, email, phone, company, position, status, owner_id, workspace_id) + RLS por `workspace_id`
- [x] Schemas Zod em `lib/validations/lead.ts` (`leadSchema`) + enum de status em `lib/lead-status.ts` (`new`/`contacted`/`qualified`/`unqualified`/`converted`)
- [x] Server Actions: create / update / delete lead — **reais no Supabase** (`lib/actions/lead.ts`), com Zod + `revalidatePath` (aula 3.4)
- [~] Lista de leads (`table` shadcn) com **busca e filtros aplicados no banco** (`?q/status/owner` via `searchParams` → SQL) — **falta filtro por data**
- [x] Formulário de criação/edição (**dialog**) com validação Zod, loading e erros por campo
- [x] Página de detalhe do lead (perfil + **timeline de atividades visual**, adiantada do Milestone 5)

**Aceite:** criar, editar, filtrar e excluir leads; dados isolados por workspace.

> **Aula 2.3 — Gestão de Leads UI (concluída):** UI completa de leads com **dados fake em memória** (`LeadsProvider`): lista em `table` com **busca** (nome/empresa/e-mail) e **filtros** (status, responsável), **badges coloridos por status** (`lead-status-badge`), CRUD via **dialog** (criar/editar/excluir) com validação **Zod** + loading + erros por campo, e **página de detalhe** (`/leads/[id]`) com card de contato e **timeline de atividades visual** (mock). ~13 leads brasileiros semente. Adicionado shadcn `select`; `FieldError`/`FormMessage` movidos para `components/form-messages.tsx` (compartilhado). A persistência real (migration `leads` + RLS + Server Actions) troca as mutações do provider (marcadas com `TODO(leads)`) pelo Supabase. Verificado com `typecheck`/`lint`/`build` + **teste E2E** (13/13).

> **Aula 3.4 — Leads & Pipeline com Dados Reais + Atividades (concluída):** substitui **todo dado fake por Supabase** (Server Actions + RLS), fechando os Milestones **3, 4, 5** e o dashboard do **M6**. **Leads:** lista buscada no servidor com **busca e filtros no banco** (`?q/status/owner` via `searchParams` → SQL, busca com debounce); Server Actions `createLead`/`updateLead`/`deleteLead`; página de detalhe virou **Server Component**. **Pipeline:** board buscado no servidor; **drag-and-drop persiste a etapa** (update otimista + `moveDealStage`, revertendo em erro). **Dashboard:** KPIs, funil e prazos próximos por **queries agregadas** (`lib/metrics.ts` assíncrono). **Atividades (M5):** tabela `activities` ligada — **formulário rápido** + timeline do banco (`createActivity`/`getActivities`). Base nova: `lib/data/{leads,deals,activities}`, `lib/actions/{lead,deal,activity,types}`, `getWorkspaceMembers()` (solo por ora), `ui/textarea`, `lib/activity-type`. Arquitetura: **fetch nas páginas** (layouts do Next não recebem `searchParams`), providers hidratados das props; **`placeholder-data.ts` removido** (zero dado fake). Decisões: **responsável = solo** (só o usuário; multi-membro exige `profiles`, pós-M7); **negócio exige um lead** (dica + botão desabilitado em workspace vazio). Verificado: `typecheck`/`lint`/`build` + **e2e fiel** via `@supabase/supabase-js` (criar/persistir, busca/filtro no banco, drag persiste, métricas, isolamento por RLS) + teste no navegador. PR **#10** mergeado.

---

## Milestone 4 — Pipeline Kanban de Vendas

**Objetivo:** board de negócios com drag-and-drop persistido.

- [x] Migration `deals` (title, value, stage, lead_id, owner_id, due_date, workspace_id) + RLS
- [x] Enum de etapas: `new_lead → contacted → proposal_sent → negotiation → won → lost` (`lib/deal-stage.ts`)
- [x] Board com @dnd-kit: colunas por etapa, cards arrastáveis (`"use client"`)
- [x] Card: título, valor (R$), lead vinculado, responsável, prazo
- [x] Persistir mudança de etapa — **update otimista + Server Action** (`moveDealStage`), revertendo em erro; sobrevive a reload (aula 3.4)
- [x] Criar/editar negócio a partir do board

**Aceite:** arrastar card entre colunas atualiza a etapa no banco e sobrevive a reload.

> **Aula 2.4 — Pipeline Kanban UI (concluída):** board Kanban de negócios com **dados fake em memória** (`DealsProvider`): **6 colunas por etapa** (`lib/deal-stage.ts`) com cor própria, contagem e **total em R$** por coluna; **cards arrastáveis** (@dnd-kit: `DndContext` + `useDroppable`/`useDraggable` + `DragOverlay`) com título, valor, lead/empresa, responsável e prazo; **drag-and-drop entre colunas** com update otimista + toast; CRUD via **dialog** (criar/editar/excluir, validação Zod); **busca** por título + **filtro** por responsável; 12 negócios semente. Polimento coeso (glass leve, cor por etapa, stagger, `prefers-reduced-motion`) mantendo Índigo/slate/Inter. Ajustes: `content` do Tailwind inclui `src/lib`; `formatCurrency`/`formatDueDate`. A persistência real (migration `deals` + RLS + Server Actions) fica marcada com `TODO(deals)`. Verificado com `typecheck`/`lint`/`build` + **teste E2E** (12/12, incluindo os totais atualizando no criar e no drag).

---

## Milestone 5 — Registro de Atividades (Timeline)

**Objetivo:** histórico cronológico de interações por lead.

- [x] Migration `activities` (type: call|email|meeting|note, description, author_id, lead_id, created_at) + RLS
- [x] Server Action para registrar atividade (`createActivity`, valida que o lead é do workspace)
- [x] Timeline na página de detalhe do lead (ordem cronológica, ícone por tipo) — **dados reais** do banco (`getActivities`) desde a aula 3.4
- [x] Formulário rápido de nova atividade (tipo + descrição)

**Aceite:** registrar diferentes tipos de atividade e vê-las na timeline do lead correto.

> **Parcial (adiantado na aula 2.3 — Leads UI):** a **timeline de atividades** já existe na página de detalhe do lead (`/leads/[id]`) — componente `ActivityTimeline` com ordem cronológica e **ícone + cor por tipo** (ligação/e-mail/reunião/nota), autor e data, a partir de dados mock (`placeholderActivities`/`getActivitiesForLead` em `lib/placeholder-data.ts`). **Falta** (pós-Supabase): migration `activities` + RLS, **Server Action** para registrar atividade, e o **formulário rápido** de nova atividade — a timeline hoje é só leitura.

---

## Milestone 6 — Dashboard de Métricas

**Objetivo:** visão gerencial de vendas.

- [x] Cards: total de leads, negócios abertos, valor total do pipeline, taxa de conversão (queries agregadas no server) — aula 3.4
- [x] Gráfico de funil de vendas com **Recharts** (UI da aula 2.5, dados reais na 3.4)
- [x] Lista de negócios do usuário logado com prazo próximo (`getUpcomingDeals`)
- [x] Skeletons de loading (`dashboard/loading.tsx`)

**Aceite:** números batem com os dados do workspace; funil reflete a distribuição por etapa.

---

## Milestone 7 — Colaboração & Convites

**Objetivo:** admin convida colaboradores por e-mail.

- [x] Migration `workspace_invites` (email, token, role, expires_at, workspace_id) + RLS + `profiles` (nomes reais dos membros)
- [x] Envio de convite via **Resend** (Server Action) com link tokenizado + **link copiável** de fallback
- [x] Fluxo de aceite: `/invite/[token]` + RPC `accept_invitation` (`SECURITY DEFINER`) — vira `workspace_member`
- [x] Tela de gestão de membros (`settings`): listar, alterar papel, remover + renomear workspace — **restrito a admin**
- [x] Enforcement de papéis: `member` acessa leads/deals; convites/membros/renomear só `admin`

**Aceite:** convite chega por e-mail, é aceito e o novo membro passa a ver os dados do workspace com o papel correto.

> **Aula 3.5 — Workspace & Colaboração (concluída):** fecha o **Milestone 7**. **`profiles`** (espelho de `auth.users`, populado pelo trigger + backfill, RLS de co-membros) destrava os **nomes reais** dos membros. **`workspace_invites`** (convites tokenizados, RLS admin-only) + RPCs `SECURITY DEFINER` `get_invite_by_token` e `accept_invitation` (validam **e-mail/expiração + limite Free**). **Convites** via `inviteMember` (admin-only) com **Resend** (`lib/resend.ts`, remetente de teste `onboarding@resend.dev`) e **link copiável** de fallback. **Aceite** em `/invite/[token]` (rota pública): deslogado entra/cadastra com `?next=`, logado aceita e entra no workspace (cookie ativo). **Settings** com gestão de membros (listar, alterar papel, remover, convites pendentes) + **renomear workspace**, tudo **admin-only** (RLS + gate na UI via `getCurrentMembership`). **Limite do plano Free = 2 membros** enforçado no convite **e** no aceite (adiantado do M8). Guardas: não remover o dono, não ficar sem admin, e-mail do aceite tem que bater. Migrations aplicadas via **Management API**. Verificado: `typecheck`/`lint`/`build` + **e2e real** (convite→aceite→membro vê dados via RLS→papel→**remover**→limite Free) + envio real pelo Resend + inspeção do Studio + teste no navegador (aceite em janela anônima). **Fora de escopo:** criar workspace adicional (RPC), domínio verificado no Resend (produção), e o passo de convite do onboarding segue só-UI.

---

## Milestone 8 — Monetização (Stripe)

**Objetivo:** planos Free/Pro com billing automatizado.

- [ ] Produtos/preços no Stripe (Pro R$49/mês); `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- [~] Estado de billing no banco: coluna `plan` em `workspaces` + tabela `subscriptions` (`stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `plan`, `status`, `current_period_end`, `cancel_at_period_end`) — criadas e com **RLS** na aula 3.2 (escrita restrita à `service_role`). **Falta** o webhook popular/sincronizar
- [ ] Route Handler `api/stripe/checkout` → Stripe Checkout
- [ ] Route Handler `api/stripe/webhook` → ativa/desativa plano (verificar assinatura do webhook)
- [ ] Customer Portal para gerenciar assinatura
- [~] **Enforcement dos limites do Free no server:** **máx. 2 membros** ✅ (convite + aceite, aula 3.5); **falta** o limite de 50 leads

**Aceite:** upgrade via Checkout ativa o Pro pelo webhook; limites do Free impedem a criação excedente; portal cancela/gerencia.

---

## Milestone 9 — Landing Page

**Objetivo:** página pública de apresentação.

- [x] Route group `(marketing)` — `/` e `/pricing`
- [x] Seções: Hero, Funcionalidades, Planos e preços, CTA
- [x] CTAs levam para signup / checkout <!-- signup ligado; checkout do Pro fica p/ o Stripe (M8, TODO) -->
- [x] Responsiva e alinhada à identidade visual

**Aceite:** landing acessível deslogado; CTA leva ao cadastro. ✅ (UI — aula 2.6)

---

## Milestone 10 — Onboarding & Polimento

**Objetivo:** primeira experiência e refino final.

- [ ] Fluxo de primeiro acesso (nomear workspace, dica de criar o primeiro lead/deal)
- [ ] Empty states em todas as telas
- [ ] Toasts de feedback (`sonner`) e tratamento de erros
- [ ] Revisão de responsividade, acessibilidade e dark mode
- [ ] README com setup e deploy

**Aceite:** novo usuário consegue ir do signup ao primeiro negócio no pipeline sem travar.

---

## Deploy

- [ ] Migrations aplicadas no Supabase de produção
- [ ] Variáveis de ambiente na Vercel (prod)
- [ ] Webhook do Stripe apontando para a URL de produção
- [ ] Domínio do Resend verificado
- [ ] Deploy na Vercel + smoke test do fluxo completo

---

## Notas de Execução

- **RLS é a fronteira de segurança** — cada nova tabela precisa de policies filtrando por `workspace_id` antes de expor qualquer dado.
- **Server-first:** leitura em Server Components, escrita em Server Actions; `"use client"` só onde há interação (Kanban, formulários).
- **Validar com Zod** todo input antes de tocar o banco.
- **Testar cada milestone** (fluxo real no navegador) antes de iniciar o próximo.
- Regerar os tipos do banco (`src/types/supabase.ts`, canônico) após cada migration — via `supabase gen types typescript` quando a CLI estiver instalada.
