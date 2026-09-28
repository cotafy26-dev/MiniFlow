"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/core/auth/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    const result = await requestPasswordResetAction(values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <MailCheck className="size-10 text-primary" />
        <h2 className="text-lg font-semibold">{pt.auth.forgotPassword.successTitle}</h2>
        <p className="text-sm text-muted-foreground">{pt.auth.forgotPassword.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="email">{pt.auth.forgotPassword.email}</FieldLabel>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        <FieldError errors={[errors.email]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? pt.auth.forgotPassword.submitting : pt.auth.forgotPassword.submit}
      </Button>
    </form>
  );
}
