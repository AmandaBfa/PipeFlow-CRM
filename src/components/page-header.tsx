import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  // Ações à direita (ex.: botão "Novo lead").
  children?: React.ReactNode;
  className?: string;
}

// Cabeçalho de página reutilizável: título, descrição e slot de ações.
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
