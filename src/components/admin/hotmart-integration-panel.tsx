"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteIntegrationAction, saveIntegrationAction } from "@/core/integrations/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";
import {
  hotmartCredentialsSchema,
  type HotmartCredentialsValues,
} from "@/lib/validations/integrations";

function ConnectForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HotmartCredentialsValues>({ resolver: zodResolver(hotmartCredentialsSchema) });

  async function onSubmit(values: HotmartCredentialsValues) {
    setFormError(null);
    const result = await saveIntegrationAction("hotmart", values);
    if (result?.error) setFormError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4 rounded-xl border p-4">
      <h3 className="text-sm font-semibold">{pt.integrations.hotmart.connectTitle}</h3>
      <Field>
        <FieldLabel htmlFor="token">{pt.integrations.hotmart.tokenLabel}</FieldLabel>
        <Input id="token" {...register("token")} />
        <FieldError errors={[errors.token]} />
        <p className="text-xs text-muted-foreground">{pt.integrations.hotmart.tokenHint}</p>
      </Field>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? pt.integrations.hotmart.saving : pt.integrations.hotmart.save}
      </Button>
    </form>
  );
}

function ConnectedPanel({ integrationId, webhookUrl }: { integrationId: string; webhookUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDisconnect() {
    if (!window.confirm(pt.integrations.hotmart.disconnectConfirm)) return;
    setIsDisconnecting(true);
    const result = await deleteIntegrationAction(integrationId, "hotmart");
    setIsDisconnecting(false);
    if (result?.error) toast.error(result.error);
  }

  return (
    <div className="flex max-w-md flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{pt.integrations.hotmart.connectTitle}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDisconnecting}
          onClick={handleDisconnect}
        >
          {pt.integrations.hotmart.disconnect}
        </Button>
      </div>
      <Field>
        <FieldLabel htmlFor="webhookUrl">{pt.integrations.hotmart.webhookUrlLabel}</FieldLabel>
        <div className="flex gap-2">
          <Input id="webhookUrl" readOnly value={webhookUrl} className="font-mono text-xs" />
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? pt.integrations.hotmart.copied : pt.integrations.hotmart.copyButton}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{pt.integrations.hotmart.webhookUrlHint}</p>
      </Field>
    </div>
  );
}

export function HotmartIntegrationPanel({
  integrationId,
  webhookUrl,
}: {
  integrationId: string | null;
  webhookUrl: string;
}) {
  if (!integrationId) return <ConnectForm />;
  return <ConnectedPanel integrationId={integrationId} webhookUrl={webhookUrl} />;
}
