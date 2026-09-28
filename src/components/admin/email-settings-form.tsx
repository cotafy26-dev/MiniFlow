"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendTestWelcomeEmailAction, updateEmailSettingsAction } from "@/core/email/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { emailSettingsSchema, type EmailSettingsValues } from "@/lib/validations/email";

export function EmailSettingsForm({ defaultValues }: { defaultValues?: Partial<EmailSettingsValues> }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: { subject: "", body: "", ...defaultValues },
  });

  async function onSubmit(values: EmailSettingsValues) {
    setFormError(null);
    const result = await updateEmailSettingsAction(values);
    if (result?.error) {
      setFormError(result.error);
      return;
    }
    toast.success(pt.emails.submit);
  }

  async function handleSendTest() {
    setIsSendingTest(true);
    const result = await sendTestWelcomeEmailAction(getValues());
    setIsSendingTest(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(pt.emails.sendTestSuccess);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="subject">{pt.emails.subjectLabel}</FieldLabel>
        <Input id="subject" placeholder="Bem-vindo(a) ao {{tenantName}}!" {...register("subject")} />
        <FieldError errors={[errors.subject]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="body">{pt.emails.bodyLabel}</FieldLabel>
        <Textarea id="body" rows={6} {...register("body")} />
        <p className="text-xs text-muted-foreground">{pt.emails.bodyHint}</p>
        <p className="text-xs text-muted-foreground">{pt.emails.placeholdersHint}</p>
        <FieldError errors={[errors.body]} />
      </Field>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? pt.emails.submitting : pt.emails.submit}
        </Button>
        <Button type="button" variant="outline" disabled={isSendingTest} onClick={handleSendTest}>
          {isSendingTest ? pt.emails.sendTestSubmitting : pt.emails.sendTest}
        </Button>
      </div>
    </form>
  );
}
