"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPostAction, updatePostAction } from "@/core/posts/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { postContentTypeValues, postSchema, type PostValues } from "@/lib/validations/posts";

const feedOnlyTypes = new Set(["announcement", "news"]);

export function PostComposer({
  communityId,
  mode = "create",
  postId,
  defaultValues,
  onDone,
  onCancel,
}: {
  communityId: string | null;
  mode?: "create" | "edit";
  postId?: string;
  defaultValues?: Partial<PostValues>;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const availableTypes = communityId
    ? postContentTypeValues.filter((type) => !feedOnlyTypes.has(type))
    : postContentTypeValues;

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      communityId,
      contentType: "text",
      bodyText: "",
      imageUrl: "",
      videoUrl: "",
      linkUrl: "",
      ...defaultValues,
    },
  });

  const contentType = watch("contentType");

  async function onSubmit(values: PostValues) {
    setFormError(null);
    const result =
      mode === "create" ? await createPostAction(values) : await updatePostAction(postId!, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    if (mode === "create") reset({ ...values, bodyText: "", imageUrl: "", videoUrl: "", linkUrl: "" });
    toast.success(mode === "create" ? pt.feed.composer.submit : pt.feed.post.editAction);
    onDone?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-xl border p-4">
      <Controller
        name="contentType"
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {pt.feed.composer.contentType[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {(contentType === "text" || contentType === "announcement" || contentType === "news") && (
        <Textarea rows={3} placeholder={pt.feed.composer.placeholder} {...register("bodyText")} />
      )}
      {contentType === "image" && (
        <input
          className="rounded-md border px-3 py-2 text-sm"
          type="url"
          placeholder={pt.feed.composer.imageUrl}
          {...register("imageUrl")}
        />
      )}
      {contentType === "video" && (
        <input
          className="rounded-md border px-3 py-2 text-sm"
          type="url"
          placeholder={pt.feed.composer.videoUrl}
          {...register("videoUrl")}
        />
      )}
      {contentType === "link" && (
        <input
          className="rounded-md border px-3 py-2 text-sm"
          type="url"
          placeholder={pt.feed.composer.linkUrl}
          {...register("linkUrl")}
        />
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? pt.feed.composer.submitting : pt.feed.composer.submit}
        </Button>
      </div>
    </form>
  );
}
