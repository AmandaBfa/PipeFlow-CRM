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
- [~] `supabase/` inicializado (config + migration inicial vazia + seed) — **falta criar o projeto na nuvem** (requer login Supabase)
- [x] `git init` + commits + branch `feat/project-setup` + **merge na `main`** + **push para o GitHub** (`AmandaBfa/PipeFlow-CRM`)

**Aceite:** ✅ `pnpm dev` sobe sem erros; `pnpm lint` e `pnpm typecheck` passam; `pnpm build` OK; página inicial renderiza com a fonte Inter e cores do tema.

---

## Milestone 1 — Autenticação & Shell do App

**Objetivo:** usuário cria conta, faz login e vê o layout do dashboard vazio.

- [ ] Clients Supabase: `lib/supabase/{server,client,middleware}.ts` (padrão `@supabase/ssr`)
- [ ] `middleware.ts` fazendo refresh de sessão
- [~] Route groups `(auth)` — telas de **login, cadastro e recuperação de senha** prontas (UI + validação Zod + loading + erros); **callback é stub** e a autenticação real (Supabase) entra na próxima aula
- [~] Route group `(dashboard)` — criado com o layout do shell; **falta a proteção** (redirect de não autenticado para `/login`)
- [x] Layout do dashboard: sidebar (com workspace switcher) + barra superior + área de conteúdo
- [~] Logout — item "Sair" leva ao `/login` (placeholder; logout real com Supabase na próxima aula)

**Aceite:** signup → recebe sessão → acessa `/dashboard`; deslogado é bloqueado nas rotas privadas.

> **Aula 2.1 — Design System & App Shell (concluída):** shell responsivo com sidebar fixa (desktop) + drawer hambúrguer (mobile via `Sheet`), barra superior com título da seção e alternador de tema, **dark mode como padrão** (next-themes), seletor de workspace com dados fake sincronizado entre desktop/mobile via `WorkspaceProvider`, e páginas placeholder (`/dashboard`, `/leads`, `/pipeline`, `/settings`) com empty states. Base reutilizável adicionada: `sheet`, `separator`, `skeleton`, `tooltip`, `ThemeToggle`, `PageHeader`, `EmptyState`. Verificado com `typecheck`/`lint`/`build` + smoke test. **Falta só a autenticação** para fechar o Milestone 1.

> **Aula 2.2 — Auth & Onboarding UI (concluída):** grupo de rotas `(auth)` com layout split-screen (painel de marca + formulário) e telas de **login**, **cadastro** e **recuperação de senha** — todas com **validação Zod por campo**, **loading** nos botões (`useFormStatus`), mensagens de erro e **botões sociais** (Google/GitHub, só UI). Fluxo de **onboarding** em passos (grupo `(onboarding)`): boas-vindas → **nomear o workspace** → convite (opcional) → `/dashboard`. Navegação **fake** por ora — login → `/dashboard`, cadastro → `/onboarding`, sem checar credenciais; a autenticação real do Supabase apenas troca as Server Actions em `lib/actions/auth.ts` (marcadas com `TODO(auth)`). Base adicionada: shadcn `checkbox` e componentes `auth/*`. Verificado com `typecheck`/`lint`/`build` + **teste E2E** (Playwright/Edge) dos 4 fluxos, cobrindo validação, loading, erros e redirects.

---

## Milestone 2 — Multi-empresa (Workspaces) & RLS

**Objetivo:** fundação multi-tenant. Todo dado passa a pertencer a um workspace.

- [ ] Migration: `workspaces`, `workspace_members` (`role`: admin|member)
- [ ] Trigger/Server Action: ao criar usuário, criar workspace pessoal e vincular como `admin`
- [ ] **Policies RLS** em `workspaces`/`workspace_members` (usuário só vê workspaces onde é membro)
- [ ] Helper `getCurrentWorkspace()` (server) — resolve workspace ativo (cookie/preferência)
- [ ] Workspace switcher funcional no topo da sidebar
- [ ] Gerar `src/types/database.types.ts`

**Aceite:** dois usuários distintos não enxergam os dados um do outro; troca de workspace altera o contexto. **Este milestone define o padrão de RLS reaproveitado em todas as tabelas seguintes.**

---

## Milestone 3 — Leads & Contatos

**Objetivo:** CRUD completo de leads com busca e filtros.

- [ ] Migration `leads` (name, email, phone, company, position, status, owner_id, workspace_id) + RLS por `workspace_id`
- [x] Schemas Zod em `lib/validations/lead.ts` (`leadSchema`) + enum de status em `lib/lead-status.ts` (`new`/`contacted`/`qualified`/`unqualified`/`converted`)
- [~] Server Actions: create / update / delete lead — **fake em memória** (`LeadsProvider`) na aula 2.3; viram Server Actions do Supabase (marcado com `TODO(leads)`)
- [~] Lista de leads (`table` shadcn) com busca (nome/e-mail/empresa) ✅ e filtros por status e responsável ✅ — **falta filtro por data**
- [x] Formulário de criação/edição (**dialog**) com validação Zod, loading e erros por campo
- [x] Página de detalhe do lead (perfil + **timeline de atividades visual**, adiantada do Milestone 5)

**Aceite:** criar, editar, filtrar e excluir leads; dados isolados por workspace.

