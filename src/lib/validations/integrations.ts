import { z } from "zod";

export const hotmartCredentialsSchema = z.object({
  token: z.string().min(1, "Informe o Hottok."),
});
export type HotmartCredentialsValues = z.infer<typeof hotmartCredentialsSchema>;

export const productIntegrationLinkSchema = z.object({
  integrationId: z.uuid("Selecione uma integração."),
  externalProductId: z.string().min(1, "Informe o ID do produto na plataforma."),
});
export type ProductIntegrationLinkValues = z.infer<typeof productIntegrationLinkSchema>;
