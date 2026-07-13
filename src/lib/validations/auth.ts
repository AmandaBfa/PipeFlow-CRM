import { z } from "zod";

// Schemas de validação das telas de autenticação. Reutilizados no client
// (mensagens de erro por campo) e no server (Server Actions).

// Regras da senha usadas no cadastro: 8+ caracteres, com letra e número.
const passwordSchema = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres")
  .regex(/[A-Za-z]/, "Inclua ao menos uma letra")
  .regex(/[0-9]/, "Inclua ao menos um número");

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
  remember: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome"),
    email: z.string().email("Informe um e-mail válido"),
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z
      .boolean()
      .refine((value) => value === true, "Você precisa aceitar os termos"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

// Redefinição de senha (após o link de recuperação). Reusa as regras da senha.
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
