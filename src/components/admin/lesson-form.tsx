"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { QuizQuestionEditor } from "@/components/admin/quiz-question-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLessonAction, updateLessonAction } from "@/core/products/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import {
  lessonContentTypeValues,
  lessonSchema,
  lessonStatusValues,
  type LessonValues,
} from "@/lib/validations/products";

export function LessonForm({
  mode,
  moduleId,
  productId,
  lessonId,
  defaultValues,
  onSuccess,
}: {
  mode: "create" | "edit";
  moduleId?: string;
  productId?: string;
  lessonId?: string;
  defaultValues?: Partial<LessonValues>;
  onSuccess?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LessonValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      contentType: "text",
      status: "draft",
      sortOrder: 0,
      quizData: { questions: [] },
      ...defaultValues,
    },
  });

  const contentType = watch("contentType");

  async function onSubmit(values: LessonValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createLessonAction(moduleId!, productId!, values)
        : await updateLessonAction(lessonId!, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="lesson-name">{pt.products.lessonForm.name}</FieldLabel>
        <Input id="lesson-name" {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="lesson-description">{pt.products.lessonForm.description}</FieldLabel>
        <Textarea id="lesson-description" rows={2} {...register("description")} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>{pt.products.lessonForm.contentType}</FieldLabel>
          <Controller
            name="contentType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lessonContentTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      {pt.products.contentTypes[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel>{pt.products.lessonForm.status}</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lessonStatusValues.map((status) => (
                    <SelectItem key={status} value={status}>
                      {pt.miniApps.status[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      {contentType === "video" && (
        <Field>
          <FieldLabel htmlFor="lesson-videoUrl">{pt.products.lessonForm.videoUrl}</FieldLabel>
          <Input id="lesson-videoUrl" type="url" placeholder="https://youtube.com/..." {...register("videoUrl")} />
          <FieldError errors={[errors.videoUrl]} />
        </Field>
      )}

      {contentType === "text" && (
        <Field>
          <FieldLabel htmlFor="lesson-bodyText">{pt.products.lessonForm.bodyText}</FieldLabel>
          <Textarea id="lesson-bodyText" rows={8} {...register("bodyText")} />
          <FieldError errors={[errors.bodyText]} />
        </Field>
      )}

      {contentType === "image" && (
        <Field>
          <FieldLabel htmlFor="lesson-imageUrl">{pt.products.lessonForm.imageUrl}</FieldLabel>
          <Input id="lesson-imageUrl" type="url" placeholder="https://..." {...register("imageUrl")} />
          <FieldError errors={[errors.imageUrl]} />
        </Field>
      )}

      {(contentType === "pdf" || contentType === "audio" || contentType === "file") && (
        <Field>
          <FieldLabel htmlFor="lesson-fileUrl">{pt.products.lessonForm.fileUrl}</FieldLabel>
          <Input id="lesson-fileUrl" type="url" placeholder="https://..." {...register("fileUrl")} />
          <FieldError errors={[errors.fileUrl]} />
        </Field>
      )}

      {contentType === "link" && (
        <Field>
          <FieldLabel htmlFor="lesson-linkUrl">{pt.products.lessonForm.linkUrl}</FieldLabel>
          <Input id="lesson-linkUrl" type="url" placeholder="https://..." {...register("linkUrl")} />
          <FieldError errors={[errors.linkUrl]} />
        </Field>
      )}

      {contentType === "quiz" && (
        <Field>
          <FieldLabel>{pt.products.lessonForm.quiz}</FieldLabel>
          <QuizQuestionEditor control={control} />
        </Field>
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.products.lessonForm.submitting
          : mode === "create"
            ? pt.products.lessonForm.submitCreate
            : pt.products.lessonForm.submitEdit}
      </Button>
    </form>
  );
}
