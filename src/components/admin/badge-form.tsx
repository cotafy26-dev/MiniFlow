"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createBadgeAction, updateBadgeAction } from "@/core/gamification/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { badgeSchema, type BadgeValues } from "@/lib/validations/gamification";

export function BadgeForm({
  mode,
  badgeId,
  defaultValues,
  onSuccess,
}: {
  mode: "create" | "edit";
  badgeId?: string;
  defaultValues?: Partial<BadgeValues>;
  onSuccess?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BadgeValues>({
    resolver: zodResolver(badgeSchema),
    defaultValues: { pointsThreshold: null, isActive: true, sortOrder: 0, ...defaultValues },
  });

  async function onSubmit(values: BadgeValues) {
    setFormError(null);
    const result =
      mode === "create" ? await createBadgeAction(values) : await updateBadgeAction(badgeId!, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="badge-name">{pt.gamification.badges.form.name}</FieldLabel>
        <Input id="badge-name" {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="badge-description">{pt.gamification.badges.form.description}</FieldLabel>
        <Textarea id="badge-description" rows={2} {...register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="badge-icon">{pt.gamification.badges.form.icon}</FieldLabel>
          <Input id="badge-icon" placeholder="🏆" {...register("icon")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="badge-sortOrder">{pt.gamification.badges.form.sortOrder}</FieldLabel>
          <Input id="badge-sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="badge-threshold">{pt.gamification.badges.form.pointsThreshold}</FieldLabel>
        <Controller
          name="pointsThreshold"
          control={control}
          render={({ field }) => (
            <Input
              id="badge-threshold"
              type="number"
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
            />
          )}
        />
        <p className="text-xs text-muted-foreground">{pt.gamification.badges.thresholdHint}</p>
      </Field>

      <Field orientation="horizontal">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} id="badge-isActive" />
          )}
        />
        <FieldLabel htmlFor="badge-isActive">{pt.gamification.badges.form.isActive}</FieldLabel>
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.gamification.badges.form.submitting
          : mode === "create"
            ? pt.gamification.badges.form.submitCreate
            : pt.gamification.badges.form.submitEdit}
      </Button>
    </form>
  );
}
