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
import { createProductAction, updateProductAction } from "@/core/products/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { cn } from "@/lib/utils";
import {
  productAccessTypeValues,
  productCardOrientationValues,
  productSchema,
  productStatusValues,
  type ProductValues,
} from "@/lib/validations/products";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function OptionCard({
  selected,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border text-muted-foreground hover:bg-accent"
      )}
    >
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </button>
  );
}

export function ProductForm({
  mode,
  productId,
  categories,
  defaultValues,
}: {
  mode: "create" | "edit";
  productId?: string;
  categories: { id: string; name: string }[];
  defaultValues?: Partial<ProductValues>;
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
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      price: 0,
      status: "draft",
      accessType: "free",
      cardOrientation: "square",
      isActive: true,
      isFeatured: false,
      sortOrder: 0,
      requiredPlan: "free",
      categoryId: null,
      ...defaultValues,
    },
  });

  const accessType = watch("accessType");

  function handleNameBlur() {
    if (getValues("slug")) return;
    setValue("slug", slugify(getValues("name") ?? ""));
  }

  async function onSubmit(values: ProductValues) {
    setFormError(null);
    const result =
      mode === "create"
        ? await createProductAction(values)
        : await updateProductAction(productId!, values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="p-name">{pt.products.form.name}</FieldLabel>
        <Input id="p-name" {...register("name")} onBlur={handleNameBlur} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="p-slug">{pt.products.form.slug}</FieldLabel>
        <Input id="p-slug" {...register("slug")} />
        <FieldError errors={[errors.slug]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="p-description">{pt.products.form.description}</FieldLabel>
        <Textarea id="p-description" rows={3} {...register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="p-imageUrl">{pt.products.form.imageUrl}</FieldLabel>
        <Input id="p-imageUrl" type="url" placeholder="https://..." {...register("imageUrl")} />
        <FieldError errors={[errors.imageUrl]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="p-price">{pt.products.form.price}</FieldLabel>
          <Input
            id="p-price"
            type="number"
            step="0.01"
            min="0"
            {...register("price", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.price]} />
        </Field>

        <Field>
          <FieldLabel>{pt.products.form.category}</FieldLabel>
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
                  <SelectItem value="none">{pt.products.form.noCategory}</SelectItem>
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
        <FieldLabel>{pt.products.form.status}</FieldLabel>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div className="flex gap-3">
              {productStatusValues
                .filter((status) => status !== "archived")
                .map((status) => (
                  <OptionCard
                    key={status}
                    selected={field.value === status}
                    title={pt.products.form.statusOptions[status].title}
                    subtitle={pt.products.form.statusOptions[status].subtitle}
                    onClick={() => field.onChange(status)}
                  />
                ))}
            </div>
          )}
        />
      </Field>

      <Field>
        <FieldLabel>{pt.products.form.accessType}</FieldLabel>
        <Controller
          name="accessType"
          control={control}
          render={({ field }) => (
            <div className="flex gap-3">
              {productAccessTypeValues.map((type) => (
                <OptionCard
                  key={type}
                  selected={field.value === type}
                  title={pt.products.form.accessTypeOptions[type].title}
                  subtitle={pt.products.form.accessTypeOptions[type].subtitle}
                  onClick={() => field.onChange(type)}
                />
              ))}
            </div>
          )}
        />
        {accessType === "paid" && (
          <p className="text-xs text-muted-foreground">{pt.products.form.accessTypePaidHint}</p>
        )}
      </Field>

      <Field>
        <FieldLabel>{pt.products.form.cardOrientation}</FieldLabel>
        <Controller
          name="cardOrientation"
          control={control}
          render={({ field }) => (
            <div className="flex gap-3">
              {productCardOrientationValues.map((orientation) => (
                <OptionCard
                  key={orientation}
                  selected={field.value === orientation}
                  title={pt.products.form.cardOrientationOptions[orientation].title}
                  subtitle={pt.products.form.cardOrientationOptions[orientation].subtitle}
                  onClick={() => field.onChange(orientation)}
                />
              ))}
            </div>
          )}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="p-requiredPlan">{pt.products.form.requiredPlan}</FieldLabel>
        <Input id="p-requiredPlan" {...register("requiredPlan")} />
      </Field>

      <Field>
        <FieldLabel htmlFor="p-sortOrder">{pt.products.form.sortOrder}</FieldLabel>
        <Input id="p-sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
      </Field>

      <div className="flex gap-8">
        <Field orientation="horizontal">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="p-isActive" />
            )}
          />
          <FieldLabel htmlFor="p-isActive">{pt.products.form.isActive}</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} id="p-isFeatured" />
            )}
          />
          <FieldLabel htmlFor="p-isFeatured">{pt.products.form.isFeatured}</FieldLabel>
        </Field>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.products.form.submitting
          : mode === "create"
            ? pt.products.form.submitCreate
            : pt.products.form.submitEdit}
      </Button>
    </form>
  );
}
