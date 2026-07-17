# PipeFlow CRM — Briefing do Projeto

> Guia de contexto para o Claude Code. O PRD completo está em [docs/PRD.md](docs/PRD.md).
> Escreva **prosa e comentários em Português (BR)**; **identificadores de código, nomes de arquivos, tabelas e commits em inglês**.

---

## 1. O que é

SaaS de CRM de vendas **multi-empresa (multi-tenant)** para PMEs, freelancers e times comerciais. Foco em simplicidade: gerenciar leads, mover negócios por um **pipeline Kanban** visual e registrar interações — sem a complexidade de HubSpot/Pipedrive.

Diferenciais: pipeline drag-and-drop, isolamento de dados por workspace via **RLS**, e monetização freemium via Stripe.

## 2. Stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript 5 (strict)
- **Estilo:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Backend:** Next.js Route Handlers + Server Actions
- **DB + Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth)
- **Pagamento:** Stripe (Checkout + Webhooks + Customer Portal)
- **E-mail:** Resend (convites de colaboradores)
- **Drag-and-drop:** @dnd-kit
- **Gráficos:** Recharts
- **Deploy:** Vercel (app) + Supabase (DB)
- **Gerenciador de pacotes:** pnpm (padrão do projeto)

## 3. Estrutura de Pastas

```
pipeflow-crm/
├─ docs/                    # PRD e documentação
├─ public/                  # assets estáticos
├─ supabase/
│  ├─ migrations/           # SQL versionado (schema + policies RLS)
│  └─ seed.sql              # dados de exemplo p/ dev
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/       # landing page pública (/, /pricing)
│  │  ├─ (auth)/            # login, signup, callback
│  │  ├─ (dashboard)/       # app autenticado
│  │  │  ├─ leads/          # lista + detalhe do lead (timeline)
│  │  │  ├─ pipeline/       # Kanban de negócios (deals)
│  │  │  ├─ dashboard/      # métricas + funil (Recharts)
│  │  │  ├─ settings/       # workspace, membros, billing
│  │  │  └─ layout.tsx      # sidebar + workspace switcher
│  │  ├─ invite/[token]/    # aceite de convite (rota pública)
│  │  ├─ api/
│  │  │  └─ webhooks/stripe/ # webhook do Stripe — ÚNICO route handler
│  │  ├─ layout.tsx         # root layout (fontes, providers)
│  │  └─ globals.css        # Tailwind + tokens de tema
│  ├─ components/
│  │  ├─ ui/                # componentes shadcn/ui (gerados)
│  │  └─ <feature>/         # componentes por domínio (leads, pipeline...)
│  ├─ lib/
│  │  ├─ supabase/          # server.ts, client.ts, proxy.ts, admin.ts
│  │  ├─ actions/           # Server Actions (auth, lead, deal, member, billing…)
│  │  ├─ data/              # leitura server-side (leads, deals, activities…)
│  │  ├─ validations/       # schemas Zod
│  │  ├─ stripe.ts          # client Stripe (somente-servidor)
│  │  ├─ resend.ts          # e-mail de convites
│  │  └─ utils.ts           # cn() e helpers
│  ├─ hooks/                # React hooks client-side
│  ├─ types/                # tipos globais + supabase.ts (tipos do banco)
│  └─ middleware.ts         # refresh de sessão + proteção de rota (lib/supabase/proxy.ts)
├─ .env.local               # segredos (nunca commitar)
└─ CLAUDE.md
```

## 4. Convenções de Código

- **Server Components por padrão.** Use `"use client"` só quando precisar de estado/eventos/hooks (ex.: board do Kanban, formulários interativos).
- **Data fetching / mutations:** preferir **Server Components** para leitura e **Server Actions** para escrita. Route Handlers (`api/`) só para webhooks e integrações externas.
- **Nomenclatura:**
  - Componentes: `PascalCase` (`LeadCard.tsx`, `PipelineBoard.tsx`)
  - Funções/variáveis: `camelCase`; hooks: `useX`
  - Arquivos utilitários e rotas: `kebab-case`
  - Tabelas e colunas no Postgres: `snake_case`
- **Tipos:** `interface` para props e modelos de dados; `type` para unions/utilitários. Evitar `any`. Gerar tipos do banco com `supabase gen types typescript`.
- **Validação:** todo input de formulário/API validado com **Zod** antes de tocar o banco.
- **Imports:** usar alias `@/` (ex.: `@/lib/supabase/server`).
- **UI:** compor com shadcn/ui; nunca editar `components/ui/*` à mão sem necessidade — reinstalar/estender. Usar `cn()` para classes condicionais.
- **Nada de segredos no client.** Só `NEXT_PUBLIC_*` chega ao browser. `SUPABASE_SERVICE_ROLE_KEY` e `STRIPE_SECRET_KEY` ficam no servidor.

## 5. Modelo de Dados (essencial)

Tabelas principais (todas em `snake_case`; quase todas com `workspace_id` para
isolamento — `profiles` é por usuário):

