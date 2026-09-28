"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createSiteAction, updateSiteAction } from "@/core/sites/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { siteSchema, type SiteValues } from "@/lib/validations/sites";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SiteForm({
  mode,
  siteId,
  baseDomain,
  defaultValues,
}: {
  mode: "create" | "edit";
  siteId?: string;
  baseDomain: string | null;
  defaultValues?: Partial<SiteValues>;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SiteValues>({
    resolver: zodResolver(siteSchema),
    defaultValues: { isActive: true, ...defaultValues },
  });

  const subdomain = watch("subdomain");

  function handleNameBlur() {
    if (getValues("subdomain")) return;
    setValue("subdomain", slugify(getValues("name") ?? ""));
  }

  async function onSubmit(values: SiteValues) {
    setFormError(null);
    const result =
      mode === "create" ? await createSiteAction(values.name, values.subdomain) : await updateSiteAction(siteId!, values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="name">{pt.sites.name}</FieldLabel>
        <Input id="name" {...register("name")} onBlur={handleNameBlur} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="subdomain">{pt.sites.subdomain}</FieldLabel>
        <Input id="subdomain" {...register("subdomain")} />
        <p className="text-xs text-muted-foreground">{pt.sites.subdomainHint}</p>
        <FieldError errors={[errors.subdomain]} />
      </Field>

      {subdomain && (
        <p className="text-xs text-muted-foreground">
          {pt.sites.urlPreview}: {baseDomain ? `https://${subdomain}.${baseDomain}` : pt.sites.urlPreviewMissingDomain}
        </p>
      )}

      {mode === "edit" && (
        <Field orientation="horizontal">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
            )}
          />
          <FieldLabel htmlFor="isActive">{pt.sites.isActive}</FieldLabel>
        </Field>
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? pt.sites.submitting : mode === "create" ? pt.sites.submitCreate : pt.sites.submitEdit}
      </Button>
    </form>
  );
}
