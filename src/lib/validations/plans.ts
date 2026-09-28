import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const planSchema = z.object({
  key: z
    .string()
    .min(2, "Informe pelo menos 2 caracteres.")
    .regex(slugRegex, "Use apenas letras minúsculas, números e hífens."),
  name: z.string().min(2, "Informe o nome do plano."),
  maxMembers: z.number().int().min(0).nullable(),
  maxMiniApps: z.number().int().min(0).nullable(),
  maxProducts: z.number().int().min(0).nullable(),
  price: z.number().min(0, "O preço não pode ser negativo."),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export type PlanValues = z.infer<typeof planSchema>;
