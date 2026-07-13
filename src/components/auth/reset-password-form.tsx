"use client";

import { useFormState } from "react-dom";

import { updatePasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { FormMessage } from "@/components/form-messages";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const initialState: AuthFormState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useFormState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && <FormMessage>{state.message}</FormMessage>}

      <PasswordField
        id="password"
        name="password"
        label="Nova senha"
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

      <SubmitButton className="w-full" pendingText="Salvando...">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
