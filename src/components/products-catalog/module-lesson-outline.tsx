import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import type { ModuleWithLessons } from "@/core/products/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { cn } from "@/lib/utils";

export function ModuleLessonOutline({
  productSlug,
  modules,
  completedLessonIds,
}: {
  productSlug: string;
  modules: ModuleWithLessons[];
  completedLessonIds: Set<string>;
}) {
  return (
    <div className="flex flex-col gap-4">
      {modules.map((module) => (
        <div key={module.id} className="rounded-xl border">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-semibold">{module.name}</p>
          </div>
          <div className="flex flex-col divide-y">
            {module.lessons.map((lesson) => {
              const completed = completedLessonIds.has(lesson.id);
              return (
                <Link
                  key={lesson.id}
                  href={`/products/${productSlug}/lessons/${lesson.id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent"
                >
                  {completed ? (
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={cn(completed && "text-muted-foreground line-through")}>
                    {lesson.name}
                  </span>
                </Link>
              );
            })}
            {module.lessons.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                {pt.products.detail.emptyModule}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
