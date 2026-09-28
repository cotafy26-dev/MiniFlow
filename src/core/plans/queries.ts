import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Plan = Database["public"]["Tables"]["plans"]["Row"];

export interface TenantPlanUsage {
  plan: Plan | null;
  memberCount: number;
  miniAppCount: number;
  productCount: number;
}

export async function getActivePlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("is_active", true).order("sort_order");
  return data ?? [];
}

export async function getAllPlansForAdmin(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").order("sort_order");
  return data ?? [];
}

export async function getPlanByKey(key: string): Promise<Plan | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").eq("key", key).maybeSingle();
  return data;
}

export async function getTenantPlanUsage(tenantId: string): Promise<TenantPlanUsage> {
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan_key")
    .eq("id", tenantId)
    .maybeSingle();

  const [{ data: plan }, memberCount, miniAppCount, productCount] = await Promise.all([
    tenant?.plan_key
      ? supabase.from("plans").select("*").eq("key", tenant.plan_key).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("tenant_memberships")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase.from("mini_apps").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);

  return {
    plan: plan ?? null,
    memberCount: memberCount.count ?? 0,
    miniAppCount: miniAppCount.count ?? 0,
    productCount: productCount.count ?? 0,
  };
}
