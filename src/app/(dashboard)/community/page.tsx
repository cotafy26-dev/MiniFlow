import type { Metadata } from "next";

import { CommunityCatalog } from "@/components/community/community-catalog";
import { getVisibleCommunities } from "@/core/communities/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.community.catalog.title };

export default async function CommunityCatalogPage() {
  const ctx = await requireTenantContext();
  const communities = ctx.tenant ? await getVisibleCommunities(ctx.tenant.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{pt.community.catalog.title}</h1>
      <CommunityCatalog communities={communities} />
    </div>
  );
}
