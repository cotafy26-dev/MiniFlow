"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createCommunityAction, updateCommunityAction } from "@/core/communities/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import {
  communitySchema,
  communityVisibilityValues,
  type CommunityValues,
} from "@/lib/validations/communities";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CommunityForm({
  mode,
  communityId,
  defaultValues,
}: {
  mode: "create" | "edit";
  communityId?: string;
  defaultValues?: Partial<CommunityValues>;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CommunityValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      visibility: "open",
      isActive: true,
      sortOrder: 0,
      ...defaultValues,
    },
  });

  function handleNameBlur() {
    if (getValues("slug")) return;
    setValue("slug", slugify(getValues("name") ?? ""));
  }

  async function onSubmit(values: CommunityValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createCommunityAction(values)
        : await updateCommunityAction(communityId!, values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="c-name">{pt.community.admin.form.name}</FieldLabel>
        <Input id="c-name" {...register("name")} onBlur={handleNameBlur} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="c-slug">{pt.community.admin.form.slug}</FieldLabel>
        <Input id="c-slug" {...register("slug")} />
        <FieldError errors={[errors.slug]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="c-description">{pt.community.admin.form.description}</FieldLabel>
        <Textarea id="c-description" rows={3} {...register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="c-imageUrl">{pt.community.admin.form.imageUrl}</FieldLabel>
        <Input id="c-imageUrl" type="url" placeholder="https://..." {...register("imageUrl")} />
        <FieldError errors={[errors.imageUrl]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>{pt.community.admin.form.visibility}</FieldLabel>
          <Controller
            name="visibility"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {communityVisibilityValues.map((visibility) => (
                    <SelectItem key={visibility} value={visibility}>
                      {pt.community.admin.visibility[visibility]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="c-sortOrder">{pt.community.admin.form.sortOrder}</FieldLabel>
          <Input id="c-sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>

      <Field orientation="horizontal">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} id="c-isActive" />
          )}
        />
        <FieldLabel htmlFor="c-isActive">{pt.community.admin.form.isActive}</FieldLabel>
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.community.admin.form.submitting
          : mode === "create"
            ? pt.community.admin.form.submitCreate
            : pt.community.admin.form.submitEdit}
      </Button>
    </form>
  );
}
