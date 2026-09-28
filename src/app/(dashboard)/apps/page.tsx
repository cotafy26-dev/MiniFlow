import type { Metadata } from "next";

import { AppsCatalog } from "@/components/apps-catalog/apps-catalog";
import { getMiniAppCategories, getVisibleMiniApps } from "@/core/mini-apps/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.apps.catalog.title };

export default async function AppsCatalogPage() {
  const ctx = await requireTenantContext();

  const [apps, categories] = ctx.tenant
    ? await Promise.all([
        getVisibleMiniApps(ctx.tenant.id),
        getMiniAppCategories(ctx.tenant.id),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{pt.apps.catalog.title}</h1>
      <AppsCatalog apps={apps} categories={categories} />
    </div>
  );
}
