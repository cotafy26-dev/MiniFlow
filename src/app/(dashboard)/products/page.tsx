import type { Metadata } from "next";

import { ProductCatalog } from "@/components/products-catalog/product-catalog";
import { getProductCategories, getVisibleProducts } from "@/core/products/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.products.catalog.title };

export default async function ProductsCatalogPage() {
  const ctx = await requireTenantContext();

  const [products, categories] = ctx.tenant
    ? await Promise.all([getVisibleProducts(ctx.tenant.id), getProductCategories(ctx.tenant.id)])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{pt.products.catalog.title}</h1>
      <ProductCatalog products={products} categories={categories} />
    </div>
  );
}
