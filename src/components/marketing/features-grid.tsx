import {
  BarChart3,
  Building2,
  KanbanSquare,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Reveal } from "./reveal";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: KanbanSquare,
    title: "Pipeline Kanban visual",
    description:
      "Arraste negócios pelas etapas do funil — do primeiro contato ao fechamento — com atualização instantânea.",
  },
  {
    icon: Users,
    title: "Gestão de leads",
    description:
      "Cadastre, busque e filtre contatos, com uma timeline de atividades por lead em um só lugar.",
  },
  {
    icon: BarChart3,
    title: "Dashboard e funil",
    description:
      "Acompanhe total de leads, valor do pipeline, taxa de conversão e o funil de vendas em tempo real.",
  },
  {
    icon: Building2,
    title: "Multi-empresa",
    description:
      "Cada workspace tem seus dados isolados — segurança por padrão com Row Level Security.",
  },
  {
    icon: UserPlus,
    title: "Colaboração em equipe",
    description:
      "Convide seu time por e-mail e trabalhem juntos no mesmo pipeline, com papéis de acesso.",
  },
  {
    icon: Sparkles,
    title: "Simples que escala",
    description:
      "Comece em minutos, sem a complexidade dos CRMs tradicionais. Do freelancer ao time comercial.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="funcionalidades" className="scroll-mt-20">
      <div className="container py-20 lg:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tudo que seu time precisa para vender mais
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Um CRM completo e enxuto, focado em simplicidade e no que realmente
            move as vendas.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 80}>
              <div className="group h-full rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
