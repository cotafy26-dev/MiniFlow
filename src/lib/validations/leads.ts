import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.email("Informe um e-mail válido."),
  whatsapp: z.string().min(8, "Informe um WhatsApp válido."),
  message: z.string().max(500, "Máximo de 500 caracteres.").optional().or(z.literal("")),
});

export type LeadValues = z.infer<typeof leadSchema>;
