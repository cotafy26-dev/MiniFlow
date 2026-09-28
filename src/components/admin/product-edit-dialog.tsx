"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProductWithRelations } from "@/core/products/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function ProductEditDialog({
  product,
  categories,
}: {
  product: ProductWithRelations;
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-4" />
        {pt.products.admin.editProduct}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pt.products.admin.editProduct}</DialogTitle>
        </DialogHeader>
        <ProductForm
          mode="edit"
          productId={product.id}
          categories={categories}
          defaultValues={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            imageUrl: product.image_url ?? "",
            price: product.price_cents / 100,
            categoryId: product.category_id,
            status: product.status,
            accessType: product.access_type,
            cardOrientation: product.card_orientation,
            requiredPlan: product.required_plan,
            isActive: product.is_active,
            isFeatured: product.is_featured,
            sortOrder: product.sort_order,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
