import type { MemberStats } from "@/core/analytics/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function MemberStatsCards({ stats }: { stats: MemberStats }) {
  const items = [
    { label: pt.analytics.totalMembers, value: stats.total },
    { label: pt.analytics.activeMembers, value: stats.active },
    { label: pt.analytics.suspendedMembers, value: stats.suspended },
    { label: pt.analytics.invitedMembers, value: stats.invited },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1 rounded-xl border p-4">
          <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
