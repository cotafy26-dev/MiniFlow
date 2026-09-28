import type { IntegrationProvider } from "@/core/integrations/queries";

export interface NormalizedWebhookEvent {
  action: "grant" | "revoke" | "ignore";
  eventType: string;
  externalProductId: string | null;
  buyerEmail: string | null;
}

export type WebhookAdapterResult = { event: NormalizedWebhookEvent } | { error: string };

/**
 * One adapter per payment provider — each has its own payload shape and
 * verification mechanism, so this is never assumed to be uniform across
 * providers (Hotmart embeds a shared secret in the body; others may sign
 * the raw body or use a header instead).
 */
export type WebhookAdapter = (payload: unknown, credentials: Record<string, unknown>) => WebhookAdapterResult;

export type ProviderAdapterRegistry = Partial<Record<IntegrationProvider, WebhookAdapter>>;
