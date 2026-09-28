import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteForm } from "@/components/admin/site-form";
import { getSiteById } from "@/core/sites/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.sites.edit };

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const site = await getSiteById(ctx.tenant.id, id);
  if (!site) notFound();

  const baseDomain = process.env.APPS_BASE_DOMAIN || null;

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{site.name}</h2>
      <SiteForm
        mode="edit"
        siteId={site.id}
        baseDomain={baseDomain}
        defaultValues={{ name: site.name, subdomain: site.subdomain, isActive: site.is_active }}
      />
    </div>
  );
}
