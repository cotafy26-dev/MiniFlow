import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

interface LogActivityInput {
  tenantId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Json;
}

/**
 * Writes one row to activity_logs via the log_activity() SQL function —
 * the table has no direct INSERT policy, so this RPC is the only write
 * path. Call after auth-sensitive operations (login, password reset,
 * settings change, membership change, ...).
 */
export async function logActivity({
  tenantId,
  action,
  entityType,
  entityId,
  metadata,
}: LogActivityInput) {
  const supabase = await createClient();
  await supabase.rpc("log_activity", {
    p_tenant_id: tenantId,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_metadata: metadata ?? {},
  });
}
