"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";

// Estado retornado pelas Server Actions para os formulários (via useFormState).
export interface AuthFormState {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  success?: boolean;
}

// AULA 3.3 — Auth Real: as actions abaixo falam com o Supabase Auth de verdade.
// A validação de campos continua no Zod; os erros do Supabase viram mensagens PT-BR.

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      message: "E-mail ou senha inválidos. Confira os dados e tente de novo.",
    };
  }

  revalidatePath("/", "layout");
  redirect(safeInternalPath(formData.get("next"), "/dashboard"));
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // `full_name` alimenta o trigger handle_new_user, que nomeia o workspace.
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${appUrl()}/callback`,
    },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return {
        errors: { email: ["Este e-mail já está cadastrado. Tente entrar."] },
      };
    }
    return {
      message: "Não foi possível criar a conta. Tente novamente em instantes.",
    };
  }

  // Com a confirmação de e-mail desligada, o signup já cria a sessão.
  // O trigger provisiona o workspace; o onboarding só renomeia. Se veio de um
  // convite (?next=/invite/...), volta pra lá em vez do onboarding.
  revalidatePath("/", "layout");
  redirect(safeInternalPath(formData.get("next"), "/onboarding"));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
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

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl()}/callback?next=/reset-password`,
  });

  // Sucesso genérico de propósito — não revela se o e-mail existe.
  return {
    success: true,
    message:
      "Se existir uma conta com esse e-mail, enviamos um link de redefinição.",
  };
}

export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      message:
        "Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
