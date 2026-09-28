"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";
import type { BadgeValues, GamificationLevelValues } from "@/lib/validations/gamification";

export interface GamificationActionResult {
  error?: string;
}

function revalidateGamificationSurfaces() {
  revalidatePath("/admin/gamification/levels");
  revalidatePath("/admin/gamification/badges");
  revalidatePath("/ranking");
}

/**
 * Internal helper, not a Server Action itself — called from OTHER
 * modules' actions (products, posts, communities) right after their main
 * effect succeeds. Just forwards to the award_points() RPC (0033), which
 * decides the point value server-side; this never accepts a point amount.
 */
export async function awardPoints(
  reason: "lesson_completed" | "post_created" | "comment_created" | "community_joined",
  entityType: string,
  entityId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("award_points", {
    p_reason: reason,
    p_entity_type: entityType,
    p_entity_id: entityId,
  });
}

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export async function createLevelAction(values: GamificationLevelValues): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("gamification_levels").insert({
    tenant_id: ctx.tenant.id,
    name: values.name,
    min_points: values.minPoints,
    sort_order: values.sortOrder,
  });

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

export async function updateLevelAction(
  id: string,
  values: GamificationLevelValues
): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("gamification_levels")
    .update({ name: values.name, min_points: values.minPoints, sort_order: values.sortOrder })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

export async function deleteLevelAction(id: string): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("gamification_levels")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export async function createBadgeAction(values: BadgeValues): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("badges").insert({
    tenant_id: ctx.tenant.id,
    name: values.name,
    description: values.description || null,
    icon: values.icon || null,
    points_threshold: values.pointsThreshold,
    is_active: values.isActive,
    sort_order: values.sortOrder,
  });

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

export async function updateBadgeAction(id: string, values: BadgeValues): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("badges")
    .update({
      name: values.name,
      description: values.description || null,
      icon: values.icon || null,
      points_threshold: values.pointsThreshold,
      is_active: values.isActive,
      sort_order: values.sortOrder,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

export async function deleteBadgeAction(id: string): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("badges").delete().eq("id", id).eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

export async function awardBadgeManuallyAction(badgeId: string, userId: string): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("user_badges").upsert(
    { tenant_id: ctx.tenant.id, badge_id: badgeId, user_id: userId },
    { onConflict: "badge_id,user_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

export async function revokeBadgeAction(badgeId: string, userId: string): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_badges")
    .delete()
    .eq("badge_id", badgeId)
    .eq("user_id", userId)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };
  revalidateGamificationSurfaces();
  return {};
}

// ---------------------------------------------------------------------------
// Certificates (manual issuance)
// ---------------------------------------------------------------------------

export async function issueCertificateManuallyAction(
  userId: string,
  productId: string
): Promise<GamificationActionResult> {
  const ctx = await requirePermission(PERMISSIONS.GAMIFICATION_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const supabase = await createClient();
  const { error } = await supabase.from("certificates").insert({
    tenant_id: ctx.tenant.id,
    user_id: userId,
    product_id: productId,
    certificate_number: code,
  });

  if (error) {
    if (error.code === "23505") return { error: "Este usuário já tem um certificado para este produto." };
    return { error: error.message };
  }
  return {};
}
