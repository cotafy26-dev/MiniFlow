import { z } from "zod";

export const inviteSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  roleId: z.uuid("Selecione um papel."),
});
export type InviteValues = z.infer<typeof inviteSchema>;

export const acceptInvitationSchema = z
  .object({
    fullName: z.string().min(2, "Informe seu nome completo."),
    password: z.string().min(8, "Mínimo de 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;
