"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { ArrowLeft, MailCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetAction,
  type AuthFormState,
} from "@/lib/actions/auth";
import { FieldError, FormMessage } from "./form-messages";
import { SubmitButton } from "./submit-button";

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(
    requestPasswordResetAction,
    initialState
  );

  // Estado de sucesso: mostra confirmação em vez do formulário.
  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <MailCheck className="h-6 w-6" />
        </div>
        <FormMessage variant="success">{state.message}</FormMessage>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="voce@empresa.com"
          autoComplete="email"
          aria-invalid={state.errors?.email ? true : undefined}
        />
        <FieldError errors={state.errors?.email} />
      </div>

      <SubmitButton className="w-full" pendingText="Enviando...">
        Enviar link de redefinição
      </SubmitButton>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o login
      </Link>
    </form>
  );
}
