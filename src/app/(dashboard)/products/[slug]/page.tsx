import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModuleLessonOutline } from "@/components/products-catalog/module-lesson-outline";
import { ProgressIndicator } from "@/components/products-catalog/progress-indicator";
import {
  getModulesWithLessonsForMember,
  getProductBySlug,
  getProductProgress,
} from "@/core/products/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

function formatPrice(cents: number) {
  if (cents === 0) return pt.products.card.free;
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  // notFound() covers both "doesn't exist" and "RLS says you can't see
  // it" through the same path — never leaking which of the two applies.
  const product = await getProductBySlug(ctx.tenant.id, slug);
  if (!product) notFound();

  const [modules, progress] = await Promise.all([
    getModulesWithLessonsForMember(ctx.tenant.id, product.id),
    getProductProgress(ctx.tenant.id, product.id, ctx.userId),
  ]);

  const supabase = await createClient();
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("product_id", product.id)
    .eq("user_id", ctx.userId);
  const completedLessonIds = new Set((progressRows ?? []).map((r) => r.lesson_id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            className="size-20 shrink-0 rounded-xl border object-cover"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
            🎓
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold">{product.name}</h1>
          {product.description && (
            <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
          )}
          <p className="mt-1 text-sm font-medium text-primary">
            {formatPrice(product.price_cents)}
          </p>
        </div>
      </div>

      <ProgressIndicator
        completed={progress.completedLessons}
        total={progress.totalLessons}
        percent={progress.percent}
      />

      <ModuleLessonOutline
        productSlug={product.slug}
        modules={modules}
        completedLessonIds={completedLessonIds}
      />
    </div>
  );
}
