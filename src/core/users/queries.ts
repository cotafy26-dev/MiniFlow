import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function updateProfile(values: {
  fullName?: string;
  avatarUrl?: string;
  locale?: "pt" | "es" | "en";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(values.fullName !== undefined && { full_name: values.fullName }),
      ...(values.avatarUrl !== undefined && { avatar_url: values.avatarUrl }),
      ...(values.locale !== undefined && { locale: values.locale }),
    })
    .eq("id", user.id);

  if (error) throw error;
}

export interface PublicProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

/**
 * Batched author lookup for Feed/Comunidade (posts, comments) — unlike
 * getTenantMembersForAdmin below, this goes through the get_tenant_profiles
 * RPC (migration 0020) instead of querying `profiles` directly, so it
 * works for any active tenant member, not just members.view holders.
 */
export async function getPublicProfiles(userIds: string[]): Promise<PublicProfile[]> {
  if (userIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_tenant_profiles", { p_user_ids: userIds });
  return (data ?? []).map((p) => ({ id: p.id, fullName: p.full_name, avatarUrl: p.avatar_url }));
}

export interface TenantMember {
  userId: string;
  fullName: string;
  email: string;
  roleKey: string;
  roleName: string;
}

export interface Role {
  id: string;
  key: string;
  name: string;
}

export async function getRoles(): Promise<Role[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("roles").select("id, key, name").order("name");
  return data ?? [];
}

export interface TenantMemberFull {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: "active" | "invited" | "suspended";
  isTenantOwner: boolean;
  joinedAt: string;
}

/**
 * Every membership row regardless of status — unlike
 * getTenantMembersForAdmin above (active-only, used for "pick a member"
 * dropdowns elsewhere), the Members admin screen needs to show suspended
 * members too, so there's something to reactivate.
 */
export async function getTenantMembersFull(tenantId: string): Promise<TenantMemberFull[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("id, user_id, role_id, status, is_tenant_owner, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at");

  if (!memberships || memberships.length === 0) return [];

  const userIds = memberships.map((m) => m.user_id);
  const roleIds = [...new Set(memberships.map((m) => m.role_id))];

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").in("id", userIds),
    supabase.from("roles").select("id, key, name").in("id", roleIds),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const roleById = new Map((roles ?? []).map((r) => [r.id, r]));

  return memberships.map((m) => {
    const profile = profileById.get(m.user_id);
    const role = roleById.get(m.role_id);
    return {
      membershipId: m.id,
      userId: m.user_id,
      fullName: profile?.full_name ?? "—",
      email: profile?.email ?? "—",
      roleId: m.role_id,
      roleKey: role?.key ?? "",
      roleName: role?.name ?? "",
      status: m.status,
      isTenantOwner: m.is_tenant_owner,
      joinedAt: m.created_at,
    };
  });
}

/**
 * Lists active members of a tenant. Relies on the existing
 * tenant_memberships_select RLS policy (members.view OR self OR Super
 * Admin) — a caller with products.manage but not members.view will get an
 * empty/partial list here, a known limitation, not a bug (see Fase 3 plan).
 */
export async function getTenantMembersForAdmin(tenantId: string): Promise<TenantMember[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("tenant_memberships")
    .select("user_id, role_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) return [];

  const userIds = memberships.map((m) => m.user_id);
  const roleIds = [...new Set(memberships.map((m) => m.role_id))];

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").in("id", userIds),
    supabase.from("roles").select("id, key, name").in("id", roleIds),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const roleById = new Map((roles ?? []).map((r) => [r.id, r]));

  return memberships.map((m) => {
    const profile = profileById.get(m.user_id);
    const role = roleById.get(m.role_id);
    return {
      userId: m.user_id,
      fullName: profile?.full_name ?? "—",
      email: profile?.email ?? "—",
      roleKey: role?.key ?? "",
      roleName: role?.name ?? "",
    };
  });
}
