import { parseHotmartWebhook } from "@/core/integrations/providers/hotmart";
import type { ProviderAdapterRegistry } from "@/core/integrations/providers/types";

/**
 * Only Hotmart has a real adapter for now — its webhook format (hottok +
 * event + data.buyer/product) is well documented. The other catalog
 * providers (kiwify, cartpanda, eduzz, greenn, celetus) intentionally have
 * no entry here until their real payload shape is confirmed; the webhook
 * route treats a missing entry as "provider not yet supported" rather than
 * guessing a format.
 */
export const PROVIDER_ADAPTERS: ProviderAdapterRegistry = {
  hotmart: parseHotmartWebhook,
};

export type { NormalizedWebhookEvent, WebhookAdapterResult } from "@/core/integrations/providers/types";