> **Aula 2.3 — Gestão de Leads UI (concluída):** UI completa de leads com **dados fake em memória** (`LeadsProvider`): lista em `table` com **busca** (nome/empresa/e-mail) e **filtros** (status, responsável), **badges coloridos por status** (`lead-status-badge`), CRUD via **dialog** (criar/editar/excluir) com validação **Zod** + loading + erros por campo, e **página de detalhe** (`/leads/[id]`) com card de contato e **timeline de atividades visual** (mock). ~13 leads brasileiros semente. Adicionado shadcn `select`; `FieldError`/`FormMessage` movidos para `components/form-messages.tsx` (compartilhado). A persistência real (migration `leads` + RLS + Server Actions) troca as mutações do provider (marcadas com `TODO(leads)`) pelo Supabase. Verificado com `typecheck`/`lint`/`build` + **teste E2E** (13/13).

---

## Milestone 4 — Pipeline Kanban de Vendas

**Objetivo:** board de negócios com drag-and-drop persistido.

- [ ] Migration `deals` (title, value, stage, lead_id, owner_id, due_date, workspace_id) + RLS
- [x] Enum de etapas: `new_lead → contacted → proposal_sent → negotiation → won → lost` (`lib/deal-stage.ts`)
- [x] Board com @dnd-kit: colunas por etapa, cards arrastáveis (`"use client"`)
- [x] Card: título, valor (R$), lead vinculado, responsável, prazo
- [~] Persistir mudança de etapa — **update otimista em memória** (`moveDeal`) na aula 2.4; Server Action real (Supabase) marcada com `TODO(deals)`
- [x] Criar/editar negócio a partir do board

**Aceite:** arrastar card entre colunas atualiza a etapa no banco e sobrevive a reload.

> **Aula 2.4 — Pipeline Kanban UI (concluída):** board Kanban de negócios com **dados fake em memória** (`DealsProvider`): **6 colunas por etapa** (`lib/deal-stage.ts`) com cor própria, contagem e **total em R$** por coluna; **cards arrastáveis** (@dnd-kit: `DndContext` + `useDroppable`/`useDraggable` + `DragOverlay`) com título, valor, lead/empresa, responsável e prazo; **drag-and-drop entre colunas** com update otimista + toast; CRUD via **dialog** (criar/editar/excluir, validação Zod); **busca** por título + **filtro** por responsável; 12 negócios semente. Polimento coeso (glass leve, cor por etapa, stagger, `prefers-reduced-motion`) mantendo Índigo/slate/Inter. Ajustes: `content` do Tailwind inclui `src/lib`; `formatCurrency`/`formatDueDate`. A persistência real (migration `deals` + RLS + Server Actions) fica marcada com `TODO(deals)`. Verificado com `typecheck`/`lint`/`build` + **teste E2E** (12/12, incluindo os totais atualizando no criar e no drag).

---

## Milestone 5 — Registro de Atividades (Timeline)

**Objetivo:** histórico cronológico de interações por lead.

- [ ] Migration `activities` (type: call|email|meeting|note, description, author_id, lead_id, created_at) + RLS
- [ ] Server Action para registrar atividade
- [x] Timeline na página de detalhe do lead (ordem cronológica, ícone por tipo) — **UI feita na aula 2.3** com dados mock (`ActivityTimeline`)
- [ ] Formulário rápido de nova atividade

**Aceite:** registrar diferentes tipos de atividade e vê-las na timeline do lead correto.

> **Parcial (adiantado na aula 2.3 — Leads UI):** a **timeline de atividades** já existe na página de detalhe do lead (`/leads/[id]`) — componente `ActivityTimeline` com ordem cronológica e **ícone + cor por tipo** (ligação/e-mail/reunião/nota), autor e data, a partir de dados mock (`placeholderActivities`/`getActivitiesForLead` em `lib/placeholder-data.ts`). **Falta** (pós-Supabase): migration `activities` + RLS, **Server Action** para registrar atividade, e o **formulário rápido** de nova atividade — a timeline hoje é só leitura.

---

## Milestone 6 — Dashboard de Métricas

**Objetivo:** visão gerencial de vendas.

- [ ] Cards: total de leads, negócios abertos, valor total do pipeline, taxa de conversão (queries agregadas no server)
- [ ] Gráfico de funil de vendas com **Recharts**
- [ ] Lista de negócios do usuário logado com prazo próximo
- [ ] Skeletons de loading

**Aceite:** números batem com os dados do workspace; funil reflete a distribuição por etapa.

---

## Milestone 7 — Colaboração & Convites

**Objetivo:** admin convida colaboradores por e-mail.

- [ ] Migration `invitations` (email, token, role, expires_at, workspace_id) + RLS
- [ ] Envio de convite via **Resend** (Server Action) com link tokenizado
- [ ] Fluxo de aceite: usuário autenticado vira `workspace_member`
- [ ] Tela de gestão de membros (`settings`): listar, alterar papel, remover — **restrito a admin**
- [ ] Enforcement de papéis: `member` acessa leads/deals; ações de billing/membros só `admin`

**Aceite:** convite chega por e-mail, é aceito e o novo membro passa a ver os dados do workspace com o papel correto.

---

## Milestone 8 — Monetização (Stripe)

**Objetivo:** planos Free/Pro com billing automatizado.

- [ ] Produtos/preços no Stripe (Pro R$49/mês); `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- [ ] Colunas de plano em `workspaces` (plan, stripe_customer_id, stripe_subscription_id, status)
- [ ] Route Handler `api/stripe/checkout` → Stripe Checkout
- [ ] Route Handler `api/stripe/webhook` → ativa/desativa plano (verificar assinatura do webhook)
- [ ] Customer Portal para gerenciar assinatura
- [ ] **Enforcement dos limites do Free no server:** máx. 2 membros e 50 leads (bloquear criação além do limite)

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
- Regerar `database.types.ts` após cada migration.
