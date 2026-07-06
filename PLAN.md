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
- [~] `git init` + primeiro commit + branch `feat/project-setup` — **falta o repositório no GitHub** (requer `gh`/login)

**Aceite:** ✅ `pnpm dev` sobe sem erros; `pnpm lint` e `pnpm typecheck` passam; `pnpm build` OK; página inicial renderiza com a fonte Inter e cores do tema.

---

## Milestone 1 — Autenticação & Shell do App

**Objetivo:** usuário cria conta, faz login e vê o layout do dashboard vazio.

- [ ] Clients Supabase: `lib/supabase/{server,client,middleware}.ts` (padrão `@supabase/ssr`)
- [ ] `middleware.ts` fazendo refresh de sessão
- [ ] Route groups `(auth)` — signup, login, callback OAuth/e-mail
- [ ] Route group `(dashboard)` protegido — redireciona não autenticado para `/login`
- [ ] Layout do dashboard: sidebar (placeholder do workspace switcher) + área de conteúdo
- [ ] Logout

**Aceite:** signup → recebe sessão → acessa `/dashboard`; deslogado é bloqueado nas rotas privadas.

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
- [ ] Schemas Zod em `lib/validations/lead.ts`
- [ ] Server Actions: create / update / delete lead
- [ ] Lista de leads (`table` shadcn) com busca (nome/e-mail/empresa) e filtros (status, responsável, data)
- [ ] Formulário de criação/edição (dialog ou página)
- [ ] Página de detalhe do lead (perfil; timeline entra no Milestone 5)

**Aceite:** criar, editar, filtrar e excluir leads; dados isolados por workspace.

---

## Milestone 4 — Pipeline Kanban de Vendas

**Objetivo:** board de negócios com drag-and-drop persistido.

- [ ] Migration `deals` (title, value, stage, lead_id, owner_id, due_date, workspace_id) + RLS
- [ ] Enum de etapas: `new_lead → contacted → proposal_sent → negotiation → won → lost`
- [ ] Board com @dnd-kit: colunas por etapa, cards arrastáveis (`"use client"`)
- [ ] Card: título, valor (R$), lead vinculado, responsável, prazo
- [ ] Persistir mudança de etapa (Server Action ao soltar o card) com update otimista
- [ ] Criar/editar negócio a partir do board

**Aceite:** arrastar card entre colunas atualiza a etapa no banco e sobrevive a reload.

---

## Milestone 5 — Registro de Atividades (Timeline)

**Objetivo:** histórico cronológico de interações por lead.

- [ ] Migration `activities` (type: call|email|meeting|note, description, author_id, lead_id, created_at) + RLS
- [ ] Server Action para registrar atividade
- [ ] Timeline na página de detalhe do lead (ordem cronológica, ícone por tipo)
- [ ] Formulário rápido de nova atividade

**Aceite:** registrar diferentes tipos de atividade e vê-las na timeline do lead correto.

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

- [ ] Route group `(marketing)` — `/` e `/pricing`
- [ ] Seções: Hero, Funcionalidades, Planos e preços, CTA
- [ ] CTAs levam para signup / checkout
- [ ] Responsiva e alinhada à identidade visual

**Aceite:** landing acessível deslogado; CTA leva ao cadastro.

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
