import { PERMISSIONS } from "@/core/permissions/constants";
import { requirePermission } from "@/core/permissions/guards";

export default async function AdminAppsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.APPS_MANAGE);
  return children;
}
