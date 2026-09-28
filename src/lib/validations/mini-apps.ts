import { z } from "zod";

export const miniAppTypeValues = [
  "internal_app",
  "internal_page",
  "external_app",
  "iframe",
  "pwa",
  "ai_tool",
  "hosted_site",
] as const;

export const miniAppStatusValues = ["draft", "published", "archived"] as const;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
  .string()
  .min(2, "Informe pelo menos 2 caracteres.")
  .regex(slugRegex, "Use apenas letras minúsculas, números e hífens.");

const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api", "mail", "ftp", "smtp", "root"]);

const subdomainField = z
  .string()
  .min(3, "Mínimo de 3 caracteres.")
  .max(63, "Máximo de 63 caracteres.")
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/, "Use apenas letras minúsculas, números e hífens.")
  .refine((value) => !RESERVED_SUBDOMAINS.has(value), "Este subdomínio é reservado.");

export const miniAppSchema = z
  .object({
    name: z.string().min(2, "Informe o nome do mini-app."),
    slug: slugField,
    description: z.string().max(500, "Máximo de 500 caracteres.").optional().or(z.literal("")),
    icon: z.string().max(8, "Use um único emoji.").optional().or(z.literal("")),
    imageUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    url: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    contentHtml: z
      .string()
      .max(20000, "Máximo de 20.000 caracteres.")
      .optional()
      .or(z.literal("")),
    aiSystemPrompt: z.string().max(4000, "Máximo de 4.000 caracteres.").optional().or(z.literal("")),
    subdomain: z.string().optional().or(z.literal("")),
    type: z.enum(miniAppTypeValues),
    status: z.enum(miniAppStatusValues),
    categoryId: z.uuid().nullable().optional(),
    requiredPlan: z.string().min(1),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.number().int(),
    visibleToRoleIds: z.array(z.uuid()).min(1, "Selecione ao menos um papel."),
  })
  .superRefine((data, ctx) => {
    if (
      (data.type === "external_app" || data.type === "iframe") &&
      data.status === "published" &&
      !data.url
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Informe a URL de destino para publicar este tipo de mini-app.",
      });
    }

    if (data.type === "hosted_site") {
      const result = subdomainField.safeParse(data.subdomain);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: ["subdomain"],
          message: result.error.issues[0]?.message ?? "Informe um subdomínio válido.",
        });
      }
    }
  });

export type MiniAppValues = z.infer<typeof miniAppSchema>;

export const miniAppCategorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria."),
  slug: slugField,
  icon: z.string().max(8, "Use um único emoji.").optional().or(z.literal("")),
  sortOrder: z.number().int(),
});

export type MiniAppCategoryValues = z.infer<typeof miniAppCategorySchema>;
