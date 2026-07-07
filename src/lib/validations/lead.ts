import { z } from "zod";

import { LEAD_STATUSES } from "@/lib/lead-status";

// Validação do formulário de lead. Reutilizada no client (erros por campo) e,
// no Milestone 3, na Server Action que persiste no Supabase.
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do lead"),
  email: z.string().trim().email("Informe um e-mail válido"),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  position: z.string().trim().optional(),
  status: z.enum(LEAD_STATUSES),
  ownerId: z.string().min(1, "Selecione um responsável"),
});

export type LeadInput = z.infer<typeof leadSchema>;
