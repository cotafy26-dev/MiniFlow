import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { LessonCompleteToggle } from "@/components/lessons/lesson-complete-toggle";
import { LessonContentRenderer } from "@/components/lessons/lesson-content-renderer";
import {
  getAdjacentLessons,
  getLessonForViewer,
  getProductBySlug,
} from "@/core/products/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  return { title: lessonId };
}

export default async function LessonViewerPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const product = await getProductBySlug(ctx.tenant.id, slug);
  if (!product) notFound();

  // notFound() covers both "doesn't exist" and "RLS blocked it" — same
  // reasoning as every other member-facing detail lookup in the app.
  const lesson = await getLessonForViewer(ctx.tenant.id, lessonId);
  if (!lesson || lesson.product_id !== product.id) notFound();

  const [{ previous, next }, supabase] = await Promise.all([
    getAdjacentLessons(ctx.tenant.id, product.id, lessonId),
    createClient(),
  ]);

  const { data: progressRow } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/products/${slug}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {product.name}
      </Link>

      <h1 className="text-xl font-semibold">{lesson.name}</h1>
      {lesson.description && <p className="text-sm text-muted-foreground">{lesson.description}</p>}

      <LessonContentRenderer lesson={lesson} />

      <LessonCompleteToggle lessonId={lesson.id} initiallyCompleted={!!progressRow} />

      <div className="flex items-center justify-between border-t pt-4">
        {previous ? (
          <Link
            href={`/products/${slug}/lessons/${previous.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            {previous.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/products/${slug}/lessons/${next.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {next.name}
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