- `profiles` — espelho de `auth.users` (full_name, email, avatar_url); o client não lê `auth.users`, então é daqui que vêm os nomes dos membros
- `workspaces` — empresa/time (name, `plan` `free`|`pro` **efetivo**, owner_id)
- `workspace_members` — junção user↔workspace com `role` (`admin` | `member`)
- `workspace_invites` — convites por e-mail pendentes (email, role, token, expires_at, invited_by)
- `subscriptions` — billing do Stripe, 1:1 com o workspace (stripe_customer_id, stripe_subscription_id, stripe_price_id, plan, status, current_period_end, cancel_at_period_end)
- `leads` — nome, email, phone, company, position, status, owner_id, workspace_id
- `deals` — title, value, stage, lead_id, owner_id, due_date, workspace_id
- `activities` — type (`call`|`email`|`meeting`|`note`), description, author_id, lead_id, created_at

> **Plano:** `workspaces.plan` é o plano **efetivo** (leitura rápida para checar
> limites); `subscriptions` é a **fonte de verdade** do billing. O webhook do
> Stripe sincroniza os dois.

**Regras de negócio-chave:**

- **Etapas do pipeline (`deals.stage`):** `new_lead` → `contacted` → `proposal_sent` → `negotiation` → `won` / `lost`.
- **RLS obrigatório:** toda tabela filtra por membresia no `workspace_id` do usuário. Nenhuma query confia no client — as policies são a fronteira de segurança.
- **Limites do plano Free:** máx. 2 membros e 50 leads por workspace. Plano Pro: ilimitado. Enforçar no server (Server Action/policy), não só na UI.

## 6. Identidade Visual

Tom: **limpo, moderno, focado em vendas.** Inspiração em Pipedrive (clareza do Kanban) com paleta própria de SaaS confiável.

### Cores (tokens Tailwind / CSS variables)

- **Primária (Índigo):** `indigo-600 (#4F46E5)` — ações, links, destaque de marca
- **Neutros:** escala `slate` (fundos, bordas, texto) — `slate-50` fundo, `slate-900` texto
- **Semânticas de pipeline/estado:**
  - Ganho / sucesso: `emerald-500 (#10B981)`
  - Perdido / erro: `red-500 (#EF4444)`
  - Atenção / prazo próximo: `amber-500 (#F59E0B)`
  - Info / em andamento: `indigo-500`
- **Etapas do Kanban:** cada coluna tem uma cor de header sutil (cinza → índigo → âmbar → esmeralda/vermelho ao chegar em ganho/perdido).

Definir como CSS variables em `globals.css` seguindo o padrão de theming do shadcn/ui (`--primary`, `--background`, etc.), com suporte a dark mode.

### Tipografia

- **Fonte:** Inter (via `next/font`), pesos 400/500/600/700
- Títulos: `font-semibold`, tracking levemente apertado; corpo: `font-normal`

### Componentes & layout

- **Cards** com `rounded-lg`, borda `slate-200`, sombra sutil (`shadow-sm`)
- Espaçamento generoso; densidade de informação alta mas respirável (referência Pipedrive)
- **Sidebar** fixa à esquerda com workspace switcher no topo
- Ícones: **lucide-react** (já vem com shadcn/ui)
- Estados de loading com skeletons; feedback de ações com toasts (`sonner`)

## 7. Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## 8. Comandos

> A definir quando o projeto for inicializado (`create-next-app`). Convenção esperada:

- `pnpm dev` — servidor de desenvolvimento
- `pnpm build` / `pnpm start` — build e produção
- `pnpm lint` — ESLint
- `pnpm typecheck` — `tsc --noEmit`
- `supabase db push` — aplicar migrations
- `supabase gen types typescript --local > src/types/database.types.ts` — regerar tipos

## 9. Roadmap de Milestones

Construir em incrementos entregáveis, testando cada etapa antes de avançar:

1. **Setup & Auth** — Next.js + Supabase, login/signup, layout do dashboard
2. **Workspaces multi-empresa** — criação, RLS, workspace switcher
3. **Leads** — CRUD, lista com busca/filtros, página de detalhe
4. **Pipeline Kanban** — board @dnd-kit, deals, drag-and-drop persistido
5. **Atividades** — timeline por lead (ligação/e-mail/reunião/nota)
6. **Dashboard** — métricas + funil (Recharts)
7. **Colaboração** — convites por e-mail (Resend), papéis admin/member
8. **Monetização** — Stripe Checkout, webhook, Customer Portal, limites de plano
9. **Landing page** — hero, funcionalidades, pricing, CTA
10. **Onboarding & polish** — fluxo de primeiro acesso, refino de UX

## 10. Princípios ao Codar Neste Projeto

- **Segurança primeiro:** todo dado passa por RLS filtrando `workspace_id`. Assuma que o client é hostil.
- **Simplicidade > features:** o produto ganha por ser mais simples que HubSpot/Pipedrive. Não adicione complexidade sem necessidade.
- **Reuse antes de criar:** aproveite componentes shadcn/ui e helpers de `lib/` existentes.
- **Server-first:** minimize `"use client"`; mantenha lógica sensível no servidor.
- **Entregas incrementais:** cada milestone deve funcionar de ponta a ponta antes do próximo.
