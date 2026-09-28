import { NextResponse } from "next/server";

import { INTEGRATION_PROVIDERS, type IntegrationProvider } from "@/core/integrations/queries";
import { PROVIDER_ADAPTERS } from "@/core/integrations/providers";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WebhookLogInsert = Database["public"]["Tables"]["webhook_logs"]["Insert"];

async function logWebhook(
  supabase: ReturnType<typeof createAdminClient>,
  log: WebhookLogInsert
) {
  await supabase.from("webhook_logs").insert(log);
}

/**
 * Receives purchase/subscription events from payment providers. No
 * authenticated session exists here (this is called by an external
 * platform, not a MiniFlow user), so it uses createAdminClient()
 * throughout — the integration id in the URL is what identifies the
 * tenant, and the provider-specific adapter is what actually verifies the
 * caller is who it claims to be (Hotmart: the `hottok` shared secret).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string; integrationId: string }> }
) {
  const { provider: rawProvider, integrationId } = await params;
  const supabase = createAdminClient();

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    await logWebhook(supabase, {
      tenant_id: null,
      integration_id: null,
      provider: rawProvider,
      event_type: null,
      payload: {},
      status: "error",
      error_message: "Corpo da requisição não é um JSON válido.",
      response_status: 400,
    });
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!INTEGRATION_PROVIDERS.includes(rawProvider as IntegrationProvider)) {
    await logWebhook(supabase, {
      tenant_id: null,
      integration_id: null,
      provider: rawProvider,
      event_type: null,
      payload: payload as Database["public"]["Tables"]["webhook_logs"]["Row"]["payload"],
      status: "error",
      error_message: `Provedor desconhecido: ${rawProvider}.`,
      response_status: 404,
    });
    return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  }
  const provider = rawProvider as IntegrationProvider;

  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration) {
    await logWebhook(supabase, {
      tenant_id: null,
      integration_id: null,
      provider,
      event_type: null,
      payload: payload as Database["public"]["Tables"]["webhook_logs"]["Row"]["payload"],
      status: "error",
      error_message: "Integração não encontrada.",
      response_status: 404,
    });
    return NextResponse.json({ error: "integration_not_found" }, { status: 404 });
  }

  const baseLog = {
    tenant_id: integration.tenant_id,
    integration_id: integration.id,
    provider,
    payload: payload as Database["public"]["Tables"]["webhook_logs"]["Row"]["payload"],
  };

  const adapter = PROVIDER_ADAPTERS[provider];
  if (!adapter) {
    await logWebhook(supabase, {
      ...baseLog,
      event_type: null,
      status: "ignored",
      error_message: "Provedor ainda sem adaptador implementado.",
      response_status: 200,
    });
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  const result = adapter(payload, integration.credentials as Record<string, unknown>);
  if ("error" in result) {
    await logWebhook(supabase, {
      ...baseLog,
      event_type: null,
      status: "error",
      error_message: result.error,
      response_status: 401,
    });
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { event } = result;

  if (event.action === "ignore") {
    await logWebhook(supabase, {
      ...baseLog,
      event_type: event.eventType,
      status: "ignored",
      response_status: 200,
    });
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  if (!event.externalProductId) {
    await logWebhook(supabase, {
      ...baseLog,
      event_type: event.eventType,
      status: "error",
      error_message: "Evento sem ID de produto.",
      response_status: 200,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { data: link } = await supabase
    .from("product_integration_links")
    .select("product_id")
    .eq("integration_id", integration.id)
    .eq("external_product_id", event.externalProductId)
    .maybeSingle();

  if (!link) {
    await logWebhook(supabase, {
      ...baseLog,
      event_type: event.eventType,
      status: "error",
      error_message: `Nenhum produto vinculado ao ID "${event.externalProductId}" nesta integração.`,
      response_status: 200,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (!event.buyerEmail) {
    await logWebhook(supabase, {
      ...baseLog,
      event_type: event.eventType,
      status: "error",
      error_message: "Evento sem e-mail do comprador.",
      response_status: 200,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", event.buyerEmail)
    .maybeSingle();

  if (!profile) {
    await logWebhook(supabase, {
      ...baseLog,
      event_type: event.eventType,
      status: "error",
      error_message: `Nenhuma conta encontrada para ${event.buyerEmail} — o comprador precisa criar uma conta antes.`,
      response_status: 200,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (event.action === "grant") {
    await supabase.from("product_access").upsert(
      {
        tenant_id: integration.tenant_id,
        product_id: link.product_id,
        user_id: profile.id,
      },
      { onConflict: "product_id,user_id", ignoreDuplicates: true }
    );
  } else {
    await supabase
      .from("product_access")
      .delete()
      .eq("product_id", link.product_id)
      .eq("user_id", profile.id);
  }

  await logWebhook(supabase, {
    ...baseLog,
    event_type: event.eventType,
    status: "processed",
    response_status: 200,
  });
  return NextResponse.json({ received: true }, { status: 200 });
}
