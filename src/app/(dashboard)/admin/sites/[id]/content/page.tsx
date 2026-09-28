import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteContentForm } from "@/components/admin/site-content-form";
import { getSiteById } from "@/core/sites/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.sites.contentTitle };

export default async function SiteContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const site = await getSiteById(ctx.tenant.id, id);
  if (!site) notFound();

  const baseDomain = process.env.APPS_BASE_DOMAIN || null;

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{site.name}</h2>
        <p className="text-sm text-muted-foreground">
          {baseDomain ? `https://${site.subdomain}.${baseDomain}` : pt.sites.urlPreviewMissingDomain}
        </p>
      </div>
      <SiteContentForm siteId={site.id} defaultValues={{ htmlContent: site.html_content ?? "" }} />
    </div>
  );
}
