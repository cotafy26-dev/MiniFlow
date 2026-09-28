"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { BannerValues } from "@/lib/validations/banners";

export interface BannerActionResult {
  error?: string;
}

function revalidateBannerSurfaces() {
  revalidatePath("/admin/banners");
  revalidatePath("/dashboard");
}

export async function createBannerAction(values: BannerValues): Promise<BannerActionResult> {
  const ctx = await requirePermission(PERMISSIONS.BANNERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banners")
    .insert({
      tenant_id: ctx.tenant.id,
      title: values.title,
      image_url: values.imageUrl,
      link_url: values.linkUrl || null,
      is_active: values.isActive,
      starts_at: values.startsAt || null,
      ends_at: values.endsAt || null,
      sort_order: values.sortOrder,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "banners.created",
    entityType: "banner",
    entityId: data.id,
  });
  revalidateBannerSurfaces();
  redirect("/admin/banners");
}

export async function updateBannerAction(
  id: string,
  values: BannerValues
): Promise<BannerActionResult> {
  const ctx = await requirePermission(PERMISSIONS.BANNERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("banners")
    .update({
      title: values.title,
      image_url: values.imageUrl,
      link_url: values.linkUrl || null,
      is_active: values.isActive,
      starts_at: values.startsAt || null,
      ends_at: values.endsAt || null,
      sort_order: values.sortOrder,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "banners.updated",
    entityType: "banner",
    entityId: id,
  });
  revalidateBannerSurfaces();
  redirect("/admin/banners");
}

export async function deleteBannerAction(id: string): Promise<BannerActionResult> {
  const ctx = await requirePermission(PERMISSIONS.BANNERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id).eq("tenant_id", ctx.tenant.id);
  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "banners.deleted",
    entityType: "banner",
    entityId: id,
  });
  revalidateBannerSurfaces();
  return {};
}
