"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTicketAction } from "@/core/support/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { newTicketSchema, type NewTicketValues } from "@/lib/validations/support";

export function NewTicketForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewTicketValues>({ resolver: zodResolver(newTicketSchema) });

  async function onSubmit(values: NewTicketValues) {
    setFormError(null);
    const result = await createTicketAction(values.subject, values.body);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    router.push(`/support/${result.ticketId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-xl border p-4">
      <Field>
        <FieldLabel htmlFor="ticket-subject">{pt.support.subjectLabel}</FieldLabel>
        <Input id="ticket-subject" placeholder={pt.support.subjectPlaceholder} {...register("subject")} />
        <FieldError errors={[errors.subject]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="ticket-body">{pt.support.bodyLabel}</FieldLabel>
        <Textarea id="ticket-body" rows={5} placeholder={pt.support.bodyPlaceholder} {...register("body")} />
        <FieldError errors={[errors.body]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? pt.support.submitting : pt.support.submit}
      </Button>
    </form>
  );
}
