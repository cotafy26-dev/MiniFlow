import type { Metadata } from "next";

import { HotmartIntegrationPanel } from "@/components/admin/hotmart-integration-panel";
import { WebhookLogsList } from "@/components/admin/webhook-logs-list";
import { getIntegrationByProvider, getWebhookLogs } from "@/core/integrations/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.integrations.providerNames.hotmart };

export default async function AdminHotmartIntegrationPage() {
  const ctx = await requireTenantContext();

  const integration = ctx.tenant ? await getIntegrationByProvider(ctx.tenant.id, "hotmart") : null;
  const logs =
    ctx.tenant && integration
      ? await getWebhookLogs(ctx.tenant.id, { integrationId: integration.id })
      : [];

  const webhookUrl = integration
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/hotmart/${integration.id}`
    : "";

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-lg font-semibold">{pt.integrations.providerNames.hotmart}</h2>

      <HotmartIntegrationPanel integrationId={integration?.id ?? null} webhookUrl={webhookUrl} />

      {integration && (
        <div className="flex max-w-md flex-col gap-2 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">{pt.integrations.hotmart.howToTitle}</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            {pt.integrations.hotmart.howToSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {integration && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{pt.integrations.hotmart.logsTitle}</h3>
          <WebhookLogsList logs={logs} />
        </div>
      )}
    </div>
  );
}
