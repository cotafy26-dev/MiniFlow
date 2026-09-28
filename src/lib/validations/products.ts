import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugField = z
  .string()
  .min(2, "Informe pelo menos 2 caracteres.")
  .regex(slugRegex, "Use apenas letras minúsculas, números e hífens.");

export const productStatusValues = ["draft", "published", "archived"] as const;
export const productAccessTypeValues = ["free", "paid"] as const;
export const productCardOrientationValues = ["square", "vertical", "horizontal"] as const;

export const productSchema = z.object({
  name: z.string().min(2, "Informe o nome do produto."),
  slug: slugField,
  description: z.string().max(2000, "Máximo de 2.000 caracteres.").optional().or(z.literal("")),
  imageUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
  price: z.number().min(0, "O preço não pode ser negativo."),
  categoryId: z.uuid().nullable().optional(),
  status: z.enum(productStatusValues),
  accessType: z.enum(productAccessTypeValues),
  cardOrientation: z.enum(productCardOrientationValues),
  requiredPlan: z.string().min(1),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int(),
});
export type ProductValues = z.infer<typeof productSchema>;

export const productCategorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria."),
  slug: slugField,
  icon: z.string().max(8, "Use um único emoji.").optional().or(z.literal("")),
  sortOrder: z.number().int(),
});
export type ProductCategoryValues = z.infer<typeof productCategorySchema>;

export const moduleSchema = z.object({
  name: z.string().min(2, "Informe o nome do módulo."),
  description: z.string().max(1000, "Máximo de 1.000 caracteres.").optional().or(z.literal("")),
});
export type ModuleValues = z.infer<typeof moduleSchema>;

export const lessonContentTypeValues = [
  "video",
  "text",
  "image",
  "pdf",
  "audio",
  "link",
  "file",
  "quiz",
] as const;

export const lessonStatusValues = ["draft", "published"] as const;

const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(1, "Informe a pergunta."),
  options: z.array(z.string().min(1, "Informe a opção.")).length(4, "Exatamente 4 opções."),
  correctIndex: z.number().int().min(0).max(3),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

const quizDataSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, "Adicione pelo menos uma pergunta."),
});

export const lessonSchema = z
  .object({
    name: z.string().min(2, "Informe o nome da aula."),
    description: z.string().max(1000, "Máximo de 1.000 caracteres.").optional().or(z.literal("")),
    contentType: z.enum(lessonContentTypeValues),
    videoUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    bodyText: z.string().max(20000, "Máximo de 20.000 caracteres.").optional().or(z.literal("")),
    imageUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    fileUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    linkUrl: z.url("Informe uma URL válida.").optional().or(z.literal("")),
    quizData: quizDataSchema.nullable().optional(),
    status: z.enum(lessonStatusValues),
    sortOrder: z.number().int(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "published") return;
    const required: Record<(typeof lessonContentTypeValues)[number], boolean> = {
      video: !!data.videoUrl,
      text: !!data.bodyText,
      image: !!data.imageUrl,
      pdf: !!data.fileUrl,
      audio: !!data.fileUrl,
      file: !!data.fileUrl,
      link: !!data.linkUrl,
      quiz: !!data.quizData && data.quizData.questions.length > 0,
    };
    if (!required[data.contentType]) {
      const fieldByType: Record<(typeof lessonContentTypeValues)[number], string> = {
        video: "videoUrl",
        text: "bodyText",
        image: "imageUrl",
        pdf: "fileUrl",
        audio: "fileUrl",
        file: "fileUrl",
        link: "linkUrl",
        quiz: "quizData",
      };
      ctx.addIssue({
        code: "custom",
        path: [fieldByType[data.contentType]],
        message: "Preencha o conteúdo para publicar esta aula.",
      });
    }
  });
export type LessonValues = z.infer<typeof lessonSchema>;
