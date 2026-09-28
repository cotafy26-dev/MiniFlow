"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInWithPasswordAction } from "@/core/auth/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const result = await signInWithPasswordAction(values, redirectTo);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="email">{pt.auth.login.email}</FieldLabel>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="password">{pt.auth.login.password}</FieldLabel>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {pt.auth.login.forgotPassword}
          </Link>
        </div>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        <FieldError errors={[errors.password]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? pt.auth.login.submitting : pt.auth.login.submit}
      </Button>
    </form>
  );
}
