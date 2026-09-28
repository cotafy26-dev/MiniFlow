"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createModuleAction, updateModuleAction } from "@/core/products/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { moduleSchema, type ModuleValues } from "@/lib/validations/products";

export function ModuleForm({
  mode,
  productId,
  moduleId,
  defaultValues,
  onSuccess,
}: {
  mode: "create" | "edit";
  productId?: string;
  moduleId?: string;
  defaultValues?: Partial<ModuleValues>;
  onSuccess?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ModuleValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues,
  });

  async function onSubmit(values: ModuleValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createModuleAction(productId!, values)
        : await updateModuleAction(moduleId!, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="mod-name">{pt.products.moduleForm.name}</FieldLabel>
        <Input id="mod-name" {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="mod-description">{pt.products.moduleForm.description}</FieldLabel>
        <Textarea id="mod-description" rows={2} {...register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.products.moduleForm.submitting
          : mode === "create"
            ? pt.products.moduleForm.submitCreate
            : pt.products.moduleForm.submitEdit}
      </Button>
    </form>
  );
}
