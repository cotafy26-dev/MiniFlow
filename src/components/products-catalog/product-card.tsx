import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Product } from "@/core/products/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { cn } from "@/lib/utils";

function formatPrice(cents: number) {
  if (cents === 0) return pt.products.card.free;
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const orientationAspect: Record<Product["card_orientation"], string> = {
  square: "aspect-square",
  vertical: "aspect-[2/3]",
  horizontal: "aspect-[2/1]",
};

export function ProductCard({ product }: { product: Product }) {
  const aspectClass = orientationAspect[product.card_orientation];

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt=""
          className={cn("w-full rounded-lg object-cover", aspectClass)}
        />
      ) : (
        <div className={cn("flex w-full items-center justify-center rounded-lg bg-muted text-4xl", aspectClass)}>
          🎓
        </div>
      )}

      <div className="flex-1">
        <p className="font-medium">{product.name}</p>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <p className="mt-1 text-sm font-medium text-primary">{formatPrice(product.price_cents)}</p>
      </div>

      <Button size="sm" className="w-full" render={<Link href={`/products/${product.slug}`} />}>
        {pt.products.card.open}
      </Button>
    </div>
  );
}
