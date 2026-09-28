import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { SiteList } from "@/components/admin/site-list";
import { Button } from "@/components/ui/button";
import { getSitesForAdmin } from "@/core/sites/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.sites.title };

export default async function AdminSitesPage() {
  const ctx = await requireTenantContext();
  const sites = ctx.tenant ? await getSitesForAdmin(ctx.tenant.id) : [];
  const baseDomain = process.env.APPS_BASE_DOMAIN || null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.sites.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.sites.subtitle}</p>
        </div>
        <Button render={<Link href="/admin/sites/new" />}>
          <Plus className="size-4" />
          {pt.sites.newSite}
        </Button>
      </div>

      {!baseDomain && (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          {pt.sites.urlPreviewMissingDomain}
        </p>
      )}

      <SiteList sites={sites} baseDomain={baseDomain} />
    </div>
  );
}
