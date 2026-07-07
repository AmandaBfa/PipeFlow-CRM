import { Mail, Phone, StickyNote, Users, type LucideIcon } from "lucide-react";

import {
  getActivitiesForLead,
  getMember,
  type ActivityType,
} from "@/lib/placeholder-data";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { label: string; icon: LucideIcon; className: string }
> = {
  call: { label: "Ligação", icon: Phone, className: "bg-primary/10 text-primary" },
  email: { label: "E-mail", icon: Mail, className: "bg-warning/15 text-warning" },
  meeting: {
    label: "Reunião",
    icon: Users,
    className: "bg-success/15 text-success",
  },
  note: {
    label: "Nota",
    icon: StickyNote,
    className: "bg-muted text-muted-foreground",
  },
};

// Timeline visual de atividades do lead (dados mockados nesta aula; a tabela
// `activities` real entra no Milestone 5).
export function ActivityTimeline({ leadId }: { leadId: string }) {
  const activities = getActivitiesForLead(leadId);

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma atividade registrada ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-6">
      {activities.map((activity, index) => {
        const config = ACTIVITY_CONFIG[activity.type];
        const Icon = config.icon;
        const author = getMember(activity.authorId);
        const isLast = index === activities.length - 1;

        return (
          <li key={activity.id} className="relative flex gap-4">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-4 top-9 h-[calc(100%-4px)] w-px -translate-x-1/2 bg-border"
              />
            )}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                config.className
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-medium">{config.label}</span>
                <span className="text-muted-foreground">
                  · {author?.name ?? "—"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {activity.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(activity.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
