import { z } from "zod";

export const bannerSchema = z
  .object({
    title: z.string().min(2, "Informe um título."),
    imageUrl: z.url("Informe uma URL válida."),
    linkUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    isActive: z.boolean(),
    startsAt: z.string().optional().or(z.literal("")),
    endsAt: z.string().optional().or(z.literal("")),
    sortOrder: z.number().int(),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "O fim deve ser depois do início.",
      });
    }
  });

export type BannerValues = z.infer<typeof bannerSchema>;
