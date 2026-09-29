"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/core/products/actions";
import type { ProductWithRelations } from "@/core/products/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

const statusVariant = {
  draft: "secondary",
  published: "default",
  archived: "outline",
} as const;

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductList({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {pt.products.admin.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {products.map((product) => (
        <div key={product.id} className="flex items-center gap-3 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
            🎓
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <Badge variant={statusVariant[product.status]}>
                {pt.miniApps.status[product.status]}
              </Badge>
              {!product.is_active && <Badge variant="outline">Inativo</Badge>}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {formatPrice(product.price_cents)}
              {product.categoryName ? ` · ${product.categoryName}` : ""}
            </p>
          </div>

          <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/products/${product.id}`} />}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDeleteButton
            confirmMessage={pt.products.admin.deleteConfirm}
            ariaLabel={pt.miniApps.admin.delete}
            onDelete={() => deleteProductAction(product.id)}
          />
        </div>
      ))}
    </div>
  );
}
