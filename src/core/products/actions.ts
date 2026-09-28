"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { awardPoints } from "@/core/gamification/actions";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission, requireTenantContext } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type {
  LessonValues,
  ModuleValues,
  ProductCategoryValues,
  ProductValues,
} from "@/lib/validations/products";
import type { Json } from "@/types/database";

export interface ProductActionResult {
  error?: string;
}

function revalidateProductSurfaces(productId?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  if (productId) revalidatePath(`/admin/products/${productId}`);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createProductCategoryAction(
  values: ProductCategoryValues
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_categories")
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
    action: "product_categories.created",
    entityType: "product_category",
    entityId: data.id,
  });
  revalidateProductSurfaces();
  return {};
}

export async function updateProductCategoryAction(
  id: string,
  values: ProductCategoryValues
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_categories")
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
    action: "product_categories.updated",
    entityType: "product_category",
    entityId: id,
  });
  revalidateProductSurfaces();
  return {};
}

export async function deleteProductCategoryAction(id: string): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "product_categories.deleted",
    entityType: "product_category",
    entityId: id,
  });
  revalidateProductSurfaces();
  return {};
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function createProductAction(values: ProductValues): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      tenant_id: ctx.tenant.id,
      category_id: values.categoryId || null,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      image_url: values.imageUrl || null,
      price_cents: Math.round(values.price * 100),
      status: values.status,
      access_type: values.accessType,
      card_orientation: values.cardOrientation,
      is_active: values.isActive,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
      required_plan: values.requiredPlan,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "products.created",
    entityType: "product",
    entityId: data.id,
  });
  revalidateProductSurfaces();
  redirect(`/admin/products/${data.id}`);
}

export async function updateProductAction(
  id: string,
  values: ProductValues
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      category_id: values.categoryId || null,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      image_url: values.imageUrl || null,
      price_cents: Math.round(values.price * 100),
      status: values.status,
      access_type: values.accessType,
      card_orientation: values.cardOrientation,
      is_active: values.isActive,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
      required_plan: values.requiredPlan,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "products.updated",
    entityType: "product",
    entityId: id,
  });
  revalidateProductSurfaces(id);
  redirect(`/admin/products/${id}`);
}

export async function deleteProductAction(id: string): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "products.deleted",
    entityType: "product",
    entityId: id,
  });
  revalidateProductSurfaces();
  return {};
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export async function createModuleAction(
  productId: string,
  values: ModuleValues
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { data, error } = await supabase
    .from("modules")
    .insert({
      tenant_id: ctx.tenant.id,
      product_id: productId,
      name: values.name,
      description: values.description || null,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "modules.created",
    entityType: "module",
    entityId: data.id,
  });
  revalidateProductSurfaces(productId);
  return {};
}

export async function updateModuleAction(
  id: string,
  values: ModuleValues
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: moduleRow, error } = await supabase
    .from("modules")
    .update({ name: values.name, description: values.description || null })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id)
    .select("product_id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "modules.updated",
    entityType: "module",
    entityId: id,
  });
  revalidateProductSurfaces(moduleRow.product_id);
  return {};
}

export async function deleteModuleAction(id: string): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: moduleRow, error } = await supabase
    .from("modules")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id)
    .select("product_id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "modules.deleted",
    entityType: "module",
    entityId: id,
  });
  revalidateProductSurfaces(moduleRow?.product_id);
  return {};
}

export async function moveModuleAction(
  id: string,
  direction: "up" | "down"
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("modules")
    .select("id, product_id, sort_order")
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id)
    .maybeSingle();

  if (!current) return { error: "Módulo não encontrado." };

  const { data: siblings } = await supabase
    .from("modules")
    .select("id, sort_order")
    .eq("tenant_id", ctx.tenant.id)
    .eq("product_id", current.product_id)
    .order("sort_order");

  const list = siblings ?? [];
  const index = list.findIndex((m) => m.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return {};

  const sibling = list[swapIndex];
  await Promise.all([
    supabase.from("modules").update({ sort_order: sibling.sort_order }).eq("id", current.id),
    supabase.from("modules").update({ sort_order: current.sort_order }).eq("id", sibling.id),
  ]);

  revalidateProductSurfaces(current.product_id);
  return {};
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

function lessonContentColumns(values: LessonValues) {
  return {
    video_url: values.videoUrl || null,
    body_text: values.bodyText || null,
    image_url: values.imageUrl || null,
    file_url: values.fileUrl || null,
    link_url: values.linkUrl || null,
    quiz_data: (values.quizData as Json | null | undefined) ?? null,
  };
}

export async function createLessonAction(
  moduleId: string,
  productId: string,
  values: LessonValues
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      tenant_id: ctx.tenant.id,
      product_id: productId,
      module_id: moduleId,
      name: values.name,
      description: values.description || null,
      content_type: values.contentType,
      status: values.status,
      sort_order: count ?? 0,
      ...lessonContentColumns(values),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "lessons.created",
    entityType: "lesson",
    entityId: data.id,
  });
  revalidateProductSurfaces(productId);
  return {};
}

