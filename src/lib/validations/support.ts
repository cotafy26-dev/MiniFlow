import { z } from "zod";

export const newTicketSchema = z.object({
  subject: z.string().min(3, "Escreva um assunto.").max(200, "Máximo de 200 caracteres."),
  body: z.string().min(1, "Descreva o problema.").max(5000, "Máximo de 5.000 caracteres."),
});
export type NewTicketValues = z.infer<typeof newTicketSchema>;
