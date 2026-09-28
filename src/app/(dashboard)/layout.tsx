import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PERMISSIONS } from "@/core/permissions/constants";
import { getCurrentTenantContext } from "@/core/tenants/context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentTenantContext();

  // Defense in depth: middleware.ts already redirects unauthenticated
  // requests to /login before this layout renders.
  if (!ctx) redirect("/login");

  const canManageAdmin =
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

  return (
    <DashboardShell
      fullName={ctx.profile.full_name}
      email={ctx.profile.email}
      tenantName={ctx.tenant?.name ?? null}
      canManageAdmin={canManageAdmin}
    >
      {children}
    </DashboardShell>
  );
}
