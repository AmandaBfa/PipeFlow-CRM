import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { AddActivityForm } from "@/components/leads/add-activity-form";
import { LeadDetailActions } from "@/components/leads/lead-detail-actions";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { getActivities } from "@/lib/data/activities";
import { getLeadById } from "@/lib/data/leads";
import { formatDate } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { getWorkspaceMembers } from "@/lib/workspace";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [lead, members, activities] = await Promise.all([
    getLeadById(params.id),
    getWorkspaceMembers(),
    getActivities(params.id),
  ]);

  // Lead inexistente ou de outro workspace (o RLS não o retorna).
  if (!lead) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
            Voltar para leads
          </Link>
        </Button>
        <EmptyState
          icon={User}
          title="Lead não encontrado"
          description="Este lead não existe ou foi removido."
        >
          <Button asChild>
            <Link href="/leads">Voltar para a lista</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const owner = members.find((m) => m.id === lead.ownerId);
  const subtitle =
    [lead.position, lead.company].filter(Boolean).join(" · ") || "Sem empresa";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <LeadDetailActions lead={lead} members={members} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {getInitials(lead.name)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {lead.name}
            </h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoRow icon={Mail} label="E-mail" value={lead.email || "—"} />
            <InfoRow icon={Phone} label="Telefone" value={lead.phone || "—"} />
            <InfoRow
              icon={Building2}
              label="Empresa"
              value={lead.company || "—"}
            />
            <InfoRow icon={User} label="Responsável" value={owner?.name ?? "—"} />
            <div className="border-t pt-4 text-xs text-muted-foreground">
              Criado em {formatDate(lead.createdAt)}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Atividades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AddActivityForm leadId={lead.id} />
            <ActivityTimeline activities={activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}
