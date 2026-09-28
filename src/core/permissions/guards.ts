import "server-only";

import { redirect } from "next/navigation";

import { getCurrentTenantContext, type TenantContext } from "@/core/tenants/context";
import type { PermissionKey } from "@/core/permissions/constants";

/**
 * Loads the current tenant context and redirects to /login if there is no
 * session. Use at the top of any protected Server Component/Server Action
 * that needs the caller's profile/tenant/role — middleware.ts only guards
 * routing, not data access.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const ctx = await getCurrentTenantContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Throws if the caller lacks `permission` in their current tenant (and
 * isn't Super Admin). Server-side only — this is defense in depth on top
 * of RLS, never a substitute for it, since every table is already RLS-
 * protected independently.
 */
export async function requirePermission(permission: PermissionKey): Promise<TenantContext> {
  const ctx = await requireTenantContext();
  if (!ctx.isSuperAdmin && !ctx.permissions.has(permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
  return ctx;
}

export async function requireSuperAdmin(): Promise<TenantContext> {
  const ctx = await requireTenantContext();
  if (!ctx.isSuperAdmin) {
    throw new Error("Super Admin required.");
  }
  return ctx;
}
