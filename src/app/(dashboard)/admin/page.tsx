import { redirect } from "next/navigation";

import { ADMIN_NAV_ITEMS } from "@/core/navigation/admin-nav-items";
import { requireTenantContext } from "@/core/permissions/guards";

/**
 * Redirects to whichever admin section comes first (in ADMIN_NAV_ITEMS
 * order) that the visitor actually has a permission for — previously this
 * only checked apps.manage/products.manage, silently stranding a
 * moderator-only or gamification-only admin at /dashboard despite them
 * having real access to a section further down the list.
 */
export default async function AdminIndexPage() {
  const ctx = await requireTenantContext();

  const firstVisible = ADMIN_NAV_ITEMS.find(
    (item) => ctx.isSuperAdmin || item.permissions.some((permission) => ctx.permissions.has(permission))
  );

  redirect(firstVisible?.href ?? "/dashboard");
}
