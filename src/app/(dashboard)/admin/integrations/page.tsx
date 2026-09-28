import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getIntegrationsForAdmin, INTEGRATION_PROVIDERS } from "@/core/integrations/queries";
import { PROVIDER_ADAPTERS } from "@/core/integrations/providers";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.integrations.catalog.title };

export default async function AdminIntegrationsPage() {
  const ctx = await requireTenantContext();
  const integrations = ctx.tenant ? await getIntegrationsForAdmin(ctx.tenant.id) : [];
  const connectedProviders = new Set(integrations.filter((i) => i.is_active).map((i) => i.provider));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{pt.integrations.catalog.title}</h2>
        <p className="text-sm text-muted-foreground">{pt.integrations.catalog.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {INTEGRATION_PROVIDERS.map((provider) => {
          const hasAdapter = provider in PROVIDER_ADAPTERS;
          const isConnected = connectedProviders.has(provider);

          const card = (
            <div
              key={provider}
              className="flex flex-col gap-2 rounded-xl border bg-card p-4 data-disabled:opacity-50"
              data-disabled={!hasAdapter || undefined}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{pt.integrations.providerNames[provider]}</p>
                {isConnected && <Badge>{pt.integrations.catalog.connectedBadge}</Badge>}
                {!hasAdapter && <Badge variant="outline">{pt.integrations.catalog.comingSoonBadge}</Badge>}
              </div>
            </div>
          );

          return hasAdapter ? (
            <Link key={provider} href={`/admin/integrations/${provider}`}>
              {card}
            </Link>
          ) : (
            card
          );
        })}
      </div>
    </div>
  );
}
