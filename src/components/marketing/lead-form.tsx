"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createLeadAction } from "@/core/leads/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { leadSchema, type LeadValues } from "@/lib/validations/leads";

export function LeadForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadValues>({ resolver: zodResolver(leadSchema) });

  async function onSubmit(values: LeadValues) {
    setFormError(null);
    const result = await createLeadAction(values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <h3 className="text-lg font-semibold">{pt.marketing.plans.successTitle}</h3>
        <p className="text-sm text-muted-foreground">{pt.marketing.plans.successBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-xl border bg-card p-6 text-left"
    >
      <div>
        <h3 className="text-lg font-semibold">{pt.marketing.plans.formTitle}</h3>
        <p className="text-sm text-muted-foreground">{pt.marketing.plans.formSubtitle}</p>
      </div>

      <Field>
        <FieldLabel htmlFor="lead-name">{pt.marketing.plans.nameLabel}</FieldLabel>
        <Input id="lead-name" autoComplete="name" {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="lead-email">{pt.marketing.plans.emailLabel}</FieldLabel>
        <Input id="lead-email" type="email" autoComplete="email" {...register("email")} />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="lead-whatsapp">{pt.marketing.plans.whatsappLabel}</FieldLabel>
        <Input id="lead-whatsapp" type="tel" placeholder="(00) 00000-0000" {...register("whatsapp")} />
        <FieldError errors={[errors.whatsapp]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="lead-message">{pt.marketing.plans.messageLabel}</FieldLabel>
        <Textarea id="lead-message" rows={3} {...register("message")} />
        <FieldError errors={[errors.message]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? pt.marketing.plans.submitting : pt.marketing.plans.submit}
      </Button>
    </form>
  );
}
