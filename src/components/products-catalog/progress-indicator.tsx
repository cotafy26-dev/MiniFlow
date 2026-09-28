import { pt } from "@/lib/i18n/dictionaries/pt";

export function ProgressIndicator({
  completed,
  total,
  percent,
}: {
  completed: number;
  total: number;
  percent: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {completed} {pt.products.detail.of} {total} {pt.products.detail.lessonsCompleted}
      </p>
    </div>
  );
}
