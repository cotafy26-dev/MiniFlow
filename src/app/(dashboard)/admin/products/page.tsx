import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { ProductList } from "@/components/admin/product-list";
import { Button } from "@/components/ui/button";
import { getProductsForAdmin } from "@/core/products/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.products.admin.title };

export default async function AdminProductsPage() {
  const ctx = await requireTenantContext();
  const products = ctx.tenant ? await getProductsForAdmin(ctx.tenant.id) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pt.products.admin.title}</h2>
          <p className="text-sm text-muted-foreground">{pt.products.admin.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/products/categories" />}>
            {pt.products.admin.manageCategories}
          </Button>
          <Button render={<Link href="/admin/products/new" />}>
            <Plus className="size-4" />
            {pt.products.admin.newProduct}
          </Button>
        </div>
      </div>

      <ProductList products={products} />
    </div>
  );
}
