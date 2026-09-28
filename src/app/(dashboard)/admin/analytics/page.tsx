import type { Metadata } from "next";

import { MemberGrowthChart } from "@/components/admin/member-growth-chart";
import { MemberStatsCards } from "@/components/admin/member-stats-cards";
import { getMemberGrowth, getMemberStats } from "@/core/analytics/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.analytics.title };

export default async function AdminAnalyticsPage() {
  const ctx = await requireTenantContext();
  const [stats, growth] = ctx.tenant
    ? await Promise.all([getMemberStats(ctx.tenant.id), getMemberGrowth(ctx.tenant.id)])
    : [{ total: 0, active: 0, suspended: 0, invited: 0 }, []];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{pt.analytics.title}</h2>
        <p className="text-sm text-muted-foreground">{pt.analytics.subtitle}</p>
      </div>

      <MemberStatsCards stats={stats} />
      <MemberGrowthChart points={growth} />
    </div>
  );
}
