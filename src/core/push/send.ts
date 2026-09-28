import "server-only";

import webpush from "web-push";

import { createAdminClient } from "@/lib/supabase/server";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;

  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
  return true;
}

/**
 * Reads the RECIPIENT's own subscriptions — not the caller's — so this
 * always goes through the service-role client rather than the session-
 * bound one. Silently no-ops without VAPID keys configured, same
 * graceful-degradation discipline as core/email/send.ts.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapidConfigured()) return;

  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  for (const subscription of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
        },
        JSON.stringify(payload)
      );
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
      }
    }
  }
}
