import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { getProductCategories } from "@/core/products/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.products.admin.newProduct };

export default async function NewProductPage() {
  const ctx = await requireTenantContext();
  const categories = ctx.tenant ? await getProductCategories(ctx.tenant.id) : [];

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{pt.products.admin.newProduct}</h2>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
