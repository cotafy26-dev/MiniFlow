"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createProductCategoryAction,
  updateProductCategoryAction,
} from "@/core/products/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { productCategorySchema, type ProductCategoryValues } from "@/lib/validations/products";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductCategoryForm({
  mode,
  categoryId,
  defaultValues,
  onSuccess,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  defaultValues?: Partial<ProductCategoryValues>;
  onSuccess?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductCategoryValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: { sortOrder: 0, ...defaultValues },
  });

  function handleNameBlur() {
    if (getValues("slug")) return;
    setValue("slug", slugify(getValues("name") ?? ""));
  }

  async function onSubmit(values: ProductCategoryValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createProductCategoryAction(values)
        : await updateProductCategoryAction(categoryId!, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="pcat-name">{pt.products.category.form.name}</FieldLabel>
        <Input id="pcat-name" {...register("name")} onBlur={handleNameBlur} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="pcat-slug">{pt.products.category.form.slug}</FieldLabel>
        <Input id="pcat-slug" {...register("slug")} />
        <FieldError errors={[errors.slug]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="pcat-icon">{pt.products.category.form.icon}</FieldLabel>
          <Input id="pcat-icon" placeholder="📁" {...register("icon")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="pcat-sort">{pt.products.category.form.sortOrder}</FieldLabel>
          <Input id="pcat-sort" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.products.category.form.submitting
          : mode === "create"
            ? pt.products.category.form.submitCreate
            : pt.products.category.form.submitEdit}
      </Button>
    </form>
  );
}
