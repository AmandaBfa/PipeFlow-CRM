"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthFormState } from "@/lib/actions/auth";
import { FieldError, FormMessage } from "@/components/form-messages";
import { AuthDivider } from "./auth-divider";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {/* Destino pós-login preservado pelo middleware (?next=). */}
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.message && <FormMessage>{state.message}</FormMessage>}

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

      <PasswordField
        id="password"
        name="password"
        label="Senha"
        placeholder="••••••••"
        autoComplete="current-password"
        errors={state.errors?.password}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id="remember" name="remember" />
          <Label htmlFor="remember" className="font-normal text-muted-foreground">
            Lembrar de mim
          </Label>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <SubmitButton className="w-full" pendingText="Entrando...">
        Entrar
      </SubmitButton>

      <AuthDivider />
      <OAuthButtons />
    </form>
  );
}
