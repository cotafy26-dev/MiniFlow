"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { HtmlUploadField } from "@/components/admin/html-upload-field";
import { updateSiteContentAction } from "@/core/sites/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { siteContentSchema, type SiteContentValues } from "@/lib/validations/sites";

export function SiteContentForm({ siteId, defaultValues }: { siteId: string; defaultValues?: Partial<SiteContentValues> }) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SiteContentValues>({
    resolver: zodResolver(siteContentSchema),
    defaultValues: { htmlContent: "", ...defaultValues },
  });

  async function onSubmit(values: SiteContentValues) {
    setFormError(null);
    const result = await updateSiteContentAction(siteId, values.htmlContent);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Controller
        name="htmlContent"
        control={control}
        render={({ field }) => (
          <HtmlUploadField
            id="htmlContent"
            value={field.value}
            onChange={field.onChange}
            label={pt.sites.contentTitle}
            hint={pt.sites.contentHint}
            error={errors.htmlContent?.message}
          />
        )}
      />

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? pt.sites.submitting : pt.sites.submitContent}
      </Button>
    </form>
  );
}
