"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends ButtonProps {
  // Texto opcional exibido enquanto a ação está pendente.
  pendingText?: string;
}

// Botão de submit que reflete o estado pendente da Server Action do <form>
// (spinner + desabilita) usando useFormStatus.
export function SubmitButton({
  children,
  pendingText,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" {...props} disabled={pending || props.disabled}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
