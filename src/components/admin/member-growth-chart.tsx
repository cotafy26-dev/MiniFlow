import type { MemberGrowthPoint } from "@/core/analytics/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

function formatDate(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

export function MemberGrowthChart({ points }: { points: MemberGrowthPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm font-medium">{pt.analytics.growthTitle}</p>

      <div className="flex h-32 items-end gap-0.5">
        {points.map((point) => (
          <div
            key={point.date}
            title={`${formatDate(point.date)}: ${point.count} novo(s) membro(s)`}
            className="flex-1 rounded-t-sm bg-primary/70 hover:bg-primary"
            style={{ height: `${Math.max(2, (point.count / max) * 100)}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{points[0] ? formatDate(points[0].date) : ""}</span>
        <span>{points.at(-1) ? formatDate(points.at(-1)!.date) : ""}</span>
      </div>
    </div>
  );
}
