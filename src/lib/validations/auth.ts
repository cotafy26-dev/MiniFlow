import { z } from "zod";

const emailField = z.email("Informe um e-mail válido.");
const passwordField = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Informe sua senha."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Informe seu nome completo."),
    tenantName: z.string().min(2, "Informe o nome do seu negócio ou espaço."),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
