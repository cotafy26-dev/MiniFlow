import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/core/permissions/constants";
import { requireTenantContext } from "@/core/permissions/guards";

/**
 * First admin subsection needing an OR-of-two-permissions guard:
 * community.manage (admin: create/edit communities) and community.moderate
 * (moderator: hide content, resolve reports, ban members) are different
 * permissions held by different default roles, both needing in here.
 * Individual pages/actions inside still check their own specific
 * permission — this is just the outer gate.
 */
export default async function AdminCommunityLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireTenantContext();

  const canAccess =
    ctx.isSuperAdmin ||
    ctx.permissions.has(PERMISSIONS.COMMUNITY_MANAGE) ||
    ctx.permissions.has(PERMISSIONS.COMMUNITY_MODERATE);

  if (!canAccess) redirect("/dashboard");

  return children;
}
