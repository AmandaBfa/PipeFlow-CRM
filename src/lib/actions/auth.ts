"use server";

import { redirect } from "next/navigation";

import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
} from "@/lib/validations/auth";

// Estado retornado pelas Server Actions para os formulários (via useFormState).
export interface AuthFormState {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  success?: boolean;
}

// AULA 2.2 — Auth & Onboarding UI: fluxo FAKE. A validação de campos é real
// (Zod), mas não há checagem de credenciais nem sessão. A autenticação de
// verdade entra na aula de wiring do Supabase, trocando os TODO(auth) abaixo
// por chamadas ao Supabase Auth.

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // TODO(auth): supabase.auth.signInWithPassword({ email, password })
  redirect("/dashboard");
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms") === "on",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // TODO(auth): supabase.auth.signUp(...) e criação do workspace pessoal (Milestone 2)
  redirect("/onboarding");
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // TODO(auth): supabase.auth.resetPasswordForEmail(email)
  return {
    success: true,
    message:
      "Se existir uma conta com esse e-mail, enviamos um link de redefinição.",
  };
}
