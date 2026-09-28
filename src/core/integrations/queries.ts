import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Integration = Database["public"]["Tables"]["integrations"]["Row"];
export type IntegrationProvider = Integration["provider"];
export type ProductIntegrationLink = Database["public"]["Tables"]["product_integration_links"]["Row"];
export type WebhookLog = Database["public"]["Tables"]["webhook_logs"]["Row"];

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  "hotmart",
  "kiwify",
  "cartpanda",
  "eduzz",
  "greenn",
  "celetus",
];

export async function getIntegrationsForAdmin(tenantId: string): Promise<Integration[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("*").eq("tenant_id", tenantId);
  return data ?? [];
}

export async function getIntegrationByProvider(
  tenantId: string,
  provider: IntegrationProvider
): Promise<Integration | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", provider)
    .maybeSingle();
  return data;
}

export interface ProductIntegrationLinkWithProvider extends ProductIntegrationLink {
  provider: IntegrationProvider;
}

export async function getProductIntegrationLinks(
  productId: string
): Promise<ProductIntegrationLinkWithProvider[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_integration_links")
    .select("*, integrations(provider)")
    .eq("product_id", productId)
    .order("created_at");

  return (data ?? []).map((row) => {
    const { integrations, ...link } = row as ProductIntegrationLink & {
      integrations: { provider: IntegrationProvider } | null;
    };
    return { ...link, provider: integrations?.provider ?? "hotmart" };
  });
}

export async function getWebhookLogs(
  tenantId: string,
  { integrationId, limit = 20 }: { integrationId?: string; limit?: number } = {}
): Promise<WebhookLog[]> {
  const supabase = await createClient();
  let query = supabase
    .from("webhook_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (integrationId) query = query.eq("integration_id", integrationId);

  const { data } = await query;
  return data ?? [];
}
