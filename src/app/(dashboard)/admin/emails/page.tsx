import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { EmailSettingsForm } from "@/components/admin/email-settings-form";
import { getTenantSettings } from "@/core/tenants/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.emails.title };

export default async function AdminEmailsPage() {
  const ctx = await requireTenantContext();
  const settings = ctx.tenant ? await getTenantSettings(ctx.tenant.id) : null;
  const isConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{pt.emails.title}</h2>
        <p className="text-sm text-muted-foreground">{pt.emails.subtitle}</p>
      </div>

      <Badge variant={isConfigured ? "default" : "destructive"} className="w-fit">
        {isConfigured ? pt.emails.statusConfigured : pt.emails.statusMissingKey}
      </Badge>

      <EmailSettingsForm
        defaultValues={{
          subject: settings?.welcome_email_subject ?? "",
          body: settings?.welcome_email_body ?? "",
        }}
      />
    </div>
  );
}
