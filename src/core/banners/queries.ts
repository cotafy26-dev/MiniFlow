import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Banner = Database["public"]["Tables"]["banners"]["Row"];

export async function getBannersForAdmin(tenantId: string): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order");
  return data ?? [];
}

export async function getBannerById(id: string): Promise<Banner | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("banners").select("*").eq("id", id).maybeSingle();
  return data;
}

/**
 * Dashboard-facing read. RLS (banners_select_visible) already restricts
 * this to active banners currently inside their display window — no
 * extra filtering needed here, same as getFeaturedMiniApps().
 */
export async function getActiveBanners(tenantId: string, limit = 8): Promise<Banner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .limit(limit);
  return data ?? [];
}
