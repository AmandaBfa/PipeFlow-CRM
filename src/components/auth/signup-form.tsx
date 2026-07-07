"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";
import { FieldError, FormMessage } from "@/components/form-messages";
import { AuthDivider } from "./auth-divider";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction] = useFormState(signUpAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && <FormMessage>{state.message}</FormMessage>}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Seu nome"
          autoComplete="name"
          aria-invalid={state.errors?.name ? true : undefined}
        />
        <FieldError errors={state.errors?.name} />
      </div>

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
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
        errors={state.errors?.password}
        showStrength
      />

      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar senha"
        placeholder="Repita a senha"
        autoComplete="new-password"
        errors={state.errors?.confirmPassword}
      />

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox id="terms" name="terms" className="mt-0.5" />
          <Label
            htmlFor="terms"
            className="font-normal leading-snug text-muted-foreground"
          >
            Concordo com os{" "}
            <Link href="#" className="text-primary hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="#" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            .
          </Label>
        </div>
        <FieldError errors={state.errors?.terms} />
      </div>

      <SubmitButton className="w-full" pendingText="Criando conta...">
        Criar conta
      </SubmitButton>

      <AuthDivider />
      <OAuthButtons />
    </form>
  );
}
