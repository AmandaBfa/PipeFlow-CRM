// Dados fake para o esqueleto visual (aulas 2.1–2.3).
// Serão substituídos por dados reais do Supabase a partir do Milestone 2.

import type { LeadStatus } from "@/lib/lead-status";

export interface PlaceholderWorkspace {
  id: string;
  name: string;
  plan: "free" | "pro";
  // Iniciais exibidas no "avatar" quadrado do workspace.
  initials: string;
}

export const placeholderWorkspaces: PlaceholderWorkspace[] = [
  { id: "ws_1", name: "Acme Vendas", plan: "pro", initials: "AV" },
  { id: "ws_2", name: "Consultoria Silva", plan: "free", initials: "CS" },
  { id: "ws_3", name: "Studio Freela", plan: "free", initials: "SF" },
];

// Workspace ativo (fake). No Milestone 2 vem de cookie/preferência.
export const activeWorkspace: PlaceholderWorkspace = placeholderWorkspaces[0];

// Membros do workspace = possíveis responsáveis (owners) por um lead.
// No Milestone 2/7 viram linhas de `workspace_members`.
export interface PlaceholderMember {
  id: string;
  name: string;
  initials: string;
}

export const placeholderMembers: PlaceholderMember[] = [
  { id: "mem_1", name: "Pedro Lima", initials: "PL" },
  { id: "mem_2", name: "Ana Souza", initials: "AS" },
  { id: "mem_3", name: "Carlos Mendes", initials: "CM" },
  { id: "mem_4", name: "Juliana Costa", initials: "JC" },
];

export function getMember(id: string): PlaceholderMember | undefined {
  return placeholderMembers.find((member) => member.id === id);
}

export interface PlaceholderUser {
  name: string;
  email: string;
  initials: string;
}

// Usuário logado (fake) — corresponde ao membro mem_1.
export const placeholderUser: PlaceholderUser = {
  name: "Pedro Lima",
  email: "pedro@acme.com",
  initials: "PL",
};

export interface PlaceholderLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: LeadStatus;
  ownerId: string;
  // Data de criação (ISO). Vira `created_at` no Postgres.
  createdAt: string;
}

// ~13 leads brasileiros de exemplo, cobrindo todos os status.
export const placeholderLeads: PlaceholderLead[] = [
  {
    id: "lead_1",
    name: "Mariana Oliveira",
    email: "mariana.oliveira@technova.com.br",
    phone: "(11) 98877-1234",
    company: "TechNova Sistemas",
    position: "Diretora de Operações",
    status: "qualified",
    ownerId: "mem_2",
    createdAt: "2026-06-28T09:15:00",
  },
  {
    id: "lead_2",
    name: "Rafael Almeida",
    email: "rafael.almeida@vitalmed.com.br",
    phone: "(21) 99123-4567",
    company: "VitalMed Clínicas",
    position: "Gerente de Compras",
    status: "contacted",
    ownerId: "mem_1",
    createdAt: "2026-07-01T14:20:00",
  },
  {
    id: "lead_3",
    name: "Carla Santos",
    email: "carla.santos@agrobrasil.com",
    phone: "(62) 98111-2020",
    company: "AgroBrasil Cooperativa",
    position: "Compradora",
    status: "new",
    ownerId: "mem_3",
    createdAt: "2026-07-05T10:00:00",
  },
  {
    id: "lead_4",
    name: "Bruno Ferreira",
    email: "bruno.ferreira@constrular.com.br",
    phone: "(31) 98444-7788",
    company: "Constrular Engenharia",
    position: "CEO",
    status: "converted",
    ownerId: "mem_1",
    createdAt: "2026-05-14T08:30:00",
  },
  {
    id: "lead_5",
    name: "Patrícia Gomes",
    email: "patricia.gomes@modabella.com.br",
    phone: "(11) 97666-3311",
    company: "Moda Bella Varejo",
    position: "Head de Marketing",
    status: "contacted",
    ownerId: "mem_4",
    createdAt: "2026-06-30T16:45:00",
  },
  {
    id: "lead_6",
    name: "Thiago Rocha",
    email: "thiago.rocha@logfacil.com",
    phone: "(41) 99555-8899",
    company: "LogFácil Transportes",
    position: "Diretor Comercial",
    status: "qualified",
    ownerId: "mem_2",
    createdAt: "2026-06-20T11:10:00",
  },
  {
    id: "lead_7",
    name: "Fernanda Lima",
    email: "fernanda.lima@edunova.com.br",
    phone: "(85) 98222-4545",
    company: "EduNova Cursos",
    position: "Coordenadora Pedagógica",
    status: "unqualified",
    ownerId: "mem_3",
    createdAt: "2026-06-10T13:00:00",
  },
  {
    id: "lead_8",
    name: "Gustavo Pereira",
    email: "gustavo.pereira@financeflow.com.br",
    phone: "(51) 99888-1212",
    company: "FinanceFlow Consultoria",
    position: "Sócio",
    status: "new",
    ownerId: "mem_1",
    createdAt: "2026-07-06T09:40:00",
  },
  {
    id: "lead_9",
    name: "Aline Barbosa",
    email: "aline.barbosa@petshopamigo.com",
    phone: "(11) 96777-9090",
    company: "Pet Shop Amigo",
    position: "Proprietária",
    status: "contacted",
    ownerId: "mem_4",
    createdAt: "2026-07-02T15:25:00",
  },
  {
    id: "lead_10",
    name: "Rodrigo Martins",
    email: "rodrigo.martins@smartcorp.com.br",
    phone: "(48) 99333-6767",
    company: "SmartCorp TI",
    position: "CTO",
    status: "qualified",
    ownerId: "mem_2",
    createdAt: "2026-06-25T17:30:00",
  },
  {
    id: "lead_11",
    name: "Camila Ribeiro",
    email: "camila.ribeiro@bellezanatural.com.br",
    phone: "(71) 98123-3232",
    company: "Beleza Natural Cosméticos",
    position: "Gerente Geral",
    status: "converted",
    ownerId: "mem_1",
    createdAt: "2026-04-18T09:00:00",
  },
  {
    id: "lead_12",
    name: "Lucas Cardoso",
    email: "lucas.cardoso@newenergy.com.br",
    phone: "(61) 99444-5050",
    company: "NewEnergy Solar",
    position: "Diretor",
    status: "new",
    ownerId: "mem_3",
    createdAt: "2026-07-04T11:55:00",
  },
  {
    id: "lead_13",
    name: "Beatriz Nunes",
    email: "beatriz.nunes@saborcaseiro.com.br",
    phone: "(11) 95555-7878",
    company: "Sabor Caseiro Alimentos",
    position: "Sócia-fundadora",
    status: "unqualified",
    ownerId: "mem_4",
    createdAt: "2026-05-30T10:15:00",
  },
];

