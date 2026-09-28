import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

export interface TenantContext {
  userId: string;
  profile: Profile;
  tenant: Tenant | null;
  roleKey: string | null;
  roleName: string | null;
  permissions: Set<string>;
  isSuperAdmin: boolean;
}

/**
 * Single source of truth for "who is logged in, in which tenant, with
 * which permissions" — used by (dashboard)/layout.tsx to guard routes and
 * render the shell, and by any server-side permission check. Fase 1 users
 * belong to exactly one tenant (profiles.default_tenant_id); switching
 * between multiple tenant memberships is a later-phase UI concern.
 */
export async function getCurrentTenantContext(): Promise<TenantContext | null> {
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

  if (!profile) return null;

  const { data: isSuperAdminResult } = await supabase.rpc("is_super_admin");
  const isSuperAdmin = isSuperAdminResult ?? false;

  let tenant: Tenant | null = null;
  let roleKey: string | null = null;
  let roleName: string | null = null;
  const permissions = new Set<string>();

  if (profile.default_tenant_id) {
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.default_tenant_id)
      .maybeSingle();
    tenant = tenantRow ?? null;

    const { data: membership } = await supabase
      .from("tenant_memberships")
      .select("role_id, roles(key, name)")
      .eq("tenant_id", profile.default_tenant_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership?.roles) {
      const role = membership.roles as unknown as { key: string; name: string };
      roleKey = role.key;
      roleName = role.name;

      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permissions(key)")
        .eq("role_id", membership.role_id);

      for (const row of rolePerms ?? []) {
        const perm = row.permissions as unknown as { key: string } | null;
        if (perm?.key) permissions.add(perm.key);
      }
    }
  }

  return {
    userId: user.id,
    profile,
    tenant,
    roleKey,
    roleName,
    permissions,
    isSuperAdmin,
  };
}
