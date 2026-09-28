import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface MemberStats {
  total: number;
  active: number;
  suspended: number;
  invited: number;
}

export interface MemberGrowthPoint {
  date: string;
  count: number;
}

export async function getMemberStats(tenantId: string): Promise<MemberStats> {
  const supabase = await createClient();
  const { data } = await supabase.from("tenant_memberships").select("status").eq("tenant_id", tenantId);
  const rows = data ?? [];

  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    suspended: rows.filter((r) => r.status === "suspended").length,
    invited: rows.filter((r) => r.status === "invited").length,
  };
}

export async function getMemberGrowth(tenantId: string, days = 30): Promise<MemberGrowthPoint[]> {
  const supabase = await createClient();

  // Bucket boundaries must stay in UTC throughout — created_at is stored
  // as UTC and bucketed below via its ISO string's date part (slice(0,10)).
  // Mixing that with a local-timezone Date (setDate/getHours) would shift
  // entries created late in the day into the wrong bucket, or outside the
  // window entirely, for any server timezone west of UTC.
  const now = new Date();
  const todayUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const sinceUtcMidnight = todayUtcMidnight - (days - 1) * dayMs;

  const { data } = await supabase
    .from("tenant_memberships")
    .select("created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", new Date(sinceUtcMidnight).toISOString());

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const dayIso = new Date(sinceUtcMidnight + i * dayMs).toISOString().slice(0, 10);
    counts.set(dayIso, 0);
  }

  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}
