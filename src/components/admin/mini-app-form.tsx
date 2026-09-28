"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { HtmlUploadField } from "@/components/admin/html-upload-field";
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
import { createMiniAppAction, updateMiniAppAction } from "@/core/mini-apps/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import {
  miniAppSchema,
  miniAppStatusValues,
  miniAppTypeValues,
  type MiniAppValues,
} from "@/lib/validations/mini-apps";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MiniAppForm({
  mode,
  miniAppId,
  categories,
  roles,
  defaultValues,
}: {
  mode: "create" | "edit";
  miniAppId?: string;
  categories: { id: string; name: string }[];
  roles: { id: string; key: string; name: string }[];
  defaultValues?: Partial<MiniAppValues>;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MiniAppValues>({
    resolver: zodResolver(miniAppSchema),
    defaultValues: {
      type: "external_app",
      status: "draft",
      isActive: true,
      isFeatured: false,
      sortOrder: 0,
      requiredPlan: "free",
      visibleToRoleIds: [],
      categoryId: null,
      contentHtml: "",
      aiSystemPrompt: "",
      ...defaultValues,
    },
  });

  const selectedType = watch("type");

  function handleNameBlur() {
    const slug = getValues("slug");
    if (slug) return;
    setValue("slug", slugify(getValues("name") ?? ""));
  }

  async function onSubmit(values: MiniAppValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createMiniAppAction(values)
        : await updateMiniAppAction(miniAppId!, values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="name">{pt.miniApps.form.name}</FieldLabel>
        <Input id="name" {...register("name")} onBlur={handleNameBlur} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="slug">{pt.miniApps.form.slug}</FieldLabel>
        <Input id="slug" {...register("slug")} />
        <FieldError errors={[errors.slug]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="description">{pt.miniApps.form.description}</FieldLabel>
        <Textarea id="description" rows={3} {...register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="icon">{pt.miniApps.form.icon}</FieldLabel>
          <Input id="icon" placeholder="🧠" {...register("icon")} />
          <FieldError errors={[errors.icon]} />
        </Field>

        <Field>
          <FieldLabel>{pt.miniApps.form.category}</FieldLabel>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? "none"}
                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{pt.miniApps.form.noCategory}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="imageUrl">{pt.miniApps.form.imageUrl}</FieldLabel>
        <Input id="imageUrl" type="url" placeholder="https://..." {...register("imageUrl")} />
        <FieldError errors={[errors.imageUrl]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>{pt.miniApps.form.type}</FieldLabel>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {miniAppTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      {pt.miniApps.types[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel>{pt.miniApps.form.status}</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {miniAppStatusValues.map((status) => (
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

      <Field>
        <FieldLabel htmlFor="url">{pt.miniApps.form.url}</FieldLabel>
        <Input id="url" type="url" placeholder="https://..." {...register("url")} />
        <FieldError errors={[errors.url]} />
      </Field>

      {selectedType === "internal_page" && (
        <Controller
          name="contentHtml"
          control={control}
          render={({ field }) => (
            <HtmlUploadField
              id="contentHtml"
              value={field.value ?? ""}
              onChange={field.onChange}
              label={pt.miniApps.form.contentHtml}
              hint={pt.miniApps.form.contentHtmlHint}
              error={errors.contentHtml?.message}
            />
          )}
        />
      )}

      {selectedType === "ai_tool" && (
        <Field>
          <FieldLabel htmlFor="aiSystemPrompt">{pt.miniApps.form.aiSystemPrompt}</FieldLabel>
          <Textarea
            id="aiSystemPrompt"
            rows={5}
            placeholder={pt.miniApps.form.aiSystemPromptPlaceholder}
            {...register("aiSystemPrompt")}
          />
          <p className="text-xs text-muted-foreground">{pt.miniApps.form.aiSystemPromptHint}</p>
          <FieldError errors={[errors.aiSystemPrompt]} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="requiredPlan">{pt.miniApps.form.requiredPlan}</FieldLabel>
          <Input id="requiredPlan" {...register("requiredPlan")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="sortOrder">{pt.miniApps.form.sortOrder}</FieldLabel>
          <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>

      <div className="flex gap-8">
        <Field orientation="horizontal">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
            )}
          />
          <FieldLabel htmlFor="isActive">{pt.miniApps.form.isActive}</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="isFeatured" />
            )}
          />
          <FieldLabel htmlFor="isFeatured">{pt.miniApps.form.isFeatured}</FieldLabel>
        </Field>
      </div>

      <Field>
        <FieldLabel>{pt.miniApps.form.visibleToRoles}</FieldLabel>
        <Controller
          name="visibleToRoleIds"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              {roles.map((role) => {
                const checked = field.value?.includes(role.id) ?? false;
                return (
                  <label key={role.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => {
                        const current = field.value ?? [];
                        field.onChange(
                          next ? [...current, role.id] : current.filter((id) => id !== role.id)
                        );
                      }}
                    />
                    {role.name}
                  </label>
                );
              })}
            </div>
          )}
        />
        <FieldError errors={[errors.visibleToRoleIds]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.miniApps.form.submitting
          : mode === "create"
            ? pt.miniApps.form.submitCreate
            : pt.miniApps.form.submitEdit}
      </Button>
    </form>
  );
}
