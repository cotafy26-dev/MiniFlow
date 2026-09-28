import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
  .string()
  .min(2, "Informe pelo menos 2 caracteres.")
  .regex(slugRegex, "Use apenas letras minúsculas, números e hífens.");

export const communityVisibilityValues = ["open", "closed"] as const;

export const communitySchema = z.object({
  name: z.string().min(2, "Informe o nome da comunidade."),
  slug: slugField,
  description: z.string().max(2000, "Máximo de 2.000 caracteres.").optional().or(z.literal("")),
  imageUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
  visibility: z.enum(communityVisibilityValues),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type CommunityValues = z.infer<typeof communitySchema>;

export const communityMemberRoleValues = ["member", "moderator", "vip"] as const;

export const communityMemberRoleSchema = z.object({
  role: z.enum(communityMemberRoleValues),
});
export type CommunityMemberRoleValues = z.infer<typeof communityMemberRoleSchema>;
