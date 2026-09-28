"use client";

import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";

import { ProductCard } from "@/components/products-catalog/product-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/core/products/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function ProductCatalog({
  products,
  categories,
}: {
  products: Product[];
  categories: ProductCategory[];
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryId && product.category_id !== categoryId) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        (product.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryId]);

  return (
    <div className="flex flex-col gap-5">
      <Input
        placeholder={pt.products.catalog.searchPlaceholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={categoryId === null}
            label={pt.products.catalog.allCategories}
            onClick={() => setCategoryId(null)}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              active={categoryId === category.id}
              label={`${category.icon ?? ""} ${category.name}`.trim()}
              onClick={() => setCategoryId(category.id)}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{pt.products.catalog.emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{pt.products.catalog.emptyBody}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {label}
    </button>
  );
}
