import { z } from "zod";

export const emailSettingsSchema = z.object({
  subject: z.string().max(200, "Máximo de 200 caracteres.").optional().or(z.literal("")),
  body: z.string().max(5000, "Máximo de 5.000 caracteres.").optional().or(z.literal("")),
});

export type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
