import { z } from "zod";

import { DEAL_STAGES } from "@/lib/deal-stage";

// Validação do formulário de negócio (deal). Reutilizada no client (erros por
// campo) e, no Milestone 4, na Server Action que persiste no Supabase.
// `value` chega como string do input e é convertido por z.coerce.number().
export const dealSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do negócio"),
  value: z.coerce.number().min(0, "Informe um valor válido"),
  stage: z.enum(DEAL_STAGES),
  leadId: z.string().min(1, "Selecione um lead"),
  ownerId: z.string().min(1, "Selecione um responsável"),
  dueDate: z.string().optional(),
});

export type DealInput = z.infer<typeof dealSchema>;
