"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { awardPoints } from "@/core/gamification/actions";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission, requireTenantContext } from "@/core/permissions/guards";
import type { TenantContext } from "@/core/tenants/context";
import { createClient } from "@/lib/supabase/server";
import type {
  CommunityMemberRoleValues,
  CommunityValues,
} from "@/lib/validations/communities";

export interface CommunityActionResult {
  error?: string;
}

function revalidateCommunitySurfaces(slug?: string) {
  revalidatePath("/admin/community");
  revalidatePath("/community");
  if (slug) revalidatePath(`/community/${slug}`);
}

/**
 * community_members writes (ban/unban/add/remove/set role) are allowed by
 * RLS for either community.manage or community.moderate — this mirrors
 * that OR at the app layer instead of forcing a single permission.
 */
async function requireCommunityModerationAccess(): Promise<TenantContext> {
  const ctx = await requireTenantContext();
  if (
    !ctx.isSuperAdmin &&
    !ctx.permissions.has(PERMISSIONS.COMMUNITY_MANAGE) &&
    !ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE)
  ) {
    throw new Error("Missing permission: community.manage or community.moderate");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

export async function createCommunityAction(values: CommunityValues): Promise<CommunityActionResult> {
  const ctx = await requirePermission(PERMISSIONS.COMMUNITY_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communities")
    .insert({
      tenant_id: ctx.tenant.id,
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      image_url: values.imageUrl || null,
      visibility: values.visibility,
      is_active: values.isActive,
      sort_order: values.sortOrder,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "communities.created",
    entityType: "community",
    entityId: data.id,
  });
  revalidateCommunitySurfaces();
  redirect(`/admin/community/${data.id}`);
}

export async function updateCommunityAction(
  id: string,
  values: CommunityValues
): Promise<CommunityActionResult> {
  const ctx = await requirePermission(PERMISSIONS.COMMUNITY_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("communities")
    .update({
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      image_url: values.imageUrl || null,
      visibility: values.visibility,
      is_active: values.isActive,
      sort_order: values.sortOrder,
    })
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id)
    .select("slug")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "communities.updated",
    entityType: "community",
    entityId: id,
  });
  revalidateCommunitySurfaces(data.slug);
  return {};
}

export async function deleteCommunityAction(id: string): Promise<CommunityActionResult> {
  const ctx = await requirePermission(PERMISSIONS.COMMUNITY_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("communities")
    .delete()
    .eq("id", id)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "communities.deleted",
    entityType: "community",
    entityId: id,
  });
  revalidateCommunitySurfaces();
  return {};
}

// ---------------------------------------------------------------------------
// Member-facing: join/leave
// ---------------------------------------------------------------------------

export async function joinCommunityAction(
  communityId: string,
  slug: string
): Promise<CommunityActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };
  const supabase = await createClient();

  const { error } = await supabase.from("community_members").upsert(
    {
      tenant_id: ctx.tenant.id,
      community_id: communityId,
      user_id: ctx.userId,
      role: "member",
      status: "active",
    },
    { onConflict: "community_id,user_id", ignoreDuplicates: true }
  );

  // RLS blocks joining a closed/inactive community — surfaced as a plain
  // Postgres error here, translated to a user-facing message.
  if (error) return { error: "Não foi possível participar desta comunidade." };

  await awardPoints("community_joined", "community", communityId);
  revalidateCommunitySurfaces(slug);
  return {};
}

export async function leaveCommunityAction(
  communityId: string,
  slug: string
): Promise<CommunityActionResult> {
  const ctx = await requireTenantContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", ctx.userId);

  if (error) return { error: error.message };

  revalidateCommunitySurfaces(slug);
  return {};
}

// ---------------------------------------------------------------------------
// Admin/moderator: membership management
// ---------------------------------------------------------------------------

export async function addMemberAction(communityId: string, userId: string): Promise<CommunityActionResult> {
  const ctx = await requireCommunityModerationAccess();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase.from("community_members").upsert(
    {
      tenant_id: ctx.tenant.id,
      community_id: communityId,
      user_id: userId,
      role: "member",
      status: "active",
    },
    { onConflict: "community_id,user_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "community_members.added",
    entityType: "community",
    entityId: communityId,
    metadata: { userId },
  });
  revalidateCommunitySurfaces();
  return {};
}

export async function removeMemberAction(
  communityId: string,
  userId: string
): Promise<CommunityActionResult> {
  const ctx = await requireCommunityModerationAccess();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "community_members.removed",
    entityType: "community",
    entityId: communityId,
    metadata: { userId },
  });
  revalidateCommunitySurfaces();
  return {};
}

export async function banMemberAction(communityId: string, userId: string): Promise<CommunityActionResult> {
  const ctx = await requireCommunityModerationAccess();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_members")
    .update({ status: "banned" })
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "community_members.banned",
    entityType: "community",
    entityId: communityId,
    metadata: { userId },
  });
  revalidateCommunitySurfaces();
  return {};
}

export async function unbanMemberAction(
  communityId: string,
  userId: string
): Promise<CommunityActionResult> {
  const ctx = await requireCommunityModerationAccess();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_members")
    .update({ status: "active" })
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "community_members.unbanned",
    entityType: "community",
    entityId: communityId,
    metadata: { userId },
  });
  revalidateCommunitySurfaces();
  return {};
}

export async function setMemberRoleAction(
  communityId: string,
  userId: string,
  values: CommunityMemberRoleValues
): Promise<CommunityActionResult> {
  const ctx = await requireCommunityModerationAccess();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("community_members")
    .update({ role: values.role })
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidateCommunitySurfaces();
  return {};
}
