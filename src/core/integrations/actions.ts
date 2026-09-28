"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import type { IntegrationProvider } from "@/core/integrations/queries";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export interface IntegrationActionResult {
  error?: string;
}

function revalidateIntegrationSurfaces(provider?: IntegrationProvider) {
  revalidatePath("/admin/integrations");
  if (provider) revalidatePath(`/admin/integrations/${provider}`);
}

export async function saveIntegrationAction(
  provider: IntegrationProvider,
  credentials: Json
): Promise<IntegrationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.INTEGRATIONS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("integrations").upsert(
    {
      tenant_id: ctx.tenant.id,
      provider,
      credentials,
      is_active: true,
      created_by: ctx.userId,
    },
    { onConflict: "tenant_id,provider" }
  );

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "integrations.saved",
    entityType: "integration",
    metadata: { provider },
  });
  revalidateIntegrationSurfaces(provider);
  return {};
}

export async function deleteIntegrationAction(id: string, provider: IntegrationProvider): Promise<IntegrationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.INTEGRATIONS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "integrations.deleted",
    entityType: "integration",
    entityId: id,
  });
  revalidateIntegrationSurfaces(provider);
  return {};
}

export async function linkProductToIntegrationAction(
  productId: string,
  integrationId: string,
  externalProductId: string
): Promise<IntegrationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("product_integration_links").insert({
    tenant_id: ctx.tenant.id,
    product_id: productId,
    integration_id: integrationId,
    external_product_id: externalProductId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Esse ID de produto já está vinculado a outro produto nessa integração." };
    }
    return { error: error.message };
  }

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "product_integration_links.created",
    entityType: "product",
    entityId: productId,
    metadata: { integrationId, externalProductId },
  });
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function unlinkProductIntegrationAction(
  linkId: string,
  productId: string
): Promise<IntegrationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_integration_links")
    .delete()
    .eq("id", linkId)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  return {};
}
