"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createPlanAction, updatePlanAction } from "@/core/plans/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { planSchema, type PlanValues } from "@/lib/validations/plans";

function NullableNumberField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Input
      id={id}
      type="number"
      min={0}
      value={value ?? ""}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(raw === "" ? null : Number(raw));
      }}
    />
  );
}

export function PlanForm({
  mode,
  planKey,
  defaultValues,
}: {
  mode: "create" | "edit";
  planKey?: string;
  defaultValues?: Partial<PlanValues>;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      maxMembers: null,
      maxMiniApps: null,
      maxProducts: null,
      price: 0,
      sortOrder: 0,
      isActive: true,
      ...defaultValues,
    },
  });

  async function onSubmit(values: PlanValues) {
    setFormError(null);
    const result = mode === "create" ? await createPlanAction(values) : await updatePlanAction(planKey!, values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="name">{pt.plans.form.name}</FieldLabel>
        <Input id="name" {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="key">{pt.plans.form.key}</FieldLabel>
        <Input id="key" disabled={mode === "edit"} {...register("key")} />
        <FieldError errors={[errors.key]} />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field>
          <FieldLabel htmlFor="maxMembers">{pt.plans.form.maxMembers}</FieldLabel>
          <Controller
            name="maxMembers"
            control={control}
            render={({ field }) => <NullableNumberField id="maxMembers" value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="maxMiniApps">{pt.plans.form.maxMiniApps}</FieldLabel>
          <Controller
            name="maxMiniApps"
            control={control}
            render={({ field }) => <NullableNumberField id="maxMiniApps" value={field.value} onChange={field.onChange} />}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="maxProducts">{pt.plans.form.maxProducts}</FieldLabel>
          <Controller
            name="maxProducts"
            control={control}
            render={({ field }) => <NullableNumberField id="maxProducts" value={field.value} onChange={field.onChange} />}
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">{pt.plans.form.limitHint}</p>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="price">{pt.plans.form.price}</FieldLabel>
          <Input id="price" type="number" step="0.01" min={0} {...register("price", { valueAsNumber: true })} />
          <FieldError errors={[errors.price]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="sortOrder">{pt.plans.form.sortOrder}</FieldLabel>
          <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>

      <Field orientation="horizontal">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />}
        />
        <FieldLabel htmlFor="isActive">{pt.plans.form.isActive}</FieldLabel>
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.plans.form.submitting
          : mode === "create"
            ? pt.plans.form.submitCreate
            : pt.plans.form.submitEdit}
      </Button>
    </form>
  );
}
