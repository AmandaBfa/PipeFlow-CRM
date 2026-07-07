import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_CONFIG, type LeadStatus } from "@/lib/lead-status";
import { cn } from "@/lib/utils";

// Badge colorido do status do lead (cor definida em LEAD_STATUS_CONFIG).
export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  const config = LEAD_STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", config.badgeClassName, className)}
    >
      {config.label}
    </Badge>
  );
}
