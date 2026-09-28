import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Site = Database["public"]["Tables"]["sites"]["Row"];

export async function getSitesForAdmin(tenantId: string): Promise<Site[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSiteById(tenantId: string, id: string): Promise<Site | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  return data;
}
