import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

// Erro de um campo específico (mostra a primeira mensagem do Zod).
export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-destructive">{errors[0]}</p>;
}

// Mensagem geral do formulário (erro de credenciais, aviso ou sucesso).
export function FormMessage({
  children,
  variant = "error",
}: {
  children: React.ReactNode;
  variant?: "error" | "success";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm",
        variant === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
