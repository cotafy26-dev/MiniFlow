import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PlatformLead = Database["public"]["Tables"]["platform_leads"]["Row"];

export async function getPlatformLeadsForAdmin(): Promise<PlatformLead[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("platform_leads").select("*").order("created_at", { ascending: false });

  return data ?? [];
}
