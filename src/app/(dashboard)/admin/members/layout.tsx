import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

/**
 * Gated by the weaker of the two permissions (members.view) so a
 * view-only role can reach the page — write actions inside additionally
 * require members.manage, checked per-action, same defense-in-depth
 * discipline as every other admin section.
 */
export default async function AdminMembersLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.MEMBERS_VIEW);
  return children;
}
