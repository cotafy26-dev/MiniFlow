"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { acceptInvitationAction } from "@/core/invitations/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { acceptInvitationSchema, type AcceptInvitationValues } from "@/lib/validations/invitations";

export function AcceptInvitationForm({ token }: { token: string }) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({ resolver: zodResolver(acceptInvitationSchema) });

  async function onSubmit(values: AcceptInvitationValues) {
    setFormError(null);
    const result = await acceptInvitationAction(token, values.fullName, values.password);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="fullName">{pt.invite.fullNameLabel}</FieldLabel>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        <FieldError errors={[errors.fullName]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="password">{pt.invite.passwordLabel}</FieldLabel>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        <FieldError errors={[errors.password]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="confirmPassword">{pt.invite.confirmPasswordLabel}</FieldLabel>
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
        {isSubmitting ? pt.invite.submitting : pt.invite.submit}
      </Button>
    </form>
  );
}
