"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createMiniAppCategoryAction,
  updateMiniAppCategoryAction,
} from "@/core/mini-apps/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { miniAppCategorySchema, type MiniAppCategoryValues } from "@/lib/validations/mini-apps";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MiniAppCategoryForm({
  mode,
  categoryId,
  defaultValues,
  onSuccess,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  defaultValues?: Partial<MiniAppCategoryValues>;
  onSuccess?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<MiniAppCategoryValues>({
    resolver: zodResolver(miniAppCategorySchema),
    defaultValues: { sortOrder: 0, ...defaultValues },
  });

  function handleNameBlur() {
    if (getValues("slug")) return;
    setValue("slug", slugify(getValues("name") ?? ""));
  }

  async function onSubmit(values: MiniAppCategoryValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createMiniAppCategoryAction(values)
        : await updateMiniAppCategoryAction(categoryId!, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="cat-name">{pt.miniApps.category.form.name}</FieldLabel>
        <Input id="cat-name" {...register("name")} onBlur={handleNameBlur} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="cat-slug">{pt.miniApps.category.form.slug}</FieldLabel>
        <Input id="cat-slug" {...register("slug")} />
        <FieldError errors={[errors.slug]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="cat-icon">{pt.miniApps.category.form.icon}</FieldLabel>
          <Input id="cat-icon" placeholder="📁" {...register("icon")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="cat-sort">{pt.miniApps.category.form.sortOrder}</FieldLabel>
          <Input id="cat-sort" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.miniApps.category.form.submitting
          : mode === "create"
            ? pt.miniApps.category.form.submitCreate
            : pt.miniApps.category.form.submitEdit}
      </Button>
    </form>
  );
}
