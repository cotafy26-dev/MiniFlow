import { z } from "zod";

export const gamificationLevelSchema = z.object({
  name: z.string().min(2, "Informe o nome do nível."),
  minPoints: z.number().int().min(0, "Não pode ser negativo."),
  sortOrder: z.number().int(),
});
export type GamificationLevelValues = z.infer<typeof gamificationLevelSchema>;

export const badgeSchema = z.object({
  name: z.string().min(2, "Informe o nome do badge."),
  description: z.string().max(500, "Máximo de 500 caracteres.").optional().or(z.literal("")),
  icon: z.string().max(8, "Use um único emoji.").optional().or(z.literal("")),
  pointsThreshold: z.number().int().min(0).nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type BadgeValues = z.infer<typeof badgeSchema>;
