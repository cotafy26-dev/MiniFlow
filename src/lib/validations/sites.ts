import { z } from "zod";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api", "mail", "ftp", "smtp", "root"]);

const subdomainField = z
  .string()
  .min(3, "Mínimo de 3 caracteres.")
  .max(63, "Máximo de 63 caracteres.")
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/, "Use apenas letras minúsculas, números e hífens.")
  .refine((value) => !RESERVED_SUBDOMAINS.has(value), "Este subdomínio é reservado.");

export const siteSchema = z.object({
  name: z.string().min(2, "Informe o nome do site."),
  subdomain: subdomainField,
  isActive: z.boolean(),
});
export type SiteValues = z.infer<typeof siteSchema>;

export const siteContentSchema = z.object({
  htmlContent: z.string().max(50000, "Máximo de 50.000 caracteres."),
});
export type SiteContentValues = z.infer<typeof siteContentSchema>;
