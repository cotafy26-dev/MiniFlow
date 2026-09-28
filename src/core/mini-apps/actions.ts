"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { MiniAppCategoryValues, MiniAppValues } from "@/lib/validations/mini-apps";

export interface MiniAppActionResult {
  error?: string;
}

function revalidateAppsSurfaces() {
  revalidatePath("/admin/apps");
  revalidatePath("/apps");
  revalidatePath("/dashboard");
}

export async function createMiniAppCategoryAction(
  values: MiniAppCategoryValues
): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mini_app_categories")
    .insert({
      tenant_id: ctx.tenant.id,
      name: values.name,
      slug: values.slug,
      icon: values.icon || null,
      sort_order: values.sortOrder,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_app_categories.created",
    entityType: "mini_app_category",
    entityId: data.id,
  });
  revalidateAppsSurfaces();
  return {};
}

export async function updateMiniAppCategoryAction(
  id: string,
  values: MiniAppCategoryValues
): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_app_categories")
    .update({
      name: values.name,
      slug: values.slug,
      icon: values.icon || null,
      sort_order: values.sortOrder,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_app_categories.updated",
    entityType: "mini_app_category",
    entityId: id,
  });
  revalidateAppsSurfaces();
  return {};
}

export async function deleteMiniAppCategoryAction(id: string): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_app_categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_app_categories.deleted",
    entityType: "mini_app_category",
    entityId: id,
  });
  revalidateAppsSurfaces();
  return {};
}

async function syncVisibleRoles(miniAppId: string, roleIds: string[]) {
  const supabase = await createClient();
  await supabase.from("mini_app_visible_roles").delete().eq("mini_app_id", miniAppId);
  if (roleIds.length > 0) {
    await supabase
      .from("mini_app_visible_roles")
      .insert(roleIds.map((roleId) => ({ mini_app_id: miniAppId, role_id: roleId })));
  }
}

export async function createMiniAppAction(values: MiniAppValues): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mini_apps")
    .insert({
      tenant_id: ctx.tenant.id,
      category_id: values.categoryId || null,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      icon: values.icon || null,
      image_url: values.imageUrl || null,
      url: values.url || null,
      content_html: values.contentHtml || null,
      ai_system_prompt: values.aiSystemPrompt || null,
      type: values.type,
      status: values.status,
      is_active: values.isActive,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
      required_plan: values.requiredPlan,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await syncVisibleRoles(data.id, values.visibleToRoleIds);
  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_apps.created",
    entityType: "mini_app",
    entityId: data.id,
  });
  revalidateAppsSurfaces();
  redirect("/admin/apps");
}

export async function updateMiniAppAction(
  id: string,
  values: MiniAppValues
): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_apps")
    .update({
      category_id: values.categoryId || null,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      icon: values.icon || null,
      image_url: values.imageUrl || null,
      url: values.url || null,
      content_html: values.contentHtml || null,
      ai_system_prompt: values.aiSystemPrompt || null,
      type: values.type,
      status: values.status,
      is_active: values.isActive,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
      required_plan: values.requiredPlan,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await syncVisibleRoles(id, values.visibleToRoleIds);
  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_apps.updated",
    entityType: "mini_app",
    entityId: id,
  });
  revalidateAppsSurfaces();
  redirect("/admin/apps");
}

export async function deleteMiniAppAction(id: string): Promise<MiniAppActionResult> {
  const ctx = await requirePermission(PERMISSIONS.APPS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mini_apps")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "mini_apps.deleted",
    entityType: "mini_app",
    entityId: id,
  });
  revalidateAppsSurfaces();
  return {};
}
