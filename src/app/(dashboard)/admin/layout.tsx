import { redirect } from "next/navigation";

import { AdminNav } from "@/components/layout/admin-nav";
import { ADMIN_NAV_ITEMS } from "@/core/navigation/admin-nav-items";
import { requireTenantContext } from "@/core/permissions/guards";
import { PERMISSIONS } from "@/core/permissions/constants";
import { pt } from "@/lib/i18n/dictionaries/pt";

/**
 * Pure shell: just requires a session. Each admin subsection
 * (admin/apps, admin/products, ...) guards its own permission in its own
 * layout — a single blanket apps.manage check here would either lock out
 * a products-only admin or implicitly assume every admin has every
 * permission forever.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireTenantContext();

  const canManageAnything =
    ctx.isSuperAdmin ||
    ctx.permissions.has(PERMISSIONS.TENANT_SETTINGS_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.MEMBERS_VIEW) ||
    ctx.permissions.has(PERMISSIONS.MEMBERS_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.APPS_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.PRODUCTS_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.COMMUNITY_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE) ||
    ctx.permissions.has(PERMISSIONS.INTEGRATIONS_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.GAMIFICATION_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.SUPPORT_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.BANNERS_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.ACTIVITY_LOGS_VIEW);

  if (!canManageAnything) redirect("/dashboard");

  const visibleKeys = ADMIN_NAV_ITEMS.filter(
    (item) => ctx.isSuperAdmin || item.permissions.some((permission) => ctx.permissions.has(permission))
  ).map((item) => item.key);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{pt.admin.title}</h1>
      <AdminNav visibleKeys={visibleKeys} />
      {children}
    </div>
  );
}
