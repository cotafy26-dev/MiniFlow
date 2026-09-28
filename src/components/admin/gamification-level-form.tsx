"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createLevelAction, updateLevelAction } from "@/core/gamification/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { gamificationLevelSchema, type GamificationLevelValues } from "@/lib/validations/gamification";

export function GamificationLevelForm({
  mode,
  levelId,
  defaultValues,
  onSuccess,
}: {
  mode: "create" | "edit";
  levelId?: string;
  defaultValues?: Partial<GamificationLevelValues>;
  onSuccess?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GamificationLevelValues>({
    resolver: zodResolver(gamificationLevelSchema),
    defaultValues: { minPoints: 0, sortOrder: 0, ...defaultValues },
  });

  async function onSubmit(values: GamificationLevelValues) {
    setFormError(null);
    const result =
      mode === "create" ? await createLevelAction(values) : await updateLevelAction(levelId!, values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="lvl-name">{pt.gamification.levels.form.name}</FieldLabel>
        <Input id="lvl-name" {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="lvl-minPoints">{pt.gamification.levels.form.minPoints}</FieldLabel>
          <Input id="lvl-minPoints" type="number" {...register("minPoints", { valueAsNumber: true })} />
          <FieldError errors={[errors.minPoints]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="lvl-sortOrder">{pt.gamification.levels.form.sortOrder}</FieldLabel>
          <Input id="lvl-sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
        </Field>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting
          ? pt.gamification.levels.form.submitting
          : mode === "create"
            ? pt.gamification.levels.form.submitCreate
            : pt.gamification.levels.form.submitEdit}
      </Button>
    </form>
  );
}
