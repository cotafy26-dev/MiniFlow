"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updatePasswordAction } from "@/core/auth/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    const result = await updatePasswordAction(values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="password">{pt.auth.resetPassword.password}</FieldLabel>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        <FieldError errors={[errors.password]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="confirmPassword">{pt.auth.resetPassword.confirmPassword}</FieldLabel>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <FieldError errors={[errors.confirmPassword]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? pt.auth.resetPassword.submitting : pt.auth.resetPassword.submit}
      </Button>
    </form>
  );
}
