import type { Metadata } from "next";

import { ProductCategoriesManager } from "@/components/admin/product-categories-manager";
import { getProductCategories } from "@/core/products/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.products.category.title };

export default async function AdminProductCategoriesPage() {
  const ctx = await requireTenantContext();
  const categories = ctx.tenant ? await getProductCategories(ctx.tenant.id) : [];

  return <ProductCategoriesManager categories={categories} />;
}
