import type { WebhookAdapter } from "@/core/integrations/providers/types";

const GRANT_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKE_EVENTS = new Set([
  "PURCHASE_CANCELED",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_EXPIRED",
  "SUBSCRIPTION_CANCELLATION",
]);

interface HotmartPayload {
  event?: string;
  hottok?: string;
  data?: {
    product?: { id?: string | number };
    buyer?: { email?: string };
  };
}

/**
 * Hotmart includes the "Hottok" (a shared secret configured in the seller's
 * Hotmart panel) directly in the JSON body as `hottok` — not as a signed
 * header — so verification is a plain string comparison against the token
 * stored for this integration.
 */
export const parseHotmartWebhook: WebhookAdapter = (payload, credentials) => {
  if (typeof payload !== "object" || payload === null) {
    return { error: "Payload inválido: esperado um objeto JSON." };
  }

  const body = payload as HotmartPayload;
  const expectedToken = typeof credentials.token === "string" ? credentials.token : "";

  if (!expectedToken || body.hottok !== expectedToken) {
    return { error: "Hottok inválido." };
  }

  const eventType = body.event ?? "UNKNOWN";
  const action = GRANT_EVENTS.has(eventType) ? "grant" : REVOKE_EVENTS.has(eventType) ? "revoke" : "ignore";

  const rawProductId = body.data?.product?.id;
  const externalProductId = rawProductId === undefined || rawProductId === null ? null : String(rawProductId);
  const buyerEmail = body.data?.buyer?.email ?? null;

  return {
    event: { action, eventType, externalProductId, buyerEmail },
  };
};
