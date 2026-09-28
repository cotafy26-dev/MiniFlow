import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductAccessManager } from "@/components/admin/product-access-manager";
import { ProductEditDialog } from "@/components/admin/product-edit-dialog";
import { ProductIntegrationLinks } from "@/components/admin/product-integration-links";
import { ProductModuleTree } from "@/components/admin/product-module-tree";
import { Badge } from "@/components/ui/badge";
import { getIntegrationsForAdmin, getProductIntegrationLinks } from "@/core/integrations/queries";
import {
  getModulesWithLessonsForAdmin,
  getProductAccessGrants,
  getProductById,
  getProductCategories,
} from "@/core/products/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { getTenantMembersForAdmin } from "@/core/users/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const [product, categories, modules, grants, members, integrations, integrationLinks] = await Promise.all([
    getProductById(ctx.tenant.id, id),
    getProductCategories(ctx.tenant.id),
    getModulesWithLessonsForAdmin(ctx.tenant.id, id),
    getProductAccessGrants(ctx.tenant.id, id),
    getTenantMembersForAdmin(ctx.tenant.id),
    getIntegrationsForAdmin(ctx.tenant.id),
    getProductIntegrationLinks(id),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <Badge variant={product.status === "published" ? "default" : "secondary"}>
              {pt.miniApps.status[product.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPrice(product.price_cents)}
            {product.categoryName ? ` · ${product.categoryName}` : ""}
          </p>
          {product.description && (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>
        <ProductEditDialog product={product} categories={categories} />
      </div>

      <ProductModuleTree productId={product.id} modules={modules} />

      <ProductAccessManager productId={product.id} grants={grants} members={members} />

      <ProductIntegrationLinks
        productId={product.id}
        links={integrationLinks}
        availableIntegrations={integrations.filter((i) => i.is_active)}
      />
    </div>
  );
}