export async function updateLessonAction(
  id: string,
  values: LessonValues
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .update({
      name: values.name,
      description: values.description || null,
      content_type: values.contentType,
      status: values.status,
      ...lessonContentColumns(values),
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id)
    .select("product_id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "lessons.updated",
    entityType: "lesson",
    entityId: id,
  });
  revalidateProductSurfaces(lesson.product_id);
  return {};
}

export async function deleteLessonAction(id: string): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id)
    .select("product_id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "lessons.deleted",
    entityType: "lesson",
    entityId: id,
  });
  revalidateProductSurfaces(lesson?.product_id);
  return {};
}

export async function moveLessonAction(
  id: string,
  direction: "up" | "down"
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("lessons")
    .select("id, product_id, module_id, sort_order")
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id)
    .maybeSingle();

  if (!current) return { error: "Aula não encontrada." };

  const { data: siblings } = await supabase
    .from("lessons")
    .select("id, sort_order")
    .eq("tenant_id", ctx.tenant.id)
    .eq("module_id", current.module_id)
    .order("sort_order");

  const list = siblings ?? [];
  const index = list.findIndex((l) => l.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return {};

  const sibling = list[swapIndex];
  await Promise.all([
    supabase.from("lessons").update({ sort_order: sibling.sort_order }).eq("id", current.id),
    supabase.from("lessons").update({ sort_order: current.sort_order }).eq("id", sibling.id),
  ]);

  revalidateProductSurfaces(current.product_id);
  return {};
}

// ---------------------------------------------------------------------------
// Access grants
// ---------------------------------------------------------------------------

export async function grantProductAccessAction(
  productId: string,
  userId: string
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("product_access").upsert(
    {
      tenant_id: ctx.tenant.id,
      product_id: productId,
      user_id: userId,
      granted_by: ctx.userId,
    },
    { onConflict: "product_id,user_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "product_access.granted",
    entityType: "product",
    entityId: productId,
    metadata: { userId },
  });
  revalidateProductSurfaces(productId);
  return {};
}

export async function revokeProductAccessAction(
  productId: string,
  userId: string
): Promise<ProductActionResult> {
  const ctx = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_access")
    .delete()
    .eq("tenant_id", ctx.tenant.id)
    .eq("product_id", productId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "product_access.revoked",
    entityType: "product",
    entityId: productId,
    metadata: { userId },
  });
  revalidateProductSurfaces(productId);
  return {};
}

// ---------------------------------------------------------------------------
// Member-facing: lesson progress
// ---------------------------------------------------------------------------

/**
 * The first member-facing WRITE action in the app — every prior action
 * required apps.manage/products.manage. Guard here is just
 * requireTenantContext() (must be signed in); the real gate is RLS's
 * lesson_progress_insert policy (WITH CHECK can_view_lesson(lesson_id)).
 * tenant_id/product_id/module_id are always derived from a fresh lookup of
 * the lesson row here — never accepted from the caller.
 */
export async function setLessonProgressAction(
  lessonId: string,
  completed: boolean
): Promise<ProductActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  if (!completed) {
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", ctx.userId)
      .eq("lesson_id", lessonId);
    if (error) return { error: error.message };
    revalidateProductSurfaces();
    return {};
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("tenant_id, product_id, module_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) return { error: "Aula não encontrada." };

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      tenant_id: lesson.tenant_id,
      product_id: lesson.product_id,
      module_id: lesson.module_id,
      lesson_id: lessonId,
      user_id: ctx.userId,
    },
    { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };

  // Both idempotent server-side (unique constraints), so it's safe to call
  // on every "mark complete" request, even a redundant one.
  await awardPoints("lesson_completed", "lesson", lessonId);
  await supabase.rpc("issue_certificate_if_eligible", { p_product_id: lesson.product_id });

  revalidateProductSurfaces();
  return {};
}
