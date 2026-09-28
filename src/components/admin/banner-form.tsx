"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createBannerAction, updateBannerAction } from "@/core/banners/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { bannerSchema, type BannerValues } from "@/lib/validations/banners";

export function BannerForm({
  mode,
  bannerId,
  defaultValues,
}: {
  mode: "create" | "edit";
  bannerId?: string;
  defaultValues?: Partial<BannerValues>;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BannerValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      isActive: true,
      sortOrder: 0,
      linkUrl: "",
      startsAt: "",
      endsAt: "",
      ...defaultValues,
    },
  });

  async function onSubmit(values: BannerValues) {
    setFormError(null);
    const result =
      mode === "create" ? await createBannerAction(values) : await updateBannerAction(bannerId!, values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="title">{pt.banners.form.title}</FieldLabel>
        <Input id="title" {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="imageUrl">{pt.banners.form.imageUrl}</FieldLabel>
        <Input id="imageUrl" type="url" {...register("imageUrl")} />
        <FieldError errors={[errors.imageUrl]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="linkUrl">{pt.banners.form.linkUrl}</FieldLabel>
        <Input id="linkUrl" {...register("linkUrl")} />
        <p className="text-xs text-muted-foreground">{pt.banners.form.linkUrlHint}</p>
        <FieldError errors={[errors.linkUrl]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="startsAt">{pt.banners.form.startsAt}</FieldLabel>
          <Input id="startsAt" type="datetime-local" {...register("startsAt")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="endsAt">{pt.banners.form.endsAt}</FieldLabel>
          <Input id="endsAt" type="datetime-local" {...register("endsAt")} />
          <FieldError errors={[errors.endsAt]} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="sortOrder">{pt.banners.form.sortOrder}</FieldLabel>
          <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
        <Field orientation="horizontal">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
            )}
          />
          <FieldLabel htmlFor="isActive">{pt.banners.form.isActive}</FieldLabel>
        </Field>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.banners.form.submitting
          : mode === "create"
            ? pt.banners.form.submitCreate
            : pt.banners.form.submitEdit}
      </Button>
    </form>
  );
}
