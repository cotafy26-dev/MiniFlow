"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpWithPasswordAction } from "@/core/auth/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    const result = await signUpWithPasswordAction(values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    if (result?.needsEmailConfirmation) {
      setEmailSent(true);
    }
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <MailCheck className="size-10 text-primary" />
        <h2 className="text-lg font-semibold">{pt.auth.register.checkEmailTitle}</h2>
        <p className="text-sm text-muted-foreground">{pt.auth.register.checkEmailBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="fullName">{pt.auth.register.fullName}</FieldLabel>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        <FieldError errors={[errors.fullName]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="tenantName">{pt.auth.register.tenantName}</FieldLabel>
        <Input id="tenantName" autoComplete="organization" {...register("tenantName")} />
        <FieldError errors={[errors.tenantName]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="email">{pt.auth.register.email}</FieldLabel>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="password">{pt.auth.register.password}</FieldLabel>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        <FieldError errors={[errors.password]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="confirmPassword">{pt.auth.register.confirmPassword}</FieldLabel>
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
        {isSubmitting ? pt.auth.register.submitting : pt.auth.register.submit}
      </Button>
    </form>
  );
}
