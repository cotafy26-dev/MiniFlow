import type { Metadata } from "next";

import { MiniAppCategoriesManager } from "@/components/admin/mini-app-categories-manager";
import { getMiniAppCategories } from "@/core/mini-apps/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.miniApps.category.title };

export default async function AdminAppCategoriesPage() {
  const ctx = await requireTenantContext();
  const categories = ctx.tenant ? await getMiniAppCategories(ctx.tenant.id) : [];

  return <MiniAppCategoriesManager categories={categories} />;
}
