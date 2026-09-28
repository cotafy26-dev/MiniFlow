import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getTenantSettings(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return data;
}
