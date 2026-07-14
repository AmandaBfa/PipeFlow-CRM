import { z } from "zod";

import { ACTIVITY_TYPES } from "@/lib/activity-type";

// Validação do formulário rápido de atividade (timeline do lead).
export const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  description: z
    .string()
    .trim()
    .min(1, "Descreva a atividade")
    .max(2000, "Máximo de 2000 caracteres"),
});

export type ActivityInput = z.infer<typeof activitySchema>;
