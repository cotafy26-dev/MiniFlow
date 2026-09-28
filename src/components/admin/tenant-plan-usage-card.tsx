import { Badge } from "@/components/ui/badge";
import type { TenantPlanUsage } from "@/core/plans/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{limit === null ? pt.plans.unlimited : `${used}/${limit}`}</span>
      </div>
      {limit !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={pct >= 100 ? "h-full bg-destructive" : "h-full bg-primary"}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function TenantPlanUsageCard({ usage }: { usage: TenantPlanUsage }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pt.plans.currentPlan}</p>
        <Badge>{usage.plan?.name ?? "—"}</Badge>
      </div>

      <UsageBar label={pt.plans.usageMiniApps} used={usage.miniAppCount} limit={usage.plan?.max_mini_apps ?? null} />
      <UsageBar label={pt.plans.usageProducts} used={usage.productCount} limit={usage.plan?.max_products ?? null} />

      <div className="flex items-center justify-between text-sm">
        <span>{pt.plans.memberCount}</span>
        <span className="text-muted-foreground">{usage.memberCount}</span>
      </div>
    </div>
  );
}
