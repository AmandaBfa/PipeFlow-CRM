import { z } from "zod";

// Validação do formulário de convite de colaborador.
export const inviteSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  role: z.enum(["admin", "member"]),
});

export type InviteInput = z.infer<typeof inviteSchema>;
