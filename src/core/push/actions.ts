"use server";

import { requireTenantContext } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";

export interface PushActionResult {
  error?: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeToPushAction(
  subscription: PushSubscriptionInput,
  userAgent?: string
): Promise<PushActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: ctx.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: userAgent ?? null,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: error.message };
  return {};
}

export async function unsubscribeFromPushAction(endpoint: string): Promise<PushActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", ctx.userId);

  if (error) return { error: error.message };
  return {};
}