// Atividades registradas por lead (timeline). No Milestone 5 viram a tabela
// `activities`. Aqui são estáticas e só ilustram a timeline visual.
export type ActivityType = "call" | "email" | "meeting" | "note";

export interface PlaceholderActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  description: string;
  authorId: string;
  createdAt: string;
}

export const placeholderActivities: PlaceholderActivity[] = [
  // lead_1 — Mariana (qualified)
  {
    id: "act_1",
    leadId: "lead_1",
    type: "note",
    description: "Lead criado a partir de indicação de um cliente atual.",
    authorId: "mem_2",
    createdAt: "2026-06-28T09:15:00",
  },
  {
    id: "act_2",
    leadId: "lead_1",
    type: "call",
    description:
      "Primeira ligação: apresentei o PipeFlow e ela demonstrou interesse no Kanban.",
    authorId: "mem_2",
    createdAt: "2026-06-29T14:30:00",
  },
  {
    id: "act_3",
    leadId: "lead_1",
    type: "email",
    description: "Enviei a proposta comercial e alguns cases de sucesso.",
    authorId: "mem_2",
    createdAt: "2026-07-01T10:05:00",
  },
  {
    id: "act_4",
    leadId: "lead_1",
    type: "meeting",
    description: "Reunião de demonstração agendada para a próxima semana.",
    authorId: "mem_2",
    createdAt: "2026-07-03T16:00:00",
  },
  // lead_2 — Rafael (contacted)
  {
    id: "act_5",
    leadId: "lead_2",
    type: "note",
    description: "Interessado no plano Pro para 5 usuários.",
    authorId: "mem_1",
    createdAt: "2026-07-01T14:25:00",
  },
  {
    id: "act_6",
    leadId: "lead_2",
    type: "call",
    description: "Ligação de qualificação; pediu para retornar em duas semanas.",
    authorId: "mem_1",
    createdAt: "2026-07-02T09:45:00",
  },
  // lead_4 — Bruno (converted)
  {
    id: "act_7",
    leadId: "lead_4",
    type: "note",
    description: "Chegou pelo formulário do site.",
    authorId: "mem_1",
    createdAt: "2026-05-14T08:30:00",
  },
  {
    id: "act_8",
    leadId: "lead_4",
    type: "meeting",
    description: "Demonstração realizada; aprovou a ferramenta.",
    authorId: "mem_1",
    createdAt: "2026-05-20T15:00:00",
  },
  {
    id: "act_9",
    leadId: "lead_4",
    type: "email",
    description: "Contrato assinado e conta ativada no plano Pro.",
    authorId: "mem_1",
    createdAt: "2026-05-25T13:20:00",
  },
  // lead_6 — Thiago (qualified)
  {
    id: "act_10",
    leadId: "lead_6",
    type: "call",
    description: "Contato inicial; gerencia um time de 8 vendedores.",
    authorId: "mem_2",
    createdAt: "2026-06-20T11:10:00",
  },
  {
    id: "act_11",
    leadId: "lead_6",
    type: "email",
    description: "Enviei um comparativo com o Pipedrive.",
    authorId: "mem_2",
    createdAt: "2026-06-22T14:10:00",
  },
  // lead_10 — Rodrigo (qualified)
  {
    id: "act_12",
    leadId: "lead_10",
    type: "meeting",
    description: "Reunião técnica sobre integração via API.",
    authorId: "mem_2",
    createdAt: "2026-06-25T17:30:00",
  },
  {
    id: "act_13",
    leadId: "lead_10",
    type: "note",
    description: "Avaliando internamente; decisão prevista para julho.",
    authorId: "mem_2",
    createdAt: "2026-06-27T09:00:00",
  },
  // lead_11 — Camila (converted)
  {
    id: "act_14",
    leadId: "lead_11",
    type: "note",
    description: "Migrou o controle de vendas de uma planilha para o PipeFlow.",
    authorId: "mem_1",
    createdAt: "2026-04-18T09:00:00",
  },
  {
    id: "act_15",
    leadId: "lead_11",
    type: "email",
    description: "Onboarding concluído com todo o time comercial.",
    authorId: "mem_1",
    createdAt: "2026-04-22T11:30:00",
  },
];

export function getActivitiesForLead(leadId: string): PlaceholderActivity[] {
  return placeholderActivities
    .filter((activity) => activity.leadId === leadId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
