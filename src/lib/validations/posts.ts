import { z } from "zod";

export const postContentTypeValues = [
  "text",
  "image",
  "video",
  "link",
  "announcement",
  "news",
] as const;

// 'announcement'/'news' are Feed-broadcast formats — the DB CHECK constraint
// allows them on any post, but the app restricts them to communityId=null
// (same "DB allows more than the UI exposes" pattern as lessons.content_type).
const feedOnlyContentTypes = new Set<(typeof postContentTypeValues)[number]>([
  "announcement",
  "news",
]);

export const postSchema = z
  .object({
    communityId: z.uuid().nullable(),
    contentType: z.enum(postContentTypeValues),
    bodyText: z.string().max(10000, "Máximo de 10.000 caracteres.").optional().or(z.literal("")),
    imageUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    videoUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    linkUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.communityId !== null && feedOnlyContentTypes.has(data.contentType)) {
      ctx.addIssue({
        code: "custom",
        path: ["contentType"],
        message: "Anúncios e novidades só podem ser publicados no Feed.",
      });
    }

    const required: Record<(typeof postContentTypeValues)[number], boolean> = {
      text: !!data.bodyText,
      announcement: !!data.bodyText,
      news: !!data.bodyText,
      image: !!data.imageUrl,
      video: !!data.videoUrl,
      link: !!data.linkUrl,
    };
    if (!required[data.contentType]) {
      const fieldByType: Record<(typeof postContentTypeValues)[number], string> = {
        text: "bodyText",
        announcement: "bodyText",
        news: "bodyText",
        image: "imageUrl",
        video: "videoUrl",
        link: "linkUrl",
      };
      ctx.addIssue({
        code: "custom",
        path: [fieldByType[data.contentType]],
        message: "Preencha o conteúdo para publicar.",
      });
    }
  });
export type PostValues = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  body: z.string().min(1, "Escreva um comentário.").max(2000, "Máximo de 2.000 caracteres."),
  parentCommentId: z.uuid().nullable().optional(),
});
export type CommentValues = z.infer<typeof commentSchema>;

export const reportSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.uuid(),
  reason: z.string().min(3, "Descreva o motivo.").max(500, "Máximo de 500 caracteres."),
});
export type ReportValues = z.infer<typeof reportSchema>;
