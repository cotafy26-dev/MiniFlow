"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/core/activity-log/log";
import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";

export interface MemberActionResult {
  error?: string;
}

function revalidateMembersSurfaces() {
  revalidatePath("/admin/members");
}

/**
 * The tenant_memberships_guard_owner trigger (0006) already blocks
 * deleting an is_tenant_owner row or flipping its is_tenant_owner flag to
 * false — it does NOT block changing the owner's role_id or status,
 * columns it doesn't inspect. These app-layer checks close that gap so
 * the owner can't be demoted or suspended through this screen either.
 */
async function assertNotOwner(tenantId: string, membershipId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_memberships")
    .select("is_tenant_owner")
    .eq("id", membershipId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (data?.is_tenant_owner) {
    return "Não é possível alterar o proprietário do tenant.";
  }
  return null;
}

export async function changeMemberRoleAction(
  membershipId: string,
  roleId: string
): Promise<MemberActionResult> {
  const ctx = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const ownerError = await assertNotOwner(ctx.tenant.id, membershipId);
  if (ownerError) return { error: ownerError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_memberships")
    .update({ role_id: roleId })
    .eq("id", membershipId)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "members.role_changed",
    entityType: "tenant_membership",
    entityId: membershipId,
    metadata: { roleId },
  });
  revalidateMembersSurfaces();
  return {};
}

export async function suspendMemberAction(membershipId: string): Promise<MemberActionResult> {
  const ctx = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const ownerError = await assertNotOwner(ctx.tenant.id, membershipId);
  if (ownerError) return { error: ownerError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_memberships")
    .update({ status: "suspended" })
    .eq("id", membershipId)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "members.suspended",
    entityType: "tenant_membership",
    entityId: membershipId,
  });
  revalidateMembersSurfaces();
  return {};
}

export async function reactivateMemberAction(membershipId: string): Promise<MemberActionResult> {
  const ctx = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_memberships")
    .update({ status: "active" })
    .eq("id", membershipId)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "members.reactivated",
    entityType: "tenant_membership",
    entityId: membershipId,
  });
  revalidateMembersSurfaces();
  return {};
}

export async function removeMemberAction(membershipId: string): Promise<MemberActionResult> {
  const ctx = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenant_memberships")
    .delete()
    .eq("id", membershipId)
    .eq("tenant_id", ctx.tenant.id);

  // The guard_tenant_owner trigger raises a clean Portuguese message
  // ("Não é possível remover o proprietário do tenant.") if this targets
  // the owner — passed straight through rather than re-worded.
  if (error) return { error: error.message };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "members.removed",
    entityType: "tenant_membership",
    entityId: membershipId,
  });
  revalidateMembersSurfaces();
  return {};
}
