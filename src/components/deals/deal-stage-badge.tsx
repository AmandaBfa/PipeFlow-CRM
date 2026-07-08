import { Badge } from "@/components/ui/badge";
import { DEAL_STAGE_CONFIG, type DealStage } from "@/lib/deal-stage";
import { cn } from "@/lib/utils";

// Badge colorido da etapa do negócio (cor definida em DEAL_STAGE_CONFIG).
export function DealStageBadge({
  stage,
  className,
}: {
  stage: DealStage;
  className?: string;
}) {
  const config = DEAL_STAGE_CONFIG[stage];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", config.badgeClassName, className)}
    >
      {config.label}
    </Badge>
  );
}
